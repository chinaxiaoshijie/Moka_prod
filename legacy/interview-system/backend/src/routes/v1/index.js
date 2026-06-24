const express = require('express');
const router = express.Router();

// Import all routes
const authRoutes = require('./auth');
const usersRoutes = require('./users');
const candidatesRoutes = require('./candidates');
const positionsRoutes = require('./positions');
const interviewsRoutes = require('./interviews');
const feedbacksRoutes = require('./feedbacks');
const resumesRoutes = require('./resumes');
const notificationsRoutes = require('./notifications');
const exportsRoutes = require('./exports');
const importsRoutes = require('./imports');
const auditLogsRoutes = require('./audit-logs');

// Mount all routes
router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/candidates', candidatesRoutes);
router.use('/positions', positionsRoutes);
router.use('/interviews', interviewsRoutes);
router.use('/feedbacks', feedbacksRoutes);
router.use('/resumes', resumesRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/exports', exportsRoutes);
router.use('/imports', importsRoutes);
router.use('/audit-logs', auditLogsRoutes);

// API info endpoint
router.get('/', (req, res) => {
  res.json({
    name: 'Moka Interview System API',
    version: 'v1',
    description: '面试管理系统 API v1',
    endpoints: {
      auth: {
        'POST /register': '用户注册',
        'POST /login': '用户登录',
        'POST /refresh': '刷新令牌',
        'GET /me': '获取当前用户',
        'PUT /profile': '更新用户资料',
        'PUT /change-password': '修改密码',
        'POST /forgot-password': '请求密码重置',
        'POST /reset-password': '重置密码'
      },
      users: {
        'GET /': '用户列表',
        'GET /:id': '用户详情',
        'GET /statistics': '用户统计',
        'GET /departments': '部门列表',
        'GET /interviewers': '面试官列表'
      },
      candidates: {
        'GET /': '候选人列表',
        'POST /': '创建候选人',
        'GET /:id': '候选人详情',
        'PUT /:id': '更新候选人',
        'DELETE /:id': '删除候选人',
        'GET /search': '搜索候选人',
        'GET /statistics': '候选人统计'
      },
      positions: {
        'GET /': '职位列表',
        'POST /': '创建职位',
        'GET /:id': '职位详情',
        'PUT /:id': '更新职位',
        'DELETE /:id': '删除职位',
        'GET /statistics': '职位统计'
      },
      interviews: {
        'GET /': '面试列表',
        'POST /': '创建面试',
        'GET /:id': '面试详情',
        'PUT /:id': '更新面试',
        'DELETE /:id': '删除面试',
        'GET /calendar': '面试日历',
        'GET /check-conflicts': '检查冲突',
        'POST /batch': '批量创建面试',
        'GET /statistics': '面试统计'
      },
      notifications: {
        'GET /': '通知列表',
        'GET /unread-count': '未读数量',
        'GET /:id': '通知详情',
        'PUT /:id/read': '标记已读',
        'PUT /read-all': '全部已读',
        'DELETE /:id': '删除通知',
        'POST /email/test': '发送测试邮件',
        'POST /email/interview-invitation': '发送面试邀请邮件'
      }
    },
    deprecationNotice: 'This is the current stable API version. No deprecation planned.'
  });
});

module.exports = router;
