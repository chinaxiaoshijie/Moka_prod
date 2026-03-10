const { pool } = require('../config/database');
const { responseUtils } = require('../utils/helpers');

// 确保字符集正确设置
const ensureCharset = async (connection) => {
  try {
    await connection.query('SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci');
    await connection.query('SET CHARACTER SET utf8mb4');
    await connection.query('SET character_set_connection=utf8mb4');
  } catch (error) {
    console.error('设置字符集失败:', error);
  }
};

// 封装查询函数，使用 pool.query 而不是 pool.execute
async function executeQuery(sql, params = []) {
  const sqlParams = Array.isArray(params) ? [...params] : [];

  // 获取连接并确保字符集正确
  const connection = await pool.getConnection();
  await ensureCharset(connection);

  try {
    const result = await connection.query(sql, sqlParams);
    connection.release();
    return result[0]; // pool.query returns [rows, fields]
  } catch (error) {
    connection.release();
    throw error;
  }
}

class Position {
  constructor(data) {
    this.id = data.id || null;
    this.title = data.title;
    this.department = data.department;
    this.level = data.level; // junior, middle, senior, expert, manager
    this.type = data.type; // fulltime, parttime, intern, contract
    this.location = data.location;
    this.salary_min = data.salary_min;
    this.salary_max = data.salary_max;
    this.description = data.description;
    this.requirements = data.requirements;
    this.benefits = data.benefits;
    this.skills_required = data.skills_required;
    this.status = data.status || 'draft'; // active, paused, closed, draft
    this.priority = data.priority || 'medium'; // low, medium, high, urgent
    this.headcount = data.headcount || 1;
    this.headcount_filled = data.headcount_filled || 0;
    this.expire_date = data.expire_date;
    this.created_by = data.created_by;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // 创建职位
  async create() {
    try {
      const query = `
        INSERT INTO positions (
          title, department, level, type, location, salary_min, salary_max,
          description, requirements, benefits, skills_required, status,
          priority, headcount, expire_date, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const result = await executeQuery(query, [
        this.title,
        this.department,
        this.level,
        this.type,
        this.location,
        this.salary_min,
        this.salary_max,
        this.description,
        this.requirements,
        this.benefits,
        this.skills_required,
        this.status,
        this.priority,
        this.headcount,
        this.expire_date,
        this.created_by
      ]);

      this.id = result.insertId;

      // 获取完整的职位信息
      const position = await Position.findById(this.id);
      Object.assign(this, position);

      return this;
    } catch (error) {
      console.error('创建职位错误:', error);
      throw error;
    }
  }

  // 更新职位
  async update(data) {
    try {
      const allowedFields = [
        'title', 'department', 'level', 'type', 'location',
        'salary_min', 'salary_max', 'description', 'requirements',
        'benefits', 'skills_required', 'status', 'priority',
        'headcount', 'expire_date'
      ];

      const updates = [];
      const values = [];

      Object.keys(data).forEach(key => {
        if (allowedFields.includes(key) && data[key] !== undefined) {
          updates.push(`${key} = ?`);
          values.push(data[key]);
          this[key] = data[key];
        }
      });

      if (updates.length === 0) {
        throw new Error('没有需要更新的字段');
      }

      updates.push('updated_at = CURRENT_TIMESTAMP');

      const query = `UPDATE positions SET ${updates.join(', ')} WHERE id = ?`;
      values.push(this.id);

      await executeQuery(query, values);

      return this;
    } catch (error) {
      console.error('更新职位错误:', error);
      throw error;
    }
  }

  // 删除职位
  async delete() {
    try {
      // 检查是否有关联的面试
      const interviewCheckQuery = 'SELECT COUNT(*) as count FROM interviews WHERE position_id = ?';
      const interviewResult = await executeQuery(interviewCheckQuery, [this.id]);

      if (interviewResult[0].count > 0) {
        throw new Error('该职位下有关联的面试记录，无法删除');
      }

      const query = 'DELETE FROM positions WHERE id = ?';
      await executeQuery(query, [this.id]);
      return true;
    } catch (error) {
      console.error('删除职位错误:', error);
      throw error;
    }
  }

  // 根据ID查找职位
  static async findById(id) {
    try {
      const query = `
        SELECT
          p.*,
          u.username as created_by_name,
          (SELECT COUNT(*) FROM interviews WHERE position_id = p.id) as interview_count,
          (SELECT COUNT(*) FROM candidates c
           JOIN interviews i ON c.id = i.candidate_id
           WHERE i.position_id = p.id AND c.status = 'hired') as hired_count
        FROM positions p
        LEFT JOIN users u ON p.created_by = u.id
        WHERE p.id = ?
      `;

      const rows = await executeQuery(query, [id]);

      if (rows.length === 0) {
        return null;
      }

      return new Position(rows[0]);
    } catch (error) {
      console.error('查找职位错误:', error);
      throw error;
    }
  }

  // 查找所有职位
  static async findAll(options = {}) {
    try {
      const {
        page = 1,
        pageSize = 20,
        status,
        department,
        level,
        type,
        priority,
        location,
        search,
        created_by,
        expired_only = false,
        active_only = false
      } = options;

      let whereConditions = ['1=1'];
      let queryParams = [];

      // 权限过滤
      if (created_by) {
        whereConditions.push('p.created_by = ?');
        queryParams.push(created_by);
      }

      // 状态筛选
      if (status) {
        whereConditions.push('p.status = ?');
        queryParams.push(status);
      }

      // 只显示激活的职位
      if (active_only) {
        whereConditions.push('p.status = "active"');
      }

      // 只显示过期的职位
      if (expired_only) {
        whereConditions.push('p.expire_date < CURDATE()');
      }

      // 部门筛选
      if (department) {
        whereConditions.push('p.department = ?');
        queryParams.push(department);
      }

      // 级别筛选
      if (level) {
        whereConditions.push('p.level = ?');
        queryParams.push(level);
      }

      // 类型筛选
      if (type) {
        whereConditions.push('p.type = ?');
        queryParams.push(type);
      }

      // 优先级筛选
      if (priority) {
        whereConditions.push('p.priority = ?');
        queryParams.push(priority);
      }

      // 地点筛选
      if (location) {
        whereConditions.push('p.location LIKE ?');
        queryParams.push(`%${location}%`);
      }

      // 搜索
      if (search) {
        whereConditions.push(`(
          p.title LIKE ? OR
          p.department LIKE ? OR
          p.description LIKE ? OR
          p.requirements LIKE ?
        )`);
        const searchPattern = `%${search}%`;
        queryParams.push(searchPattern, searchPattern, searchPattern, searchPattern);
      }

      const whereClause = whereConditions.join(' AND ');

      // 查询总数
      const countQuery = `
        SELECT COUNT(*) as total
        FROM positions p
        WHERE ${whereClause}
      `;

      const countResult = await executeQuery(countQuery, queryParams);
      const total = countResult[0].total;

      // 查询数据
      const offset = (page - 1) * pageSize;
      const dataQuery = `
        SELECT
          p.*,
          u.username as created_by_name,
          (SELECT COUNT(*) FROM interviews WHERE position_id = p.id) as interview_count,
          (SELECT COUNT(*) FROM candidates c
           JOIN interviews i ON c.id = i.candidate_id
           WHERE i.position_id = p.id AND c.status = 'hired') as hired_count
        FROM positions p
        LEFT JOIN users u ON p.created_by = u.id
        WHERE ${whereClause}
        ORDER BY
          CASE p.priority
            WHEN 'urgent' THEN 1
            WHEN 'high' THEN 2
            WHEN 'medium' THEN 3
            WHEN 'low' THEN 4
          END,
          p.created_at DESC
        LIMIT ? OFFSET ?
      `;

      const rows = await executeQuery(dataQuery, [...queryParams, pageSize, offset]);

      const positions = rows.map(row => new Position(row));

      return {
        positions,
        pagination: {
          current: page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      };
    } catch (error) {
      console.error('查找职位列表错误:', error);
      throw error;
    }
  }

  // 搜索职位
  static async search(searchTerm, options = {}) {
    try {
      const { page = 1, pageSize = 20 } = options;

      const query = `
        SELECT
          p.*,
          u.username as created_by_name,
          (SELECT COUNT(*) FROM interviews WHERE position_id = p.id) as interview_count,
          MATCH(p.title, p.description, p.requirements) AGAINST(? IN NATURAL LANGUAGE MODE) as relevance
        FROM positions p
        LEFT JOIN users u ON p.created_by = u.id
        WHERE (
          p.title LIKE ? OR
          p.department LIKE ? OR
          p.description LIKE ? OR
          p.requirements LIKE ? OR
          MATCH(p.title, p.description, p.requirements) AGAINST(? IN NATURAL LANGUAGE MODE)
        )
        AND p.status != 'closed'
        ORDER BY relevance DESC, p.created_at DESC
        LIMIT ? OFFSET ?
      `;

      const searchPattern = `%${searchTerm}%`;
      const offset = (page - 1) * pageSize;

      const rows = await executeQuery(query, [
        searchTerm, searchPattern, searchPattern, searchPattern,
        searchPattern, searchTerm, pageSize, offset
      ]);

      return rows.map(row => new Position(row));
    } catch (error) {
      console.error('搜索职位错误:', error);
      // 如果全文搜索失败，使用简单搜索
      return this.findAll({ search: searchTerm, ...options });
    }
  }

  // 获取职位统计
  static async getStatistics(createdBy = null) {
    try {
      let whereClause = '1=1';
      const params = [];

      if (createdBy) {
        whereClause = 'created_by = ?';
        params.push(createdBy);
      }

      const query = `
        SELECT
          COUNT(*) as total_positions,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_positions,
          SUM(CASE WHEN status = 'paused' THEN 1 ELSE 0 END) as paused_positions,
          SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed_positions,
          SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft_positions,
          SUM(CASE WHEN priority = 'urgent' THEN 1 ELSE 0 END) as urgent_positions,
          SUM(CASE WHEN DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as new_this_week,
          SUM(CASE WHEN expire_date < CURDATE() AND status = 'active' THEN 1 ELSE 0 END) as expired_positions,
          SUM(headcount) as total_headcount,
          SUM(headcount_filled) as total_filled,
          ROUND(AVG(CASE WHEN salary_min > 0 THEN (salary_min + IFNULL(salary_max, salary_min)) / 2 END), 2) as avg_salary
        FROM positions
        WHERE ${whereClause}
      `;

      const rows = await executeQuery(query, params);
      return rows[0];
    } catch (error) {
      console.error('获取职位统计错误:', error);
      throw error;
    }
  }

  // 获取部门统计
  static async getDepartmentStatistics(createdBy = null) {
    try {
      let whereClause = '1=1';
      const params = [];

      if (createdBy) {
        whereClause = 'created_by = ?';
        params.push(createdBy);
      }

      const query = `
        SELECT
          department,
          COUNT(*) as position_count,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_count,
          SUM(headcount) as total_headcount,
          SUM(headcount_filled) as filled_headcount
        FROM positions
        WHERE ${whereClause} AND department IS NOT NULL AND department != ''
        GROUP BY department
        ORDER BY position_count DESC
      `;

      const rows = await executeQuery(query, params);
      return rows;
    } catch (error) {
      console.error('获取部门统计错误:', error);
      throw error;
    }
  }

  // 更新招聘进度
  async updateProgress() {
    try {
      const query = `
        UPDATE positions SET headcount_filled = (
          SELECT COUNT(*) FROM candidates c
          JOIN interviews i ON c.id = i.candidate_id
          WHERE i.position_id = ? AND c.status = 'hired'
        )
        WHERE id = ?
      `;

      await executeQuery(query, [this.id, this.id]);

      // 重新获取更新后的数据
      const updatedPosition = await Position.findById(this.id);
      Object.assign(this, updatedPosition);

      return this;
    } catch (error) {
      console.error('更新招聘进度错误:', error);
      throw error;
    }
  }

  // 检查职位是否可以关闭
  canClose() {
    return this.headcount_filled >= this.headcount;
  }

  // 获取招聘完成率
  getCompletionRate() {
    if (this.headcount === 0) return 0;
    return Math.round((this.headcount_filled / this.headcount) * 100);
  }

  // 转换为JSON格式
  toJSON() {
    return {
      id: this.id,
      title: this.title,
      department: this.department,
      level: this.level,
      type: this.type,
      location: this.location,
      salary_min: this.salary_min,
      salary_max: this.salary_max,
      description: this.description,
      requirements: this.requirements,
      benefits: this.benefits,
      skills_required: this.skills_required,
      status: this.status,
      priority: this.priority,
      headcount: this.headcount,
      headcount_filled: this.headcount_filled || 0,
      expire_date: this.expire_date,
      created_by: this.created_by,
      created_by_name: this.created_by_name,
      interview_count: this.interview_count || 0,
      hired_count: this.hired_count || 0,
      completion_rate: this.getCompletionRate(),
      can_close: this.canClose(),
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

module.exports = Position;