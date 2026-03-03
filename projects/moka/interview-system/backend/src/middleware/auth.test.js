const request = require('supertest');
const express = require('express');

// Mock dependencies
jest.mock('../config/redis', () => ({
  checkAndIncrementAttempts: jest.fn().mockResolvedValue({ allowed: true }),
  clearAttempts: jest.fn().mockResolvedValue()
}));

jest.mock('../config/database');

const { jwtUtils, responseUtils } = require('../utils/helpers');
const { query } = require('../config/database');
const { authenticate, authorize, optionalAuthenticate, loginAttemptLimiter } = require('./auth');

// 创建测试应用
const createTestApp = () => {
  const app = express();
  app.use(express.json());

  // 测试路由 - 使用认证中间件
  app.get('/protected', authenticate, (req, res) => {
    res.json({ success: true, user: req.user });
  });

  app.get('/optional', optionalAuthenticate, (req, res) => {
    res.json({ success: true, user: req.user });
  });

  app.get('/admin', authenticate, authorize('admin'), (req, res) => {
    res.json({ success: true, message: 'Admin access granted' });
  });

  app.get('/hr-or-admin', authenticate, authorize('hr', 'admin'), (req, res) => {
    res.json({ success: true, message: 'Access granted' });
  });

  return app;
};

// 设置测试环境变量
process.env.JWT_SECRET = 'test-jwt-secret-key';

