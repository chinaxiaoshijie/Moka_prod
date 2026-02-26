const express = require('express');
const Interview = require('../models/Interview');
const { responseUtils, paginationUtils } = require('../utils/helpers');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, interviewSchemas } = require('../middleware/validation');

const router = express.Router();

// 所有路由都需要认证
router.use(authenticate);

/**
 * @route   GET /api/interviews
 * @desc    获取面试列表
 * @access  Private
 */
router.get('/', async (req, res) => {
  try {
    const paginationParams = paginationUtils.getPaginationParams(req);
    const {
      status,
      interviewer_id,
      candidate_id,
      position_id,
      interview_type,
      date_from,
      date_to,
      search
    } = req.query;

    const options = {
      ...paginationParams,
      status,
      interviewer_id: interviewer_id ? parseInt(interviewer_id) : undefined,
      candidate_id: candidate_id ? parseInt(candidate_id) : undefined,
      position_id: position_id ? parseInt(position_id) : undefined,
      interview_type,
      date_from,
      date_to,
      search,
      // 面试官只能看到自己相关的面试
      created_by: req.user.role === 'interviewer' ? req.user.id : undefined
    };

    const result = await Interview.findAll(options);

    return responseUtils.paginated(res, result.interviews, result.pagination, '获取面试列表成功');

  } catch (error) {
    console.error('获取面试列表错误:', error);
    return responseUtils.error(res, '获取面试列表失败', 500);
  }
});

/**
 * @route   GET /api/interviews/statistics
 * @desc    获取面试统计信息
 * @access  Private
 */
router.get('/statistics', async (req, res) => {
  try {
    const createdBy = req.user.role === 'interviewer' ? req.user.id : null;
    const statistics = await Interview.getStatistics(createdBy);

    return responseUtils.success(res, statistics, '获取面试统计成功');

  } catch (error) {
    console.error('获取面试统计错误:', error);
    return responseUtils.error(res, '获取面试统计失败', 500);
  }
});

/**
 * @route   GET /api/interviews/calendar
 * @desc    获取面试日历数据
 * @access  Private
 */
router.get('/calendar', async (req, res) => {
  try {
    const { interviewer_id, start_date, end_date } = req.query;

    const options = {
      interviewer_id: interviewer_id ? parseInt(interviewer_id) : undefined,
      start_date,
      end_date,
      created_by: req.user.role === 'interviewer' ? req.user.id : undefined
    };

    const calendarData = await Interview.getCalendarData(options);

    return responseUtils.success(res, calendarData, '获取日历数据成功');

  } catch (error) {
    console.error('获取日历数据错误:', error);
    return responseUtils.error(res, '获取日历数据失败', 500);
  }
});

/**
 * @route   GET /api/interviews/availability/:interviewerId/:date
 * @desc    获取面试官在指定日期的可用时间
 * @access  Private
 */
router.get('/availability/:interviewerId/:date', async (req, res) => {
  try {
    const { interviewerId, date } = req.params;

    const availability = await Interview.getInterviewerAvailability(
      parseInt(interviewerId),
      date
    );

    return responseUtils.success(res, availability, '获取面试官可用时间成功');

  } catch (error) {
    console.error('获取面试官可用时间错误:', error);
    return responseUtils.error(res, '获取面试官可用时间失败', 500);
  }
});

/**
 * @route   GET /api/interviews/:id
 * @desc    获取单个面试信息
 * @access  Private
 */
router.get('/:id', async (req, res) => {
  try {
    const interviewId = parseInt(req.params.id);

    const interview = await Interview.findById(interviewId);

    if (!interview) {
      return responseUtils.error(res, '面试不存在', 404);
    }

    // 检查权限：面试官只能查看自己相关的面试
    if (req.user.role === 'interviewer' &&
        interview.created_by !== req.user.id &&
        interview.interviewer_id !== req.user.id) {
      return responseUtils.error(res, '权限不足', 403);
    }

    return responseUtils.success(res, interview.toJSON(), '获取面试信息成功');

  } catch (error) {
    console.error('获取面试信息错误:', error);
    return responseUtils.error(res, '获取面试信息失败', 500);
  }
});

/**
 * @route   POST /api/interviews
 * @desc    创建新面试
 * @access  Private
 */
router.post('/', validate(interviewSchemas.create), async (req, res) => {
  try {
    const interviewData = {
      ...req.body,
      created_by: req.user.id
    };

    const interview = new Interview(interviewData);
    await interview.create();

    return responseUtils.success(res, interview.toJSON(), '创建面试成功', 201);

  } catch (error) {
    console.error('创建面试错误:', error);
    if (error.message.includes('冲突')) {
      return responseUtils.error(res, error.message, 400);
    }
    return responseUtils.error(res, '创建面试失败', 500);
  }
});

/**
 * @route   PUT /api/interviews/:id
 * @desc    更新面试信息
 * @access  Private
 */
