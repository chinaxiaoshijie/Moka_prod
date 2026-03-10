const winston = require('winston');
const path = require('path');
const fs = require('fs');

// 确保日志目录存在
const logDir = process.env.LOG_PATH || path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// 自定义日志格式
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// 控制台输出格式（开发环境更友好）
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

// 创建日志 transports
const transports = [
  // 控制台输出
  new winston.transports.Console({
    format: process.env.NODE_ENV === 'production' ? customFormat : consoleFormat,
    level: process.env.LOG_LEVEL || 'info'
  }),

  // 错误日志文件
  new winston.transports.File({
    filename: path.join(logDir, 'error.log'),
    level: 'error',
    format: customFormat,
    maxsize: 10485760, // 10MB
    maxFiles: 5
  }),

  // 所有日志文件
  new winston.transports.File({
    filename: path.join(logDir, 'combined.log'),
    format: customFormat,
    maxsize: 10485760, // 10MB
    maxFiles: 10
  })
];

// 创建 logger 实例
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: customFormat,
  transports,
  exitOnError: false
});

// 生产环境添加 HTTP 日志
if (process.env.NODE_ENV === 'production') {
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, 'http.log'),
      level: 'http',
      format: customFormat,
      maxsize: 10485760,
      maxFiles: 5
    })
  );
}

// 请求日志创建器（用于记录 HTTP 请求）
const createRequestLogger = () => {
  return (req, res, next) => {
    const start = Date.now();

    // 记录请求
    logger.http({
      method: req.method,
      url: req.originalUrl,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent')
    }, 'Incoming request');

    // 拦截响应完成
    res.on('finish', () => {
      const duration = Date.now() - start;
      const { statusCode } = res;

      const logData = {
        method: req.method,
        url: req.originalUrl,
        status: statusCode,
        duration: `${duration}ms`,
        ip: req.ip || req.connection.remoteAddress
      };

      if (statusCode >= 400) {
        logger.error(logData, 'Request failed');
      } else {
        logger.http(logData, 'Request completed');
      }
    });

    next();
  };
};

// 子日志创建器（用于特定模块）
const createModuleLogger = (module) => {
  return {
    debug: (message, meta) => logger.debug(message, { module, ...meta }),
    info: (message, meta) => logger.info(message, { module, ...meta }),
    warn: (message, meta) => logger.warn(message, { module, ...meta }),
    error: (message, meta) => logger.error(message, { module, ...meta }),
    http: (message, meta) => logger.http(message, { module, ...meta })
  };
};

// 请求 ID 中间件
const requestIdMiddleware = (req, res, next) => {
  req.id = req.headers['x-request-id'] ||
           require('crypto').randomBytes(16).toString('hex');
  res.setHeader('X-Request-ID', req.id);
  next();
};

// 错误日志记录器（用于 Express 错误处理中间件）
const logError = (err, req, res, next) => {
  logger.error({
    error: err.message,
    stack: err.stack,
    request: {
      id: req.id,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      body: req.body,
      query: req.query
    }
  }, 'Unhandled error');
  next(err);
};

module.exports = {
  logger,
  createRequestLogger,
  createModuleLogger,
  requestIdMiddleware,
  logError
};