describe('Auth Middleware Tests', () => {
  let app;
  let validToken;
  let expiredToken;
  let mockUser;

  beforeEach(() => {
    jest.clearAllMocks();
    app = createTestApp();

    // Mock user data
    mockUser = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      role: 'admin',
      department: '技术部',
      status: 'active'
    };

    // Mock database query to return proper format
    query.mockImplementation((sql, params) => {
      if (sql.includes('SELECT')) {
        return Promise.resolve([mockUser]); // Return single user, not nested array
      }
      return Promise.resolve([]);
    });

    // Generate valid token
    validToken = jwtUtils.generateToken({
      userId: 1,
      username: 'testuser',
      email: 'test@example.com',
      role: 'admin'
    });

    // Generate expired token (using a very short expiration)
    expiredToken = jwtUtils.generateToken({
      userId: 1,
      username: 'testuser'
    }, '-1h'); // Expired 1 hour ago
  });

  describe('authenticate middleware', () => {
    it('should authenticate user with valid token', async () => {
      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.username).toBe('testuser');
    });

    it('should return 401 if no authorization header', async () => {
      const response = await request(app)
        .get('/protected');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('缺少访问令牌');
    });

    it('should return 401 if authorization header does not start with Bearer', async () => {
      const response = await request(app)
        .get('/protected')
        .set('Authorization', 'InvalidFormat token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return 401 if token is invalid', async () => {
      const response = await request(app)
        .get('/protected')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('无效的访问令牌');
    });

    it('should return 401 if user not found in database', async () => {
      query.mockResolvedValueOnce([]); // Empty result

      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('用户不存在');
    });

    it('should return 401 if user status is not active', async () => {
      const inactiveUser = { ...mockUser, status: 'inactive' };
      query.mockResolvedValueOnce([inactiveUser]);

      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('账户已被禁用');
    });

    it('should add user info to request object', async () => {
      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.body.user.id).toBe(1);
      expect(response.body.user.username).toBe('testuser');
      expect(response.body.user.email).toBe('test@example.com');
      expect(response.body.user.role).toBe('admin');
    });
  });

  describe('authorize middleware', () => {
    it('should allow access to user with correct role', async () => {
      const adminUser = { ...mockUser, role: 'admin' };
      query.mockResolvedValue([adminUser]);

      const adminToken = jwtUtils.generateToken({
        userId: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: 'admin'
      });

      const response = await request(app)
        .get('/admin')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Admin access granted');
    });

    it('should return 403 if user lacks required role', async () => {
      const interviewerUser = { ...mockUser, role: 'interviewer' };
      query.mockResolvedValue([interviewerUser]);

      const interviewerToken = jwtUtils.generateToken({
        userId: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: 'interviewer'
      });

      const response = await request(app)
        .get('/admin')
        .set('Authorization', `Bearer ${interviewerToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('权限不足');
    });

    it('should allow access if user has one of multiple allowed roles', async () => {
      const hrUser = { ...mockUser, role: 'hr' };
      query.mockResolvedValue([hrUser]);

      const hrToken = jwtUtils.generateToken({
        userId: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: 'hr'
      });

      const response = await request(app)
        .get('/hr-or-admin')
        .set('Authorization', `Bearer ${hrToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Access granted');
    });

    it('should return 401 if no user in request', async () => {
      // Create a route without authenticate middleware
      const testApp = express();
      testApp.get('/no-auth', authorize('admin'), (req, res) => {
        res.json({ success: true });
      });

      const response = await request(testApp)
        .get('/no-auth');

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('未认证用户');
    });
  });

  describe('optionalAuthenticate middleware', () => {
    it('should set user to null if no authorization header', async () => {
      const response = await request(app)
        .get('/optional');

      expect(response.status).toBe(200);
      expect(response.body.user).toBeNull();
    });

    it('should set user to null if invalid token', async () => {
      const response = await request(app)
        .get('/optional')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(200);
      expect(response.body.user).toBeNull();
    });

    it('should set user if valid token provided', async () => {
      query.mockResolvedValue([mockUser]);

      const response = await request(app)
        .get('/optional')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.username).toBe('testuser');
    });

    it('should set user to null if user is inactive', async () => {
      const inactiveUser = { ...mockUser, status: 'inactive' };
      query.mockResolvedValue([inactiveUser]);

      const response = await request(app)
        .get('/optional')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.user).toBeNull();
    });
  });

  describe('loginAttemptLimiter', () => {
    it('should check login attempts before processing', async () => {
      const testApp = express();
      testApp.use(express.json());

      testApp.post('/login', loginAttemptLimiter.checkAttempts, (req, res, next) => next(), (req, res) => {
        res.json({ success: true });
      });

      const response = await request(testApp)
        .post('/login')
        .send({ email: 'test@example.com', password: 'password' });

      expect(response.status).toBe(200);
    });

    it('should record failed attempts', async () => {
      const checkAndIncrementAttempts = require('../config/redis').checkAndIncrementAttempts;

      const testApp = express();
      testApp.use(express.json());

      testApp.post('/login', loginAttemptLimiter.checkAttempts, (req, res, next) => next(), (req, res) => {
        res.status(401).json({ success: false });
      });

      const response = await request(testApp)
        .post('/login')
        .send({ email: 'test@example.com', password: 'wrong-password' });

      expect(checkAndIncrementAttempts).toHaveBeenCalled();
    });
  });

  describe('JWT token handling', () => {
    it('should extract token correctly from Bearer header', async () => {
      const token = jwtUtils.generateToken({ userId: 1 });

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });

    it('should verify valid token', async () => {
      const token = jwtUtils.generateToken({
        userId: 1,
        username: 'testuser'
      });

      const decoded = jwtUtils.verifyToken(token);

      expect(decoded.userId).toBe(1);
      expect(decoded.username).toBe('testuser');
    });

    it('should throw error for invalid token', async () => {
      expect(() => {
        jwtUtils.verifyToken('invalid-token');
      }).toThrow();
    });

    it('should generate refresh token', async () => {
      const refreshToken = jwtUtils.generateRefreshToken({ userId: 1 });

      expect(refreshToken).toBeDefined();
      expect(typeof refreshToken).toBe('string');
    });
  });

  describe('Error handling', () => {
    it('should handle database errors gracefully', async () => {
      query.mockRejectedValueOnce(new Error('Database connection failed'));

      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });

    it('should handle unexpected errors', async () => {
      // Mock query to throw an unexpected error
      query.mockImplementationOnce(() => {
        throw new Error('Unexpected error');
      });

      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${validToken}`);

      expect([500, 401]).toContain(response.status);
    });
  });

  describe('checkOwnership middleware', () => {
    const { checkOwnership } = require('./auth');

    beforeEach(() => {
      // Reset query mock before each checkOwnership test
      query.mockImplementation((sql, params) => {
        if (sql.includes('SELECT id, username')) {
          return Promise.resolve([mockUser]);
        }
        return Promise.resolve([]);
      });
    });

    it('should allow admin to access any resource', async () => {
      const app = express();
      app.get('/resource/:id', authenticate, checkOwnership(), (req, res) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .get('/resource/1')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
    });

    it('should deny non-owner from accessing resource', async () => {
      const app = express();
      app.get('/resource/:id', authenticate, checkOwnership(), (req, res) => {
        res.json({ success: true });
      });

      // Mock non-admin user
      const userToken = jwtUtils.generateToken({
        userId: 2,
        username: 'owner',
        role: 'interviewer'
      });

      const ownerUser = { ...mockUser, id: 2, role: 'interviewer' };

      let callCount = 0;
      query.mockImplementation((sql, params) => {
        callCount++;
        if (callCount === 1 && sql.includes('SELECT id, username')) {
          return Promise.resolve([ownerUser]);
        }
        // Resource owned by user 1, not user 2
        if (sql.includes('created_by')) {
          return Promise.resolve([{ created_by: 1 }]);
        }
        return Promise.resolve([]);
      });

      const response = await request(app)
        .get('/resource/1')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
    });

    it('should return 404 when resource not found', async () => {
      const app = express();
      app.get('/resource/:id', authenticate, checkOwnership(), (req, res) => {
        res.json({ success: true });
      });

      // Use non-admin user for this test
      const userToken = jwtUtils.generateToken({
        userId: 2,
        username: 'interviewer',
        role: 'interviewer'
      });

      const interviewerUser = { ...mockUser, id: 2, role: 'interviewer' };

      let callCount = 0;
      query.mockImplementation((sql, params) => {
        callCount++;
        if (callCount === 1 && sql.includes('SELECT id, username')) {
          return Promise.resolve([interviewerUser]);
        }
        // Resource not found
        return Promise.resolve([]);
      });

      const response = await request(app)
        .get('/resource/999')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('checkDepartment middleware', () => {
    const { checkDepartment } = require('./auth');

    it('should allow admin to access all departments', async () => {
      const app = express();
      app.get('/data', authenticate, checkDepartment, (req, res) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .get('/data')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
    });

    it('should allow hr to access all departments', async () => {
      const app = express();
      app.get('/data', authenticate, checkDepartment, (req, res) => {
        res.json({ success: true });
      });

      const hrToken = jwtUtils.generateToken({
        userId: 2,
        username: 'hruser',
        role: 'hr'
      });

      const hrUser = { ...mockUser, id: 2, role: 'hr' };
      query.mockResolvedValueOnce([hrUser]);

      const response = await request(app)
        .get('/data')
        .set('Authorization', `Bearer ${hrToken}`);

      expect(response.status).toBe(200);
    });

    it('should set department filter for interviewer', async () => {
      const app = express();
      app.get('/data', authenticate, checkDepartment, (req, res) => {
        res.json({ success: true, department: req.departmentFilter });
      });

      const interviewerToken = jwtUtils.generateToken({
        userId: 2,
        username: 'interviewer',
        role: 'interviewer',
        department: '技术部'
      });

      const interviewerUser = { ...mockUser, id: 2, role: 'interviewer', department: '技术部' };
      query.mockResolvedValueOnce([interviewerUser]);

      const response = await request(app)
        .get('/data')
        .set('Authorization', `Bearer ${interviewerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.department).toBe('技术部');
    });
  });

  describe('loginAttemptLimiter', () => {
    const { loginAttemptLimiter } = require('./auth');
    const { checkAndIncrementAttempts, clearAttempts } = require('../config/redis');

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should allow login when attempts are within limit', async () => {
      const app = express();
      app.use(express.json());
      app.post('/login', loginAttemptLimiter.checkAttempts, (req, res) => {
        res.json({ success: true });
      });

      checkAndIncrementAttempts.mockResolvedValueOnce({ allowed: true });

      const response = await request(app)
        .post('/login')
        .send({ email: 'test@example.com', password: 'password' });

      expect(response.status).toBe(200);
    });

    it('should block login when attempts exceed limit', async () => {
      const app = express();
      app.use(express.json());
      app.post('/login', loginAttemptLimiter.checkAttempts, (req, res) => {
        res.json({ success: true });
      });

      const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000;

      checkAndIncrementAttempts.mockResolvedValueOnce({
        allowed: false,
        lastAttempt: thirtyMinutesAgo
      });

      const response = await request(app)
        .post('/login')
        .send({ email: 'test@example.com', password: 'password' });

      expect(response.status).toBe(429);
      expect(response.body.success).toBe(false);
    });

    it('should clear attempts on successful login', async () => {
      clearAttempts.mockResolvedValueOnce();

      await loginAttemptLimiter.clearAttempts('test-key');

      expect(clearAttempts).toHaveBeenCalledWith('test-key');
    });

    it('should handle errors in checkAttempts gracefully', async () => {
      const app = express();
      app.use(express.json());
      app.post('/login', loginAttemptLimiter.checkAttempts, (req, res) => {
        res.json({ success: true, loginKey: req.loginKey });
      });

      checkAndIncrementAttempts.mockRejectedValueOnce(new Error('Redis error'));

      const response = await request(app)
        .post('/login')
        .send({ email: 'test@example.com', password: 'password' });

      // Should still proceed due to graceful degradation
      expect(response.status).toBe(200);
      expect(response.body.loginKey).toBeDefined();
    });
  });
});
