/**
 * 数据导出API路由
 */

const express = require('express');
const router = express.Router();
const exportService = require('../services/ExportService');
const { query } = require('../config/database');
const path = require('path');
const fs = require('fs');

// 导出目录
const exportDir = path.join(__dirname, '../../exports');

// 确保导出目录存在
if (!fs.existsSync(exportDir)) {
  fs.mkdirSync(exportDir, { recursive: true });
}

/**
 * 导出候选人列表
 * GET /api/exports/candidates
 */
router.get('/candidates', async (req, res) => {
  try {
    const { status, education, experience_min, experience_max, search } = req.query;

    let sql = `
      SELECT
        id, name, email, phone, education, school, major,
        experience_years, current_company, current_position,
        skills, status, created_at
      FROM candidates
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }

    if (education) {
      sql += ' AND education = ?';
      params.push(education);
    }

    if (experience_min) {
      sql += ' AND experience_years >= ?';
      params.push(parseInt(experience_min));
    }

    if (experience_max) {
      sql += ' AND experience_years <= ?';
      params.push(parseInt(experience_max));
    }

    if (search) {
      sql += ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    sql += ' ORDER BY created_at DESC';

    const candidates = await query(sql, params);

    const result = await exportService.exportCandidates(candidates, { status, education, search });

    res.json({
      success: true,
      message: '候选人列表导出成功',
      data: {
        download_url: exportService.getDownloadUrl(result.filename),
        filename: result.filename,
        count: result.count
      }
    });
  } catch (error) {
    console.error('导出候选人失败:', error);
    res.status(500).json({
      success: false,
      message: '导出失败: ' + error.message
    });
  }
});

/**
 * 导出面试列表
 * GET /api/exports/interviews
 */
router.get('/interviews', async (req, res) => {
  try {
    const { status, position_id, interviewer_id, date_from, date_to } = req.query;

    let sql = `
      SELECT
        i.id,
        c.name as candidate_name,
        p.title as position_title,
        i.interviewer_name,
        DATE_FORMAT(i.scheduled_time, '%Y-%m-%d') as interview_date,
        DATE_FORMAT(i.scheduled_time, '%H:%i') as interview_time,
        i.type as interview_type,
        i.location,
        i.meeting_url,
        i.status,
        IFNULL(i.feedback, '') as feedback_status,
        i.created_at
      FROM interviews i
      LEFT JOIN candidates c ON i.candidate_id = c.id
      LEFT JOIN positions p ON i.position_id = p.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      sql += ' AND i.status = ?';
      params.push(status);
    }

    if (position_id) {
      sql += ' AND i.position_id = ?';
      params.push(position_id);
    }

    if (interviewer_id) {
      sql += ' AND i.interviewer_id = ?';
      params.push(interviewer_id);
    }

    if (dateFrom) {
      sql += ' AND DATE(i.scheduled_time) >= ?';
      params.push(dateFrom);
    }

    if (dateTo) {
      sql += ' AND DATE(i.scheduled_time) <= ?';
      params.push(dateTo);
    }

    sql += ' ORDER BY i.scheduled_time DESC';

    const interviews = await query(sql, params);

    const result = await exportService.exportInterviews(interviews, { status, position_id });

    res.json({
      success: true,
      message: '面试列表导出成功',
      data: {
        download_url: exportService.getDownloadUrl(result.filename),
        filename: result.filename,
        count: result.count
      }
    });
  } catch (error) {
    console.error('导出面试失败:', error);
    res.status(500).json({
      success: false,
      message: '导出失败: ' + error.message
    });
  }
});

/**
 * 导出反馈列表
 * GET /api/exports/feedbacks
 */
