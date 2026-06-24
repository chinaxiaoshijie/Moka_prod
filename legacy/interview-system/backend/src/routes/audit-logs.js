/**
 * 操作日志API路由
 */

const express = require('express');
const router = express.Router();
const { getAuditLogs, getAuditStats, cleanOldLogs, ActionTypes, ResourceTypes } = require('../middleware/audit');
const { authenticate, authorize } = require('../middleware/auth');
const { query } = require('../config/database');

/**
 * 获取操作日志列表
 * GET /api/audit-logs
 */
router.get('/', authenticate, authorize('admin', 'hr_manager', 'hr'), async (req, res) => {
  try {
    const {
      user_id,
      username,
      action_type,
      resource_type,
      resource_id,
      date_from,
      date_to,
      page = 1,
      limit = 50,
      sort_by = 'created_at',
      sort_order = 'DESC'
    } = req.query;

    const filters = {
      user_id,
      username,
      action_type,
      resource_type,
      resource_id,
      date_from,
      date_to
    };

    const pagination = {
      page,
      limit,
      sort_by,
      sort_order
    };

    const result = await getAuditLogs(filters, pagination);

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('获取操作日志失败:', error);
    res.status(500).json({
      success: false,
      message: '获取失败: ' + error.message
    });
  }
});

/**
 * 获取日志统计
 * GET /api/audit-logs/stats
 */
router.get('/stats', authenticate, authorize('admin', 'hr_manager', 'hr'), async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const dateTo = new Date();
    const dateFrom = new Date(dateTo.getTime() - days * 24 * 60 * 60 * 1000);

    const stats = await getAuditStats(
      dateFrom.toISOString().slice(0, 19).replace('T', ' '),
      dateTo.toISOString().slice(0, 19).replace('T', ' ')
    );

    res.json({
      success: true,
      data: {
        period: {
          from: dateFrom,
          to: dateTo,
          days: parseInt(days)
        },
        stats
      }
    });
  } catch (error) {
    console.error('获取日志统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取失败: ' + error.message
    });
  }
});

/**
 * 清理旧日志
 * DELETE /api/audit-logs/clean
 */
router.delete('/clean', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { days = 90 } = req.query;

    const deletedCount = await cleanOldLogs(parseInt(days));

    res.json({
      success: true,
      message: `已删除 ${deletedCount} 条超过 ${days} 天的日志`,
      data: {
        deleted_count: deletedCount,
        days_kept: parseInt(days)
      }
    });
  } catch (error) {
    console.error('清理日志失败:', error);
    res.status(500).json({
      success: false,
      message: '清理失败: ' + error.message
    });
  }
});

/**
 * 获取可用的操作类型
 * GET /api/audit-logs/action-types
 */
router.get('/action-types', authenticate, (req, res) => {
  res.json({
    success: true,
    data: Object.values(ActionTypes)
  });
});

/**
 * 获取可用的资源类型
 * GET /api/audit-logs/resource-types
 */
router.get('/resource-types', authenticate, (req, res) => {
  res.json({
    success: true,
    data: Object.values(ResourceTypes)
  });
});

module.exports = router;
