const express = require('express');
const Position = require('../models/Position');
const { responseUtils, paginationUtils } = require('../utils/helpers');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, positionSchemas } = require('../middleware/validation');

const router = express.Router();

// 所有路由都需要认证
router.use(authenticate);

/**
 * @route   GET /api/positions
 * @desc    获取职位列表
 * @access  Private
 */
router.get('/', async (req, res) => {
  try {
    const paginationParams = paginationUtils.getPaginationParams(req);
    const {
      status,
      department,
      level,
      type,
      priority,
      location,
      search,
      expired_only,
      active_only
    } = req.query;

    const options = {
      ...paginationParams,
      status,
      department,
      level,
      type,
      priority,
      location,
      search,
      expired_only: expired_only === 'true',
      active_only: active_only === 'true',
      // 面试官只能看到自己创建的职位（可选权限）
      // created_by: req.user.role === 'interviewer' ? req.user.id : undefined
    };

    const result = await Position.findAll(options);

    return responseUtils.paginated(res, result.positions, result.pagination, '获取职位列表成功');

  } catch (error) {
    console.error('获取职位列表错误:', error);
    return responseUtils.error(res, '获取职位列表失败', 500);
  }
});

/**
 * @route   GET /api/positions/statistics
 * @desc    获取职位统计信息
 * @access  Private
 */
router.get('/statistics', async (req, res) => {
  try {
    const createdBy = req.user.role === 'interviewer' ? req.user.id : null;
    const statistics = await Position.getStatistics(createdBy);

    return responseUtils.success(res, statistics, '获取职位统计成功');

  } catch (error) {
    console.error('获取职位统计错误:', error);
    return responseUtils.error(res, '获取职位统计失败', 500);
  }
});

/**
 * @route   GET /api/positions/departments
 * @desc    获取部门统计信息
 * @access  Private
 */
router.get('/departments', async (req, res) => {
  try {
    const createdBy = req.user.role === 'interviewer' ? req.user.id : null;
    const departmentStats = await Position.getDepartmentStatistics(createdBy);

    return responseUtils.success(res, departmentStats, '获取部门统计成功');

  } catch (error) {
    console.error('获取部门统计错误:', error);
    return responseUtils.error(res, '获取部门统计失败', 500);
  }
});

/**
 * @route   GET /api/positions/search
 * @desc    搜索职位
 * @access  Private
 */
router.get('/search', async (req, res) => {
  try {
    const { q: searchTerm } = req.query;

    if (!searchTerm) {
      return responseUtils.error(res, '搜索关键词不能为空', 400);
    }

    const paginationParams = paginationUtils.getPaginationParams(req);
    const positions = await Position.search(searchTerm, paginationParams);

    return responseUtils.success(res, positions, '搜索职位成功');

  } catch (error) {
    console.error('搜索职位错误:', error);
    return responseUtils.error(res, '搜索职位失败', 500);
  }
});

/**
 * @route   GET /api/positions/:id
 * @desc    获取单个职位信息
 * @access  Private
 */
router.get('/:id', async (req, res) => {
  try {
    const positionId = parseInt(req.params.id);

    const position = await Position.findById(positionId);

    if (!position) {
      return responseUtils.error(res, '职位不存在', 404);
    }

    return responseUtils.success(res, position.toJSON(), '获取职位信息成功');

  } catch (error) {
    console.error('获取职位信息错误:', error);
    return responseUtils.error(res, '获取职位信息失败', 500);
  }
});

/**
 * @route   POST /api/positions
 * @desc    创建新职位
 * @access  Private (Admin, HR)
 */
router.post('/', authorize(['admin', 'hr']), validate(positionSchemas.create), async (req, res) => {
  try {
    const positionData = {
      ...req.body,
      created_by: req.user.id
    };

    const position = new Position(positionData);
    await position.create();

    return responseUtils.success(res, position.toJSON(), '创建职位成功', 201);

  } catch (error) {
    console.error('创建职位错误:', error);
    return responseUtils.error(res, '创建职位失败', 500);
  }
});

/**
 * @route   PUT /api/positions/:id
 * @desc    更新职位信息
 * @access  Private (Admin, HR, Owner)
 */