router.get('/feedbacks', async (req, res) => {
  try {
    const { position_id, interviewer_id, recommendation } = req.query;

    let sql = `
      SELECT
        f.id,
        c.name as candidate_name,
        p.title as position_title,
        u.name as interviewer_name,
        i.interview_date,
        f.technical_score,
        f.communication_score,
        f.overall_score,
        f.recommendation,
        f.comments,
        f.created_at
      FROM feedbacks f
      LEFT JOIN interviews i ON f.interview_id = i.id
      LEFT JOIN candidates c ON i.candidate_id = c.id
      LEFT JOIN positions p ON i.position_id = p.id
      LEFT JOIN users u ON f.interviewer_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (position_id) {
      sql += ' AND i.position_id = ?';
      params.push(position_id);
    }

    if (interviewer_id) {
      sql += ' AND f.interviewer_id = ?';
      params.push(interviewer_id);
    }

    if (recommendation) {
      sql += ' AND f.recommendation = ?';
      params.push(recommendation);
    }

    sql += ' ORDER BY f.created_at DESC';

    const feedbacks = await query(sql, params);

    const result = await exportService.exportFeedbacks(feedbacks, { position_id });

    res.json({
      success: true,
      message: '反馈列表导出成功',
      data: {
        download_url: exportService.getDownloadUrl(result.filename),
        filename: result.filename,
        count: result.count
      }
    });
  } catch (error) {
    console.error('导出反馈失败:', error);
    res.status(500).json({
      success: false,
      message: '导出失败: ' + error.message
    });
  }
});

/**
 * 导出职位列表
 * GET /api/exports/positions
 */
router.get('/positions', async (req, res) => {
  try {
    const { status, department, employment_type } = req.query;

    let sql = `
      SELECT
        id, title, department, type as employment_type, location,
        CONCAT(IFNULL(salary_min, 0), '-', IFNULL(salary_max, 0)) as salary_range,
        level as experience_required, '本科' as education_required,
        status, created_at
      FROM positions
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }

    if (department) {
      sql += ' AND department = ?';
      params.push(department);
    }

    if (employmentType) {
      sql += ' AND type = ?';
      params.push(employmentType);
    }

    sql += ' ORDER BY created_at DESC';

    const positions = await query(sql, params);

    const result = await exportService.exportPositions(positions, { status, department });

    res.json({
      success: true,
      message: '职位列表导出成功',
      data: {
        download_url: exportService.getDownloadUrl(result.filename),
        filename: result.filename,
        count: result.count
      }
    });
  } catch (error) {
    console.error('导出职位失败:', error);
    res.status(500).json({
      success: false,
      message: '导出失败: ' + error.message
    });
  }
});

/**
 * 下载导出文件
 * GET /api/exports/download/:filename
 */
router.get('/download/:filename', (req, res) => {
  try {
    const filename = req.params.filename;

    // 安全检查：防止路径遍历攻击
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({
        success: false,
        message: '非法的文件名'
      });
    }

    const filepath = path.join(exportDir, filename);

    if (!fs.existsSync(filepath)) {
      return res.status(404).json({
        success: false,
        message: '文件不存在'
      });
    }

    // 设置响应头
    res.download(filepath, filename, (err) => {
      if (err) {
        console.error('文件下载失败:', err);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: '文件下载失败'
          });
        }
      }
    });
  } catch (error) {
    console.error('下载文件失败:', error);
    res.status(500).json({
      success: false,
      message: '下载失败: ' + error.message
    });
  }
});

/**
 * 获取导出历史
 * GET /api/exports/history
 */
router.get('/history', (req, res) => {
  try {
    const files = fs.readdirSync(exportDir)
      .filter(file => file.endsWith('.xlsx'))
      .map(file => {
        const filepath = path.join(exportDir, file);
        const stats = fs.statSync(filepath);
        return {
          filename: file,
          size: stats.size,
          created_at: stats.mtime,
          download_url: exportService.getDownloadUrl(file)
        };
      })
      .sort((a, b) => b.created_at - a.created_at);

    res.json({
      success: true,
      data: files
    });
  } catch (error) {
    console.error('获取导出历史失败:', error);
    res.status(500).json({
      success: false,
      message: '获取失败: ' + error.message
    });
  }
});

module.exports = router;
