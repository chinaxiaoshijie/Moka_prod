const Notification = require('./Notification');
const { query } = require('../config/database');

// Mock database module
jest.mock('../config/database');

describe('Notification Model', () => {
  let mockNotification;

  beforeEach(() => {
    // 重置所有 mocks
    jest.clearAllMocks();

    // 创建测试通知数据
    mockNotification = {
      id: 1,
      user_id: 1,
      type: 'interview_invitation',
      title: '面试邀请',
      content: '您有一场新的面试安排',
      link: '/interviews/123',
      is_read: 0,
      read_at: null,
      related_id: 123,
      related_type: 'interview'
    };
  });

  describe('create()', () => {
    it('should create a new notification successfully', async () => {
      const notification = new Notification(mockNotification);

      query.mockResolvedValueOnce({
        insertId: 1
      });

      await notification.create();

      expect(notification.id).toBe(1);
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO notifications'),
        expect.arrayContaining([
          mockNotification.user_id,
          mockNotification.type,
          mockNotification.title,
          mockNotification.content,
          mockNotification.link,
          mockNotification.related_id,
          mockNotification.related_type
        ])
      );
    });

    it('should handle null link and related fields', async () => {
      const notification = new Notification({
        user_id: 1,
        type: 'system',
        title: '系统通知',
        content: '这是一条系统通知'
      });

      query.mockResolvedValueOnce({
        insertId: 1
      });

      await notification.create();

      expect(query).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([1, 'system', '系统通知', '这是一条系统通知', null, null, null])
      );
    });

    it('should handle database errors', async () => {
      const notification = new Notification(mockNotification);

      query.mockRejectedValueOnce(new Error('Database error'));

      await expect(notification.create()).rejects.toThrow('Database error');
    });
  });

  describe('findById()', () => {
    it('should find notification by ID', async () => {
      query.mockResolvedValueOnce([
        {
          id: 1,
          user_id: 1,
          type: 'interview_invitation',
          title: '面试邀请',
          content: '您有一场新的面试安排'
        }
      ]);

      const notification = await Notification.findById(1);

      expect(notification).toBeInstanceOf(Notification);
      expect(notification.id).toBe(1);
      expect(notification.type).toBe('interview_invitation');
    });

    it('should return null if notification not found', async () => {
      query.mockResolvedValueOnce([]);

      const notification = await Notification.findById(999);

      expect(notification).toBeNull();
    });
  });

  describe('findByUserId()', () => {
    it('should return paginated notifications for user', async () => {
      const mockNotifications = [
        { id: 1, title: '通知1' },
        { id: 2, title: '通知2' }
      ];

      query.mockResolvedValueOnce([{ total: 2 }]);
      query.mockResolvedValueOnce(mockNotifications);

      const result = await Notification.findByUserId(1, { page: 1, pageSize: 10 });

      expect(result.notifications).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.totalPages).toBe(1);
    });

    it('should filter unread only when specified', async () => {
      query.mockResolvedValueOnce([{ total: 1 }]);
      query.mockResolvedValueOnce([{ id: 1, is_read: 0 }]);

      const result = await Notification.findByUserId(1, { unreadOnly: true, page: 1, pageSize: 10 });

      expect(result.notifications).toHaveLength(1);
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('is_read = 0'),
        expect.arrayContaining([1])
      );
    });

    it('should filter by type when specified', async () => {
      query.mockResolvedValueOnce([{ total: 1 }]);
      query.mockResolvedValueOnce([{ id: 1, type: 'interview_reminder' }]);

      const result = await Notification.findByUserId(1, { type: 'interview_reminder', page: 1, pageSize: 10 });

      expect(result.notifications).toHaveLength(1);
    });

    it('should filter by both unreadOnly and type', async () => {
      query.mockResolvedValueOnce([{ total: 1 }]);
      query.mockResolvedValueOnce([{ id: 1 }]);

      const result = await Notification.findByUserId(1, {
        unreadOnly: true,
        type: 'interview_invitation',
        page: 1,
        pageSize: 10
      });

      expect(result.notifications).toHaveLength(1);
    });

    it('should use default pagination options', async () => {
      query.mockResolvedValueOnce([{ total: 0 }]);
      query.mockResolvedValueOnce([]);

      await Notification.findByUserId(1);

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT ? OFFSET ?'),
        expect.arrayContaining([1, 20, 0])
      );
    });

    it('should calculate pagination correctly', async () => {
      query.mockResolvedValueOnce([{ total: 25 }]);
      query.mockResolvedValueOnce([]);

      const result = await Notification.findByUserId(1, { page: 2, pageSize: 10 });

      expect(result.pagination.totalPages).toBe(3);
      expect(result.pagination.hasNext).toBe(true);
      expect(result.pagination.hasPrev).toBe(true);
    });

    it('should handle last page', async () => {
      query.mockResolvedValueOnce([{ total: 25 }]);
      query.mockResolvedValueOnce([]);

      const result = await Notification.findByUserId(1, { page: 3, pageSize: 10 });

      expect(result.pagination.hasNext).toBe(false);
      expect(result.pagination.hasPrev).toBe(true);
    });

    it('should handle first page', async () => {
      query.mockResolvedValueOnce([{ total: 25 }]);
      query.mockResolvedValueOnce([]);

      const result = await Notification.findByUserId(1, { page: 1, pageSize: 10 });

      expect(result.pagination.hasNext).toBe(true);
      expect(result.pagination.hasPrev).toBe(false);
    });
  });

  describe('markAsRead()', () => {
    it('should mark notification as read', async () => {
      const notification = new Notification(mockNotification);
      notification.id = 1;

      query.mockResolvedValueOnce({});

      const result = await notification.markAsRead();

      expect(result.is_read).toBe(1);
      expect(result.read_at).toBeInstanceOf(Date);
    });

    it('should update database', async () => {
      const notification = new Notification(mockNotification);
      notification.id = 1;

      query.mockResolvedValueOnce({});

      await notification.markAsRead();

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE notifications'),
        expect.arrayContaining([1])
      );
    });

    it('should handle database errors', async () => {
      const notification = new Notification(mockNotification);
      notification.id = 1;

      query.mockRejectedValueOnce(new Error('Update failed'));

      await expect(notification.markAsRead()).rejects.toThrow('Update failed');
    });
  });

  describe('markMultipleAsRead()', () => {
    it('should mark multiple notifications as read', async () => {
      query.mockResolvedValueOnce({ affectedRows: 3 });

      const count = await Notification.markMultipleAsRead(1, [1, 2, 3]);

      expect(count).toBe(3);
    });

    it('should return 0 for empty notificationIds array', async () => {
      const count = await Notification.markMultipleAsRead(1, []);

      expect(count).toBe(0);
      expect(query).not.toHaveBeenCalled();
    });

    it('should return 0 for null notificationIds', async () => {
      const count = await Notification.markMultipleAsRead(1, null);

      expect(count).toBe(0);
      expect(query).not.toHaveBeenCalled();
    });

    it('should only mark notifications belonging to user', async () => {
      query.mockResolvedValueOnce({ affectedRows: 2 });

      await Notification.markMultipleAsRead(1, [1, 2, 3]);

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('AND user_id = ?'),
        expect.arrayContaining([1, 2, 3, 1])
      );
    });

    it('should generate correct placeholders', async () => {
      query.mockResolvedValueOnce({ affectedRows: 3 });

      await Notification.markMultipleAsRead(1, [1, 2, 3]);

      const sql = query.mock.calls[0][0];
      expect(sql).toContain('id IN (?,?,?)');
    });
  });

  describe('markAllAsRead()', () => {
    it('should mark all unread notifications as read', async () => {
      query.mockResolvedValueOnce({ affectedRows: 10 });

      const count = await Notification.markAllAsRead(1);

      expect(count).toBe(10);
    });

    it('should only mark unread notifications', async () => {
      query.mockResolvedValueOnce({ affectedRows: 5 });

      await Notification.markAllAsRead(1);

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('is_read = 0'),
        [1]
      );
    });

    it('should return 0 if no unread notifications', async () => {
      query.mockResolvedValueOnce({ affectedRows: 0 });

      const count = await Notification.markAllAsRead(1);

      expect(count).toBe(0);
    });
  });

  describe('delete()', () => {
    it('should delete notification successfully', async () => {
      const notification = new Notification(mockNotification);
      notification.id = 1;

      query.mockResolvedValueOnce({});

      const result = await notification.delete();

      expect(result).toBe(notification);
    });

    it('should call database with correct ID', async () => {
      const notification = new Notification(mockNotification);
      notification.id = 1;

      query.mockResolvedValueOnce({});

      await notification.delete();

      expect(query).toHaveBeenCalledWith(
        'DELETE FROM notifications WHERE id = ?',
        [1]
      );
    });

    it('should handle database errors', async () => {
      const notification = new Notification(mockNotification);
      notification.id = 1;

      query.mockRejectedValueOnce(new Error('Delete failed'));

      await expect(notification.delete()).rejects.toThrow('Delete failed');
    });
  });

  describe('getUnreadCount()', () => {
    it('should return unread notification count', async () => {
      query.mockResolvedValueOnce([{ count: 5 }]);

      const count = await Notification.getUnreadCount(1);

      expect(count).toBe(5);
    });

    it('should return 0 if no unread notifications', async () => {
      query.mockResolvedValueOnce([{ count: 0 }]);

      const count = await Notification.getUnreadCount(1);

      expect(count).toBe(0);
    });

    it('should query for specific user', async () => {
      query.mockResolvedValueOnce([{ count: 3 }]);

      await Notification.getUnreadCount(1);

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE user_id = ? AND is_read = 0'),
        [1]
      );
    });
  });

  describe('createNotification()', () => {
    it('should create notification using static method', async () => {
      query.mockResolvedValueOnce({ insertId: 1 });

      const notification = await Notification.createNotification({
        user_id: 1,
        type: 'system',
        title: '测试通知',
        content: '这是一条测试通知'
      });

      expect(notification).toBeInstanceOf(Notification);
      expect(notification.id).toBe(1);
    });
  });

  describe('createBulkNotifications()', () => {
    it('should create multiple notifications', async () => {
      query.mockResolvedValueOnce({ insertId: 1 });
      query.mockResolvedValueOnce({ insertId: 2 });
      query.mockResolvedValueOnce({ insertId: 3 });

      const notifications = await Notification.createBulkNotifications([
        { user_id: 1, type: 'system', title: '通知1', content: '内容1' },
        { user_id: 1, type: 'system', title: '通知2', content: '内容2' },
        { user_id: 1, type: 'system', title: '通知3', content: '内容3' }
      ]);

      expect(notifications).toHaveLength(3);
      expect(notifications[0]).toBeInstanceOf(Notification);
    });

    it('should return empty array for empty input', async () => {
      const notifications = await Notification.createBulkNotifications([]);

      expect(notifications).toEqual([]);
      expect(query).not.toHaveBeenCalled();
    });

    it('should return empty array for null input', async () => {
      const notifications = await Notification.createBulkNotifications(null);

      expect(notifications).toEqual([]);
      expect(query).not.toHaveBeenCalled();
    });

    it('should handle individual notification errors', async () => {
      query.mockResolvedValueOnce({ insertId: 1 });
      query.mockRejectedValueOnce(new Error('Create failed'));

      await expect(Notification.createBulkNotifications([
        { user_id: 1, type: 'system', title: '通知1', content: '内容1' },
        { user_id: 1, type: 'system', title: '通知2', content: '内容2' }
      ])).rejects.toThrow('Create failed');
    });
  });

  describe('cleanupOldNotifications()', () => {
    it('should delete old read notifications', async () => {
      query.mockResolvedValueOnce({ affectedRows: 50 });

      const count = await Notification.cleanupOldNotifications();

      expect(count).toBe(50);
    });

    it('should only delete read notifications older than 30 days', async () => {
      query.mockResolvedValueOnce({ affectedRows: 10 });

      await Notification.cleanupOldNotifications();

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE is_read = 1 AND read_at < DATE_SUB(NOW(), INTERVAL 30 DAY)')
      );
    });

    it('should return 0 if no old notifications', async () => {
      query.mockResolvedValueOnce({ affectedRows: 0 });

      const count = await Notification.cleanupOldNotifications();

      expect(count).toBe(0);
    });
  });

  describe('toJSON()', () => {
    it('should return notification as plain object', () => {
      const notification = new Notification(mockNotification);

      const json = notification.toJSON();

      expect(json).not.toBeInstanceOf(Notification);
      expect(json.id).toBe(1);
      expect(json.type).toBe('interview_invitation');
    });

    it('should convert is_read to boolean', () => {
      const notification = new Notification({
        ...mockNotification,
        is_read: 1
      });

      const json = notification.toJSON();

      expect(typeof json.is_read).toBe('boolean');
      expect(json.is_read).toBe(true);
    });

    it('should convert is_read 0 to false', () => {
      const notification = new Notification({
        ...mockNotification,
        is_read: 0
      });

      const json = notification.toJSON();

      expect(json.is_read).toBe(false);
    });

    it('should include all fields', () => {
      const notification = new Notification({
        id: 1,
        user_id: 1,
        type: 'interview_invitation',
        title: '面试邀请',
        content: '您有一场新的面试安排',
        link: '/interviews/123',
        is_read: 0,
        read_at: null,
        created_at: new Date(),
        related_id: 123,
        related_type: 'interview'
      });

      const json = notification.toJSON();

      expect(json).toHaveProperty('id');
      expect(json).toHaveProperty('user_id');
      expect(json).toHaveProperty('type');
      expect(json).toHaveProperty('title');
      expect(json).toHaveProperty('content');
      expect(json).toHaveProperty('link');
      expect(json).toHaveProperty('is_read');
      expect(json).toHaveProperty('read_at');
      expect(json).toHaveProperty('created_at');
      expect(json).toHaveProperty('related_id');
      expect(json).toHaveProperty('related_type');
    });
  });

  describe('constructor', () => {
    it('should create notification with all fields', () => {
      const notification = new Notification(mockNotification);

      expect(notification.id).toBe(1);
      expect(notification.user_id).toBe(1);
      expect(notification.type).toBe('interview_invitation');
      expect(notification.title).toBe('面试邀请');
    });

    it('should use default is_read when not provided', () => {
      const notification = new Notification({
        user_id: 1,
        type: 'system',
        title: '通知',
        content: '内容'
      });

      expect(notification.is_read).toBe(0);
    });

    it('should create empty notification with no data', () => {
      const notification = new Notification();

      expect(notification.id).toBeUndefined();
      expect(notification.user_id).toBeUndefined();
      expect(notification.type).toBeUndefined();
    });
  });
});
