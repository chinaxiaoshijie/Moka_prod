const express = require('express');
const Candidate = require('../models/Candidate');
const { responseUtils, paginationUtils } = require('../utils/helpers');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, candidateSchemas } = require('../middleware/validation');

const router = express.Router();

// 所有路由都需要认证
router.use(authenticate);

/**
 * @route   GET /api/candidates
 * @desc    获取候选人列表
 * @access  Private
 */
router.get('/', async (req, res) => {
  try {
    const paginationParams = paginationUtils.getPaginationParams(req);
    const { status, source, education, experience_years, search } = req.query;

    const options = {
      ...paginationParams,
      status,
      source,
      education,
      experience_years: experience_years ? parseInt(experience_years) : undefined,
      search,
      // 面试官只能看到自己创建的候选人
      created_by: req.user.role === 'interviewer' ? req.user.id : undefined
    };

    const result = await Candidate.findAll(options);

    return responseUtils.paginated(res, result.candidates, result.pagination, '获取候选人列表成功');

  } catch (error) {
    console.error('获取候选人列表错误:', error);
    return responseUtils.error(res, '获取候选人列表失败', 500);
  }
});

/**
 * @route   GET /api/candidates/statistics
 * @desc    获取候选人统计信息
 * @access  Private
 */
router.get('/statistics', async (req, res) => {
  try {
    const createdBy = req.user.role === 'interviewer' ? req.user.id : null;
    const statistics = await Candidate.getStatistics(createdBy);

    return responseUtils.success(res, statistics, '获取候选人统计成功');

  } catch (error) {
    console.error('获取候选人统计错误:', error);
    return responseUtils.error(res, '获取候选人统计失败', 500);
  }
});

/**
 * @route   GET /api/candidates/search
 * @desc    搜索候选人
 * @access  Private
 */
router.get('/search', async (req, res) => {
  try {
    const { q: searchTerm } = req.query;

    if (!searchTerm) {
      return responseUtils.error(res, '搜索关键词不能为空', 400);
    }

    const paginationParams = paginationUtils.getPaginationParams(req);
    const candidates = await Candidate.search(searchTerm, paginationParams);

    return responseUtils.success(res, candidates, '搜索候选人成功');

  } catch (error) {
    console.error('搜索候选人错误:', error);
    return responseUtils.error(res, '搜索候选人失败', 500);
  }
});

/**
 * @route   GET /api/candidates/:id
 * @desc    获取单个候选人信息
 * @access  Private
 */
router.get('/:id', async (req, res) => {
  try {
    const candidateId = parseInt(req.params.id);

    const candidate = await Candidate.findById(candidateId);

    if (!candidate) {
      return responseUtils.error(res, '候选人不存在', 404);
    }

    // 检查权限：面试官只能查看自己创建的候选人
    if (req.user.role === 'interviewer' && candidate.created_by !== req.user.id) {
      return responseUtils.error(res, '权限不足', 403);
    }

    return responseUtils.success(res, candidate.toJSON(), '获取候选人信息成功');

  } catch (error) {
    console.error('获取候选人信息错误:', error);
    return responseUtils.error(res, '获取候选人信息失败', 500);
  }
});

/**
 * @route   POST /api/candidates
 * @desc    创建新候选人
 * @access  Private
 */
router.post('/', validate(candidateSchemas.create), async (req, res) => {
  try {
    const candidateData = {
      ...req.body,
      created_by: req.user.id
    };

    // 检查是否有重复候选人
    if (candidateData.email || candidateData.phone) {
      const duplicates = await Candidate.findDuplicates(
        candidateData.email,
        candidateData.phone,
        candidateData.name
      );

      if (duplicates.length > 0) {
        return responseUtils.error(res, '发现重复的候选人', 400, {
          duplicates: duplicates.map(c => ({
            id: c.id,
            name: c.name,
            email: c.email,
            phone: c.phone,
            status: c.status
          }))
        });
      }
    }

    const candidate = new Candidate(candidateData);
    await candidate.create();

    return responseUtils.success(res, candidate.toJSON(), '创建候选人成功', 201);

  } catch (error) {
    console.error('创建候选人错误:', error);
    return responseUtils.error(res, '创建候选人失败', 500);
  }
});

/**
 * @route   PUT /api/candidates/:id
 * @desc    更新候选人信息
 * @access  Private
 */
router.put('/:id', validate(candidateSchemas.update), async (req, res) => {
  try {
    const candidateId = parseInt(req.params.id);

    const candidate = await Candidate.findById(candidateId);

    if (!candidate) {
      return responseUtils.error(res, '候选人不存在', 404);
    }

    // 检查权限：面试官只能修改自己创建的候选人
    if (req.user.role === 'interviewer' && candidate.created_by !== req.user.id) {
      return responseUtils.error(res, '权限不足', 403);
    }

    // 如果更新邮箱或手机号，检查是否重复
    if ((req.body.email && req.body.email !== candidate.email) ||
        (req.body.phone && req.body.phone !== candidate.phone)) {
      const duplicates = await Candidate.findDuplicates(
        req.body.email || candidate.email,
        req.body.phone || candidate.phone,
        req.body.name || candidate.name
      );

      const otherDuplicates = duplicates.filter(d => d.id !== candidate.id);
      if (otherDuplicates.length > 0) {
        return responseUtils.error(res, '邮箱或手机号已存在', 400);
      }
    }

    await candidate.update(req.body);

    return responseUtils.success(res, candidate.toJSON(), '更新候选人信息成功');

  } catch (error) {
    console.error('更新候选人信息错误:', error);
    return responseUtils.error(res, '更新候选人信息失败', 500);
  }
});

/**
 * @route   DELETE /api/candidates/:id
 * @desc    删除候选人
 * @access  Private (Admin, HR, Owner)
 */
router.delete('/:id', async (req, res) => {
  try {
    const candidateId = parseInt(req.params.id);

    const candidate = await Candidate.findById(candidateId);

    if (!candidate) {
      return responseUtils.error(res, '候选人不存在', 404);
    }

    // 检查权限：只有管理员、HR或创建者可以删除
    if (req.user.role !== 'admin' &&
        req.user.role !== 'hr' &&
        candidate.created_by !== req.user.id) {
      return responseUtils.error(res, '权限不足', 403);
    }

    await candidate.delete();

    return responseUtils.success(res, null, '删除候选人成功');

  } catch (error) {
    console.error('删除候选人错误:', error);
    return responseUtils.error(res, '删除候选人失败', 500);
  }
});

/**
 * @route   POST /api/candidates/:id/duplicate-check
 * @desc    检查候选人重复
 * @access  Private
 */
router.post('/duplicate-check', async (req, res) => {
  try {
    const { email, phone, name } = req.body;

    if (!email && !phone && !name) {
      return responseUtils.error(res, '至少需要提供一个检查字段', 400);
    }

    const duplicates = await Candidate.findDuplicates(email, phone, name);

    return responseUtils.success(res, {
      hasDuplicates: duplicates.length > 0,
      duplicates: duplicates.map(c => ({
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        status: c.status,
        created_at: c.created_at
      }))
    }, '重复检查完成');

  } catch (error) {
    console.error('检查候选人重复错误:', error);
    return responseUtils.error(res, '检查候选人重复失败', 500);
  }
});

module.exports = router;