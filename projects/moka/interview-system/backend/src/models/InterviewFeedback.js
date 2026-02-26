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

class InterviewFeedback {
  constructor(data) {
    this.id = data.id || null;
    this.interview_id = data.interview_id;
    this.interviewer_id = data.interviewer_id;
    this.candidate_id = data.candidate_id;
    this.position_id = data.position_id;
    this.template_id = data.template_id || null;

    // 多维度评分 (1-10分)
    this.technical_score = data.technical_score || null;
    this.communication_score = data.communication_score || null;
    this.problem_solving_score = data.problem_solving_score || null;
    this.cultural_fit_score = data.cultural_fit_score || null;
    this.leadership_score = data.leadership_score || null;
    this.creativity_score = data.creativity_score || null;

    // 详细反馈内容
    this.strengths = data.strengths || '';
    this.weaknesses = data.weaknesses || '';
    this.technical_assessment = data.technical_assessment || '';
    this.behavioral_assessment = data.behavioral_assessment || '';
    this.improvement_suggestions = data.improvement_suggestions || '';
    this.additional_notes = data.additional_notes || '';

    // 总体评估
    this.overall_rating = data.overall_rating; // 'excellent', 'good', 'average', 'poor'
    this.overall_score = data.overall_score || null; // 综合得分
    this.recommendation = data.recommendation; // 'strong_hire', 'hire', 'no_hire', 'strong_no_hire'
    this.confidence_level = data.confidence_level || null; // 评估信心度 1-5

    // 状态和时间
    this.status = data.status || 'draft'; // draft, submitted, reviewed
    this.submitted_at = data.submitted_at;
    this.reviewed_at = data.reviewed_at;
    this.reviewed_by = data.reviewed_by || null;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;

    // 关联信息（从JOIN查询获得）
    this.interviewer_name = data.interviewer_name;
    this.candidate_name = data.candidate_name;
    this.position_title = data.position_title;
    this.interview_round = data.interview_round;
  }

