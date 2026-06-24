/**
 * 操作日志中间件
 * 记录所有重要的CRUD操作
 */

const { query } = require('../config/database');

/**
 * 操作类型枚举
 */
const ActionTypes = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  LOGIN: 'login',
  LOGOUT: 'logout',
  EXPORT: 'export',
  IMPORT: 'import',
  UPLOAD: 'upload',
  SEND_EMAIL: 'send_email'
};

/**
 * 资源类型枚举
 */
const ResourceTypes = {
  CANDIDATE: 'candidate',
  POSITION: 'position',
  INTERVIEW: 'interview',
  FEEDBACK: 'feedback',
  RESUME: 'resume',
  USER: 'user',
  EXPORT: 'export',
  IMPORT: 'import'
};

/**
 * 记录操作日志
 */
async function createAuditLog(req, actionType, resourceType, resourceId = null, details = {}) {
  try {
    const userId = req.user?.id || null;
    const username = req.user?.username || 'anonymous';
    const userRole = req.user?.role || 'anonymous';
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent') || '';

    const sql = `
      INSERT INTO audit_logs (
        user_id, action, resource_type,
        resource_id, details, ip_address, user_agent, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    const values = [
      userId,
      actionType,
      resourceType,
      resourceId,
      JSON.stringify(details),
      ip,
      userAgent
    ];

    await query(sql, values);
  } catch (error) {
    // 日志记录失败不应该影响主流程
    console.error('审计日志记录失败:', error.message);
  }
}

/**
 * 审计日志中间件工厂
 */
function auditMiddleware(actionType, resourceType) {
  return async (req, res, next) => {
    // 保存原始的json方法
    const originalJson = res.json.bind(res);

    // 重写json方法以捕获响应
    res.json = function(data) {
      // 异步记录日志，不阻塞响应
      setImmediate(async () => {
        const resourceId = req.params.id || null;

        // 只记录成功的操作
        const isSuccess = res.statusCode < 400;

        if (isSuccess) {
          const details = {
            method: req.method,
            path: req.path,
            query: req.query,
            body: sanitizeBody(req.body),
            status: res.statusCode,
            response: sanitizeResponse(data)
          };

          await createAuditLog(req, actionType, resourceType, resourceId, details);
        }
      });

      // 调用原始方法
      return originalJson(data);
    };

    next();
  };
}

/**
 * 清理敏感信息
 */
function sanitizeBody(body) {
  if (!body) return {};

  const sanitized = { ...body };

  // 移除密码字段
  delete sanitized.password;
  delete sanitized.newPassword;
  delete sanitized.confirmPassword;

  // 移除token
  delete sanitized.token;

  return sanitized;
}

/**
 * 清理响应数据
 */
function sanitizeResponse(data) {
  if (!data) return {};

  const sanitized = { ...data };

  // 移除token
  if (sanitized.data && sanitized.data.token) {
    delete sanitized.data.token;
  }

  return sanitized;
}

/**
 * 登录日志中间件
 */
function logLogin(req, res, next) {
  const originalJson = res.json.bind(res);

  res.json = function(data) {
    setImmediate(async () => {
      if (data.success && data.data?.user) {
        await createAuditLog(req, ActionTypes.LOGIN, ResourceTypes.USER, data.data.user.id, {
          username: data.data.user.username,
          role: data.data.user.role
        });
      }
    });

    return originalJson(data);
  };

  next();
}

/**
 * 导出日志中间件
 */
function logExport(resourceType) {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = function(data) {
      setImmediate(async () => {
        if (data.success) {
          await createAuditLog(req, ActionTypes.EXPORT, resourceType, null, {
            query: req.query,
            filename: data.data?.filename,
            count: data.data?.count
          });
        }
      });

      return originalJson(data);
    };

    next();
  };
}

/**
 * 查询审计日志
 */
async function getAuditLogs(filters = {}, pagination = {}) {
  const {
    user_id,
    username,
    action,
    resource_type,
    resource_id,
    date_from,
    date_to
  } = filters;

  const { page = 1, limit = 50, sort_by = 'created_at', sort_order = 'DESC' } = pagination;

  let sql = `
    SELECT
      id, user_id, action, resource_type,
      resource_id, details, ip_address, user_agent, created_at
    FROM audit_logs
    WHERE 1=1
  `;
  const params = [];

  if (user_id) {
    sql += ' AND user_id = ?';
    params.push(user_id);
  }

  if (username) {
    sql += ' AND username LIKE ?';
    params.push(`%${username}%`);
  }

  if (action) {
    sql += ' AND action = ?';
    params.push(action);
  }

  if (resource_type) {
    sql += ' AND resource_type = ?';
    params.push(resource_type);
  }

  if (resource_id) {
    sql += ' AND resource_id = ?';
    params.push(resource_id);
  }

  if (date_from) {
    sql += ' AND created_at >= ?';
    params.push(date_from);
  }

  if (date_to) {
    sql += ' AND created_at <= ?';
    params.push(date_to);
  }

  // 获取总数
  const countSql = sql.replace(/SELECT.*?FROM/, 'SELECT COUNT(*) as total FROM');
  const countResult = await query(countSql, params);
  const total = Array.isArray(countResult) && countResult.length > 0 ? countResult[0].total : 0;

  // 排序和分页
  const validSortFields = ['id', 'created_at', 'action', 'resource_type'];
  const sortField = validSortFields.includes(sort_by) ? sort_by : 'created_at';
  const sortDir = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  sql += ` ORDER BY ${sortField} ${sortDir}`;
  sql += ` LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

  const logs = await query(sql, params);

  // 解析details JSON
  logs.forEach(log => {
    try {
      log.details = JSON.parse(log.details);
    } catch {
      log.details = {};
    }
  });

  return {
    data: logs,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit))
    }
  };
}

/**
 * 获取日志统计
 */
async function getAuditStats(dateFrom, dateTo) {
  const sql = `
    SELECT
      action,
      resource_type,
      COUNT(*) as count,
      COUNT(DISTINCT user_id) as unique_users
    FROM audit_logs
    WHERE created_at >= ? AND created_at <= ?
    GROUP BY action, resource_type
    ORDER BY count DESC
  `;

  const stats = await query(sql, [dateFrom, dateTo]);

  return stats;
}

/**
 * 清理旧日志
 */
async function cleanOldLogs(daysToKeep = 90) {
  const sql = `
    DELETE FROM audit_logs
    WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)
  `;

  const result = await query(sql, [daysToKeep]);

  return result.affectedRows;
}

module.exports = {
  auditMiddleware,
  logLogin,
  logExport,
  getAuditLogs,
  getAuditStats,
  cleanOldLogs,
  ActionTypes,
  ResourceTypes
};
