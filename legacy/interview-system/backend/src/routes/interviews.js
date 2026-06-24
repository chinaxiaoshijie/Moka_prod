const express = require('express');
const Interview = require('../models/Interview');
const { responseUtils, paginationUtils } = require('../utils/helpers');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, interviewSchemas } = require('../middleware/validation');
const ConflictDetectionService = require('../services/ConflictDetectionService');

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

    // Check for conflicts before creating
    const conflictCheck = await ConflictDetectionService.checkConflicts({
      scheduled_time: interviewData.scheduled_time,
      duration: interviewData.duration || 60,
      interviewer_id: interviewData.interviewer_id,
      candidate_id: interviewData.candidate_id
    });

    // Include conflict warnings in response if conflicts exist
    const conflictWarnings = conflictCheck.hasConflicts ? conflictCheck : null;

    const interview = new Interview(interviewData);
    await interview.create();

    const responseData = interview.toJSON();

    // Add conflict warnings if present
    if (conflictWarnings) {
      responseData.conflict_warnings = conflictWarnings;
    }

    return responseUtils.success(
      res,
      responseData,
      conflictCheck.hasConflicts ? '创建面试成功，但发现时间冲突' : '创建面试成功',
      201
    );

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

    // Check for conflicts if time, interviewer, or candidate is being updated
    const updateTime = req.body.scheduled_time || interview.scheduled_time;
    const updateInterviewer = req.body.interviewer_id || interview.interviewer_id;
    const updateCandidate = req.body.candidate_id || interview.candidate_id;
    const updateDuration = req.body.duration || interview.duration;

    const conflictCheck = await ConflictDetectionService.checkConflicts({
      scheduled_time: updateTime,
      duration: updateDuration,
      interviewer_id: updateInterviewer,
      candidate_id: updateCandidate,
      id: interviewId // Exclude current interview from conflict check
    });

    await interview.update(req.body);

    const responseData = interview.toJSON();

    // Add conflict warnings if present
    if (conflictCheck.hasConflicts) {
      responseData.conflict_warnings = conflictCheck;
    }

    return responseUtils.success(
      res,
      responseData,
      conflictCheck.hasConflicts ? '更新面试信息成功，但发现时间冲突' : '更新面试信息成功'
    );

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

/**
 * @route   POST /api/interviews/check-conflicts
 * @desc    检查面试时间冲突
 * @access  Private
 */
router.post('/check-conflicts', async (req, res) => {
  try {
    const { scheduled_time, duration, interviewer_id, candidate_id } = req.body;

    if (!scheduled_time || !interviewer_id || !candidate_id) {
      return responseUtils.error(res, '缺少必填字段: scheduled_time, interviewer_id, candidate_id', 400);
    }

    const conflictResult = await ConflictDetectionService.checkConflicts({
      scheduled_time,
      duration: duration || 60,
      interviewer_id,
      candidate_id
    });

    return responseUtils.success(res, conflictResult, '冲突检查完成');

  } catch (error) {
    console.error('检查面试冲突错误:', error);
    return responseUtils.error(res, '检查面试冲突失败', 500);
  }
});

/**
 * @route   GET /api/interviews/available-slots
 * @desc    查找可用的面试时间段
 * @access  Private
 */
router.get('/available-slots', async (req, res) => {
  try {
    const {
      interviewer_id,
      candidate_id,
      start_date,
      end_date,
      duration = 60
    } = req.query;

    if (!interviewer_id || !start_date || !end_date) {
      return responseUtils.error(res, '缺少必填字段: interviewer_id, start_date, end_date', 400);
    }

    const availableSlots = await ConflictDetectionService.findAvailableSlots({
      interviewer_id: parseInt(interviewer_id),
      candidate_id: candidate_id ? parseInt(candidate_id) : undefined,
      start_date: new Date(start_date),
      end_date: new Date(end_date),
      duration: parseInt(duration)
    });

    return responseUtils.success(res, availableSlots, '查找可用时间段成功');

  } catch (error) {
    console.error('查找可用时间段错误:', error);
    return responseUtils.error(res, '查找可用时间段失败', 500);
  }
});

/**
 * @route   GET /api/interviews/daily-conflicts
 * @desc    获取指定日期的冲突统计
 * @access  Private (Admin, HR)
 */
router.get('/daily-conflicts', authorize(['admin', 'hr']), async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return responseUtils.error(res, '缺少必填字段: date', 400);
    }

    const conflictStats = await ConflictDetectionService.getDailyConflicts(new Date(date));

    return responseUtils.success(res, conflictStats, '获取每日冲突统计成功');

  } catch (error) {
    console.error('获取每日冲突统计错误:', error);
    return responseUtils.error(res, '获取每日冲突统计失败', 500);
  }
});

module.exports = router;