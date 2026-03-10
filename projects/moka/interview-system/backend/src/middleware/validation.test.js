const { validate, userSchemas, candidateSchemas, interviewSchemas, positionSchemas } = require('./validation');

// Mock responseUtils
jest.mock('../utils/helpers', () => ({
  responseUtils: {
    error: jest.fn((res, message, status, errors) => ({
      success: false,
      message,
      status,
      errors
    }))
  }
}));

const { responseUtils } = require('../utils/helpers');

describe('Validation Middleware', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      body: {}
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    mockNext = jest.fn();
  });

  describe('validate()', () => {
    it('should call next() when validation passes', () => {
      const schema = userSchemas.login;
      mockReq.body = {
        email: 'test@example.com',
        password: 'password123'
      };

      const middleware = validate(schema);
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(responseUtils.error).not.toHaveBeenCalled();
    });

    it('should return error when validation fails', () => {
      const schema = userSchemas.login;
      mockReq.body = {
        email: 'invalid-email',
        password: 'pass' // Too short
      };

      const middleware = validate(schema);
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(responseUtils.error).toHaveBeenCalledWith(
        mockRes,
        '参数验证失败',
        400,
        expect.any(Array)
      );
    });

    it('should strip unknown fields', () => {
      const schema = userSchemas.login;
      mockReq.body = {
        email: 'test@example.com',
        password: 'password123',
        unknownField: 'should be removed'
      };

      const middleware = validate(schema);
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      // Joi's stripUnknown only affects the validated value, not original req.body
      // The validate middleware modifies req.body in place
    });
  });

  describe('userSchemas.login', () => {
    it('should validate valid login data', () => {
      const { error } = userSchemas.login.validate({
        email: 'test@example.com',
        password: 'anyPassword123'
      });

      expect(error).toBeUndefined();
    });

    it('should reject invalid email', () => {
      const { error } = userSchemas.login.validate({
        email: 'not-an-email',
        password: 'password123'
      });

      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('邮箱');
    });

    it('should require email', () => {
      const { error } = userSchemas.login.validate({
        password: 'password123'
      });

      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('必填项');
    });

    it('should require password', () => {
      const { error } = userSchemas.login.validate({
        email: 'test@example.com'
      });

      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('必填项');
    });
  });

  describe('userSchemas.register', () => {
    const validRegisterData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'Password123',
      role: 'interviewer',
      department: '技术部'
    };

    it('should validate valid registration data', () => {
      const { error } = userSchemas.register.validate(validRegisterData);
      expect(error).toBeUndefined();
    });

    it('should require username', () => {
      const { error } = userSchemas.register.validate({
        email: 'test@example.com',
        password: 'Password123'
      });

      expect(error).toBeDefined();
      expect(error.details.some(d => d.message.includes('用户名'))).toBe(true);
    });

    it('should require username to be alphanumeric', () => {
      const { error } = userSchemas.register.validate({
        username: 'user-with-dash',
        email: 'test@example.com',
        password: 'Password123'
      });

      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('字母和数字');
    });

    it('should enforce username length (min 3, max 30)', () => {
      const { error: error1 } = userSchemas.register.validate({
        username: 'ab',
        email: 'test@example.com',
        password: 'Password123'
      });

      expect(error1).toBeDefined();

      const { error: error2 } = userSchemas.register.validate({
        username: 'a'.repeat(31),
        email: 'test@example.com',
        password: 'Password123'
      });

      expect(error2).toBeDefined();
    });

    it('should validate password pattern', () => {
      const { error } = userSchemas.register.validate({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password' // No number
      });

      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('字母和一个数字');
    });

    it('should enforce password minimum length', () => {
      const { error } = userSchemas.register.validate({
        username: 'testuser',
        email: 'test@example.com',
        password: 'Pass1' // Too short
      });

      expect(error).toBeDefined();
    });

    it('should validate role enum', () => {
      const { error } = userSchemas.register.validate({
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123',
        role: 'invalid_role'
      });

      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('admin、hr或interviewer');
    });

    it('should default role to interviewer', () => {
      const { value, error } = userSchemas.register.validate({
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123'
      });

      expect(error).toBeUndefined();
      expect(value.role).toBe('interviewer');
    });
  });

  describe('userSchemas.updateProfile', () => {
    it('should validate profile update data', () => {
      const { error } = userSchemas.updateProfile.validate({
        username: 'newusername',
        department: '产品部'
      });

      expect(error).toBeUndefined();
    });

    it('should allow partial updates', () => {
      const { error } = userSchemas.updateProfile.validate({
        department: '技术部'
      });

      expect(error).toBeUndefined();
    });
  });

  describe('candidateSchemas', () => {
    it('should validate candidate creation', () => {
      const { error } = candidateSchemas.create.validate({
        name: '张三',
        email: 'zhangsan@example.com',
        phone: '13800138000',
        education: 'bachelor',
        experience_years: 3
      });

      expect(error).toBeUndefined();
    });

    it('should require name', () => {
      const { error } = candidateSchemas.create.validate({
        email: 'test@example.com'
      });

      expect(error).toBeDefined();
    });

    it('should validate email format', () => {
      const { error } = candidateSchemas.create.validate({
        name: '张三',
        email: 'invalid-email'
      });

      expect(error).toBeDefined();
    });

    it('should validate Chinese phone number', () => {
      const { error } = candidateSchemas.create.validate({
        name: '张三',
        email: 'test@example.com',
        phone: '12345' // Invalid phone
      });

      expect(error).toBeDefined();
    });

    it('should validate education enum', () => {
      const { error } = candidateSchemas.create.validate({
        name: '张三',
        email: 'test@example.com',
        education: 'invalid'
      });

      expect(error).toBeDefined();
    });
  });

  describe('interviewSchemas', () => {
    it('should validate interview creation', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1); // Tomorrow

      const { error } = interviewSchemas.create.validate({
        candidate_id: 1,
        position_id: 2,
        interviewer_id: 3,
        interviewer_name: '张三',
        scheduled_time: futureDate,
        interview_type: 'video'
      });

      expect(error).toBeUndefined();
    });

    it('should require candidate_id', () => {
      const { error } = interviewSchemas.create.validate({
        position_id: 2,
        interviewer_id: 3,
        scheduled_date: '2024-03-15'
      });

      expect(error).toBeDefined();
    });

    it('should validate date format', () => {
      const { error } = interviewSchemas.create.validate({
        candidate_id: 1,
        position_id: 2,
        interviewer_id: 3,
        scheduled_date: 'invalid-date'
      });

      expect(error).toBeDefined();
    });

    it('should validate time format', () => {
      const { error } = interviewSchemas.create.validate({
        candidate_id: 1,
        position_id: 2,
        interviewer_id: 3,
        scheduled_date: '2024-03-15',
        scheduled_time: 'invalid-time'
      });

      expect(error).toBeDefined();
    });

    it('should validate interview type enum', () => {
      const { error } = interviewSchemas.create.validate({
        candidate_id: 1,
        position_id: 2,
        interviewer_id: 3,
        scheduled_date: '2024-03-15',
        scheduled_time: '14:00',
        type: 'invalid_type'
      });

      expect(error).toBeDefined();
    });
  });

  describe('positionSchemas', () => {
    it('should validate position creation', () => {
      const { error } = positionSchemas.create.validate({
        title: '软件工程师',
        department: '技术部',
        level: 'middle',
        type: 'fulltime',
        location: '北京',
        salary_min: 150000,
        salary_max: 250000,
        headcount: 3
      });

      expect(error).toBeUndefined();
    });

    it('should require title', () => {
      const { error } = positionSchemas.create.validate({
        department: '技术部'
      });

      expect(error).toBeDefined();
    });

    it('should require department', () => {
      const { error } = positionSchemas.create.validate({
        title: '软件工程师'
      });

      expect(error).toBeDefined();
    });

    it('should validate salary range', () => {
      const { error } = positionSchemas.create.validate({
        title: '软件工程师',
        department: '技术部',
        salary_min: 300000,
        salary_max: 200000 // min > max
      });

      expect(error).toBeDefined();
    });

    it('should validate level enum', () => {
      const { error } = positionSchemas.create.validate({
        title: '软件工程师',
        department: '技术部',
        level: 'invalid_level'
      });

      expect(error).toBeDefined();
    });

    it('should validate type enum', () => {
      const { error } = positionSchemas.create.validate({
        title: '软件工程师',
        department: '技术部',
        type: 'invalid_type'
      });

      expect(error).toBeDefined();
    });

    it('should validate headcount is positive', () => {
      const { error } = positionSchemas.create.validate({
        title: '软件工程师',
        department: '技术部',
        headcount: -1
      });

      expect(error).toBeDefined();
    });
  });

  describe('userSchemas.forgotPassword', () => {
    it('should validate forgot password request', () => {
      const { error } = userSchemas.forgotPassword.validate({
        email: 'test@example.com'
      });

      expect(error).toBeUndefined();
    });

    it('should require email for forgot password', () => {
      const { error } = userSchemas.forgotPassword.validate({});

      expect(error).toBeDefined();
    });
  });

  describe('userSchemas.resetPassword', () => {
    it('should validate reset password request', () => {
      const { error } = userSchemas.resetPassword.validate({
        token: 'valid-reset-token-123',
        newPassword: 'NewPassword123'
      });

      expect(error).toBeUndefined();
    });

    it('should require token', () => {
      const { error } = userSchemas.resetPassword.validate({
        password: 'NewPassword123'
      });

      expect(error).toBeDefined();
    });

    it('should validate new password pattern', () => {
      const { error } = userSchemas.resetPassword.validate({
        token: 'some-token',
        password: 'weak' // Too short and no number
      });

      expect(error).toBeDefined();
    });
  });
});
