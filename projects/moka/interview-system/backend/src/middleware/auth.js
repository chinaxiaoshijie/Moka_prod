const { jwtUtils, responseUtils } = require('../utils/helpers');
const { query } = require('../config/database');

// 认证中间件
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return responseUtils.error(res, '缺少访问令牌', 401);
    }

    const token = authHeader.substring(7); // 移除 'Bearer ' 前缀

    try {
      const decoded = jwtUtils.verifyToken(token);

      // 查询用户信息
      const users = await query(
        'SELECT id, username, email, role, department, status, created_at FROM users WHERE id = ?',
        [decoded.userId]
      );

      if (users.length === 0) {
        return responseUtils.error(res, '用户不存在', 401);
      }

      const user = users[0];

      // 检查用户状态
      if (user.status !== 'active') {
        return responseUtils.error(res, '账户已被禁用', 401);
      }

      // 将用户信息添加到请求对象
      req.user = user;
      next();

    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return responseUtils.error(res, '访问令牌已过期', 401);
      } else if (jwtError.name === 'JsonWebTokenError') {
        return responseUtils.error(res, '无效的访问令牌', 401);
      } else {
        throw jwtError;
      }
    }

  } catch (error) {
    console.error('认证中间件错误:', error);
    return responseUtils.error(res, '认证失败', 500);
  }
};

// 权限检查中间件
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return responseUtils.error(res, '未认证用户', 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return responseUtils.error(res, '权限不足', 403);
    }

    next();
  };
};

// 可选认证中间件（不强制要求登录）
const optionalAuthenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwtUtils.verifyToken(token);

      const users = await query(
        'SELECT id, username, email, role, department, status FROM users WHERE id = ?',
        [decoded.userId]
      );

      if (users.length > 0 && users[0].status === 'active') {
        req.user = users[0];
      } else {
        req.user = null;
      }

    } catch (jwtError) {
      req.user = null;
    }

    next();

  } catch (error) {
    console.error('可选认证中间件错误:', error);
    req.user = null;
    next();
  }
};

// 检查资源所有者权限
const checkOwnership = (resourceIdField = 'id') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[resourceIdField];
      const userId = req.user.id;

      // 管理员有所有权限
      if (req.user.role === 'admin') {
        return next();
      }

      // 检查资源是否属于当前用户
      // 这里需要根据具体资源类型来查询，示例为通用查询
      const tableName = req.baseUrl.split('/').pop(); // 从路径获取表名
      const ownershipQuery = `SELECT created_by FROM ${tableName} WHERE id = ?`;

      const results = await query(ownershipQuery, [resourceId]);

      if (results.length === 0) {
        return responseUtils.error(res, '资源不存在', 404);
      }

      if (results[0].created_by !== userId) {
        return responseUtils.error(res, '无权访问此资源', 403);
      }

      next();

    } catch (error) {
      console.error('权限检查错误:', error);
      return responseUtils.error(res, '权限检查失败', 500);
    }
  };
};

// 部门权限检查
const checkDepartment = async (req, res, next) => {
  try {
    // 管理员可以访问所有部门数据
    if (req.user.role === 'admin') {
      return next();
    }

    // HR可以访问所有部门数据
    if (req.user.role === 'hr') {
      return next();
    }

    // 面试官只能访问自己部门的数据
    if (req.user.role === 'interviewer') {
      // 在查询中添加部门过滤条件
      req.departmentFilter = req.user.department;
    }

    next();

  } catch (error) {
    console.error('部门权限检查错误:', error);
    return responseUtils.error(res, '部门权限检查失败', 500);
  }
};

// 登录尝试限制中间件
const loginAttemptLimiter = {
  attempts: new Map(), // 存储登录尝试记录

  // 检查登录尝试
  checkAttempts: (req, res, next) => {
    const identifier = req.body.email || req.body.username;
    const clientIP = req.ip;
    const key = `${identifier}:${clientIP}`;

    const attempts = loginAttemptLimiter.attempts.get(key) || { count: 0, lastAttempt: null };

    // 如果超过5次失败，且距离上次尝试不到1小时
    if (attempts.count >= 5) {
      const timeSinceLastAttempt = Date.now() - attempts.lastAttempt;
      const oneHour = 60 * 60 * 1000;

      if (timeSinceLastAttempt < oneHour) {
        return responseUtils.error(res, '登录尝试过于频繁，请1小时后再试', 429);
      } else {
        // 重置计数
        loginAttemptLimiter.attempts.delete(key);
      }
    }

    req.loginKey = key;
    next();
  },

  // 记录失败尝试
  recordFailedAttempt: (key) => {
    const attempts = loginAttemptLimiter.attempts.get(key) || { count: 0, lastAttempt: null };
    attempts.count += 1;
    attempts.lastAttempt = Date.now();
    loginAttemptLimiter.attempts.set(key, attempts);

    // 清理旧记录（超过24小时的记录）
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    for (const [k, v] of loginAttemptLimiter.attempts.entries()) {
      if (v.lastAttempt < oneDayAgo) {
        loginAttemptLimiter.attempts.delete(k);
      }
    }
  },

  // 清除成功登录的记录
  clearAttempts: (key) => {
    loginAttemptLimiter.attempts.delete(key);
  }
};

module.exports = {
  authenticate,
  authorize,
  optionalAuthenticate,
  checkOwnership,
  checkDepartment,
  loginAttemptLimiter
};