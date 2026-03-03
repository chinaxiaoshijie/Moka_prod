const express = require('express');
const User = require('../models/User');
const { responseUtils, paginationUtils } = require('../utils/helpers');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, userSchemas } = require('../middleware/validation');

const router = express.Router();

// 所有路由都需要认证
router.use(authenticate);

/**
 * @route   GET /api/users
 * @desc    获取用户列表
 * @access  Private (Admin, HR)
 */
router.get('/', authorize('admin', 'hr'), async (req, res) => {
  try {
    const paginationParams = paginationUtils.getPaginationParams(req);
    const { role, department, status, search } = req.query;

    const options = {
      ...paginationParams,
      role,
      department,
      status,
      search
    };

    const result = await User.findAll(options);

    return responseUtils.paginated(res, result.users, result.pagination, '获取用户列表成功');

  } catch (error) {
    console.error('获取用户列表错误:', error);
    return responseUtils.error(res, '获取用户列表失败', 500);
  }
});

/**
 * @route   GET /api/users/statistics
 * @desc    获取用户统计信息
 * @access  Private (Admin)
 */
router.get('/statistics', authorize('admin'), async (req, res) => {
  try {
    const statistics = await User.getStatistics();
    return responseUtils.success(res, statistics, '获取用户统计成功');

  } catch (error) {
    console.error('获取用户统计错误:', error);
    return responseUtils.error(res, '获取用户统计失败', 500);
  }
});

/**
 * @route   GET /api/users/profile
 * @desc    获取当前登录用户信息
 * @access  Private
 */
router.get('/profile', async (req, res) => {
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
 * @route   GET /api/users/departments
 * @desc    获取部门列表
 * @access  Private
 */
router.get('/departments', async (req, res) => {
  try {
    const departments = await User.getDepartments();
    return responseUtils.success(res, departments, '获取部门列表成功');

  } catch (error) {
    console.error('获取部门列表错误:', error);
    return responseUtils.error(res, '获取部门列表失败', 500);
  }
});

/**
 * @route   GET /api/users/interviewers
 * @desc    获取面试官列表
 * @access  Private (Admin, HR)
 */
router.get('/interviewers', authorize('admin', 'hr'), async (req, res) => {
  try {
    const { department } = req.query;

    const options = {
      page: 1,
      pageSize: 100,
      role: 'interviewer',
      status: 'active',
      department
    };

    const result = await User.findAll(options);

    const interviewers = result.users.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      department: user.department
    }));

    return responseUtils.success(res, interviewers, '获取面试官列表成功');

  } catch (error) {
    console.error('获取面试官列表错误:', error);
    return responseUtils.error(res, '获取面试官列表失败', 500);
  }
});

/**
 * @route   GET /api/users/:id
 * @desc    获取单个用户信息
 * @access  Private (Admin, HR, Self)
 */
router.get('/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    // 检查权限：只有管理员、HR或用户本人可以查看
    if (req.user.role !== 'admin' &&
        req.user.role !== 'hr' &&
        req.user.id !== userId) {
      return responseUtils.error(res, '权限不足', 403);
    }

    const user = await User.findById(userId);

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
 * @route   POST /api/users
 * @desc    创建新用户
 * @access  Private (Admin)
 */
router.post('/', authorize('admin'), validate(userSchemas.register), async (req, res) => {
  try {
    const { username, email, password, role, department } = req.body;

    const user = new User({
      username,
      email,
      password,
      role,
      department
    });

    await user.create();

    return responseUtils.success(res, user.toSafeJSON(), '创建用户成功', 201);

  } catch (error) {
    console.error('创建用户错误:', error);

    if (error.message === '用户名或邮箱已存在') {
      return responseUtils.error(res, error.message, 400);
    }

    return responseUtils.error(res, '创建用户失败', 500);
  }
});

/**
 * @route   PUT /api/users/:id
 * @desc    更新用户信息
 * @access  Private (Admin, Self)
 */
router.put('/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    // 检查权限：只有管理员或用户本人可以修改
    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return responseUtils.error(res, '权限不足', 403);
    }

    const user = await User.findById(userId);

    if (!user) {
      return responseUtils.error(res, '用户不存在', 404);
    }

    const { username, email, role, department, status, phone } = req.body;

    // 非管理员不能修改角色和状态
    const updateData = { username, department, phone };

    if (req.user.role === 'admin') {
      updateData.role = role;
      updateData.status = status;
      updateData.email = email;
    }

    // 验证更新数据
    const allowedUpdates = {};
    for (const [key, value] of Object.entries(updateData)) {
      if (value !== undefined) {
        allowedUpdates[key] = value;
      }
    }

    // 如果更新邮箱或用户名，检查是否已存在
    if (allowedUpdates.email && allowedUpdates.email !== user.email) {
      const existingUser = await User.findByEmail(allowedUpdates.email);
      if (existingUser && existingUser.id !== user.id) {
        return responseUtils.error(res, '邮箱已存在', 400);
      }
    }

    if (allowedUpdates.username && allowedUpdates.username !== user.username) {
      const existingUser = await User.findByUsername(allowedUpdates.username);
      if (existingUser && existingUser.id !== user.id) {
        return responseUtils.error(res, '用户名已存在', 400);
      }
    }

    await user.update(allowedUpdates);

    return responseUtils.success(res, user.toSafeJSON(), '更新用户信息成功');

  } catch (error) {
    console.error('更新用户信息错误:', error);
    return responseUtils.error(res, '更新用户信息失败', 500);
  }
});

