const { query, transaction } = require('../config/database');
const { dateUtils } = require('../utils/helpers');

class Candidate {
  constructor(data = {}) {
    this.id = data.id;
    this.name = data.name;
    this.email = data.email;
    this.phone = data.phone;
    this.gender = data.gender;
    this.age = data.age;
    this.education = data.education;
    this.school = data.school;
    this.major = data.major;
    this.experience_years = data.experience_years;
    this.current_company = data.current_company;
    this.current_position = data.current_position;
    this.current_salary = data.current_salary;
    this.expected_salary = data.expected_salary;
    this.skills = data.skills;
    this.resume_url = data.resume_url;
    this.resume_text = data.resume_text;
    this.source = data.source || 'manual';
    this.source_detail = data.source_detail;
    this.status = data.status || 'new';
    this.rejection_reason = data.rejection_reason;
    this.notes = data.notes;
    this.tags = data.tags;
    this.created_by = data.created_by;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // 创建候选人
  async create() {
    try {
      const sql = `
        INSERT INTO candidates (
          name, email, phone, gender, age, education, school, major,
          experience_years, current_company, current_position, current_salary,
          expected_salary, skills, resume_url, resume_text, source, source_detail,
          status, notes, tags, created_by, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `;

      const result = await query(sql, [
        this.name, this.email, this.phone, this.gender, this.age,
        this.education, this.school, this.major, this.experience_years,
        this.current_company, this.current_position, this.current_salary,
        this.expected_salary, this.skills, this.resume_url, this.resume_text,
        this.source, this.source_detail, this.status, this.notes,
        JSON.stringify(this.tags || []), this.created_by
      ]);

      this.id = result.insertId;
      return this;

    } catch (error) {
      console.error('创建候选人错误:', error);
      throw error;
    }
  }

  // 根据ID查找候选人
  static async findById(id) {
    try {
      const sql = `
        SELECT c.*, u.username as created_by_name
        FROM candidates c
        LEFT JOIN users u ON c.created_by = u.id
        WHERE c.id = ?
      `;

      const results = await query(sql, [id]);
      if (results.length === 0) return null;

      const candidate = new Candidate(results[0]);
      // 解析JSON字段
      if (candidate.tags && typeof candidate.tags === 'string') {
        candidate.tags = JSON.parse(candidate.tags);
      }
      return candidate;

    } catch (error) {
      console.error('查找候选人错误:', error);
      throw error;
    }
  }

  // 根据邮箱或手机号查找候选人
  static async findByEmailOrPhone(email, phone) {
    try {
      const conditions = [];
      const values = [];

      if (email) {
        conditions.push('email = ?');
        values.push(email);
      }

      if (phone) {
        conditions.push('phone = ?');
        values.push(phone);
      }

      if (conditions.length === 0) return null;

      const sql = `
        SELECT c.*, u.username as created_by_name
        FROM candidates c
        LEFT JOIN users u ON c.created_by = u.id
        WHERE ${conditions.join(' OR ')}
        LIMIT 1
      `;

      const results = await query(sql, values);
      if (results.length === 0) return null;

      const candidate = new Candidate(results[0]);
      // 解析JSON字段
      if (candidate.tags && typeof candidate.tags === 'string') {
        candidate.tags = JSON.parse(candidate.tags);
      }
      return candidate;

    } catch (error) {
      console.error('根据邮箱或手机号查找候选人错误:', error);
      throw error;
    }
  }

  // 静态方法：根据ID更新候选人
  static async update(id, updateData) {
    try {
      const allowedFields = [
        'name', 'email', 'phone', 'gender', 'age', 'education', 'school', 'major',
        'experience_years', 'current_company', 'current_position', 'current_salary',
        'expected_salary', 'skills', 'resume_url', 'resume_text', 'source', 'source_detail',
        'status', 'rejection_reason', 'notes', 'tags'
      ];

      const updates = [];
      const values = [];

      for (const [key, value] of Object.entries(updateData)) {
        if (allowedFields.includes(key) && value !== undefined) {
          updates.push(`${key} = ?`);
          if (key === 'tags' && typeof value === 'object') {
            values.push(JSON.stringify(value));
          } else {
            values.push(value);
          }
        }
      }

      if (updates.length === 0) {
        return await Candidate.findById(id);
      }

      updates.push('updated_at = NOW()');
      values.push(id);

      const sql = `UPDATE candidates SET ${updates.join(', ')} WHERE id = ?`;
      await query(sql, values);

      return await Candidate.findById(id);

    } catch (error) {
      console.error('更新候选人错误:', error);
      throw error;
    }
  }

  // 获取候选人列表
  static async findAll(options = {}) {
    try {
      const {
        page = 1,
        pageSize = 20,
        status,
        source,
        education,
        experience_years,
        search,
        created_by
      } = options;

      const offset = (page - 1) * pageSize;
      const conditions = [];
      const values = [];

      // 构建查询条件
      if (status) {
        conditions.push('c.status = ?');
        values.push(status);
      }

      if (source) {
        conditions.push('c.source = ?');
        values.push(source);
      }

      if (education) {
        conditions.push('c.education = ?');
        values.push(education);
      }

      if (experience_years !== undefined) {
        conditions.push('c.experience_years >= ?');
        values.push(experience_years);
      }

      if (created_by) {
        conditions.push('c.created_by = ?');
        values.push(created_by);
      }

      if (search) {
        conditions.push(`(
          c.name LIKE ? OR
          c.email LIKE ? OR
          c.phone LIKE ? OR
          c.current_company LIKE ? OR
          c.skills LIKE ? OR
          MATCH(c.resume_text) AGAINST(? IN NATURAL LANGUAGE MODE)
        )`);
        const searchTerm = `%${search}%`;
        values.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, search);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // 查询总数 - 使用独立的数组
      const countValues = [...values];
      const countSql = `
        SELECT COUNT(*) as total
        FROM candidates c
        ${whereClause}
      `;
      const countResult = await query(countSql, countValues);
      const total = countResult[0].total;

      // 查询数据 - 创建新的数组避免参数绑定问题
      const dataValues = [...values, pageSize, offset];
      const dataSql = `
        SELECT c.*, u.username as created_by_name
        FROM candidates c
        LEFT JOIN users u ON c.created_by = u.id
        ${whereClause}
        ORDER BY c.created_at DESC
        LIMIT ? OFFSET ?
      `;

      const results = await query(dataSql, dataValues);

      const candidates = results.map(row => {
        const candidate = new Candidate(row);
        // 解析JSON字段
        if (candidate.tags && typeof candidate.tags === 'string') {
          candidate.tags = JSON.parse(candidate.tags);
        }
        return candidate;
      });

      return {
        candidates,
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
      console.error('查询候选人列表错误:', error);
      throw error;
    }
  }

  // 更新候选人信息
  async update(updateData) {
    try {
      const allowedFields = [
        'name', 'email', 'phone', 'gender', 'age', 'education', 'school', 'major',
        'experience_years', 'current_company', 'current_position', 'current_salary',
        'expected_salary', 'skills', 'resume_url', 'resume_text', 'source', 'source_detail',
        'status', 'rejection_reason', 'notes', 'tags'
      ];

      const updates = [];
      const values = [];

      for (const [key, value] of Object.entries(updateData)) {
        if (allowedFields.includes(key) && value !== undefined) {
          updates.push(`${key} = ?`);
          if (key === 'tags' && typeof value === 'object') {
            values.push(JSON.stringify(value));
            this[key] = value;
          } else {
            values.push(value);
            this[key] = value;
          }
        }
      }

      if (updates.length === 0) {
        return this;
      }

      updates.push('updated_at = NOW()');
      values.push(this.id);

      const sql = `UPDATE candidates SET ${updates.join(', ')} WHERE id = ?`;
      await query(sql, values);

      return this;

    } catch (error) {
      console.error('更新候选人错误:', error);
      throw error;
    }
  }

  // 删除候选人
  async delete() {
    try {
      const sql = 'DELETE FROM candidates WHERE id = ?';
      await query(sql, [this.id]);
      return true;

    } catch (error) {
      console.error('删除候选人错误:', error);
      throw error;
    }
  }

  // 检查重复候选人
  static async findDuplicates(email, phone, name) {
    try {
      const conditions = [];
      const values = [];

      if (email) {
        conditions.push('email = ?');
        values.push(email);
      }

      if (phone) {
        conditions.push('phone = ?');
        values.push(phone);
      }

      if (name) {
        conditions.push('name = ? AND (email = ? OR phone = ?)');
        values.push(name, email, phone);
      }

      if (conditions.length === 0) return [];

      const sql = `
        SELECT id, name, email, phone, status, created_at
        FROM candidates
        WHERE ${conditions.join(' OR ')}
        ORDER BY created_at DESC
      `;

      const results = await query(sql, values);
      return results.map(row => new Candidate(row));

    } catch (error) {
      console.error('查找重复候选人错误:', error);
      throw error;
    }
  }

  // 获取候选人统计信息
  static async getStatistics(createdBy = null) {
    try {
      const whereClause = createdBy ? 'WHERE created_by = ?' : '';
      const values = createdBy ? [createdBy] : [];

      const sql = `
        SELECT
          COUNT(*) as total_candidates,
          SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as new_candidates,
          SUM(CASE WHEN status = 'screening' THEN 1 ELSE 0 END) as screening_candidates,
          SUM(CASE WHEN status = 'interviewing' THEN 1 ELSE 0 END) as interviewing_candidates,
          SUM(CASE WHEN status = 'offer' THEN 1 ELSE 0 END) as offer_candidates,
          SUM(CASE WHEN status = 'hired' THEN 1 ELSE 0 END) as hired_candidates,
          SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_candidates,
          SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as new_this_week,
          SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as new_this_month
        FROM candidates ${whereClause}
      `;

      const results = await query(sql, values);
      return results[0];

    } catch (error) {
      console.error('获取候选人统计错误:', error);
      throw error;
    }
  }

  // 搜索候选人（全文搜索）
  static async search(searchTerm, options = {}) {
    try {
      const { page = 1, pageSize = 20 } = options;
      const offset = (page - 1) * pageSize;

      const sql = `
        SELECT c.*, u.username as created_by_name,
               MATCH(c.resume_text, c.skills) AGAINST(? IN NATURAL LANGUAGE MODE) as relevance
        FROM candidates c
        LEFT JOIN users u ON c.created_by = u.id
        WHERE MATCH(c.resume_text, c.skills) AGAINST(? IN NATURAL LANGUAGE MODE)
           OR c.name LIKE ?
           OR c.email LIKE ?
           OR c.current_company LIKE ?
        ORDER BY relevance DESC, c.created_at DESC
        LIMIT ? OFFSET ?
      `;

      const searchPattern = `%${searchTerm}%`;
      const results = await query(sql, [
        searchTerm, searchTerm, searchPattern, searchPattern, searchPattern,
        pageSize, offset
      ]);

      const candidates = results.map(row => {
        const candidate = new Candidate(row);
        if (candidate.tags && typeof candidate.tags === 'string') {
          candidate.tags = JSON.parse(candidate.tags);
        }
        candidate.relevance = row.relevance;
        return candidate;
      });

      return candidates;

    } catch (error) {
      console.error('搜索候选人错误:', error);
      throw error;
    }
  }

  // 转换为JSON格式
  toJSON() {
    const data = { ...this };
    // 确保tags是数组
    if (typeof data.tags === 'string') {
      try {
        data.tags = JSON.parse(data.tags);
      } catch {
        data.tags = [];
      }
    }
    return data;
  }
}

module.exports = Candidate;