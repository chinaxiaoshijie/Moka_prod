const express = require('express');
const { responseUtils } = require('../utils/helpers');
const { authenticate, authorize } = require('../middleware/auth');
const InterviewFeedback = require('../models/InterviewFeedback');
const FeedbackTemplate = require('../models/FeedbackTemplate');

const router = express.Router();

// 所有路由都需要认证
router.use(authenticate);

// ==================== 面试反馈相关路由 ====================

/**
 * @route   GET /api/feedbacks
 * @desc    获取反馈列表
 * @access  Private
 */
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 20,
      interview_id,
      interviewer_id,
      candidate_id,
      position_id,
      status,
      overall_rating,
      recommendation,
      date_from,
      date_to,
      search
    } = req.query;

    const options = {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      interview_id,
      interviewer_id,
      candidate_id,
      position_id,
      status,
      overall_rating,
      recommendation,
      date_from,
      date_to,
      search
    };

    // 非管理员只能查看自己的反馈
    if (!req.user.isAdmin && !req.user.isHR) {
      options.interviewer_id = req.user.id;
    }

    const result = await InterviewFeedback.findAll(options);
    return responseUtils.success(res, result, '获取反馈列表成功');
  } catch (error) {
    console.error('获取反馈列表错误:', error);
    return responseUtils.error(res, '获取反馈列表失败', 500);
  }
});

/**
 * @route   GET /api/feedbacks/:id
 * @desc    获取反馈详情
 * @access  Private
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const feedback = await InterviewFeedback.findById(id);

    if (!feedback) {
      return responseUtils.error(res, '反馈不存在', 404);
    }

    // 权限检查：只有管理员、HR或反馈创建者可以查看
    if (!req.user.isAdmin && !req.user.isHR && feedback.interviewer_id !== req.user.id) {
      return responseUtils.error(res, '无权限查看该反馈', 403);
    }

    return responseUtils.success(res, feedback.toJSON(), '获取反馈详情成功');
  } catch (error) {
    console.error('获取反馈详情错误:', error);
    return responseUtils.error(res, '获取反馈详情失败', 500);
  }
});

/**
 * @route   POST /api/feedbacks
 * @desc    创建面试反馈
 * @access  Private (面试官)
 */
router.post('/', async (req, res) => {
  try {
    const data = {
      ...req.body,
      interviewer_id: req.user.id
    };

    const feedback = new InterviewFeedback(data);
    await feedback.create();

    return responseUtils.success(res, feedback.toJSON(), '创建反馈成功');
  } catch (error) {
    console.error('创建反馈错误:', error);
    return responseUtils.error(res, error.message || '创建反馈失败', 400);
  }
});

/**
 * @route   PUT /api/feedbacks/:id
 * @desc    更新面试反馈
 * @access  Private (反馈创建者或管理员)
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const feedback = await InterviewFeedback.findById(id);

    if (!feedback) {
      return responseUtils.error(res, '反馈不存在', 404);
    }

    // 权限检查：只有反馈创建者或管理员可以修改
    if (!req.user.isAdmin && feedback.interviewer_id !== req.user.id) {
      return responseUtils.error(res, '无权限修改该反馈', 403);
    }

    // 已提交的反馈只有管理员可以修改
    if (feedback.status === 'submitted' && !req.user.isAdmin) {
      return responseUtils.error(res, '已提交的反馈无法修改', 403);
    }

    await feedback.update(req.body);
    return responseUtils.success(res, feedback.toJSON(), '更新反馈成功');
  } catch (error) {
    console.error('更新反馈错误:', error);
    return responseUtils.error(res, error.message || '更新反馈失败', 400);
  }
});

/**
 * @route   DELETE /api/feedbacks/:id
 * @desc    删除面试反馈
 * @access  Private (管理员)
 */
router.delete('/:id', authorize(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const feedback = await InterviewFeedback.findById(id);

    if (!feedback) {
      return responseUtils.error(res, '反馈不存在', 404);
    }

    await feedback.delete();
    return responseUtils.success(res, null, '删除反馈成功');
  } catch (error) {
    console.error('删除反馈错误:', error);
    return responseUtils.error(res, error.message || '删除反馈失败', 500);
  }
});

