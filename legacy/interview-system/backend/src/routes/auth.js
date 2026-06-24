const express = require('express');
const User = require('../models/User');
const { jwtUtils, responseUtils } = require('../utils/helpers');
const { validate, userSchemas } = require('../middleware/validation');
const { authenticate, loginAttemptLimiter } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    用户注册
 * @access  Public
 */
router.post('/register', validate(userSchemas.register), async (req, res) => {
  try {
    const { username, email, password, role, department } = req.body;

    // 创建新用户
    const user = new User({
      username,
      email,
      password,
      role,
      department
    });

    await user.create();

    // 生成JWT令牌
    const token = jwtUtils.generateToken({
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    });

    const refreshToken = jwtUtils.generateRefreshToken({
      userId: user.id
    });

    // 返回用户信息（不包含密码）
    const userInfo = user.toSafeJSON();

    return responseUtils.success(res, {
      user: userInfo,
      token,
      refreshToken,
      expiresIn: process.env.JWT_EXPIRE || '7d'
    }, '注册成功');

  } catch (error) {
    console.error('注册错误:', error);

    if (error.message === '用户名或邮箱已存在') {
      return responseUtils.error(res, error.message, 400);
    }

    return responseUtils.error(res, '注册失败', 500);
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    用户登录
 * @access  Public
 */
router.post('/login',
  validate(userSchemas.login),
  async (req, res, next) => {
    await loginAttemptLimiter.checkAttempts(req, res, next);
  },
  async (req, res) => {
    try {
      const { email, password } = req.body;

      // 查找用户
      const user = await User.findByEmail(email);

      if (!user) {
        await loginAttemptLimiter.recordFailedAttempt(req.loginKey);
        return responseUtils.error(res, '邮箱或密码错误', 401);
      }

      // 检查用户状态
      if (user.status !== 'active') {
        await loginAttemptLimiter.recordFailedAttempt(req.loginKey);
        return responseUtils.error(res, '账户已被禁用', 401);
      }

      // 验证密码
      const isValidPassword = await user.verifyPassword(password);

      if (!isValidPassword) {
        await loginAttemptLimiter.recordFailedAttempt(req.loginKey);
        return responseUtils.error(res, '邮箱或密码错误', 401);
      }

      // 清除失败尝试记录
      await loginAttemptLimiter.clearAttempts(req.loginKey);

      // 更新最后登录时间
      await user.updateLastLogin();

      // 生成JWT令牌
      const token = jwtUtils.generateToken({
        userId: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      });

      const refreshToken = jwtUtils.generateRefreshToken({
        userId: user.id
      });

      // 返回用户信息（不包含密码）
      const userInfo = user.toSafeJSON();

      return responseUtils.success(res, {
        user: userInfo,
        token,
        refreshToken,
        expiresIn: process.env.JWT_EXPIRE || '7d'
      }, '登录成功');

    } catch (error) {
      console.error('登录错误:', error);
      return responseUtils.error(res, '登录失败', 500);
    }
  });

/**
 * @route   POST /api/auth/refresh
 * @desc    刷新访问令牌
 * @access  Public
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return responseUtils.error(res, '缺少刷新令牌', 400);
    }

    try {
      // 验证刷新令牌
      const decoded = jwtUtils.verifyToken(refreshToken);

      // 查找用户
      const user = await User.findById(decoded.userId);

      if (!user || user.status !== 'active') {
        return responseUtils.error(res, '用户不存在或已被禁用', 401);
      }

      // 生成新的访问令牌
      const newToken = jwtUtils.generateToken({
        userId: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      });

      return responseUtils.success(res, {
        token: newToken,
        expiresIn: process.env.JWT_EXPIRE || '7d'
      }, '令牌刷新成功');

    } catch (jwtError) {
      return responseUtils.error(res, '无效的刷新令牌', 401);
    }

  } catch (error) {
    console.error('令牌刷新错误:', error);
    return responseUtils.error(res, '令牌刷新失败', 500);
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    获取当前用户信息
 * @access  Private
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return responseUtils.error(res, '用户不存在', 404);
    }

    return responseUtils.success(res, user.toSafeJSON(), '获取用户信息成功');

  } catch (error) {
    console.error('获取用户信息错误:', error);
    return responseUtils.error(res, '获取用户信息失败', 500);
  }
});

/**
 * @route   PUT /api/auth/profile
 * @desc    更新当前用户信息
 * @access  Private
 */
router.put('/profile',
  authenticate,
  validate(userSchemas.updateProfile),
  async (req, res) => {
    try {
      const { username, department } = req.body;

      const user = await User.findById(req.user.id);

      if (!user) {
        return responseUtils.error(res, '用户不存在', 404);
      }

      // 如果更新用户名，检查是否已存在
      if (username && username !== user.username) {
        const existingUser = await User.findByUsername(username);
        if (existingUser && existingUser.id !== user.id) {
          return responseUtils.error(res, '用户名已存在', 400);
        }
      }

      // 更新用户信息
      await user.update({
        username,
        department
      });

      return responseUtils.success(res, user.toSafeJSON(), '更新用户信息成功');

    } catch (error) {
      console.error('更新用户信息错误:', error);
      return responseUtils.error(res, '更新用户信息失败', 500);
    }
  });

/**
 * @route   PUT /api/auth/change-password
 * @desc    修改密码
 * @access  Private
 */
router.put('/change-password',
  authenticate,
  validate(userSchemas.changePassword),
  async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;

      const user = await User.findById(req.user.id);

      if (!user) {
        return responseUtils.error(res, '用户不存在', 404);
      }

      // 验证当前密码
      const isValidPassword = await user.verifyPassword(currentPassword);

      if (!isValidPassword) {
        return responseUtils.error(res, '当前密码错误', 400);
      }

      // 检查新密码不能与当前密码相同
      const isSamePassword = await user.verifyPassword(newPassword);

      if (isSamePassword) {
        return responseUtils.error(res, '新密码不能与当前密码相同', 400);
      }

      // 更新密码
      await user.updatePassword(newPassword);

      return responseUtils.success(res, null, '密码修改成功');

    } catch (error) {
      console.error('修改密码错误:', error);
      return responseUtils.error(res, '修改密码失败', 500);
    }
  });

/**
 * @route   POST /api/auth/logout
 * @desc    用户登出
 * @access  Private
 */
router.post('/logout', authenticate, async (req, res) => {
  try {
    // 实际应用中可能需要将令牌加入黑名单
    // 这里只是简单返回成功响应
    return responseUtils.success(res, null, '登出成功');

  } catch (error) {
    console.error('登出错误:', error);
    return responseUtils.error(res, '登出失败', 500);
  }
});

/**
 * @route   GET /api/auth/verify
 * @desc    验证令牌有效性
 * @access  Private
 */
router.get('/verify', authenticate, async (req, res) => {
  try {
    return responseUtils.success(res, {
      valid: true,
      user: req.user
    }, '令牌验证成功');

  } catch (error) {
    console.error('令牌验证错误:', error);
    return responseUtils.error(res, '令牌验证失败', 500);
  }
});

/**
 * @route   POST /api/auth/forgot-password
 * @desc    请求密码重置
 * @access  Public
 */
router.post('/forgot-password',
  validate(userSchemas.forgotPassword),
  async (req, res) => {
    try {
      const { email } = req.body;

      // 查找用户（即使用户不存在也返回成功，防止邮箱枚举攻击）
      const user = await User.findByEmail(email);

      if (user && user.status === 'active') {
        // 生成重置令牌
        const resetToken = await user.generateResetToken();

        // 发送重置邮件
        const emailService = require('../services/EmailService');
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

        try {
          await emailService.sendPasswordResetEmail(user.email, {
            username: user.username,
            resetUrl,
            expiresIn: '15分钟'
          });
        } catch (emailError) {
          console.error('发送重置邮件失败:', emailError);
          // 继续执行，不向用户暴露邮件发送失败
        }
      }

      // 总是返回成功消息（防止邮箱枚举攻击）
      return responseUtils.success(res, null, '如果该邮箱存在，重置链接已发送');

    } catch (error) {
      console.error('请求密码重置错误:', error);
      return responseUtils.error(res, '请求密码重置失败', 500);
    }
  }
);

/**
 * @route   POST /api/auth/reset-password
 * @desc    使用令牌重置密码
 * @access  Public
 */
router.post('/reset-password',
  validate(userSchemas.resetPassword),
  async (req, res) => {
    try {
      const { token, newPassword } = req.body;

      // 验证令牌并重置密码
      const user = await User.resetPassword(token, newPassword);

      if (!user) {
        return responseUtils.error(res, '无效或过期的重置令牌', 400);
      }

      return responseUtils.success(res, null, '密码重置成功，请使用新密码登录');

    } catch (error) {
      console.error('重置密码错误:', error);
      if (error.message === '无效或过期的重置令牌') {
        return responseUtils.error(res, error.message, 400);
      }
      return responseUtils.error(res, '重置密码失败', 500);
    }
  }
);

/**
 * @route   POST /api/auth/verify-reset-token
 * @desc    验证重置令牌是否有效
 * @access  Public
 */
router.post('/verify-reset-token', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return responseUtils.error(res, '缺少重置令牌', 400);
    }

    const user = await User.verifyResetToken(token);

    if (!user) {
      return responseUtils.error(res, '无效或过期的重置令牌', 400);
    }

    return responseUtils.success(res, {
      valid: true,
      email: user.email
    }, '令牌验证成功');

  } catch (error) {
    console.error('验证重置令牌错误:', error);
    return responseUtils.error(res, '验证重置令牌失败', 500);
  }
});

module.exports = router;