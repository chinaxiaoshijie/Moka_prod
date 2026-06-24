// Set required environment variables before importing
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-purpose-only';
process.env.JWT_EXPIRE = '7d';
process.env.REDIS_URL = 'redis://localhost:6379';

const {
  jwtUtils,
  passwordUtils,
  responseUtils,
  validationUtils,
  paginationUtils,
  dateUtils
} = require('./helpers');

describe('JWT Utils', () => {
  const mockPayload = {
    userId: 1,
    username: 'testuser',
    email: 'test@example.com',
    role: 'interviewer'
  };

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const token = jwtUtils.generateToken(mockPayload);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should include payload in token', () => {
      const token = jwtUtils.generateToken(mockPayload);
      const decoded = jwtUtils.verifyToken(token);
      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.username).toBe(mockPayload.username);
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const token = jwtUtils.generateToken(mockPayload);
      const decoded = jwtUtils.verifyToken(token);
      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe(mockPayload.userId);
    });

    it('should throw error for invalid token', () => {
      expect(() => {
        jwtUtils.verifyToken('invalid.token.here');
      }).toThrow();
    });

    it('should throw error for expired token', () => {
      const jwt = require('jsonwebtoken');
      const expiredToken = jwt.sign(
        { userId: 1 },
        'test-jwt-secret-key-for-testing-purpose-only',
        { expiresIn: '-1h' }
      );
      expect(() => {
        jwtUtils.verifyToken(expiredToken);
      }).toThrow();
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a refresh token', () => {
      const refreshToken = jwtUtils.generateRefreshToken({ userId: 1 });
      expect(refreshToken).toBeDefined();
      expect(typeof refreshToken).toBe('string');
    });
  });
});

describe('Password Utils', () => {
  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'TestPassword123';
      const hashedPassword = await passwordUtils.hashPassword(password);
      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(20);
    });

    it('should generate different hashes for same password', async () => {
      const password = 'TestPassword123';
      const hash1 = await passwordUtils.hashPassword(password);
      const hash2 = await passwordUtils.hashPassword(password);
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const password = 'TestPassword123';
      const hashedPassword = await passwordUtils.hashPassword(password);
      const isValid = await passwordUtils.verifyPassword(password, hashedPassword);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'TestPassword123';
      const wrongPassword = 'WrongPassword123';
      const hashedPassword = await passwordUtils.hashPassword(password);
      const isValid = await passwordUtils.verifyPassword(wrongPassword, hashedPassword);
      expect(isValid).toBe(false);
    });
  });

  describe('generateRandomPassword', () => {
    it('should generate password with default length', () => {
      const password = passwordUtils.generateRandomPassword();
      expect(password).toBeDefined();
      expect(password.length).toBe(8);
    });

    it('should generate password with custom length', () => {
      const password = passwordUtils.generateRandomPassword(16);
      expect(password.length).toBe(16);
    });

    it('should generate different passwords each time', () => {
      const password1 = passwordUtils.generateRandomPassword();
      const password2 = passwordUtils.generateRandomPassword();
      expect(password1).not.toBe(password2);
    });
  });
});

describe('Response Utils', () => {
  let mockRes;

  beforeEach(() => {
    mockRes = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis()
    };
  });

  describe('success', () => {
    it('should send success response', () => {
      responseUtils.success(mockRes, { test: 'data' }, 'Success message');
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Success message',
        data: { test: 'data' },
        timestamp: expect.any(String)
      });
    });

    it('should handle null data', () => {
      responseUtils.success(mockRes, null, 'Success');
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Success',
        data: null,
        timestamp: expect.any(String)
      });
    });
  });

  describe('error', () => {
    it('should send error response', () => {
      responseUtils.error(mockRes, 'Error message', 400);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.status('').json).toHaveBeenCalledWith({
        success: false,
        message: 'Error message',
        error: null,
        timestamp: expect.any(String)
      });
    });

    it('should include error details in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      responseUtils.error(mockRes, 'Error', 500, { details: 'error details' });
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: { details: 'error details' }
        })
      );
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('paginated', () => {
    it('should send paginated response', () => {
      const data = [{ id: 1 }, { id: 2 }];
      const pagination = { page: 1, pageSize: 10, total: 2 };
      responseUtils.paginated(mockRes, data, pagination, 'Success');
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Success',
        data,
        pagination,
        timestamp: expect.any(String)
      });
    });
  });
});

