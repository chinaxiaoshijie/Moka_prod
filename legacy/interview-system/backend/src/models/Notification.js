const { query } = require('../config/database');
const { dateUtils } = require('../utils/helpers');

class Notification {
  constructor(data = {}) {
    this.id = data.id;
    this.user_id = data.user_id;
    this.type = data.type; // interview_invitation, interview_reminder, feedback_request, offer, system
    this.title = data.title;
    this.content = data.content;
    this.link = data.link;
    this.is_read = data.is_read || 0;
    this.read_at = data.read_at;
    this.created_at = data.created_at;
    this.related_id = data.related_id; // ID of related entity (interview_id, candidate_id, etc.)
    this.related_type = data.related_type; // Type of related entity
  }

  // 创建通知
  async create() {
    try {
      const sql = `
        INSERT INTO notifications (user_id, type, title, content, link, related_id, related_type, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
      `;

      const result = await query(sql, [
        this.user_id,
        this.type,
        this.title,
        this.content,
        this.link || null,
        this.related_id || null,
        this.related_type || null
      ]);

      this.id = result.insertId;
      return this;

    } catch (error) {
      console.error('创建通知错误:', error);
      throw error;
    }
  }

  // 根据ID查找通知
  static async findById(id) {
    try {
      const sql = `
        SELECT id, user_id, type, title, content, link, is_read, read_at,
               related_id, related_type, created_at
        FROM notifications WHERE id = ?
      `;

      const results = await query(sql, [id]);
      return results.length > 0 ? new Notification(results[0]) : null;

    } catch (error) {
      console.error('查找通知错误:', error);
      throw error;
    }
  }

  // 获取用户的通知列表
  static async findByUserId(userId, options = {}) {
    try {
      const {
        page = 1,
        pageSize = 20,
        unreadOnly = false,
        type
      } = options;

      const offset = (page - 1) * pageSize;
      const conditions = ['user_id = ?'];
      const values = [userId];

      if (unreadOnly) {
        conditions.push('is_read = 0');
      }

      if (type) {
        conditions.push('type = ?');
        values.push(type);
      }

      const whereClause = conditions.join(' AND ');

      // 查询总数
      const countSql = `SELECT COUNT(*) as total FROM notifications WHERE ${whereClause}`;
      const countResult = await query(countSql, values);
      const total = countResult[0].total;

      // 查询数据
      const dataValues = [...values, pageSize, offset];
      const dataSql = `
        SELECT id, user_id, type, title, content, link, is_read, read_at,
               related_id, related_type, created_at
        FROM notifications
        WHERE ${whereClause}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `;

      const results = await query(dataSql, dataValues);

      return {
        notifications: results.map(n => new Notification(n)),
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
      console.error('查询用户通知错误:', error);
      throw error;
    }
  }

  // 标记为已读
  async markAsRead() {
    try {
      const sql = `
        UPDATE notifications
        SET is_read = 1, read_at = NOW()
        WHERE id = ?
      `;
      await query(sql, [this.id]);

      this.is_read = 1;
      this.read_at = new Date();
      return this;

    } catch (error) {
      console.error('标记通知为已读错误:', error);
      throw error;
    }
  }

  // 批量标记为已读
  static async markMultipleAsRead(userId, notificationIds) {
    try {
      if (!notificationIds || notificationIds.length === 0) {
        return 0;
      }

      const placeholders = notificationIds.map(() => '?').join(',');
      const sql = `
        UPDATE notifications
        SET is_read = 1, read_at = NOW()
        WHERE id IN (${placeholders}) AND user_id = ?
      `;

      const result = await query(sql, [...notificationIds, userId]);
      return result.affectedRows;

    } catch (error) {
      console.error('批量标记通知为已读错误:', error);
      throw error;
    }
  }

  // 标记所有通知为已读
  static async markAllAsRead(userId) {
    try {
      const sql = `
        UPDATE notifications
        SET is_read = 1, read_at = NOW()
        WHERE user_id = ? AND is_read = 0
      `;
      const result = await query(sql, [userId]);
      return result.affectedRows;

    } catch (error) {
      console.error('标记所有通知为已读错误:', error);
      throw error;
    }
  }

  // 删除通知
  async delete() {
    try {
      const sql = 'DELETE FROM notifications WHERE id = ?';
      await query(sql, [this.id]);
      return this;

    } catch (error) {
      console.error('删除通知错误:', error);
      throw error;
    }
  }

  // 获取未读通知数量
  static async getUnreadCount(userId) {
    try {
      const sql = `
        SELECT COUNT(*) as count
        FROM notifications
        WHERE user_id = ? AND is_read = 0
      `;
      const result = await query(sql, [userId]);
      return result[0].count;

    } catch (error) {
      console.error('获取未读通知数量错误:', error);
      throw error;
    }
  }

  // 创建通知的辅助方法
  static async createNotification(data) {
    try {
      const notification = new Notification(data);
      await notification.create();
      return notification;
    } catch (error) {
      console.error('创建通知错误:', error);
      throw error;
    }
  }

  // 批量创建通知（例如发送给多个面试官）
  static async createBulkNotifications(notifications) {
    try {
      if (!notifications || notifications.length === 0) {
        return [];
      }

      const results = [];
      for (const data of notifications) {
        const notification = await Notification.createNotification(data);
        results.push(notification);
      }
      return results;

    } catch (error) {
      console.error('批量创建通知错误:', error);
      throw error;
    }
  }

  // 清理旧通知（超过30天的已读通知）
  static async cleanupOldNotifications() {
    try {
      const sql = `
        DELETE FROM notifications
        WHERE is_read = 1 AND read_at < DATE_SUB(NOW(), INTERVAL 30 DAY)
      `;
      const result = await query(sql);
      return result.affectedRows;

    } catch (error) {
      console.error('清理旧通知错误:', error);
      throw error;
    }
  }

  toJSON() {
    return {
      id: this.id,
      user_id: this.user_id,
      type: this.type,
      title: this.title,
      content: this.content,
      link: this.link,
      is_read: !!this.is_read,
      read_at: this.read_at,
      created_at: this.created_at,
      related_id: this.related_id,
      related_type: this.related_type
    };
  }
}

module.exports = Notification;
