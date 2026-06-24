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

class FeedbackTemplate {
  constructor(data) {
    this.id = data.id || null;
    this.name = data.name;
    this.description = data.description || '';
    this.position_level = data.position_level || 'all'; // junior, middle, senior, expert, manager, all
    this.department = data.department || '';
    this.template_type = data.template_type || 'standard'; // standard, technical, behavioral, leadership

    // 评估维度配置
    this.dimensions = data.dimensions || '[]'; // JSON字符串，存储评估维度配置

    // 权重配置
    this.technical_weight = data.technical_weight || 25;
    this.communication_weight = data.communication_weight || 20;
    this.problem_solving_weight = data.problem_solving_weight || 20;
    this.cultural_fit_weight = data.cultural_fit_weight || 15;
    this.leadership_weight = data.leadership_weight || 10;
    this.creativity_weight = data.creativity_weight || 10;

    // 评分标准
    this.scoring_guidelines = data.scoring_guidelines || '{}'; // JSON字符串

    // 状态
    this.status = data.status || 'active'; // active, inactive, archived
    this.is_default = data.is_default || false;
    this.created_by = data.created_by;
    this.usage_count = data.usage_count || 0;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;

    // 关联信息
    this.created_by_name = data.created_by_name;
  }

  // 创建模板
  async create() {
    try {
      // 检查权重总和是否为100
      const totalWeight = this.technical_weight + this.communication_weight +
                         this.problem_solving_weight + this.cultural_fit_weight +
                         this.leadership_weight + this.creativity_weight;

      if (totalWeight !== 100) {
        throw new Error('评估维度权重总和必须为100%');
      }

      const query = `
        INSERT INTO feedback_templates (
          name, description, position_level, department, template_type,
          dimensions, technical_weight, communication_weight, problem_solving_weight,
          cultural_fit_weight, leadership_weight, creativity_weight,
          scoring_guidelines, status, is_default, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const result = await executeQuery(query, [
        this.name, this.description, this.position_level, this.department, this.template_type,
        this.dimensions, this.technical_weight, this.communication_weight, this.problem_solving_weight,
        this.cultural_fit_weight, this.leadership_weight, this.creativity_weight,
        this.scoring_guidelines, this.status, this.is_default, this.created_by
      ]);

      this.id = result.insertId;

      // 如果设置为默认模板，取消其他默认模板
      if (this.is_default) {
        await this.setAsDefault();
      }

      // 获取完整的模板信息
      const template = await FeedbackTemplate.findById(this.id);
      Object.assign(this, template);

      return this;
    } catch (error) {
      console.error('创建反馈模板错误:', error);
      throw error;
    }
  }

  // 更新模板
  async update(data) {
    try {
      const allowedFields = [
        'name', 'description', 'position_level', 'department', 'template_type',
        'dimensions', 'technical_weight', 'communication_weight', 'problem_solving_weight',
        'cultural_fit_weight', 'leadership_weight', 'creativity_weight',
        'scoring_guidelines', 'status', 'is_default'
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

      // 检查权重
      if (data.technical_weight || data.communication_weight || data.problem_solving_weight ||
          data.cultural_fit_weight || data.leadership_weight || data.creativity_weight) {
        const totalWeight = (data.technical_weight || this.technical_weight) +
                           (data.communication_weight || this.communication_weight) +
                           (data.problem_solving_weight || this.problem_solving_weight) +
                           (data.cultural_fit_weight || this.cultural_fit_weight) +
                           (data.leadership_weight || this.leadership_weight) +
                           (data.creativity_weight || this.creativity_weight);

        if (totalWeight !== 100) {
          throw new Error('评估维度权重总和必须为100%');
        }
      }

      updates.push('updated_at = CURRENT_TIMESTAMP');

      const query = `UPDATE feedback_templates SET ${updates.join(', ')} WHERE id = ?`;
      values.push(this.id);

      await executeQuery(query, values);

      // 如果设置为默认模板，取消其他默认模板
      if (data.is_default) {
        await this.setAsDefault();
      }

      return this;
    } catch (error) {
      console.error('更新反馈模板错误:', error);
      throw error;
    }
  }

  // 删除模板
  async delete() {
    try {
      // 检查是否有使用该模板的反馈
      const usageQuery = 'SELECT COUNT(*) as count FROM interview_feedbacks WHERE template_id = ?';
      const usageResult = await executeQuery(usageQuery, [this.id]);

      if (usageResult[0].count > 0) {
        throw new Error('该模板正在使用中，无法删除');
      }

      const query = 'DELETE FROM feedback_templates WHERE id = ?';
      await executeQuery(query, [this.id]);
      return true;
    } catch (error) {
      console.error('删除反馈模板错误:', error);
      throw error;
    }
  }

  // 设置为默认模板
  async setAsDefault() {
    try {
      // 取消其他默认模板
      await executeQuery(
        'UPDATE feedback_templates SET is_default = FALSE WHERE is_default = TRUE AND id != ?',
        [this.id]
      );

      // 设置当前模板为默认
      await executeQuery(
        'UPDATE feedback_templates SET is_default = TRUE WHERE id = ?',
        [this.id]
      );

      this.is_default = true;
    } catch (error) {
      console.error('设置默认模板错误:', error);
      throw error;
    }
  }

  // 增加使用次数
  async incrementUsage() {
    try {
      await executeQuery(
        'UPDATE feedback_templates SET usage_count = usage_count + 1 WHERE id = ?',
        [this.id]
      );
      this.usage_count += 1;
    } catch (error) {
      console.error('更新模板使用次数错误:', error);
    }
  }

  // 根据ID查找模板
  static async findById(id) {
    try {
      const query = `
        SELECT
          ft.*,
          u.username as created_by_name
        FROM feedback_templates ft
        LEFT JOIN users u ON ft.created_by = u.id
        WHERE ft.id = ?
      `;

      const rows = await executeQuery(query, [id]);

      if (rows.length === 0) {
        return null;
      }

      return new FeedbackTemplate(rows[0]);
    } catch (error) {
      console.error('查找反馈模板错误:', error);
      throw error;
    }
  }

  // 获取默认模板
  static async getDefault() {
    try {
      const query = `
        SELECT * FROM feedback_templates
        WHERE is_default = TRUE AND status = 'active'
        ORDER BY created_at DESC
        LIMIT 1
      `;

      const rows = await executeQuery(query);

      if (rows.length === 0) {
        return null;
      }

      return new FeedbackTemplate(rows[0]);
    } catch (error) {
      console.error('获取默认模板错误:', error);
      throw error;
    }
  }

  // 查找所有模板
  static async findAll(options = {}) {
    try {
      const {
        page = 1,
        pageSize = 20,
        status,
        position_level,
        department,
        template_type,
        created_by,
        search
      } = options;

      let whereConditions = ['1=1'];
      let queryParams = [];

      if (status) {
        whereConditions.push('ft.status = ?');
        queryParams.push(status);
      }

      if (position_level && position_level !== 'all') {
        whereConditions.push('(ft.position_level = ? OR ft.position_level = "all")');
        queryParams.push(position_level);
      }

      if (department) {
        whereConditions.push('(ft.department = ? OR ft.department = "")');
        queryParams.push(department);
      }

      if (template_type) {
        whereConditions.push('ft.template_type = ?');
        queryParams.push(template_type);
      }

      if (created_by) {
        whereConditions.push('ft.created_by = ?');
        queryParams.push(created_by);
      }

      if (search) {
        whereConditions.push('(ft.name LIKE ? OR ft.description LIKE ?)');
        const searchPattern = `%${search}%`;
        queryParams.push(searchPattern, searchPattern);
      }

      const whereClause = whereConditions.join(' AND ');

      // 查询总数
      const countQuery = `
        SELECT COUNT(*) as total
        FROM feedback_templates ft
        WHERE ${whereClause}
      `;

      const countResult = await executeQuery(countQuery, queryParams);
      const total = countResult[0].total;

      // 查询数据
      const offset = (page - 1) * pageSize;
      const dataQuery = `
        SELECT
          ft.*,
          u.username as created_by_name
        FROM feedback_templates ft
        LEFT JOIN users u ON ft.created_by = u.id
        WHERE ${whereClause}
        ORDER BY ft.is_default DESC, ft.usage_count DESC, ft.created_at DESC
        LIMIT ? OFFSET ?
      `;

      const rows = await executeQuery(dataQuery, [...queryParams, pageSize, offset]);

      const templates = rows.map(row => new FeedbackTemplate(row));

      return {
        templates,
        pagination: {
          current: page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      };
    } catch (error) {
      console.error('查找反馈模板列表错误:', error);
      throw error;
    }
  }

  // 获取适合的模板（根据职位和部门）
  static async getSuitableTemplates(positionLevel, department) {
    try {
      const query = `
        SELECT * FROM feedback_templates
        WHERE status = 'active'
        AND (position_level = ? OR position_level = 'all')
        AND (department = ? OR department = '')
        ORDER BY is_default DESC,
                 CASE WHEN department = ? THEN 1 ELSE 0 END DESC,
                 CASE WHEN position_level = ? THEN 1 ELSE 0 END DESC,
                 usage_count DESC
      `;

      const rows = await executeQuery(query, [positionLevel, department, department, positionLevel]);
      return rows.map(row => new FeedbackTemplate(row));
    } catch (error) {
      console.error('获取适合模板错误:', error);
      throw error;
    }
  }

  // 获取模板统计
  static async getStatistics() {
    try {
      const query = `
        SELECT
          COUNT(*) as total_templates,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_templates,
          SUM(usage_count) as total_usage,
          COUNT(CASE WHEN is_default = TRUE THEN 1 END) as default_count,
          ROUND(AVG(usage_count), 2) as avg_usage
        FROM feedback_templates
      `;

      const rows = await executeQuery(query);
      return rows[0];
    } catch (error) {
      console.error('获取模板统计错误:', error);
      throw error;
    }
  }

  // 复制模板
  async duplicate(newName, createdBy) {
    try {
      const duplicateTemplate = new FeedbackTemplate({
        name: newName,
        description: `${this.description} (复制)`,
        position_level: this.position_level,
        department: this.department,
        template_type: this.template_type,
        dimensions: this.dimensions,
        technical_weight: this.technical_weight,
        communication_weight: this.communication_weight,
        problem_solving_weight: this.problem_solving_weight,
        cultural_fit_weight: this.cultural_fit_weight,
        leadership_weight: this.leadership_weight,
        creativity_weight: this.creativity_weight,
        scoring_guidelines: this.scoring_guidelines,
        status: 'active',
        is_default: false,
        created_by: createdBy
      });

      await duplicateTemplate.create();
      return duplicateTemplate;
    } catch (error) {
      console.error('复制模板错误:', error);
      throw error;
    }
  }

  // 解析维度配置
  getDimensions() {
    try {
      return JSON.parse(this.dimensions);
    } catch (error) {
      return [];
    }
  }

  // 解析评分标准
  getScoringGuidelines() {
    try {
      return JSON.parse(this.scoring_guidelines);
    } catch (error) {
      return {};
    }
  }

  // 转换为JSON格式
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      position_level: this.position_level,
      department: this.department,
      template_type: this.template_type,
      dimensions: this.getDimensions(),
      weights: {
        technical: this.technical_weight,
        communication: this.communication_weight,
        problem_solving: this.problem_solving_weight,
        cultural_fit: this.cultural_fit_weight,
        leadership: this.leadership_weight,
        creativity: this.creativity_weight
      },
      scoring_guidelines: this.getScoringGuidelines(),
      status: this.status,
      is_default: this.is_default,
      usage_count: this.usage_count,
      created_by: this.created_by,
      created_by_name: this.created_by_name,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

module.exports = FeedbackTemplate;