describe('Validation Utils', () => {
  describe('isValidEmail', () => {
    it('should validate correct email', () => {
      expect(validationUtils.isValidEmail('test@example.com')).toBe(true);
      expect(validationUtils.isValidEmail('user.name+tag@domain.co.uk')).toBe(true);
    });

    it('should reject invalid email', () => {
      expect(validationUtils.isValidEmail('invalid')).toBe(false);
      expect(validationUtils.isValidEmail('@example.com')).toBe(false);
      expect(validationUtils.isValidEmail('test@')).toBe(false);
      expect(validationUtils.isValidEmail('test @example.com')).toBe(false);
    });
  });

  describe('isValidPhone', () => {
    it('should validate correct Chinese phone number', () => {
      expect(validationUtils.isValidPhone('13800138000')).toBe(true);
      expect(validationUtils.isValidPhone('15912345678')).toBe(true);
      expect(validationUtils.isValidPhone('18888888888')).toBe(true);
    });

    it('should reject invalid phone number', () => {
      expect(validationUtils.isValidPhone('12800138000')).toBe(false); // 12 not valid
      expect(validationUtils.isValidPhone('1380013800')).toBe(false); // too short
      expect(validationUtils.isValidPhone('138001380001')).toBe(false); // too long
      expect(validationUtils.isValidPhone('abcdefghijk')).toBe(false); // letters
    });
  });

  describe('isStrongPassword', () => {
    it('should validate strong password', () => {
      expect(validationUtils.isStrongPassword('Password123')).toBe(true);
      expect(validationUtils.isStrongPassword('Test1234')).toBe(true);
      expect(validationUtils.isStrongPassword('MyPassword1')).toBe(true);
    });

    it('should reject weak password', () => {
      expect(validationUtils.isStrongPassword('password')).toBe(false); // no number
      expect(validationUtils.isStrongPassword('12345678')).toBe(false); // no letter
      expect(validationUtils.isStrongPassword('Pass1')).toBe(false); // too short
      expect(validationUtils.isStrongPassword('密码123')).toBe(false); // Chinese chars
    });
  });
});

describe('Pagination Utils', () => {
  describe('getPaginationParams', () => {
    let mockReq;

    beforeEach(() => {
      mockReq = { query: {} };
    });

    it('should use default values', () => {
      const params = paginationUtils.getPaginationParams(mockReq);
      expect(params).toEqual({
        page: 1,
        pageSize: 20,
        offset: 0,
        limit: 20
      });
    });

    it('should use custom values', () => {
      mockReq.query = { page: '3', pageSize: '50' };
      const params = paginationUtils.getPaginationParams(mockReq);
      expect(params).toEqual({
        page: 3,
        pageSize: 50,
        offset: 100,
        limit: 50
      });
    });

    it('should limit max pageSize to 100', () => {
      mockReq.query = { page: '1', pageSize: '200' };
      const params = paginationUtils.getPaginationParams(mockReq);
      expect(params.pageSize).toBe(100);
    });

    it('should handle minimum page', () => {
      mockReq.query = { page: '-1', pageSize: '20' };
      const params = paginationUtils.getPaginationParams(mockReq);
      expect(params.page).toBe(1);
    });
  });

  describe('generatePaginationInfo', () => {
    it('should generate correct pagination info', () => {
      const pagination = paginationUtils.generatePaginationInfo(2, 20, 100);
      expect(pagination).toEqual({
        current: 2,
        pageSize: 20,
        total: 100,
        totalPages: 5,
        hasNext: true,
        hasPrev: true
      });
    });

    it('should handle first page', () => {
      const pagination = paginationUtils.generatePaginationInfo(1, 20, 100);
      expect(pagination.hasPrev).toBe(false);
      expect(pagination.hasNext).toBe(true);
    });

    it('should handle last page', () => {
      const pagination = paginationUtils.generatePaginationInfo(5, 20, 100);
      expect(pagination.hasPrev).toBe(true);
      expect(pagination.hasNext).toBe(false);
    });
  });
});

describe('Date Utils', () => {
  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2024-02-27T14:30:00Z');
      const formatted = dateUtils.formatDate(date, 'YYYY-MM-DD HH:mm:ss');
      // Note: This will use the system timezone
      expect(formatted).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    });

    it('should return null for null date', () => {
      expect(dateUtils.formatDate(null)).toBeNull();
    });

    it('should return null for undefined date', () => {
      expect(dateUtils.formatDate(undefined)).toBeNull();
    });
  });

  describe('now', () => {
    it('should return current date', () => {
      const now = dateUtils.now();
      expect(now).toBeInstanceOf(Date);
      expect(now.getTime()).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('addDays', () => {
    it('should add days to date', () => {
      const date = new Date('2024-02-27T00:00:00Z');
      const result = dateUtils.addDays(date, 7);
      const expectedDate = new Date('2024-03-05T00:00:00Z');
      expect(result.getTime()).toBeCloseTo(expectedDate.getTime(), -3);
    });

    it('should handle negative days', () => {
      const date = new Date('2024-02-27T00:00:00Z');
      const result = dateUtils.addDays(date, -7);
      const expectedDate = new Date('2024-02-20T00:00:00Z');
      expect(result.getTime()).toBeCloseTo(expectedDate.getTime(), -3);
    });
  });
});
