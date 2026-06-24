const express = require('express');
const { uploadSingle, uploadMultiple, handleUploadError } = require('../middleware/upload');
const ResumeParser = require('../services/ResumeParser');
const Candidate = require('../models/Candidate');
const { responseUtils } = require('../utils/helpers');
const { authenticate } = require('../middleware/auth');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// 所有路由需要认证
router.use(authenticate);

/**
 * @route   POST /api/resumes/upload
 * @desc    上传单个简历文件
 * @access  Private
 */
router.post('/upload', uploadSingle, handleUploadError, async (req, res) => {
  try {
    if (!req.file) {
      return responseUtils.error(res, '请选择要上传的文件', 400);
    }

    const file = req.file;
    const filePath = file.path;
    const fileUrl = `/uploads/resumes/${file.filename}`;

    // 解析简历内容
    const parseResult = await ResumeParser.parse(filePath, file.originalname);

    // 如果是新候选人，自动创建
    let candidate;
    const { email, phone } = parseResult.candidateInfo;

    if (email || phone) {
      // 查找是否已存在
      const existing = await Candidate.findByEmailOrPhone(email, phone);

      if (existing) {
        // 更新现有候选人的简历信息
        await Candidate.update(existing.id, {
          resume_url: fileUrl,
          resume_text: parseResult.text
        });
        candidate = existing;
      } else {
        // 创建新候选人
        candidate = new Candidate({
          ...parseResult.candidateInfo,
          resume_url: fileUrl,
          resume_text: parseResult.text,
          source: 'manual',
          status: 'new',
          created_by: req.user.id
        });
        await candidate.create();
      }
    }

    return responseUtils.success(res, {
      file: {
        originalName: file.originalname,
        fileName: file.filename,
        size: file.size,
        url: fileUrl,
        type: file.mimetype
      },
      parseResult,
      candidateId: candidate.id
    }, '简历上传成功');

  } catch (error) {
    console.error('简历上传错误:', error);

    // 如果上传失败，删除已上传的文件
    if (req.file && req.file.path) {
      fs.unlinkSync(req.file.path);
    }

    return responseUtils.error(res, '简历上传失败', 500);
  }
});

/**
 * @route   POST /api/resumes/batch
 * @desc    批量上传简历文件
 * @access  Private
 */
router.post('/batch', uploadMultiple, handleUploadError, async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return responseUtils.error(res, '请选择要上传的文件', 400);
    }

    const results = [];
    const successCount = [];
    const failCount = [];

    for (const file of req.files) {
      try {
        const filePath = file.path;
        const fileUrl = `/uploads/resumes/${file.filename}`;

        // 解析简历
        const parseResult = await ResumeParser.parse(filePath, file.originalname);

        // 创建或更新候选人
        const { email, phone } = parseResult.candidateInfo;
        let candidateId;

        if (email || phone) {
          const existing = await Candidate.findByEmailOrPhone(email, phone);

          if (existing) {
            await Candidate.update(existing.id, {
              resume_url: fileUrl,
              resume_text: parseResult.text
            });
            candidateId = existing.id;
          } else {
            const candidate = new Candidate({
              ...parseResult.candidateInfo,
              resume_url: fileUrl,
              resume_text: parseResult.text,
              source: 'manual',
              status: 'new',
              created_by: req.user.id
            });
            await candidate.create();
            candidateId = candidate.id;
          }
        }

        results.push({
          originalName: file.originalname,
          fileName: file.filename,
          size: file.size,
          url: fileUrl,
          candidateId: candidateId,
          success: true
        });
        successCount.push(file.originalname);

      } catch (error) {
        console.error(`文件 ${file.originalname} 处理失败:`, error);
        results.push({
          originalName: file.originalname,
          error: error.message,
          success: false
        });
        failCount.push(file.originalname);

        // 删除失败的文件
        if (file.path) {
          fs.unlinkSync(file.path);
        }
      }
    }

    return responseUtils.success(res, {
      total: req.files.length,
      success: successCount.length,
      failed: failCount.length,
      results
    }, `批量上传完成，成功 ${successCount.length} 个，失败 ${failCount.length} 个`);

  } catch (error) {
    console.error('批量上传错误:', error);
    return responseUtils.error(res, '批量上传失败', 500);
  }
});

/**
 * @route   GET /api/resumes/stats/:candidateId
 * @desc    获取简历统计信息
 * @access  Private
 */
