const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// JWT工具函数
const jwtUtils = {
  // 生成访问令牌
  generateToken: (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE || '7d'
    });
  },

  // 验证令牌
  verifyToken: (token) => {
    return jwt.verify(token, process.env.JWT_SECRET);
  },

  // 生成刷新令牌
  generateRefreshToken: (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '30d'
    });
  }
};

// 密码工具函数
const passwordUtils = {
  // 哈希密码
  hashPassword: async (password) => {
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    return await bcrypt.hash(password, saltRounds);
  },

  // 验证密码
  verifyPassword: async (password, hashedPassword) => {
    return await bcrypt.compare(password, hashedPassword);
  },

  // 生成随机密码
  generateRandomPassword: (length = 8) => {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  }
};

// 响应工具函数
const responseUtils = {
  // 成功响应
  success: (res, data = null, message = '操作成功') => {
    return res.json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    });
  },

  // 错误响应
  error: (res, message = '操作失败', status = 400, error = null) => {
    return res.status(status).json({
      success: false,
      message,
      error: process.env.NODE_ENV === 'development' ? error : null,
      timestamp: new Date().toISOString()
    });
  },

  // 分页响应
  paginated: (res, data, pagination, message = '查询成功') => {
    return res.json({
      success: true,
      message,
      data,
      pagination,
      timestamp: new Date().toISOString()
    });
  }
};

// 验证工具函数
const validationUtils = {
  // 邮箱验证
  isValidEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // 手机号验证（中国大陆）
  isValidPhone: (phone) => {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
  },

  // 密码强度验证
  isStrongPassword: (password) => {
    // 至少8位，包含数字、字母
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
    return passwordRegex.test(password);
  }
};

// 分页工具函数
const paginationUtils = {
  // 获取分页参数
  getPaginationParams: (req) => {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;
    const offset = (page - 1) * pageSize;

    return {
      page: Math.max(1, page),
      pageSize: Math.min(100, Math.max(1, pageSize)), // 限制最大每页100条
      offset,
      limit: pageSize
    };
  },

  // 生成分页信息
  generatePaginationInfo: (page, pageSize, total) => {
    const totalPages = Math.ceil(total / pageSize);
    return {
      current: page,
      pageSize,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    };
  }
};

// 日期工具函数
const dateUtils = {
  // 格式化日期
  formatDate: (date, format = 'YYYY-MM-DD HH:mm:ss') => {
    if (!date) return null;
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');

    return format
      .replace('YYYY', year)
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds);
  },

  // 获取当前时间戳
  now: () => new Date(),

  // 添加天数
  addDays: (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }
};

module.exports = {
  jwtUtils,
  passwordUtils,
  responseUtils,
  validationUtils,
  paginationUtils,
  dateUtils
};