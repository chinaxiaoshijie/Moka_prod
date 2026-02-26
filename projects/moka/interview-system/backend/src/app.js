require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const { testConnection } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// 安全中间件
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS配置
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// 请求限流
const limiter = rateLimit({
  windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000, // 15分钟
  max: process.env.RATE_LIMIT_MAX || 100, // 最多100个请求
  message: {
    error: '请求过于频繁，请稍后再试'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// 日志中间件
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// 解析请求体
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 设置所有响应的Content-Type为UTF-8
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 健康检查接口
app.get('/health', async (req, res) => {
  try {
    const dbStatus = await testConnection();
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        database: dbStatus ? 'ok' : 'error',
        server: 'ok'
      },
      version: process.env.npm_package_version || '1.0.0'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Service unavailable',
      timestamp: new Date().toISOString()
    });
  }
});

// API路由
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/candidates', require('./routes/candidates'));
app.use('/api/positions', require('./routes/positions'));
app.use('/api/interviews', require('./routes/interviews'));
app.use('/api/feedbacks', require('./routes/feedbacks'));
app.use('/api/resumes', require('./routes/resumes'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/exports', require('./routes/exports'));
app.use('/api/imports', require('./routes/imports'));
app.use('/api/audit-logs', require('./routes/audit-logs'));

// 根路由
app.get('/', (req, res) => {
  res.json({
    message: '🎯 面试管理系统 API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: [
      'GET /health - 健康检查',
      'POST /api/auth/login - 用户登录',
      'GET /api/users - 用户列表',
      'GET /api/candidates - 候选人列表',
      'GET /api/interviews - 面试列表',
      'GET /api/feedbacks - 反馈列表',
      'GET /api/exports/* - 数据导出',
      'POST /api/imports/* - 批量导入',
      'GET /api/audit-logs - 操作日志'
    ]
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({
    error: 'API接口不存在',
    message: `找不到请求的路径: ${req.originalUrl}`,
    timestamp: new Date().toISOString()
  });
});

// 全局错误处理中间件
app.use((error, req, res, next) => {
  console.error('服务器错误:', error);

  // Joi验证错误
  if (error.isJoi) {
    return res.status(400).json({
      error: '参数验证失败',
      message: error.details[0].message,
      timestamp: new Date().toISOString()
    });
  }

  // JWT错误
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: '认证失败',
      message: '无效的访问令牌',
      timestamp: new Date().toISOString()
    });
  }

  // 数据库错误
  if (error.code && error.code.startsWith('ER_')) {
    return res.status(500).json({
      error: '数据库操作失败',
      message: process.env.NODE_ENV === 'development' ? error.message : '服务器内部错误',
      timestamp: new Date().toISOString()
    });
  }

  // 默认错误处理
  res.status(error.status || 500).json({
    error: error.message || '服务器内部错误',
    message: process.env.NODE_ENV === 'development' ? error.stack : '请联系系统管理员',
    timestamp: new Date().toISOString()
  });
});

// 启动服务器
async function startServer() {
  try {
    // 测试数据库连接
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('❌ 数据库连接失败，服务器启动中止');
      process.exit(1);
    }

    // 初始化邮件服务
    const emailService = require('./services/EmailService');
    await emailService.initialize();

    // 初始化定时任务调度器
    const scheduler = require('./services/Scheduler');
    scheduler.initialize();

    // 启动HTTP服务器
    app.listen(PORT, () => {
      console.log(`
🚀 面试管理系统后端服务启动成功
📍 服务地址: http://localhost:${PORT}
🌍 运行环境: ${process.env.NODE_ENV || 'development'}
📊 健康检查: http://localhost:${PORT}/health
📖 API文档: http://localhost:${PORT}/
      `);
    });

  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
}

// 优雅关闭处理
process.on('SIGTERM', () => {
  console.log('收到SIGTERM信号，正在优雅关闭服务器...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('收到SIGINT信号，正在优雅关闭服务器...');
  process.exit(0);
});

// 启动服务器
if (require.main === module) {
  startServer();
}

module.exports = app;