router.put('/:id', validate(positionSchemas.update), async (req, res) => {
  try {
    const positionId = parseInt(req.params.id);

    const position = await Position.findById(positionId);

    if (!position) {
      return responseUtils.error(res, '职位不存在', 404);
    }

    // 检查权限：只有管理员、HR或创建者可以修改
    if (req.user.role !== 'admin' &&
        req.user.role !== 'hr' &&
        position.created_by !== req.user.id) {
      return responseUtils.error(res, '权限不足', 403);
    }

    await position.update(req.body);

    return responseUtils.success(res, position.toJSON(), '更新职位信息成功');

  } catch (error) {
    console.error('更新职位信息错误:', error);
    return responseUtils.error(res, '更新职位信息失败', 500);
  }
});

/**
 * @route   DELETE /api/positions/:id
 * @desc    删除职位
 * @access  Private (Admin, HR, Owner)
 */
router.delete('/:id', async (req, res) => {
  try {
    const positionId = parseInt(req.params.id);

    const position = await Position.findById(positionId);

    if (!position) {
      return responseUtils.error(res, '职位不存在', 404);
    }

    // 检查权限：只有管理员、HR或创建者可以删除
    if (req.user.role !== 'admin' &&
        req.user.role !== 'hr' &&
        position.created_by !== req.user.id) {
      return responseUtils.error(res, '权限不足', 403);
    }

    await position.delete();

    return responseUtils.success(res, null, '删除职位成功');

  } catch (error) {
    console.error('删除职位错误:', error);
    if (error.message.includes('关联')) {
      return responseUtils.error(res, error.message, 400);
    }
    return responseUtils.error(res, '删除职位失败', 500);
  }
});

/**
 * @route   POST /api/positions/:id/status
 * @desc    更新职位状态
 * @access  Private (Admin, HR, Owner)
 */
router.post('/:id/status', validate(positionSchemas.status), async (req, res) => {
  try {
    const positionId = parseInt(req.params.id);
    const { status, reason } = req.body;

    const position = await Position.findById(positionId);

    if (!position) {
      return responseUtils.error(res, '职位不存在', 404);
    }

    // 检查权限
    if (req.user.role !== 'admin' &&
        req.user.role !== 'hr' &&
        position.created_by !== req.user.id) {
      return responseUtils.error(res, '权限不足', 403);
    }

    await position.update({ status });

    return responseUtils.success(res, position.toJSON(), '更新职位状态成功');

  } catch (error) {
    console.error('更新职位状态错误:', error);
    return responseUtils.error(res, '更新职位状态失败', 500);
  }
});

/**
 * @route   POST /api/positions/:id/progress
 * @desc    更新职位招聘进度
 * @access  Private (Admin, HR)
 */
router.post('/:id/progress', authorize(['admin', 'hr']), async (req, res) => {
  try {
    const positionId = parseInt(req.params.id);

    const position = await Position.findById(positionId);

    if (!position) {
      return responseUtils.error(res, '职位不存在', 404);
    }

    await position.updateProgress();

    return responseUtils.success(res, position.toJSON(), '更新招聘进度成功');

  } catch (error) {
    console.error('更新招聘进度错误:', error);
    return responseUtils.error(res, '更新招聘进度失败', 500);
  }
});

/**
 * @route   POST /api/positions/batch-update-progress
 * @desc    批量更新职位招聘进度
 * @access  Private (Admin, HR)
 */
router.post('/batch-update-progress', authorize(['admin', 'hr']), async (req, res) => {
  try {
    const { position_ids } = req.body;

    if (!position_ids || !Array.isArray(position_ids) || position_ids.length === 0) {
      return responseUtils.error(res, '职位ID列表不能为空', 400);
    }

    const results = [];
    const errors = [];

    for (const positionId of position_ids) {
      try {
        const position = await Position.findById(positionId);
        if (position) {
          await position.updateProgress();
          results.push(position.toJSON());
        }
      } catch (error) {
        errors.push({
          position_id: positionId,
          error: error.message
        });
      }
    }

    if (errors.length > 0) {
      return responseUtils.error(res, '部分职位更新失败', 400, {
        success: results,
        errors
      });
    }

    return responseUtils.success(res, results, '批量更新招聘进度成功');

  } catch (error) {
    console.error('批量更新招聘进度错误:', error);
    return responseUtils.error(res, '批量更新招聘进度失败', 500);
  }
});

module.exports = router;