/**
 * @route   PUT /api/users/:id/status
 * @desc    更新用户状态
 * @access  Private (Admin)
 */
router.put('/:id/status', authorize('admin'), async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { status } = req.body;

    if (!['active', 'inactive', 'deleted'].includes(status)) {
      return responseUtils.error(res, '无效的状态值', 400);
    }

    const user = await User.findById(userId);

    if (!user) {
      return responseUtils.error(res, '用户不存在', 404);
    }

    // 不能修改自己的状态
    if (userId === req.user.id) {
      return responseUtils.error(res, '不能修改自己的状态', 400);
    }

    await user.update({ status });

    return responseUtils.success(res, user.toSafeJSON(), '更新用户状态成功');

  } catch (error) {
    console.error('更新用户状态错误:', error);
    return responseUtils.error(res, '更新用户状态失败', 500);
  }
});

/**
 * @route   PUT /api/users/:id/reset-password
 * @desc    重置用户密码
 * @access  Private (Admin)
 */
router.put('/:id/reset-password', authorize('admin'), async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return responseUtils.error(res, '新密码至少8个字符', 400);
    }

    const user = await User.findById(userId);

    if (!user) {
      return responseUtils.error(res, '用户不存在', 404);
    }

    await user.updatePassword(newPassword);

    return responseUtils.success(res, null, '重置密码成功');

  } catch (error) {
    console.error('重置密码错误:', error);
    return responseUtils.error(res, '重置密码失败', 500);
  }
});

/**
 * @route   DELETE /api/users/:id
 * @desc    删除用户（软删除）
 * @access  Private (Admin)
 */
router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    // 不能删除自己
    if (userId === req.user.id) {
      return responseUtils.error(res, '不能删除自己', 400);
    }

    const user = await User.findById(userId);

    if (!user) {
      return responseUtils.error(res, '用户不存在', 404);
    }

    await user.softDelete();

    return responseUtils.success(res, null, '删除用户成功');

  } catch (error) {
    console.error('删除用户错误:', error);
    return responseUtils.error(res, '删除用户失败', 500);
  }
});

/**
 * @route   POST /api/users/:id/activate
 * @desc    激活用户
 * @access  Private (Admin)
 */
router.post('/:id/activate', authorize('admin'), async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    const user = await User.findById(userId);

    if (!user) {
      return responseUtils.error(res, '用户不存在', 404);
    }

    await user.activate();

    return responseUtils.success(res, user.toSafeJSON(), '激活用户成功');

  } catch (error) {
    console.error('激活用户错误:', error);
    return responseUtils.error(res, '激活用户失败', 500);
  }
});

/**
 * @route   POST /api/users/:id/deactivate
 * @desc    禁用用户
 * @access  Private (Admin)
 */
router.post('/:id/deactivate', authorize('admin'), async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    // 不能禁用自己
    if (userId === req.user.id) {
      return responseUtils.error(res, '不能禁用自己', 400);
    }

    const user = await User.findById(userId);

    if (!user) {
      return responseUtils.error(res, '用户不存在', 404);
    }

    await user.deactivate();

    return responseUtils.success(res, user.toSafeJSON(), '禁用用户成功');

  } catch (error) {
    console.error('禁用用户错误:', error);
    return responseUtils.error(res, '禁用用户失败', 500);
  }
});

module.exports = router;