/**
 * @route   POST /api/feedbacks/:id/submit
 * @desc    提交面试反馈
 * @access  Private (反馈创建者)
 */
router.post('/:id/submit', async (req, res) => {
  try {
    const { id } = req.params;
    const feedback = await InterviewFeedback.findById(id);

    if (!feedback) {
      return responseUtils.error(res, '反馈不存在', 404);
    }

    // 权限检查：只有反馈创建者可以提交
    if (feedback.interviewer_id !== req.user.id) {
      return responseUtils.error(res, '无权限提交该反馈', 403);
    }

    if (feedback.status === 'submitted') {
      return responseUtils.error(res, '反馈已提交', 400);
    }

    await feedback.submit();
    return responseUtils.success(res, feedback.toJSON(), '提交反馈成功');
  } catch (error) {
    console.error('提交反馈错误:', error);
    return responseUtils.error(res, error.message || '提交反馈失败', 500);
  }
});

/**
 * @route   GET /api/feedbacks/statistics
 * @desc    获取反馈统计
 * @access  Private (管理员、HR)
 */
router.get('/statistics', authorize(['admin', 'hr']), async (req, res) => {
  try {
    const { interviewer_id, date_from, date_to } = req.query;

    const statistics = await InterviewFeedback.getStatistics({
      interviewer_id,
      date_from,
      date_to
    });

    return responseUtils.success(res, statistics, '获取反馈统计成功');
  } catch (error) {
    console.error('获取反馈统计错误:', error);
    return responseUtils.error(res, '获取反馈统计失败', 500);
  }
});

/**
 * @route   GET /api/feedbacks/candidate/:candidateId
 * @desc    获取候选人的所有反馈记录
 * @access  Private (管理员、HR)
 */
router.get('/candidate/:candidateId', authorize(['admin', 'hr']), async (req, res) => {
  try {
    const { candidateId } = req.params;
    const feedbacks = await InterviewFeedback.getCandidateFeedbacks(candidateId);

    return responseUtils.success(res, feedbacks.map(f => f.toJSON()), '获取候选人反馈记录成功');
  } catch (error) {
    console.error('获取候选人反馈记录错误:', error);
    return responseUtils.error(res, '获取候选人反馈记录失败', 500);
  }
});

// ==================== 反馈模板相关路由 ====================

/**
 * @route   GET /api/feedbacks/templates
 * @desc    获取反馈模板列表
 * @access  Private
 */
router.get('/templates', async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 20,
      status = 'active',
      position_level,
      department,
      template_type,
      search
    } = req.query;

    const options = {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      status,
      position_level,
      department,
      template_type,
      search
    };

    const result = await FeedbackTemplate.findAll(options);
    return responseUtils.success(res, result, '获取模板列表成功');
  } catch (error) {
    console.error('获取模板列表错误:', error);
    return responseUtils.error(res, '获取模板列表失败', 500);
  }
});

/**
 * @route   GET /api/feedbacks/templates/:id
 * @desc    获取反馈模板详情
 * @access  Private
 */
router.get('/templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const template = await FeedbackTemplate.findById(id);

    if (!template) {
      return responseUtils.error(res, '模板不存在', 404);
    }

    return responseUtils.success(res, template.toJSON(), '获取模板详情成功');
  } catch (error) {
    console.error('获取模板详情错误:', error);
    return responseUtils.error(res, '获取模板详情失败', 500);
  }
});

/**
 * @route   POST /api/feedbacks/templates
 * @desc    创建反馈模板
 * @access  Private (管理员、HR)
 */
router.post('/templates', authorize(['admin', 'hr']), async (req, res) => {
  try {
    const data = {
      ...req.body,
      created_by: req.user.id
    };

    const template = new FeedbackTemplate(data);
    await template.create();

    return responseUtils.success(res, template.toJSON(), '创建模板成功');
  } catch (error) {
    console.error('创建模板错误:', error);
    return responseUtils.error(res, error.message || '创建模板失败', 400);
  }
});

/**
 * @route   PUT /api/feedbacks/templates/:id
 * @desc    更新反馈模板
 * @access  Private (管理员、HR或模板创建者)
 */