router.put('/:id', validate(interviewSchemas.update), async (req, res) => {
  try {
    const interviewId = parseInt(req.params.id);

    const interview = await Interview.findById(interviewId);

    if (!interview) {
      return responseUtils.error(res, '面试不存在', 404);
    }

    // 检查权限：面试官只能修改自己创建的或自己参与的面试
    if (req.user.role === 'interviewer' &&
        interview.created_by !== req.user.id &&
        interview.interviewer_id !== req.user.id) {
      return responseUtils.error(res, '权限不足', 403);
    }

    await interview.update(req.body);

    return responseUtils.success(res, interview.toJSON(), '更新面试信息成功');

  } catch (error) {
    console.error('更新面试信息错误:', error);
    if (error.message.includes('冲突')) {
      return responseUtils.error(res, error.message, 400);
    }
    return responseUtils.error(res, '更新面试信息失败', 500);
  }
});

/**
 * @route   DELETE /api/interviews/:id
 * @desc    删除面试
 * @access  Private (Admin, HR, Owner)
 */
router.delete('/:id', async (req, res) => {
  try {
    const interviewId = parseInt(req.params.id);

    const interview = await Interview.findById(interviewId);

    if (!interview) {
      return responseUtils.error(res, '面试不存在', 404);
    }

    // 检查权限：只有管理员、HR或创建者可以删除
    if (req.user.role !== 'admin' &&
        req.user.role !== 'hr' &&
        interview.created_by !== req.user.id) {
      return responseUtils.error(res, '权限不足', 403);
    }

    await interview.delete();

    return responseUtils.success(res, null, '删除面试成功');

  } catch (error) {
    console.error('删除面试错误:', error);
    return responseUtils.error(res, '删除面试失败', 500);
  }
});

/**
 * @route   POST /api/interviews/:id/feedback
 * @desc    提交面试反馈
 * @access  Private
 */
router.post('/:id/feedback', validate(interviewSchemas.feedback), async (req, res) => {
  try {
    const interviewId = parseInt(req.params.id);
    const { feedback, score, result } = req.body;

    const interview = await Interview.findById(interviewId);

    if (!interview) {
      return responseUtils.error(res, '面试不存在', 404);
    }

    // 检查权限：只有面试官或创建者可以提交反馈
    if (interview.interviewer_id !== req.user.id &&
        interview.created_by !== req.user.id &&
        req.user.role !== 'admin' &&
        req.user.role !== 'hr') {
      return responseUtils.error(res, '权限不足', 403);
    }

    await interview.update({
      feedback,
      score,
      result,
      status: 'completed'
    });

    return responseUtils.success(res, interview.toJSON(), '提交面试反馈成功');

  } catch (error) {
    console.error('提交面试反馈错误:', error);
    return responseUtils.error(res, '提交面试反馈失败', 500);
  }
});

/**
 * @route   POST /api/interviews/:id/status
 * @desc    更新面试状态
 * @access  Private
 */
router.post('/:id/status', validate(interviewSchemas.status), async (req, res) => {
  try {
    const interviewId = parseInt(req.params.id);
    const { status, notes } = req.body;

    const interview = await Interview.findById(interviewId);

    if (!interview) {
      return responseUtils.error(res, '面试不存在', 404);
    }

    // 检查权限
    if (req.user.role === 'interviewer' &&
        interview.created_by !== req.user.id &&
        interview.interviewer_id !== req.user.id) {
      return responseUtils.error(res, '权限不足', 403);
    }

    const updateData = { status };
    if (notes) {
      updateData.notes = notes;
    }

    await interview.update(updateData);

    return responseUtils.success(res, interview.toJSON(), '更新面试状态成功');

  } catch (error) {
    console.error('更新面试状态错误:', error);
    return responseUtils.error(res, '更新面试状态失败', 500);
  }
});

/**
 * @route   POST /api/interviews/batch-create
 * @desc    批量创建面试（用于面试轮次安排）
 * @access  Private
 */
router.post('/batch-create', validate(interviewSchemas.batchCreate), async (req, res) => {
  try {
    const { interviews } = req.body;
    const results = [];
    const errors = [];

    for (const interviewData of interviews) {
      try {
        const interview = new Interview({
          ...interviewData,
          created_by: req.user.id
        });
        await interview.create();
        results.push(interview.toJSON());
      } catch (error) {
        errors.push({
          interview: interviewData,
          error: error.message
        });
      }
    }

    if (errors.length > 0) {
      return responseUtils.error(res, '部分面试创建失败', 400, {
        success: results,
        errors
      });
    }

    return responseUtils.success(res, results, '批量创建面试成功', 201);

  } catch (error) {
    console.error('批量创建面试错误:', error);
    return responseUtils.error(res, '批量创建面试失败', 500);
  }
});

module.exports = router;