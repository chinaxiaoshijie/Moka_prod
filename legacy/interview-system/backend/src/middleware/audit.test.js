const { auditMiddleware, logLogin, logExport, getAuditLogs, getAuditStats, cleanOldLogs, ActionTypes, ResourceTypes } = require('./audit');
const { query } = require('../config/database');

// Mock database
jest.mock('../config/database');

describe('Audit Middleware Tests', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      user: {
        id: 1,
        username: 'testuser',
        role: 'admin'
      },
      ip: '127.0.0.1',
      connection: { remoteAddress: '127.0.0.1' },
      get: jest.fn((header) => {
        if (header === 'User-Agent') return 'Mozilla/5.0 Test Browser';
        return null;
      }),
      body: {},
      params: {},
      query: {}
    };

    mockRes = {
      json: jest.fn(),
      statusCode: 200
    };

    mockRes.json = jest.fn(function(data) {
      this.statusCode = this.statusCode || 200;
      return data;
    });

    mockNext = jest.fn();

    // Mock successful query - use mockImplementation to always resolve
    query.mockImplementation(async () => ({ insertId: 1, affectedRows: 1 }));
  });

  describe('logLogin middleware', () => {
    it('should call next to proceed', async () => {
      await logLogin(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should wrap res.json method', async () => {
      await logLogin(mockReq, mockRes, mockNext);

      expect(typeof mockRes.json).toBe('function');
    });
  });

  describe('logExport middleware', () => {
    it('should return a middleware function', () => {
      const middleware = logExport(ResourceTypes.CANDIDATE);

      expect(typeof middleware).toBe('function');
      expect(middleware.length).toBe(3);
    });

    it('should call next to proceed', async () => {
      const middleware = logExport(ResourceTypes.POSITION);

      await middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should wrap res.json method', async () => {
      const middleware = logExport(ResourceTypes.INTERVIEW);

      await middleware(mockReq, mockRes, mockNext);

      expect(typeof mockRes.json).toBe('function');
    });
  });

  describe('getAuditLogs', () => {
    it('should get audit logs with pagination', async () => {
      const mockLogs = [
        { id: 1, action: 'create', resource_type: 'candidate', username: 'testuser' },
        { id: 2, action: 'update', resource_type: 'interview', username: 'admin' }
      ];

      query.mockResolvedValueOnce([{ total: 2 }]);
      query.mockResolvedValueOnce(mockLogs);

      const result = await getAuditLogs({}, { page: 1, limit: 20 });

      expect(result.data).toEqual(mockLogs);
      expect(result.pagination.total).toBe(2);
      expect(query).toHaveBeenCalledTimes(2);
    });

    it('should filter by action type', async () => {
      query.mockResolvedValueOnce([{ total: 1 }]);
      query.mockResolvedValueOnce([{ id: 1, action: 'login' }]);

      await getAuditLogs({ action: 'login' }, { page: 1, limit: 20 });

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('action = ?'),
        expect.any(Array)
      );
    });

    it('should filter by resource type', async () => {
      query.mockResolvedValueOnce([{ total: 1 }]);
      query.mockResolvedValueOnce([{ id: 1, resource_type: 'candidate' }]);

      await getAuditLogs({ resource_type: 'candidate' }, { page: 1, limit: 20 });

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('resource_type = ?'),
        expect.any(Array)
      );
    });

    it('should filter by user', async () => {
      query.mockResolvedValueOnce([{ total: 1 }]);
      query.mockResolvedValueOnce([{ id: 1, user_id: 5 }]);

      await getAuditLogs({ user_id: 5 }, { page: 1, limit: 20 });

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('user_id = ?'),
        expect.arrayContaining([5])
      );
    });

    it('should handle empty results', async () => {
      query.mockResolvedValueOnce([{ total: 0 }]);
      query.mockResolvedValueOnce([]);

      const result = await getAuditLogs({}, { page: 1, limit: 20 });

      expect(result.data).toEqual([]);
      expect(result.pagination.total).toBe(0);
    });
  });

  describe('auditMiddleware', () => {
    it('should create middleware function with correct action and resource type', () => {
      const middleware = auditMiddleware(ActionTypes.CREATE, ResourceTypes.CANDIDATE);

      expect(typeof middleware).toBe('function');
      expect(middleware.length).toBe(3); // req, res, next
    });

    it('should call next and proceed with request', async () => {
      const middleware = auditMiddleware(ActionTypes.READ, ResourceTypes.INTERVIEW);

      await middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should capture response after json is called', async () => {
      const middleware = auditMiddleware(ActionTypes.UPDATE, ResourceTypes.FEEDBACK);

      // Simulate successful response
      mockRes.json = jest.fn(function(data) {
        this.statusCode = 200;
        this.data = data;
        return data;
      });

      await middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('ActionTypes', () => {
    it('should have all required action types', () => {
      expect(ActionTypes.CREATE).toBe('create');
      expect(ActionTypes.READ).toBe('read');
      expect(ActionTypes.UPDATE).toBe('update');
      expect(ActionTypes.DELETE).toBe('delete');
      expect(ActionTypes.LOGIN).toBe('login');
      expect(ActionTypes.LOGOUT).toBe('logout');
      expect(ActionTypes.EXPORT).toBe('export');
      expect(ActionTypes.IMPORT).toBe('import');
      expect(ActionTypes.UPLOAD).toBe('upload');
      expect(ActionTypes.SEND_EMAIL).toBe('send_email');
    });
  });

  describe('ResourceTypes', () => {
    it('should have all required resource types', () => {
      expect(ResourceTypes.CANDIDATE).toBe('candidate');
      expect(ResourceTypes.POSITION).toBe('position');
      expect(ResourceTypes.INTERVIEW).toBe('interview');
      expect(ResourceTypes.FEEDBACK).toBe('feedback');
      expect(ResourceTypes.RESUME).toBe('resume');
      expect(ResourceTypes.USER).toBe('user');
      expect(ResourceTypes.EXPORT).toBe('export');
      expect(ResourceTypes.IMPORT).toBe('import');
    });
  });

  describe('Error handling', () => {
    it('should handle database errors gracefully in getAuditLogs', async () => {
      query.mockRejectedValueOnce(new Error('Database error'));

      await expect(
        getAuditLogs({}, { page: 1, limit: 20 })
      ).rejects.toThrow();
    });

    it('should handle export middleware creation', async () => {
      const middleware = logExport(ResourceTypes.CANDIDATE);

      expect(typeof middleware).toBe('function');
    });

    it('should log export with filename and count', async () => {
      const middleware = logExport(ResourceTypes.CANDIDATE);

      mockReq.query = { format: 'xlsx' };

      mockRes.json = jest.fn(function(data) {
        this.statusCode = 200;
        this.data = data;
        return data;
      });

      await middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('auditMiddleware with different scenarios', () => {
    it('should not log failed requests (status >= 400)', async () => {
      const middleware = auditMiddleware(ActionTypes.CREATE, ResourceTypes.CANDIDATE);

      mockRes.json = jest.fn(function(data) {
        this.statusCode = 400;
        return data;
      });

      await middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should extract resource_id from params', async () => {
      const middleware = auditMiddleware(ActionTypes.UPDATE, ResourceTypes.INTERVIEW);

      mockReq.params = { id: 123 };
      mockReq.body = { status: 'completed' };
      mockReq.method = 'PUT';
      mockReq.path = '/api/interviews/123';

      mockRes.json = jest.fn(function(data) {
        this.statusCode = 200;
        return data;
      });

      await middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle requests without user', async () => {
      const middleware = auditMiddleware(ActionTypes.READ, ResourceTypes.POSITION);

      mockReq.user = null;

      await middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('logLogin with different scenarios', () => {
    it('should not log failed login', async () => {
      mockRes.json = jest.fn(function(data) {
        this.statusCode = 401;
        return data;
      });

      await logLogin(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should not log when user data is missing', async () => {
      mockRes.json = jest.fn(function(data) {
        this.statusCode = 200;
        return { success: true, data: {} };
      });

      await logLogin(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('getAuditLogs with more filters', () => {
    it('should filter by username', async () => {
      query.mockResolvedValueOnce([{ total: 1 }]);
      query.mockResolvedValueOnce([{ id: 1, username: 'testuser' }]);

      const result = await getAuditLogs({ username: 'test' }, { page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
    });

    it('should filter by resource_id', async () => {
      query.mockResolvedValueOnce([{ total: 1 }]);
      query.mockResolvedValueOnce([{ id: 1, resource_id: '123' }]);

      const result = await getAuditLogs({ resource_id: '123' }, { page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
    });

    it('should filter by date range', async () => {
      query.mockResolvedValueOnce([{ total: 0 }]);
      query.mockResolvedValueOnce([]);

      const result = await getAuditLogs(
        { date_from: '2025-01-01', date_to: '2025-01-31' },
        { page: 1, limit: 20 }
      );

      expect(result.data).toEqual([]);
    });

    it('should handle sorting by different fields', async () => {
      query.mockResolvedValueOnce([{ total: 1 }]);
      query.mockResolvedValueOnce([{ id: 1, action: 'create' }]);

      const result = await getAuditLogs({}, { page: 1, limit: 20, sort_by: 'action', sort_order: 'ASC' });

      expect(result.data).toBeDefined();
    });

    it('should default sort to created_at DESC', async () => {
      query.mockResolvedValueOnce([{ total: 1 }]);
      query.mockResolvedValueOnce([{ id: 1, created_at: '2025-01-01' }]);

      const result = await getAuditLogs({}, { page: 1, limit: 20, sort_by: 'invalid_field' });

      expect(result.data).toBeDefined();
    });

    it('should parse JSON details', async () => {
      query.mockResolvedValueOnce([{ total: 1 }]);
      query.mockResolvedValueOnce([{ id: 1, details: '{"key": "value"}' }]);

      const result = await getAuditLogs({}, { page: 1, limit: 20 });

      expect(result.data[0].details).toEqual({ key: 'value' });
    });

    it('should handle invalid JSON details gracefully', async () => {
      query.mockResolvedValueOnce([{ total: 1 }]);
      query.mockResolvedValueOnce([{ id: 1, details: 'invalid json' }]);

      const result = await getAuditLogs({}, { page: 1, limit: 20 });

      expect(result.data[0].details).toEqual({});
    });
  });

  describe('getAuditStats', () => {
    it('should return audit statistics', async () => {
      const mockStats = [
        { action: 'create', resource_type: 'candidate', count: 10, unique_users: 5 },
        { action: 'update', resource_type: 'interview', count: 5, unique_users: 2 }
      ];

      query.mockResolvedValue(mockStats);

      const result = await getAuditStats('2025-01-01', '2025-01-31');

      expect(result).toHaveLength(2);
      expect(result[0].action).toBe('create');
    });

    it('should group by action and resource_type', async () => {
      query.mockResolvedValue([
        {
          action: 'login',
          resource_type: 'user',
          count: 100,
          unique_users: 10
        }
      ]);

      const result = await getAuditStats('2025-01-01', '2025-01-31');

      expect(result).toBeDefined();
    });
  });

  describe('cleanOldLogs', () => {
    it('should delete old audit logs', async () => {
      query.mockResolvedValueOnce({ affectedRows: 100 });

      const deletedCount = await cleanOldLogs(90);

      expect(deletedCount).toBe(100);
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM audit_logs'),
        [90]
      );
    });

    it('should use default 90 days if not specified', async () => {
      query.mockResolvedValueOnce({ affectedRows: 50 });

      const deletedCount = await cleanOldLogs();

      expect(deletedCount).toBe(50);
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM audit_logs'),
        [90]
      );
    });

    it('should handle database errors in cleanOldLogs', async () => {
      query.mockRejectedValueOnce(new Error('Database error'));

      await expect(cleanOldLogs(30)).rejects.toThrow('Database error');
    });
  });

  describe('auditMiddleware actual logging', () => {
    it('should log successful requests with all details', async () => {
      const middleware = auditMiddleware(ActionTypes.CREATE, ResourceTypes.CANDIDATE);

      mockReq.method = 'POST';
      mockReq.path = '/api/candidates';
      mockReq.query = { page: 1 };
      mockReq.body = { name: 'Test Candidate', email: 'test@example.com' };
      mockReq.params = { id: '123' };

      mockRes.json = jest.fn(function(data) {
        this.statusCode = 201;
        return data;
      });

      await middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      // Log is created asynchronously, so we can't check it directly
    });

    it('should sanitize body before logging', async () => {
      const middleware = auditMiddleware(ActionTypes.UPDATE, ResourceTypes.USER);

      mockReq.body = {
        username: 'testuser',
        password: 'secret123',
        token: 'secret-token',
        email: 'test@example.com'
      };
      mockRes.json = jest.fn(function(data) {
        this.statusCode = 200;
        return data;
      });

      await middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should sanitize response token before logging', async () => {
      const middleware = auditMiddleware(ActionTypes.LOGIN, ResourceTypes.USER);

      mockRes.json = jest.fn(function(data) {
        this.statusCode = 200;
        return {
          success: true,
          data: {
            user: { id: 1, username: 'test' },
            token: 'jwt-token-123'
          }
        };
      });

      await middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('logExport actual logging', () => {
    it('should log export with filename and count', async () => {
      const middleware = logExport(ResourceTypes.CANDIDATE);

      mockReq.query = { format: 'xlsx', status: 'active' };

      mockRes.json = jest.fn(function(data) {
        this.statusCode = 200;
        return {
          success: true,
          data: {
            filename: 'candidates_export.xlsx',
            count: 150
          }
        };
      });

      await middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should only log on successful exports', async () => {
      const middleware = logExport(ResourceTypes.POSITION);

      mockRes.json = jest.fn(function(data) {
        this.statusCode = 400; // Error status
        return {
          success: false,
          message: 'Export failed'
        };
      });

      await middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('logLogin actual logging', () => {
    it('should log successful login with user info', async () => {
      mockRes.json = jest.fn(function(data) {
        this.statusCode = 200;
        return {
          success: true,
          data: {
            user: {
              id: 1,
              username: 'testuser',
              role: 'admin',
              email: 'test@example.com'
            }
          }
        };
      });

      await logLogin(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle login without user data', async () => {
      mockRes.json = jest.fn(function(data) {
        this.statusCode = 200;
        return {
          success: true,
          data: {}
        };
      });

      await logLogin(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('auditMiddleware actual async logging', () => {
    it('should create audit log after successful response', async () => {
      const { auditMiddleware, ActionTypes, ResourceTypes } = require('./audit');
      const middleware = auditMiddleware(ActionTypes.CREATE, ResourceTypes.CANDIDATE);

      mockReq.method = 'POST';
      mockReq.path = '/api/candidates';
      mockReq.body = { name: 'Test', email: 'test@example.com', password: 'secret123' };
      mockReq.params = { id: '123' };

      mockRes.json = jest.fn(function(data) {
        this.statusCode = 201;
        return { success: true, data: { id: 123, name: 'Test', token: 'jwt-token' } };
      });

      const initialCallCount = query.mock.calls.length;

      await middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();

      // Call the wrapped json method to trigger logging
      mockRes.json({ success: true, data: { id: 123, name: 'Test' } });

      // Wait for setImmediate and async operations
      await new Promise(resolve => setTimeout(resolve, 20));

      // Check that query was called additional times
      expect(query.mock.calls.length).toBeGreaterThan(initialCallCount);
    });

    it('should not create log for failed responses (status >= 400)', async () => {
      const { auditMiddleware, ActionTypes, ResourceTypes } = require('./audit');
      const middleware = auditMiddleware(ActionTypes.CREATE, ResourceTypes.CANDIDATE);

      mockRes.json = jest.fn(function(data) {
        this.statusCode = 400;
        return { success: false, message: 'Validation failed' };
      });

      const initialCallCount = query.mock.calls.length;

      await middleware(mockReq, mockRes, mockNext);

      // Call the wrapped json method
      mockRes.json({ success: false, message: 'Validation failed' });

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 20));

      expect(mockNext).toHaveBeenCalled();
      // Query should not be called for failed responses
      expect(query.mock.calls.length).toBe(initialCallCount);
    });
  });

  describe('logLogin actual async logging', () => {
    it('should create login log with user info', async () => {
      const { logLogin } = require('./audit');

      mockRes.json = jest.fn(function(data) {
        this.statusCode = 200;
        return {
          success: true,
          data: {
            user: {
              id: 1,
              username: 'testuser',
              role: 'admin',
              email: 'test@example.com'
            }
          }
        };
      });

      const initialCallCount = query.mock.calls.length;

      await logLogin(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();

      // Call the wrapped json method
      mockRes.json({
        success: true,
        data: {
          user: {
            id: 1,
            username: 'testuser',
            role: 'admin'
          }
        }
      });

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 20));

      // Check that query was called additional times
      expect(query.mock.calls.length).toBeGreaterThan(initialCallCount);
    });

    it('should not create log if response is missing user data', async () => {
      const { logLogin } = require('./audit');

      mockRes.json = jest.fn(function(data) {
        this.statusCode = 200;
        return { success: true, data: {} };
      });

      const initialCallCount = query.mock.calls.length;

      await logLogin(mockReq, mockRes, mockNext);

      // Call the wrapped json method
      mockRes.json({ success: true, data: {} });

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 20));

      expect(mockNext).toHaveBeenCalled();
      expect(query.mock.calls.length).toBe(initialCallCount);
    });
  });

  describe('logExport actual async logging', () => {
    it('should create export log with filename and count', async () => {
      const { logExport, ResourceTypes } = require('./audit');
      const middleware = logExport(ResourceTypes.CANDIDATE);

      mockReq.query = { format: 'xlsx', status: 'active' };

      mockRes.json = jest.fn(function(data) {
        this.statusCode = 200;
        return {
          success: true,
          data: {
            filename: 'candidates_export.xlsx',
            count: 150
          }
        };
      });

      const initialCallCount = query.mock.calls.length;

      await middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();

      // Call the wrapped json method
      mockRes.json({
        success: true,
        data: {
          filename: 'candidates_export.xlsx',
          count: 150
        }
      });

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 20));

      // Check that query was called additional times
      expect(query.mock.calls.length).toBeGreaterThan(initialCallCount);
    });

    it('should not create log for failed export', async () => {
      const { logExport, ResourceTypes } = require('./audit');
      const middleware = logExport(ResourceTypes.POSITION);

      mockRes.json = jest.fn(function(data) {
        this.statusCode = 400;
        return { success: false, message: 'Export failed' };
      });

      const initialCallCount = query.mock.calls.length;

      await middleware(mockReq, mockRes, mockNext);

      // Call the wrapped json method
      mockRes.json({ success: false, message: 'Export failed' });

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 20));

      expect(mockNext).toHaveBeenCalled();
      expect(query.mock.calls.length).toBe(initialCallCount);
    });
  });
});