  // 创建反馈
  async create() {
    try {
      // 检查是否已存在该面试的反馈
      const existingFeedback = await InterviewFeedback.findByInterviewAndInterviewer(
        this.interview_id,
        this.interviewer_id
      );

      if (existingFeedback) {
        throw new Error('该面试已存在反馈记录');
      }

      const query = `
        INSERT INTO interview_feedbacks (
          interview_id, interviewer_id, candidate_id, position_id, template_id,
          technical_score, communication_score, problem_solving_score,
          cultural_fit_score, leadership_score, creativity_score,
          strengths, weaknesses, technical_assessment, behavioral_assessment,
          improvement_suggestions, additional_notes,
          overall_rating, overall_score, recommendation, confidence_level, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const result = await executeQuery(query, [
        this.interview_id, this.interviewer_id, this.candidate_id, this.position_id, this.template_id,
        this.technical_score, this.communication_score, this.problem_solving_score,
        this.cultural_fit_score, this.leadership_score, this.creativity_score,
        this.strengths, this.weaknesses, this.technical_assessment, this.behavioral_assessment,
        this.improvement_suggestions, this.additional_notes,
        this.overall_rating, this.overall_score, this.recommendation, this.confidence_level, this.status
      ]);

      this.id = result.insertId;

      // 获取完整的反馈信息
      const feedback = await InterviewFeedback.findById(this.id);
      Object.assign(this, feedback);

      return this;
    } catch (error) {
      console.error('创建面试反馈错误:', error);
      throw error;
    }
  }

  // 更新反馈
  async update(data) {
    try {
      const allowedFields = [
        'technical_score', 'communication_score', 'problem_solving_score',
        'cultural_fit_score', 'leadership_score', 'creativity_score',
        'strengths', 'weaknesses', 'technical_assessment', 'behavioral_assessment',
        'improvement_suggestions', 'additional_notes',
        'overall_rating', 'overall_score', 'recommendation', 'confidence_level', 'status'
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

      // 如果状态改为submitted，记录提交时间
      if (data.status === 'submitted' && this.status !== 'submitted') {
        updates.push('submitted_at = CURRENT_TIMESTAMP');
      }

      updates.push('updated_at = CURRENT_TIMESTAMP');

      const query = `UPDATE interview_feedbacks SET ${updates.join(', ')} WHERE id = ?`;
      values.push(this.id);

      await executeQuery(query, values);

      return this;
    } catch (error) {
      console.error('更新面试反馈错误:', error);
      throw error;
    }
  }

  // 删除反馈
  async delete() {
    try {
      const query = 'DELETE FROM interview_feedbacks WHERE id = ?';
      await executeQuery(query, [this.id]);
      return true;
    } catch (error) {
      console.error('删除面试反馈错误:', error);
      throw error;
    }
  }

  // 提交反馈
  async submit() {
    try {
      await this.update({ status: 'submitted' });
      return this;
    } catch (error) {
      console.error('提交面试反馈错误:', error);
      throw error;
    }
  }

  // 计算综合得分
  calculateOverallScore() {
    const scores = [
      this.technical_score,
      this.communication_score,
      this.problem_solving_score,
      this.cultural_fit_score,
      this.leadership_score,
      this.creativity_score
    ].filter(score => score !== null && score !== undefined);

    if (scores.length === 0) return null;

    const sum = scores.reduce((acc, score) => acc + score, 0);
    return Math.round((sum / scores.length) * 10) / 10; // 保留一位小数
  }

  // 根据ID查找反馈
  static async findById(id) {
    try {
      const query = `
        SELECT
          fb.*,
          u.username as interviewer_name,
          c.name as candidate_name,
          p.title as position_title,
          i.interview_round
        FROM interview_feedbacks fb
        LEFT JOIN users u ON fb.interviewer_id = u.id
        LEFT JOIN interviews i ON fb.interview_id = i.id
        LEFT JOIN candidates c ON i.candidate_id = c.id
        LEFT JOIN positions p ON i.position_id = p.id
        WHERE fb.id = ?
      `;

      const rows = await executeQuery(query, [id]);

      if (rows.length === 0) {
        return null;
      }

      return new InterviewFeedback(rows[0]);
    } catch (error) {
      console.error('查找面试反馈错误:', error);
      throw error;
    }
  }

  // 根据面试和面试官查找反馈
  static async findByInterviewAndInterviewer(interviewId, interviewerId) {
    try {
      const query = `
        SELECT * FROM interview_feedbacks
        WHERE interview_id = ? AND interviewer_id = ?
      `;

      const rows = await executeQuery(query, [interviewId, interviewerId]);

      if (rows.length === 0) {
        return null;
      }

      return new InterviewFeedback(rows[0]);
    } catch (error) {
      console.error('查找面试反馈错误:', error);
      throw error;
    }
  }

  // 查找所有反馈
  static async findAll(options = {}) {
    try {
      const {
        page = 1,
        pageSize = 20,
        interview_id,
        interviewer_id,
        candidate_id,
        position_id,
        status,
        overall_rating,
        recommendation,
        date_from,
        date_to,
        search
      } = options;

      let whereConditions = ['1=1'];
      let queryParams = [];

      // 筛选条件
      if (interview_id) {
        whereConditions.push('fb.interview_id = ?');
        queryParams.push(interview_id);
      }

      if (interviewer_id) {
        whereConditions.push('fb.interviewer_id = ?');
        queryParams.push(interviewer_id);
      }

      if (candidate_id) {
        whereConditions.push('i.candidate_id = ?');
        queryParams.push(candidate_id);
      }

      if (position_id) {
        whereConditions.push('i.position_id = ?');
        queryParams.push(position_id);
      }

      if (status) {
        whereConditions.push('fb.status = ?');
        queryParams.push(status);
      }

      if (overall_rating) {
        whereConditions.push('fb.overall_rating = ?');
        queryParams.push(overall_rating);
      }

      if (recommendation) {
        whereConditions.push('fb.recommendation = ?');
        queryParams.push(recommendation);
      }

      if (date_from) {
        whereConditions.push('DATE(fb.created_at) >= ?');
        queryParams.push(date_from);
      }

      if (date_to) {
        whereConditions.push('DATE(fb.created_at) <= ?');
        queryParams.push(date_to);
      }

      if (search) {
        whereConditions.push(`(
          c.name LIKE ? OR
          u.username LIKE ? OR
          p.title LIKE ? OR
          fb.strengths LIKE ? OR
          fb.weaknesses LIKE ?
        )`);
        const searchPattern = `%${search}%`;
        queryParams.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
      }

      const whereClause = whereConditions.join(' AND ');

      // 查询总数
      const countQuery = `
        SELECT COUNT(*) as total
        FROM interview_feedbacks fb
        LEFT JOIN users u ON fb.interviewer_id = u.id
        LEFT JOIN interviews i ON fb.interview_id = i.id
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
          fb.*,
          u.username as interviewer_name,
          c.name as candidate_name,
          p.title as position_title,
          i.interview_round,
          i.scheduled_time as interview_date
        FROM interview_feedbacks fb
        LEFT JOIN users u ON fb.interviewer_id = u.id
        LEFT JOIN interviews i ON fb.interview_id = i.id
        LEFT JOIN candidates c ON i.candidate_id = c.id
        LEFT JOIN positions p ON i.position_id = p.id
        WHERE ${whereClause}
        ORDER BY fb.created_at DESC
        LIMIT ? OFFSET ?
      `;

      const rows = await executeQuery(dataQuery, [...queryParams, pageSize, offset]);

      const feedbacks = rows.map(row => new InterviewFeedback(row));

      return {
        feedbacks,
        pagination: {
          current: page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      };
    } catch (error) {
      console.error('查找面试反馈列表错误:', error);
      throw error;
    }
  }

  // 获取反馈统计
  static async getStatistics(options = {}) {
    try {
      const { interviewer_id, date_from, date_to } = options;

      let whereConditions = ['fb.status = "submitted"'];
      let queryParams = [];

      if (interviewer_id) {
        whereConditions.push('fb.interviewer_id = ?');
        queryParams.push(interviewer_id);
      }

      if (date_from) {
        whereConditions.push('DATE(fb.created_at) >= ?');
        queryParams.push(date_from);
      }

      if (date_to) {
        whereConditions.push('DATE(fb.created_at) <= ?');
        queryParams.push(date_to);
      }

      const whereClause = whereConditions.join(' AND ');

      const query = `
        SELECT
          COUNT(*) as total_feedbacks,
          COUNT(DISTINCT fb.interviewer_id) as total_interviewers,

          -- 推荐统计
          SUM(CASE WHEN fb.recommendation = 'strong_hire' THEN 1 ELSE 0 END) as strong_hire_count,
          SUM(CASE WHEN fb.recommendation = 'hire' THEN 1 ELSE 0 END) as hire_count,
          SUM(CASE WHEN fb.recommendation = 'no_hire' THEN 1 ELSE 0 END) as no_hire_count,
          SUM(CASE WHEN fb.recommendation = 'strong_no_hire' THEN 1 ELSE 0 END) as strong_no_hire_count,

          -- 评级统计
          SUM(CASE WHEN fb.overall_rating = 'very_satisfied' THEN 1 ELSE 0 END) as very_satisfied_count,
          SUM(CASE WHEN fb.overall_rating = 'satisfied' THEN 1 ELSE 0 END) as satisfied_count,
          SUM(CASE WHEN fb.overall_rating = 'neutral' THEN 1 ELSE 0 END) as neutral_count,
          SUM(CASE WHEN fb.overall_rating = 'unsatisfied' THEN 1 ELSE 0 END) as unsatisfied_count,

          -- 平均分数
          ROUND(AVG(fb.technical_score), 2) as avg_technical_score,
          ROUND(AVG(fb.communication_score), 2) as avg_communication_score,
          ROUND(AVG(fb.problem_solving_score), 2) as avg_problem_solving_score,
          ROUND(AVG(fb.cultural_fit_score), 2) as avg_cultural_fit_score,
          ROUND(AVG(fb.overall_score), 2) as avg_overall_score,

          -- 信心度
          ROUND(AVG(fb.confidence_level), 2) as avg_confidence_level

        FROM interview_feedbacks fb
        WHERE ${whereClause}
      `;

      const rows = await executeQuery(query, queryParams);
      return rows[0];
    } catch (error) {
      console.error('获取反馈统计错误:', error);
      throw error;
    }
  }

  // 获取候选人的所有反馈（多轮面试对比）
  static async getCandidateFeedbacks(candidateId) {
    try {
      const query = `
        SELECT
          fb.*,
          u.username as interviewer_name,
          i.interview_round,
          i.scheduled_time as interview_date,
          p.title as position_title
        FROM interview_feedbacks fb
        LEFT JOIN users u ON fb.interviewer_id = u.id
        LEFT JOIN interviews i ON fb.interview_id = i.id
        LEFT JOIN positions p ON i.position_id = p.id
        WHERE i.candidate_id = ? AND fb.is_submitted = 1
        ORDER BY i.interview_round, fb.created_at
      `;

      const rows = await executeQuery(query, [candidateId]);
      return rows.map(row => new InterviewFeedback(row));
    } catch (error) {
      console.error('获取候选人反馈错误:', error);
      throw error;
    }
  }

  // 转换为JSON格式
  toJSON() {
    return {
      id: this.id,
      interview_id: this.interview_id,
      interviewer_id: this.interviewer_id,
      interviewer_name: this.interviewer_name,
      candidate_id: this.candidate_id,
      candidate_name: this.candidate_name,
      position_id: this.position_id,
      position_title: this.position_title,
      interview_round: this.interview_round,
      template_id: this.template_id,

      // 评分
      technical_score: this.technical_score,
      communication_score: this.communication_score,
      problem_solving_score: this.problem_solving_score,
      cultural_fit_score: this.cultural_fit_score,
      leadership_score: this.leadership_score,
      creativity_score: this.creativity_score,

      // 反馈内容
      strengths: this.strengths,
      weaknesses: this.weaknesses,
      technical_assessment: this.technical_assessment,
      behavioral_assessment: this.behavioral_assessment,
      improvement_suggestions: this.improvement_suggestions,
      additional_notes: this.additional_notes,

      // 总体评估
      overall_rating: this.overall_rating,
      overall_score: this.overall_score || this.calculateOverallScore(),
      recommendation: this.recommendation,
      confidence_level: this.confidence_level,

      // 状态
      status: this.status,
      submitted_at: this.submitted_at,
      reviewed_at: this.reviewed_at,
      reviewed_by: this.reviewed_by,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

module.exports = InterviewFeedback;