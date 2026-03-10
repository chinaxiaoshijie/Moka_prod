const { query, transaction } = require('../config/database');
const { passwordUtils, dateUtils } = require('../utils/helpers');
const crypto = require('crypto');

class User {
  constructor(data = {}) {
    this.id = data.id;
    this.username = data.username;
    this.email = data.email;
    this.password = data.password;
    this.role = data.role || 'interviewer';
    this.department = data.department;
    this.status = data.status || 'active';
    this.avatar = data.avatar;
    this.phone = data.phone;
    this.last_login = data.last_login;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // 创建用户
  async create() {
    try {
      // 检查用户名和邮箱是否已存在
      const existingUser = await User.findByEmailOrUsername(this.email, this.username);
      if (existingUser) {
        throw new Error('用户名或邮箱已存在');
      }

      // 哈希密码
      this.password = await passwordUtils.hashPassword(this.password);

      const sql = `
        INSERT INTO users (username, email, password, role, department, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
      `;

      const result = await query(sql, [
        this.username,
        this.email,
        this.password,
        this.role,
        this.department,
        this.status
      ]);

      this.id = result.insertId;
      return this;

    } catch (error) {
      console.error('创建用户错误:', error);
      throw error;
    }
  }

  // 根据ID查找用户
  static async findById(id) {
    try {
      const sql = `
        SELECT id, username, email, role, department, status, avatar, phone,
               last_login, created_at, updated_at
        FROM users WHERE id = ?
      `;

      const results = await query(sql, [id]);
      return results.length > 0 ? new User(results[0]) : null;

    } catch (error) {
      console.error('查找用户错误:', error);
      throw error;
    }
  }

  // 根据邮箱查找用户
  static async findByEmail(email) {
    try {
      const sql = `
        SELECT id, username, email, password, role, department, status, avatar, phone,
               last_login, created_at, updated_at
        FROM users WHERE email = ?
      `;

      const results = await query(sql, [email]);
      return results.length > 0 ? new User(results[0]) : null;

    } catch (error) {
      console.error('查找用户错误:', error);
      throw error;
    }
  }

  // 根据用户名查找用户
  static async findByUsername(username) {
    try {
      const sql = `
        SELECT id, username, email, password, role, department, status, avatar, phone,
               last_login, created_at, updated_at
        FROM users WHERE username = ?
      `;

      const results = await query(sql, [username]);
      return results.length > 0 ? new User(results[0]) : null;

    } catch (error) {
      console.error('查找用户错误:', error);
      throw error;
    }
  }

  // 根据邮箱或用户名查找用户
  static async findByEmailOrUsername(email, username) {
    try {
      const sql = `
        SELECT id, username, email, role, department, status, avatar, phone,
               last_login, created_at, updated_at
        FROM users WHERE email = ? OR username = ?
      `;

      const results = await query(sql, [email, username]);
      return results.length > 0 ? new User(results[0]) : null;

    } catch (error) {
      console.error('查找用户错误:', error);
      throw error;
    }
  }

  // 验证密码
  async verifyPassword(password) {
    try {
      return await passwordUtils.verifyPassword(password, this.password);
    } catch (error) {
      console.error('密码验证错误:', error);
      throw error;
    }
  }

  // 更新用户信息
  async update(updateData) {
    try {
      const allowedFields = ['username', 'email', 'role', 'department', 'status', 'avatar', 'phone'];
      const updates = [];
      const values = [];

      // 过滤允许更新的字段
      for (const [key, value] of Object.entries(updateData)) {
        if (allowedFields.includes(key) && value !== undefined) {
          updates.push(`${key} = ?`);
          values.push(value);
          this[key] = value;
        }
      }

      if (updates.length === 0) {
        return this;
      }

      updates.push('updated_at = NOW()');
      values.push(this.id);

      const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
      await query(sql, values);

      return this;

    } catch (error) {
      console.error('更新用户错误:', error);
      throw error;
    }
  }

  // 更新密码
  async updatePassword(newPassword) {
    try {
      const hashedPassword = await passwordUtils.hashPassword(newPassword);

      const sql = 'UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?';
      await query(sql, [hashedPassword, this.id]);

      this.password = hashedPassword;
      return this;

    } catch (error) {
      console.error('更新密码错误:', error);
      throw error;
    }
  }

  // 生成密码重置令牌
  async generateResetToken() {
    try {
      // 生成随机令牌
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpires = new Date(Date.now() + 15 * 60 * 1000); // 15分钟后过期

      const sql = `
        UPDATE users
        SET reset_token = ?, reset_token_expires = ?, updated_at = NOW()
        WHERE id = ?
      `;
      await query(sql, [resetToken, resetTokenExpires, this.id]);

      this.reset_token = resetToken;
      this.reset_token_expires = resetTokenExpires;
      return resetToken;

    } catch (error) {
      console.error('生成重置令牌错误:', error);
      throw error;
    }
  }

  // 验证密码重置令牌
  static async verifyResetToken(token) {
    try {
      const sql = `
        SELECT id, username, email, reset_token_expires
        FROM users
        WHERE reset_token = ? AND reset_token_expires > NOW() AND status = 'active'
      `;

      const results = await query(sql, [token]);
      return results.length > 0 ? new User(results[0]) : null;

    } catch (error) {
      console.error('验证重置令牌错误:', error);
      throw error;
    }
  }

  // 使用令牌重置密码
  static async resetPassword(token, newPassword) {
    try {
      const user = await User.verifyResetToken(token);

      if (!user) {
        throw new Error('无效或过期的重置令牌');
      }

      const hashedPassword = await passwordUtils.hashPassword(newPassword);

      const sql = `
        UPDATE users
        SET password = ?, reset_token = NULL, reset_token_expires = NULL, updated_at = NOW()
        WHERE id = ?
      `;
      await query(sql, [hashedPassword, user.id]);

      return user;

    } catch (error) {
      console.error('重置密码错误:', error);
      throw error;
    }
  }

  // 清除重置令牌
  async clearResetToken() {
    try {
      const sql = `
        UPDATE users
        SET reset_token = NULL, reset_token_expires = NULL, updated_at = NOW()
        WHERE id = ?
      `;
      await query(sql, [this.id]);

      this.reset_token = null;
      this.reset_token_expires = null;
      return this;

    } catch (error) {
      console.error('清除重置令牌错误:', error);
      throw error;
    }
  }

  // 更新最后登录时间
  async updateLastLogin() {
    try {
      const sql = 'UPDATE users SET last_login = NOW() WHERE id = ?';
      await query(sql, [this.id]);

      this.last_login = new Date();
      return this;

    } catch (error) {
      console.error('更新最后登录时间错误:', error);
      throw error;
    }
  }

  // 获取用户列表
  static async findAll(options = {}) {
    try {
      const {
        page = 1,
        pageSize = 20,
        role,
        department,
        status,
        search
      } = options;

      const offset = (page - 1) * pageSize;
      const conditions = [];
      const values = [];

      // 构建查询条件
      if (role) {
        conditions.push('role = ?');
        values.push(role);
      }

      if (department) {
        conditions.push('department = ?');
        values.push(department);
      }

      if (status) {
        conditions.push('status = ?');
        values.push(status);
      }

      if (search) {
        conditions.push('(username LIKE ? OR email LIKE ?)');
        values.push(`%${search}%`, `%${search}%`);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // 查询总数 - 使用独立的数组
      const countValues = [...values];
      const countSql = `SELECT COUNT(*) as total FROM users ${whereClause}`;
      const countResult = await query(countSql, countValues);
      const total = countResult[0].total;

      // 查询数据 - 创建新的数组避免参数绑定问题
      const dataValues = [...values, pageSize, offset];
      const dataSql = `
        SELECT id, username, email, role, department, status, avatar, phone,
               last_login, created_at, updated_at
        FROM users ${whereClause}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `;

      const results = await query(dataSql, dataValues);

      return {
        users: results.map(user => new User(user)),
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
          hasNext: page < Math.ceil(total / pageSize),
          hasPrev: page > 1
        }
      };

    } catch (error) {
      console.error('查询用户列表错误:', error);
      throw error;
    }
  }

  // 删除用户（软删除）
  async softDelete() {
    try {
      const sql = 'UPDATE users SET status = ?, updated_at = NOW() WHERE id = ?';
      await query(sql, ['deleted', this.id]);

      this.status = 'deleted';
      return this;

    } catch (error) {
      console.error('删除用户错误:', error);
      throw error;
    }
  }

  // 激活用户
  async activate() {
    try {
      const sql = 'UPDATE users SET status = ?, updated_at = NOW() WHERE id = ?';
      await query(sql, ['active', this.id]);

      this.status = 'active';
      return this;

    } catch (error) {
      console.error('激活用户错误:', error);
      throw error;
    }
  }

  // 禁用用户
  async deactivate() {
    try {
      const sql = 'UPDATE users SET status = ?, updated_at = NOW() WHERE id = ?';
      await query(sql, ['inactive', this.id]);

      this.status = 'inactive';
      return this;

    } catch (error) {
      console.error('禁用用户错误:', error);
      throw error;
    }
  }

  // 获取用户统计信息
  static async getStatistics() {
    try {
      const sql = `
        SELECT
          COUNT(*) as total_users,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_users,
          SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admin_count,
          SUM(CASE WHEN role = 'hr' THEN 1 ELSE 0 END) as hr_count,
          SUM(CASE WHEN role = 'interviewer' THEN 1 ELSE 0 END) as interviewer_count,
          SUM(CASE WHEN last_login >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as active_last_30_days
        FROM users
        WHERE status != 'deleted'
      `;

      const results = await query(sql);
      return results[0];

    } catch (error) {
      console.error('获取用户统计错误:', error);
      throw error;
    }
  }

  // 获取部门列表
  static async getDepartments() {
    try {
      const sql = `
        SELECT department, COUNT(*) as count
        FROM users
        WHERE status = 'active' AND department IS NOT NULL AND department != ''
        GROUP BY department
        ORDER BY count DESC, department
      `;

      const results = await query(sql);
      return results;

    } catch (error) {
      console.error('获取部门列表错误:', error);
      throw error;
    }
  }

  // 转换为安全的JSON格式（不包含密码）
  toSafeJSON() {
    const safeData = { ...this };
    delete safeData.password;
    return safeData;
  }

  // 转换为JSON格式
  toJSON() {
    return {
      id: this.id,
      username: this.username,
      email: this.email,
      role: this.role,
      department: this.department,
      status: this.status,
      avatar: this.avatar,
      phone: this.phone,
      last_login: this.last_login,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

module.exports = User;