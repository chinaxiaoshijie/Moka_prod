#!/usr/bin/env node

/**
 * 简历管理和邮件通知功能全面测试
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const BASE_URL = 'http://localhost:3000';
let AUTH_TOKEN = '';

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function section(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'blue');
  console.log('='.repeat(60));
}

// HTTP请求封装
async function request(method, endpoint, data = null, isFormData = false) {
  const url = `${BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: {}
  };

  if (AUTH_TOKEN && !endpoint.includes('/login')) {
    options.headers['Authorization'] = `Bearer ${AUTH_TOKEN}`;
  }

  if (!isFormData && data) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);
    const text = await response.text();
    let jsonData;
    try {
      jsonData = JSON.parse(text);
    } catch {
      jsonData = { message: text };
    }
    return { status: response.status, data: jsonData };
  } catch (error) {
    return { status: 0, error: error.message };
  }
}

// 测试结果跟踪
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

function testResult(name, passed, details = '') {
  const status = passed ? 'PASS' : 'FAIL';
  const color = passed ? 'green' : 'red';
  results.tests.push({ name, passed, details });
  if (passed) {
    results.passed++;
  } else {
    results.failed++;
  }
  log(`  [${status}] ${name}`, color);
  if (details) {
    console.log(`       ${details}`);
  }
}

// 创建测试PDF文件
function createTestPDF() {
  const testDir = path.join(__dirname, 'test-files');
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }

  // 创建一个简单的测试文本文件（模拟简历）
  const testResume = path.join(testDir, 'test-resume.txt');
  fs.writeFileSync(testResume, `
张三
前端开发工程师

个人信息
邮箱：zhangsan@example.com
电话：13800138000
学历：本科
学校：北京科技大学
专业：计算机科学与技术

工作经历
2021-2023 某某科技有限公司 前端工程师
2019-2021 某某网络技术有限公司 前端开发

技能
JavaScript、TypeScript、React、Vue、Node.js
MySQL、MongoDB、Redis
Docker、Git、Linux
  `);

  return testResume;
}

async function runTests() {
  log('\n🚀 开始全面功能测试', 'magenta');

  // ========================================
  // 1. 健康检查
  // ========================================
  section('1. 健康检查测试');

  const healthRes = await request('GET', '/health');
  testResult(
    '健康检查端点',
    healthRes.status === 200 && healthRes.data.status === 'ok',
    JSON.stringify(healthRes.data)
  );

  // ========================================
  // 2. 用户认证
  // ========================================
  section('2. 用户认证测试');

  const loginRes = await request('POST', '/api/auth/login', {
    username: 'admin',
    email: 'admin@company.com',
    password: 'test123'
  });
  testResult(
    '管理员登录',
    loginRes.status === 200 && loginRes.data.success === true,
    ''
  );

  if (loginRes.data && loginRes.data.data && loginRes.data.data.token) {
    AUTH_TOKEN = loginRes.data.data.token;
    log('  ✓ 获取到认证令牌', 'green');
  }

  // ========================================
  // 3. 简历管理功能测试
  // ========================================
  section('3. 简历管理功能测试');

  // 创建测试文件
  const testFile = createTestPDF();
  log(`  创建测试文件: ${testFile}`, 'yellow');

  // 3.1 测试文件上传API
  log('\n  测试单文件上传...', 'yellow');
  const formData = new FormData();
  formData.append('resume', fs.createReadStream(testFile));

  try {
    const uploadRes = await fetch(`${BASE_URL}/api/resumes/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`
      },
      body: formData
    });

    const uploadData = await uploadRes.json();

    testResult(
      '简历文件上传',
      uploadData.success === true,
      uploadData.message || ''
    );

    const candidateId = uploadData.data?.candidateId;
    if (candidateId) {
      log(`  ✓ 候选人ID: ${candidateId}`, 'green');

      // 3.2 获取候选人详情
      const candidateRes = await request('GET', `/api/candidates/${candidateId}`);
      testResult(
        '获取候选人详情',
        candidateRes.status === 200,
        `姓名: ${candidateRes.data?.data?.name || 'N/A'}`
      );

      // 3.3 获取简历统计
      const statsRes = await request('GET', `/api/resumes/stats/${candidateId}`);
      testResult(
        '获取简历统计',
        statsRes.status === 200,
        `简历文本长度: ${statsRes.data?.data?.resumeTextLength || 0} 字符`
      );
    }
  } catch (error) {
    testResult('简历文件上传', false, error.message);
  }

  // 3.4 测试解析API（仅解析不保存）
  log('\n  测试简历解析...', 'yellow');
  try {
    const parseFormData = new FormData();
    parseFormData.append('resume', fs.createReadStream(testFile));

    const parseRes = await fetch(`${BASE_URL}/api/resumes/parse`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`
      },
      body: parseFormData
    });

    const parseData = await parseRes.json();
    testResult(
      '简历解析功能',
      parseData.success === true,
      `提取邮箱: ${parseData.data?.parseResult?.candidateInfo?.email || 'N/A'}`
    );
  } catch (error) {
    testResult('简历解析功能', false, error.message);
  }

  // ========================================
  // 4. 邮件通知功能测试
  // ========================================
  section('4. 邮件通知功能测试');

  // 4.1 检查邮件服务配置
  log('\n  测试邮件配置...', 'yellow');
  const configRes = await request('GET', '/api/notifications/config');
  testResult(
    '获取邮件配置',
    configRes.status === 200,
    `邮件服务${configRes.data?.data?.enabled ? '已启用' : '未启用'}`
  );

  // 4.2 测试发送测试邮件
  log('\n  测试发送邮件...', 'yellow');
  const emailRes = await request('POST', '/api/notifications/test', {
    to: 'test@example.com'
  });

  // 邮件可能会失败（未配置SMTP），但API应该正常响应
  if (emailRes.status === 400 && emailRes.data?.message?.includes('未启用')) {
    testResult(
      '邮件服务状态检查',
      true,
      '邮件服务未启用（符合预期，需要配置SMTP）'
    );
  } else if (emailRes.status === 200) {
    testResult('发送测试邮件', true, '测试邮件发送成功');
  } else {
    testResult(
      '邮件API响应',
      emailRes.status < 500,
      `状态码: ${emailRes.status}, 信息: ${emailRes.data?.message || ''}`
    );
  }

  // 4.3 测试面试邀请邮件API
  log('\n  测试面试邀请邮件...', 'yellow');
  const invitationRes = await request('POST', '/api/notifications/interview-invitation', {
    to: 'candidate@example.com',
    candidateName: '张三',
    positionTitle: '前端工程师',
    interviewDate: '2026-03-01',
    interviewTime: '14:00',
    interviewType: 'online',
    meetingUrl: 'https://meeting.example.com/123'
  });

  testResult(
    '面试邀请邮件API',
    invitationRes.status === 200 || invitationRes.status === 400,
    invitationRes.data?.message || ''
  );

  // 4.4 测试批量发送API
  log('\n  测试批量邮件发送...', 'yellow');
  const bulkRes = await request('POST', '/api/notifications/bulk', {
    templateName: 'interview_reminder',
    recipients: [
      { to: 'interviewer1@example.com', interviewerName: '李面试官', candidateName: '张三', positionTitle: '前端工程师', interviewDate: '2026-03-01', interviewTime: '14:00' },
      { to: 'interviewer2@example.com', interviewerName: '王面试官', candidateName: '李四', positionTitle: '后端工程师', interviewDate: '2026-03-01', interviewTime: '15:00' }
    ],
    commonData: {}
  });

  testResult(
    '批量邮件API',
    bulkRes.status === 200 || bulkRes.status === 400,
    bulkRes.data?.message || ''
  );

  // ========================================
  // 5. API路由验证
  // ========================================
  section('5. API路由验证');

  const routes = [
    { method: 'GET', path: '/api/notifications/config', desc: '邮件配置GET' },
    { method: 'POST', path: '/api/notifications/test', desc: '测试邮件POST' },
    { method: 'GET', path: '/api/resumes/stats/1', desc: '简历统计GET' }
  ];

  for (const route of routes) {
    const res = await request(route.method, route.path);
    testResult(
      `${route.desc} 路由存在`,
      res.status !== 404,
      `状态码: ${res.status}`
    );
  }

  // ========================================
  // 6. 权限测试
  // ========================================
  section('6. 权限验证测试');

  // 无token访问
  const oldToken = AUTH_TOKEN;
  AUTH_TOKEN = '';
  const noAuthRes = await request('GET', '/api/notifications/config');
  AUTH_TOKEN = oldToken;

  testResult(
    '未认证访问被拒绝',
    noAuthRes.status === 401,
    '无token访问受保护资源'
  );

  // ========================================
  // 测试总结
  // ========================================
  section('测试总结');

  const total = results.passed + results.failed;
  const passRate = total > 0 ? ((results.passed / total) * 100).toFixed(1) : 0;

  console.log(`
  总测试数: ${total}
  通过: ${results.passed} ✓
  失败: ${results.failed} ✗
  通过率: ${passRate}%
  `);

  if (results.failed > 0) {
    log('\n❌ 失败的测试:', 'red');
    results.tests.filter(t => !t.passed).forEach(t => {
      console.log(`  - ${t.name}: ${t.details}`);
    });
  }

  // 清理测试文件
  try {
    if (fs.existsSync(testFile)) {
      fs.unlinkSync(testFile);
      log('  ✓ 清理测试文件完成', 'green');
    }
  } catch (error) {
    // 忽略清理错误
  }

  console.log('\n' + '='.repeat(60));
  if (results.failed === 0) {
    log('✅ 所有测试通过！', 'green');
  } else {
    log(`⚠️  ${results.failed} 个测试失败`, 'yellow');
  }
  console.log('='.repeat(60) + '\n');

  process.exit(results.failed > 0 ? 1 : 0);
}

// 运行测试
runTests().catch(error => {
  log(`\n❌ 测试执行出错: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