router.put('/templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const template = await FeedbackTemplate.findById(id);

    if (!template) {
      return responseUtils.error(res, '模板不存在', 404);
    }

    // 权限检查：管理员、HR或模板创建者可以修改
    if (!req.user.isAdmin && !req.user.isHR && template.created_by !== req.user.id) {
      return responseUtils.error(res, '无权限修改该模板', 403);
    }

    await template.update(req.body);
    return responseUtils.success(res, template.toJSON(), '更新模板成功');
  } catch (error) {
    console.error('更新模板错误:', error);
    return responseUtils.error(res, error.message || '更新模板失败', 400);
  }
});

/**
 * @route   DELETE /api/feedbacks/templates/:id
 * @desc    删除反馈模板
 * @access  Private (管理员)
 */
router.delete('/templates/:id', authorize(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const template = await FeedbackTemplate.findById(id);

    if (!template) {
      return responseUtils.error(res, '模板不存在', 404);
    }

    await template.delete();
    return responseUtils.success(res, null, '删除模板成功');
  } catch (error) {
    console.error('删除模板错误:', error);
    return responseUtils.error(res, error.message || '删除模板失败', 500);
  }
});

/**
 * @route   POST /api/feedbacks/templates/:id/duplicate
 * @desc    复制反馈模板
 * @access  Private (管理员、HR)
 */
router.post('/templates/:id/duplicate', authorize(['admin', 'hr']), async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
      return responseUtils.error(res, '请提供新模板名称', 400);
    }

    const template = await FeedbackTemplate.findById(id);
    if (!template) {
      return responseUtils.error(res, '原模板不存在', 404);
    }

    const duplicatedTemplate = await template.duplicate(name, req.user.id);
    return responseUtils.success(res, duplicatedTemplate.toJSON(), '复制模板成功');
  } catch (error) {
    console.error('复制模板错误:', error);
    return responseUtils.error(res, error.message || '复制模板失败', 500);
  }
});

/**
 * @route   POST /api/feedbacks/templates/:id/set-default
 * @desc    设置默认模板
 * @access  Private (管理员)
 */
router.post('/templates/:id/set-default', authorize(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const template = await FeedbackTemplate.findById(id);

    if (!template) {
      return responseUtils.error(res, '模板不存在', 404);
    }

    await template.setAsDefault();
    return responseUtils.success(res, template.toJSON(), '设置默认模板成功');
  } catch (error) {
    console.error('设置默认模板错误:', error);
    return responseUtils.error(res, error.message || '设置默认模板失败', 500);
  }
});

/**
 * @route   GET /api/feedbacks/templates/default
 * @desc    获取默认模板
 * @access  Private
 */
router.get('/templates/default', async (req, res) => {
  try {
    const template = await FeedbackTemplate.getDefault();

    if (!template) {
      return responseUtils.error(res, '未设置默认模板', 404);
    }

    return responseUtils.success(res, template.toJSON(), '获取默认模板成功');
  } catch (error) {
    console.error('获取默认模板错误:', error);
    return responseUtils.error(res, '获取默认模板失败', 500);
  }
});

/**
 * @route   GET /api/feedbacks/templates/suitable
 * @desc    获取适合的模板（根据职位和部门）
 * @access  Private
 */
router.get('/templates/suitable', async (req, res) => {
  try {
    const { position_level, department } = req.query;

    if (!position_level) {
      return responseUtils.error(res, '请提供职位等级', 400);
    }

    const templates = await FeedbackTemplate.getSuitableTemplates(position_level, department || '');
    return responseUtils.success(res, templates.map(t => t.toJSON()), '获取适合模板成功');
  } catch (error) {
    console.error('获取适合模板错误:', error);
    return responseUtils.error(res, '获取适合模板失败', 500);
  }
});

/**
 * @route   GET /api/feedbacks/templates/statistics
 * @desc    获取模板统计
 * @access  Private (管理员、HR)
 */
router.get('/templates/statistics', authorize(['admin', 'hr']), async (req, res) => {
  try {
    const statistics = await FeedbackTemplate.getStatistics();
    return responseUtils.success(res, statistics, '获取模板统计成功');
  } catch (error) {
    console.error('获取模板统计错误:', error);
    return responseUtils.error(res, '获取模板统计失败', 500);
  }
});

module.exports = router;