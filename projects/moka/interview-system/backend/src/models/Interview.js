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

class Interview {
  constructor(data) {
    this.id = data.id || null;
    this.candidate_id = data.candidate_id;
    this.position_id = data.position_id;
    this.interviewer_id = data.interviewer_id;
    this.interviewer_name = data.interviewer_name;
    this.scheduled_time = data.scheduled_time;
    this.duration = data.duration || 60; // 默认60分钟
    this.location = data.location;
    this.meeting_link = data.meeting_link;
    this.interview_type = data.interview_type; // phone, video, onsite
    this.interview_round = data.interview_round || 1;
    this.status = data.status || 'scheduled'; // scheduled, in_progress, completed, cancelled, no_show
    this.notes = data.notes;
    this.feedback = data.feedback;
    this.score = data.score;
    this.result = data.result; // pass, fail, pending
    this.created_by = data.created_by;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // 创建面试
  async create() {
    try {
      // 检查时间冲突
      const conflicts = await this.checkConflicts();
      if (conflicts.length > 0) {
        throw new Error('面试时间冲突，请选择其他时间');
      }

      const query = `
        INSERT INTO interviews (
          candidate_id, position_id, interviewer_id, interviewer_name,
          scheduled_time, duration, location, meeting_link, interview_type,
          interview_round, status, notes, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const result = await executeQuery(query, [
        this.candidate_id,
        this.position_id,
        this.interviewer_id,
        this.interviewer_name,
        this.scheduled_time,
        this.duration,
        this.location,
        this.meeting_link,
        this.interview_type,
        this.interview_round,
        this.status,
        this.notes,
        this.created_by
      ]);

      this.id = result.insertId;

      // 获取完整的面试信息
      const interview = await Interview.findById(this.id);
      Object.assign(this, interview);

      return this;
    } catch (error) {
      console.error('创建面试错误:', error);
      throw error;
    }
  }

  // 更新面试
  async update(data) {
    try {
      const allowedFields = [
        'scheduled_time', 'duration', 'location', 'meeting_link',
        'interview_type', 'status', 'notes', 'feedback', 'score', 'result'
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

      // 如果更新面试时间，检查冲突
      if (data.scheduled_time && data.scheduled_time !== this.scheduled_time) {
        const tempInterview = new Interview({
          ...this,
          ...data
        });
        const conflicts = await tempInterview.checkConflicts(this.id);
        if (conflicts.length > 0) {
          throw new Error('面试时间冲突，请选择其他时间');
        }
      }

      updates.push('updated_at = CURRENT_TIMESTAMP');

      const query = `UPDATE interviews SET ${updates.join(', ')} WHERE id = ?`;
      values.push(this.id);

      await executeQuery(query, values);

      return this;
    } catch (error) {
      console.error('更新面试错误:', error);
      throw error;
    }
  }

  // 删除面试
  async delete() {
    try {
      const query = 'DELETE FROM interviews WHERE id = ?';
      await executeQuery(query, [this.id]);
      return true;
    } catch (error) {
      console.error('删除面试错误:', error);
      throw error;
    }
  }

  // 检查时间冲突
  async checkConflicts(excludeId = null) {
    try {
      const endTime = new Date(new Date(this.scheduled_time).getTime() + this.duration * 60000);

      let query = `
        SELECT i.*, c.name as candidate_name
        FROM interviews i
        LEFT JOIN candidates c ON i.candidate_id = c.id
        WHERE i.interviewer_id = ?
        AND i.status IN ('scheduled', 'in_progress')
        AND (
          (i.scheduled_time <= ? AND DATE_ADD(i.scheduled_time, INTERVAL i.duration MINUTE) > ?) OR
          (i.scheduled_time < ? AND i.scheduled_time >= ?)
        )
      `;

      const values = [
        this.interviewer_id,
        this.scheduled_time,
        this.scheduled_time,
        endTime.toISOString(),
        this.scheduled_time
      ];

      if (excludeId) {
        query += ' AND i.id != ?';
        values.push(excludeId);
      }

      const rows = await executeQuery(query, values);
      return rows;
    } catch (error) {
      console.error('检查面试冲突错误:', error);
      throw error;
    }
  }

  // 根据ID查找面试
  static async findById(id) {
    try {
      const query = `
        SELECT
          i.*,
          c.name as candidate_name,
          c.email as candidate_email,
          c.phone as candidate_phone,
          p.title as position_title,
          u.username as created_by_name
        FROM interviews i
        LEFT JOIN candidates c ON i.candidate_id = c.id
        LEFT JOIN positions p ON i.position_id = p.id
        LEFT JOIN users u ON i.created_by = u.id
        WHERE i.id = ?
      `;

      const rows = await executeQuery(query, [id]);

      if (rows.length === 0) {
        return null;
      }

      return new Interview(rows[0]);
    } catch (error) {
      console.error('查找面试错误:', error);
      throw error;
    }
  }

  // 查找所有面试
  static async findAll(options = {}) {
    try {
      const {
        page = 1,
        pageSize = 20,
        status,
        interviewer_id,
        candidate_id,
        position_id,
        interview_type,
        date_from,
        date_to,
        search,
        created_by
      } = options;

      let whereConditions = ['1=1'];
      let queryParams = [];

      // 权限过滤
      if (created_by) {
        whereConditions.push('(i.created_by = ? OR i.interviewer_id = ?)');
        queryParams.push(created_by, created_by);
      }

      // 状态筛选
      if (status) {
        whereConditions.push('i.status = ?');
        queryParams.push(status);
      }

      // 面试官筛选
      if (interviewer_id) {
        whereConditions.push('i.interviewer_id = ?');
        queryParams.push(interviewer_id);
      }

      // 候选人筛选
      if (candidate_id) {
        whereConditions.push('i.candidate_id = ?');
        queryParams.push(candidate_id);
      }

      // 职位筛选
      if (position_id) {
        whereConditions.push('i.position_id = ?');
        queryParams.push(position_id);
      }

      // 面试类型筛选
      if (interview_type) {
        whereConditions.push('i.interview_type = ?');
        queryParams.push(interview_type);
      }

      // 日期范围筛选
      if (date_from) {
        whereConditions.push('DATE(i.scheduled_time) >= ?');
        queryParams.push(date_from);
      }

      if (date_to) {
        whereConditions.push('DATE(i.scheduled_time) <= ?');
        queryParams.push(date_to);
      }

      // 搜索
      if (search) {
        whereConditions.push(`(
          c.name LIKE ? OR
          c.email LIKE ? OR
          i.interviewer_name LIKE ? OR
          p.title LIKE ?
        )`);
        const searchPattern = `%${search}%`;
        queryParams.push(searchPattern, searchPattern, searchPattern, searchPattern);
      }

      const whereClause = whereConditions.join(' AND ');

      // 查询总数
      const countQuery = `
        SELECT COUNT(*) as total
        FROM interviews i
        LEFT JOIN candidates c ON i.candidate_id = c.id
        LEFT JOIN positions p ON i.position_id = p.id
        WHERE ${whereClause}
      `;

      const countResult = await executeQuery(countQuery, queryParams);
      const total = countResult[0].total;

      // 查询数据
      const offset = (page - 1) * pageSize;
      const dataQuery = `
        SELECT
          i.*,
          c.name as candidate_name,
          c.email as candidate_email,
          c.phone as candidate_phone,
          c.status as candidate_status,
          p.title as position_title,
          u.username as created_by_name
        FROM interviews i
        LEFT JOIN candidates c ON i.candidate_id = c.id
        LEFT JOIN positions p ON i.position_id = p.id
        LEFT JOIN users u ON i.created_by = u.id
        WHERE ${whereClause}
        ORDER BY i.scheduled_time DESC
        LIMIT ? OFFSET ?
      `;

      const rows = await executeQuery(dataQuery, [...queryParams, pageSize, offset]);

      const interviews = rows.map(row => new Interview(row));

      return {
        interviews,
        pagination: {
          current: page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      };
    } catch (error) {
      console.error('查找面试列表错误:', error);
      throw error;
    }
  }

  // 获取面试统计
  static async getStatistics(createdBy = null) {
    try {
      let whereClause = '1=1';
      const params = [];

      if (createdBy) {
        whereClause = '(created_by = ? OR interviewer_id = ?)';
        params.push(createdBy, createdBy);
      }

      const query = `
        SELECT
          COUNT(*) as total_interviews,
          SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) as scheduled_interviews,
          SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_interviews,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_interviews,
          SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_interviews,
          SUM(CASE WHEN status = 'no_show' THEN 1 ELSE 0 END) as no_show_interviews,
          SUM(CASE WHEN DATE(scheduled_time) = CURDATE() THEN 1 ELSE 0 END) as today_interviews,
          SUM(CASE WHEN DATE(scheduled_time) >= CURDATE()
               AND DATE(scheduled_time) < DATE_ADD(CURDATE(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as this_week_interviews,
          SUM(CASE WHEN result = 'pass' THEN 1 ELSE 0 END) as passed_interviews,
          ROUND(AVG(CASE WHEN score IS NOT NULL THEN score END), 2) as average_score
        FROM interviews
        WHERE ${whereClause}
      `;

      const rows = await executeQuery(query, params);
      return rows[0];
    } catch (error) {
      console.error('获取面试统计错误:', error);
      throw error;
    }
  }

  // 获取面试官的可用时间
  static async getInterviewerAvailability(interviewerId, date) {
    try {
      const query = `
        SELECT scheduled_time, duration
        FROM interviews
        WHERE interviewer_id = ?
        AND DATE(scheduled_time) = ?
        AND status IN ('scheduled', 'in_progress')
        ORDER BY scheduled_time
      `;

      const rows = await executeQuery(query, [interviewerId, date]);
      return rows;
    } catch (error) {
      console.error('获取面试官可用时间错误:', error);
      throw error;
    }
  }

  // 获取日历数据
  static async getCalendarData(options = {}) {
    try {
      const { interviewer_id, start_date, end_date, created_by } = options;

      let whereConditions = ['1=1'];
      let queryParams = [];

      // 权限过滤
      if (created_by) {
        whereConditions.push('(i.created_by = ? OR i.interviewer_id = ?)');
        queryParams.push(created_by, created_by);
      }

      if (interviewer_id) {
        whereConditions.push('i.interviewer_id = ?');
        queryParams.push(interviewer_id);
      }

      if (start_date) {
        whereConditions.push('DATE(i.scheduled_time) >= ?');
        queryParams.push(start_date);
      }

      if (end_date) {
        whereConditions.push('DATE(i.scheduled_time) <= ?');
        queryParams.push(end_date);
      }

      const whereClause = whereConditions.join(' AND ');

      const query = `
        SELECT
          i.id,
          i.scheduled_time,
          i.duration,
          i.status,
          i.interview_type,
          i.interview_round,
          c.name as candidate_name,
          p.title as position_title,
          i.interviewer_name
        FROM interviews i
        LEFT JOIN candidates c ON i.candidate_id = c.id
        LEFT JOIN positions p ON i.position_id = p.id
        WHERE ${whereClause}
        ORDER BY i.scheduled_time
      `;

      const rows = await executeQuery(query, queryParams);

      return rows.map(row => ({
        id: row.id,
        title: `${row.candidate_name} - ${row.position_title}`,
        start: row.scheduled_time,
        end: new Date(new Date(row.scheduled_time).getTime() + row.duration * 60000),
        status: row.status,
        type: row.interview_type,
        round: row.interview_round,
        interviewer: row.interviewer_name
      }));
    } catch (error) {
      console.error('获取日历数据错误:', error);
      throw error;
    }
  }

  // 转换为JSON格式
  toJSON() {
    return {
      id: this.id,
      candidate_id: this.candidate_id,
      candidate_name: this.candidate_name,
      candidate_email: this.candidate_email,
      candidate_phone: this.candidate_phone,
      candidate_status: this.candidate_status,
      position_id: this.position_id,
      position_title: this.position_title,
      interviewer_id: this.interviewer_id,
      interviewer_name: this.interviewer_name,
      scheduled_time: this.scheduled_time,
      duration: this.duration,
      location: this.location,
      meeting_link: this.meeting_link,
      interview_type: this.interview_type,
      interview_round: this.interview_round,
      status: this.status,
      notes: this.notes,
      feedback: this.feedback,
      score: this.score,
      result: this.result,
      created_by: this.created_by,
      created_by_name: this.created_by_name,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

module.exports = Interview;