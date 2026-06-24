const User = require('./User');
const { query } = require('../config/database');
const { passwordUtils } = require('../utils/helpers');

// Mock database module
jest.mock('../config/database');

// Mock only passwordUtils in helpers
jest.mock('../utils/helpers', () => ({
  ...jest.requireActual('../utils/helpers'),
  passwordUtils: {
    hashPassword: jest.fn(),
    verifyPassword: jest.fn()
  }
}));

describe('User Model', () => {
  let mockUser;
  let originalFindByEmailOrUsername;

  beforeAll(() => {
    // Save original method
    originalFindByEmailOrUsername = User.findByEmailOrUsername;
  });

  beforeEach(() => {
    // 重置所有 mocks
    jest.clearAllMocks();

    // Reset passwordUtils mocks
    passwordUtils.hashPassword.mockReset();
    passwordUtils.verifyPassword.mockReset();

    // 设置 passwordUtils 默认返回值
    passwordUtils.hashPassword.mockResolvedValue('hashed_password_123');
    passwordUtils.verifyPassword.mockResolvedValue(true);

    // 创建测试用户数据
    mockUser = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      password: 'TestPassword123',
      role: 'interviewer',
      department: '技术部',
      status: 'active'
    };

    // Mock User.findByEmailOrUsername as a static method
    User.findByEmailOrUsername = jest.fn().mockResolvedValue(null);
  });

  describe('create()', () => {
    it('should create a new user successfully', async () => {
      const user = new User(mockUser);

      // Mock findByEmailOrUsername to return no existing user
      User.findByEmailOrUsername.mockResolvedValueOnce(null);

      // Mock 插入操作
      query.mockResolvedValueOnce({
        insertId: 1
      });

      await user.create();

      expect(user.id).toBe(1);
      expect(User.findByEmailOrUsername).toHaveBeenCalledWith(mockUser.email, mockUser.username);
    });

    it('should throw error if user already exists', async () => {
      const user = new User(mockUser);

      // Mock findByEmailOrUsername to return existing user
      User.findByEmailOrUsername.mockResolvedValueOnce(
        new User({ email: mockUser.email })
      );

      await expect(user.create()).rejects.toThrow('用户名或邮箱已存在');
    });

    it('should hash password before saving', async () => {
      const user = new User(mockUser);

      User.findByEmailOrUsername.mockResolvedValueOnce(null);
      query.mockResolvedValueOnce({ insertId: 1 });

      await user.create();

      expect(passwordUtils.hashPassword).toHaveBeenCalledWith(mockUser.password);
      expect(user.password).toBe('hashed_password_123');
    });
  });

  describe('findById()', () => {
    it('should find user by ID', async () => {
      query.mockResolvedValueOnce([
        { id: 1, username: 'testuser', email: 'test@example.com', role: 'interviewer' }
      ]);

      const user = await User.findById(1);

      expect(user).toBeInstanceOf(User);
      expect(user.id).toBe(1);
    });

    it('should return null if user not found', async () => {
      query.mockResolvedValueOnce([]);

      const user = await User.findById(999);

      expect(user).toBeNull();
    });
  });

  describe('findByEmail()', () => {
    it('should find user by email', async () => {
      query.mockResolvedValueOnce([
        { id: 1, email: 'test@example.com', password: 'hashedpassword' }
      ]);

      const user = await User.findByEmail('test@example.com');

      expect(user).toBeInstanceOf(User);
      expect(user.email).toBe('test@example.com');
    });

    it('should return null if email not found', async () => {
      query.mockResolvedValueOnce([]);

      const user = await User.findByEmail('notfound@example.com');

      expect(user).toBeNull();
    });
  });

  describe('verifyPassword()', () => {
    it('should verify correct password', async () => {
      const user = new User(mockUser);
      user.password = 'hashed_password_123';

      passwordUtils.verifyPassword.mockResolvedValueOnce(true);

      const isValid = await user.verifyPassword('TestPassword123');

      expect(isValid).toBe(true);
      expect(passwordUtils.verifyPassword).toHaveBeenCalledWith('TestPassword123', 'hashed_password_123');
    });

    it('should reject incorrect password', async () => {
      const user = new User(mockUser);
      user.password = 'hashed_password_123';

      passwordUtils.verifyPassword.mockResolvedValueOnce(false);

      const isValid = await user.verifyPassword('WrongPassword123');

      expect(isValid).toBe(false);
    });
  });

  describe('update()', () => {
    it('should update user information', async () => {
      const user = new User(mockUser);
      user.id = 1;

      query.mockResolvedValueOnce([]);

      const updatedUser = await user.update({
        username: 'updateduser'
      });

      expect(updatedUser.username).toBe('updateduser');
    });

    it('should not update password if not provided', async () => {
      const user = new User(mockUser);
      user.id = 1;
      query.mockResolvedValueOnce([]);

      await user.update({ username: 'newuser' });

      expect(user.password).toBe(mockUser.password);
    });
  });

  describe('updatePassword()', () => {
    it('should update user password', async () => {
      const user = new User(mockUser);
      user.id = 1;
      const oldPassword = user.password;

      query.mockResolvedValueOnce([]);

      const updatedUser = await user.updatePassword('NewPassword123');

      expect(updatedUser.password).not.toBe(oldPassword);
    });
  });

  describe('updateLastLogin()', () => {
    it('should update last login time', async () => {
      const user = new User(mockUser);
      user.id = 1;

      query.mockResolvedValueOnce([]);

      await user.updateLastLogin();

      expect(user.last_login).toBeInstanceOf(Date);
    });
  });

  describe('findAll()', () => {
    it('should return paginated user list', async () => {
      const mockUsers = [
        { id: 1, username: 'user1' },
        { id: 2, username: 'user2' }
      ];

      query.mockResolvedValueOnce([{ total: 2 }]);
      query.mockResolvedValueOnce(mockUsers);

      const result = await User.findAll({ page: 1, pageSize: 10 });

      expect(result.users).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
    });

    it('should filter by role when specified', async () => {
      query.mockResolvedValueOnce([{ total: 1 }]);
      query.mockResolvedValueOnce([{ id: 1, role: 'admin' }]);

      const result = await User.findAll({ role: 'admin', page: 1, pageSize: 10 });

      expect(result.users).toHaveLength(1);
    });

    it('should filter by status when specified', async () => {
      query.mockResolvedValueOnce([{ total: 1 }]);
      query.mockResolvedValueOnce([{ id: 1, status: 'active' }]);

      const result = await User.findAll({ status: 'active', page: 1, pageSize: 10 });

      expect(result.users).toHaveLength(1);
    });
  });

  describe('generateResetToken()', () => {
    it('should generate a reset token', async () => {
      const user = new User(mockUser);
      user.id = 1;

      query.mockResolvedValueOnce([]);

      const token = await user.generateResetToken();

      expect(token).toBeDefined();
      expect(token).toHaveLength(64); // 32 bytes * 2 (hex)
    });

    it('should set token expiration', async () => {
      const user = new User(mockUser);
      user.id = 1;

      query.mockResolvedValueOnce([]);

      await user.generateResetToken();

      expect(user.reset_token_expires).toBeInstanceOf(Date);
    });
  });

  describe('verifyResetToken()', () => {
    it('should verify valid reset token', async () => {
      const token = 'valid-token';
      query.mockResolvedValueOnce([
        {
          id: 1,
          reset_token: token,
          reset_token_expires: new Date(Date.now() + 3600000) // 1 hour from now
        }
      ]);

      const user = await User.verifyResetToken(token);

      expect(user).toBeInstanceOf(User);
      expect(user.id).toBe(1);
    });

    it('should return null for invalid token', async () => {
      query.mockResolvedValueOnce([]);

      const user = await User.verifyResetToken('invalid-token');

      expect(user).toBeNull();
    });

    it('should return null for expired token', async () => {
      // 数据库的 WHERE reset_token_expires > NOW() 会过滤掉过期记录
      // 所以对于过期的 token，query 应该返回空数组
      query.mockResolvedValueOnce([]);

      const user = await User.verifyResetToken('expired-token');

      expect(user).toBeNull();
    });
  });

  describe('resetPassword()', () => {
    it('should reset password with valid token', async () => {
      const token = 'valid-token';
      const newPassword = 'NewPassword123';

      query.mockResolvedValueOnce([
        {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          reset_token: token,
          reset_token_expires: new Date(Date.now() + 3600000)
        }
      ]);

      query.mockResolvedValueOnce({}); // UPDATE statement

      const user = await User.resetPassword(token, newPassword);

      expect(user).toBeInstanceOf(User);
    });

    it('should throw error for invalid token', async () => {
      query.mockResolvedValueOnce([]);

      await expect(User.resetPassword('invalid-token', 'NewPassword123'))
        .rejects.toThrow('无效或过期的重置令牌');
    });
  });

  describe('toSafeJSON()', () => {
    it('should exclude password from JSON', () => {
      const user = new User({
        ...mockUser,
        password: 'hashedpassword'
      });

      const json = user.toSafeJSON();

      expect(json.password).toBeUndefined();
    });

    it('should include all other fields', () => {
      const user = new User(mockUser);
      const json = user.toSafeJSON();

      expect(json.id).toBe(1);
      expect(json.username).toBe('testuser');
      expect(json.email).toBe('test@example.com');
    });
  });

  describe('getStatistics()', () => {
    it('should return user statistics', async () => {
      const mockStats = {
        total_users: 10,
        active_users: 8,
        admin_count: 2,
        hr_count: 3,
        interviewer_count: 5,
        active_last_30_days: 7
      };

      query.mockResolvedValueOnce([mockStats]);

      const stats = await User.getStatistics();

      expect(stats).toBeDefined();
      expect(stats.total_users).toBe(10);
      expect(stats.active_users).toBe(8);
    });
  });

  describe('getDepartments()', () => {
    it('should return list of departments', async () => {
      const mockDepts = [
        { department: '技术部', count: 5 },
        { department: '产品部', count: 3 }
      ];

      query.mockResolvedValueOnce(mockDepts);

      const departments = await User.getDepartments();

      expect(departments).toHaveLength(2);
      expect(departments[0].department).toBe('技术部');
    });
  });

  describe('activate()', () => {
    it('should activate user', async () => {
      const user = new User(mockUser);
      user.id = 1;

      query.mockResolvedValueOnce([]);

      const activatedUser = await user.activate();

      expect(activatedUser.status).toBe('active');
    });
  });

  describe('deactivate()', () => {
    it('should deactivate user', async () => {
      const user = new User(mockUser);
      user.id = 1;

      query.mockResolvedValueOnce([]);

      const deactivatedUser = await user.deactivate();

      expect(deactivatedUser.status).toBe('inactive');
    });
  });

  describe('findByUsername()', () => {
    it('should find user by username', async () => {
      const mockUserData = { ...mockUser, id: 1 };
      query.mockResolvedValueOnce([mockUserData]);

      const user = await User.findByUsername('testuser');

      expect(user).toBeInstanceOf(User);
      expect(user.username).toBe('testuser');
    });

    it('should return null if user not found by username', async () => {
      query.mockResolvedValueOnce([]);

      const user = await User.findByUsername('nonexistent');

      expect(user).toBeNull();
    });

    it('should handle database errors in findByUsername', async () => {
      query.mockRejectedValueOnce(new Error('Database error'));

      await expect(User.findByUsername('testuser')).rejects.toThrow('Database error');
    });
  });

  describe('findByEmailOrUsername()', () => {
    beforeEach(() => {
      // Restore original method for these tests
      User.findByEmailOrUsername = originalFindByEmailOrUsername;
    });

    it('should find user by email', async () => {
      const mockUserData = { ...mockUser, id: 1 };
      query.mockResolvedValueOnce([mockUserData]);

      const user = await User.findByEmailOrUsername('test@example.com', 'testuser');

      expect(user).toBeInstanceOf(User);
      expect(user.email).toBe('test@example.com');
    });

    it('should find user by username', async () => {
      const mockUserData = { ...mockUser, id: 1 };
      query.mockResolvedValueOnce([mockUserData]);

      const user = await User.findByEmailOrUsername('test@example.com', 'testuser');

      expect(user).toBeInstanceOf(User);
      expect(user.username).toBe('testuser');
    });

    it('should return null if user not found', async () => {
      query.mockResolvedValueOnce([]);

      const user = await User.findByEmailOrUsername('nonexistent@example.com', 'nonexistent');

      expect(user).toBeNull();
    });

    it('should handle database errors in findByEmailOrUsername', async () => {
      query.mockRejectedValueOnce(new Error('Database error'));

      await expect(User.findByEmailOrUsername('test@example.com', 'testuser'))
        .rejects.toThrow('Database error');
    });
  });

  describe('verifyPassword()', () => {
    it('should verify correct password', async () => {
      const user = new User(mockUser);
      passwordUtils.verifyPassword.mockResolvedValueOnce(true);

      const isValid = await user.verifyPassword('TestPassword123');

      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const user = new User(mockUser);
      passwordUtils.verifyPassword.mockResolvedValueOnce(false);

      const isValid = await user.verifyPassword('WrongPassword');

      expect(isValid).toBe(false);
    });

    it('should handle verification errors', async () => {
      const user = new User(mockUser);
      passwordUtils.verifyPassword.mockRejectedValueOnce(new Error('Verification error'));

      await expect(user.verifyPassword('password')).rejects.toThrow('Verification error');
    });
  });

  describe('updateLastLogin()', () => {
    it('should update last login timestamp', async () => {
      const user = new User(mockUser);
      user.id = 1;
      query.mockResolvedValueOnce([]);

      const updatedUser = await user.updateLastLogin();

      expect(updatedUser.last_login).toBeDefined();
      expect(query).toHaveBeenCalled();
    });
  });

  describe('updatePassword()', () => {
    it('should update user password', async () => {
      const user = new User(mockUser);
      user.id = 1;
      passwordUtils.hashPassword.mockResolvedValueOnce('new_hashed_password');
      query.mockResolvedValueOnce([]);

      const updatedUser = await user.updatePassword('NewPassword123');

      expect(updatedUser).toBeInstanceOf(User);
      expect(passwordUtils.hashPassword).toHaveBeenCalledWith('NewPassword123');
    });

    it('should handle password update errors', async () => {
      const user = new User(mockUser);
      user.id = 1;
      passwordUtils.hashPassword.mockRejectedValueOnce(new Error('Hash error'));

      await expect(user.updatePassword('NewPassword123')).rejects.toThrow('Hash error');
    });
  });

  describe('resetPassword() static', () => {
    it('should reset user password with token', async () => {
      // Mock finding user by reset token
      query.mockResolvedValueOnce([{ id: 1, ...mockUser }]);
      // Mock password update
      query.mockResolvedValueOnce([]);
      // Mock clearing reset token
      query.mockResolvedValueOnce([]);

      passwordUtils.hashPassword.mockResolvedValueOnce('new_hashed_password');

      const updatedUser = await User.resetPassword('valid_reset_token_123', 'NewPassword123');

      expect(updatedUser).toBeInstanceOf(User);
    });

    it('should throw error if token is invalid', async () => {
      // Mock finding user by reset token - not found
      query.mockResolvedValueOnce([]);

      await expect(User.resetPassword('invalid_token', 'NewPassword123'))
        .rejects.toThrow('无效或过期的重置令牌');
    });
  });

});