router.get('/stats/:candidateId', authenticate, async (req, res) => {
  try {
    const candidateId = parseInt(req.params.candidateId);
    const candidate = await Candidate.findById(candidateId);

    if (!candidate) {
      return responseUtils.error(res, '候选人不存在', 404);
    }

    const stats = {
      hasResume: !!candidate.resume_url,
      resumeSize: 0,
      resumeTextLength: 0
    };

    if (candidate.resume_url) {
      const resumePath = path.join(__dirname, '../../', candidate.resume_url);

      if (fs.existsSync(resumePath)) {
        stats.resumeSize = ResumeParser.getFileSize(resumePath);
        stats.resumeSizeFormatted = ResumeParser.formatFileSize(stats.resumeSize);
      }
    }

    if (candidate.resume_text) {
      stats.resumeTextLength = candidate.resume_text.length;
      stats.wordCount = candidate.resume_text.split(/\s+/).length;
    }

    return responseUtils.success(res, stats, '获取简历统计成功');

  } catch (error) {
    console.error('获取简历统计错误:', error);
    return responseUtils.error(res, '获取简历统计失败', 500);
  }
});

/**
 * @route   GET /api/resumes/:candidateId
 * @desc    获取候选人简历
 * @access  Private
 */
router.get('/:candidateId', authenticate, async (req, res) => {
  try {
    const candidateId = parseInt(req.params.candidateId);
    const candidate = await Candidate.findById(candidateId);

    if (!candidate) {
      return responseUtils.error(res, '候选人不存在', 404);
    }

    if (!candidate.resume_url) {
      return responseUtils.error(res, '该候选人未上传简历', 404);
    }

    // 构建文件完整路径
    const resumePath = path.join(__dirname, '../../', candidate.resume_url);

    if (!fs.existsSync(resumePath)) {
      return responseUtils.error(res, '简历文件不存在', 404);
    }

    // 检查文件权限
    try {
      fs.accessSync(resumePath, fs.constants.R_OK);
    } catch (err) {
      return responseUtils.error(res, '无权访问该文件', 403);
    }

    // 返回文件流
    res.sendFile(resumePath, (err) => {
      if (err) {
        console.error('文件发送错误:', err);
        return responseUtils.error(res, '文件读取失败', 500);
      }
    });

  } catch (error) {
    console.error('获取简历错误:', error);
    return responseUtils.error(res, '获取简历失败', 500);
  }
});

/**
 * @route   DELETE /api/resumes/:candidateId
 * @desc   删除候选人简历
 * @access  Private
 */
router.delete('/:candidateId', authenticate, async (req, res) => {
  try {
    const candidateId = parseInt(req.params.candidateId);
    const candidate = await Candidate.findById(candidateId);

    if (!candidate) {
      return responseUtils.error(res, '候选人不存在', 404);
    }

    if (!candidate.resume_url) {
      return responseUtils.error(res, '该候选人未上传简历', 400);
    }

    // 构建文件路径
    const resumePath = path.join(__dirname, '../../', candidate.resume_url);

    // 删除文件
    const deleteResult = ResumeParser.deleteFile(resumePath);

    if (deleteResult.success) {
      // 更新候选人记录
      await Candidate.update(candidateId, {
        resume_url: null,
        resume_text: null
      });

      return responseUtils.success(res, null, '简历删除成功');
    } else {
      return responseUtils.error(res, '简历删除失败', 500);
    }

  } catch (error) {
    console.error('删除简历错误:', error);
    return responseUtils.error(res, '删除简历失败', 500);
  }
});

/**
 * @route   POST /api/resumes/parse
 * @desc    仅解析简历不保存
 * @access  Private
 */
router.post('/parse', uploadSingle, handleUploadError, async (req, res) => {
  try {
    if (!req.file) {
      return responseUtils.error(res, '请选择要上传的文件', 400);
    }

    const file = req.file;
    const filePath = file.path;

    // 解析简历
    const parseResult = await ResumeParser.parse(filePath, file.originalname);

    // 删除临时文件
    fs.unlinkSync(filePath);

    return responseUtils.success(res, {
      file: {
        originalName: file.originalname,
        fileName: file.filename,
        size: file.size
      },
      parseResult
    }, '简历解析成功');

  } catch (error) {
    console.error('简历解析错误:', error);

    // 删除临时文件
    if (req.file && req.file.path) {
      fs.unlinkSync(req.file.path);
    }

    return responseUtils.error(res, '简历解析失败', 500);
  }
});

module.exports = router;
