const Interview = require('./Interview');
const { pool } = require('../config/database');

// Mock database module
jest.mock('../config/database');

describe('Interview Model', () => {
  let mockInterview;
  let mockConnection;
  let queryResponseQueue = [];

  beforeEach(() => {
    // 重置所有 mocks
    jest.clearAllMocks();
    queryResponseQueue = [];

    // 创建 mock 连接对象
    mockConnection = {
      query: jest.fn(),
      release: jest.fn()
    };

    // Mock pool.getConnection
    pool.getConnection = jest.fn().mockResolvedValue(mockConnection);

    // 设置智能 mock：从队列中取响应
    // mysql2返回格式：[rows, fields]
    mockConnection.query.mockImplementation((sql, params) => {
      if (queryResponseQueue.length > 0) {
        const response = queryResponseQueue.shift();
        // 检查是否是 rejected Promise（用于错误测试）
        if (response && typeof response.then === 'function' && typeof response.catch === 'function') {
          // 这是一个Promise，直接返回（用于模拟错误）
          return response;
        }
        // response是rows数据，包装成[rows, fields]格式
        // 如果response是数组，说明是rows；如果不是，包装成数组
        const rows = Array.isArray(response) ? response : [response];
        return Promise.resolve([rows]);
      }
      // 默认返回空rows（用于 ensureCharset 或队列耗尽）
      return Promise.resolve([[]]);
    });

    // 创建测试面试数据
    mockInterview = {
      id: 1,
      candidate_id: 1,
      position_id: 1,
      interviewer_id: 2,
      interviewer_name: '面试官A',
      scheduled_time: '2024-03-01T10:00:00Z',
      duration: 60,
      location: '会议室A',
      meeting_link: 'https://meeting.example.com/123',
      interview_type: 'onsite',
      interview_round: 1,
      status: 'scheduled',
      notes: '初次面试',
      feedback: null,
      score: null,
      result: null,
      created_by: 1
    };
  });

  // Helper function - 添加一次 executeQuery 的响应到队列
  // executeQuery 会调用 connection.query 4次（ensureCharset 3次 + 实际查询 1次）
  const setupExecuteQuery = (data) => {
    // 添加3次空响应（ensureCharset调用）- 每个[]代表空rows
    queryResponseQueue.push([], [], []);
    // 添加实际数据响应 - data应该是rows数组
    queryResponseQueue.push(data);
  };

  // 简化版本：直接添加响应（不自动添加 ensureCharset 的空响应）
  const setupQuerySuccess = (data) => {
    queryResponseQueue.push(data);
  };

  describe('create()', () => {
    it('should create a new interview successfully', async () => {
      const interview = new Interview(mockInterview);

      // 1. Mock checkConflicts() - 使用 executeQuery
      setupExecuteQuery([]);

      // 2. Mock INSERT query - 使用 executeQuery
      setupExecuteQuery({ insertId: 1 });

      // 3. Mock findById query - 使用 executeQuery
      setupExecuteQuery({
        id: 1,
        candidate_name: '张三',
        position_title: '高级工程师',
        created_by_name: 'admin',
        ...mockInterview
      });

      await interview.create();

      expect(interview.id).toBe(1);
    });

    it('should throw error if time conflict exists', async () => {
      const interview = new Interview(mockInterview);

      // checkConflicts 返回冲突
      setupExecuteQuery([
        { id: 2, scheduled_time: '2024-03-01T10:30:00Z' }
      ]);

      await expect(interview.create()).rejects.toThrow('面试时间冲突');
    });

    it('should handle database errors', async () => {
      const interview = new Interview(mockInterview);

      // 清空队列，添加rejection到正确的位置
      queryResponseQueue = [];
      queryResponseQueue.push([], [], []); // charset calls
      queryResponseQueue.push(Promise.reject(new Error('Database error')));

      await expect(interview.create()).rejects.toThrow('Database error');
    });
  });

  describe('update()', () => {
    it('should update interview successfully', async () => {
      const interview = new Interview({ ...mockInterview, id: 1 });

      const result = await interview.update({
        status: 'completed',
        feedback: '表现良好',
        score: 85
      });

      expect(interview.status).toBe('completed');
      expect(interview.feedback).toBe('表现良好');
      expect(interview.score).toBe(85);
    });

    it('should check conflicts when updating scheduled_time', async () => {
      const interview = new Interview({ ...mockInterview, id: 1 });

      // Mock conflict check for new time
      setupExecuteQuery([]);

      // Mock UPDATE query - executeQuery needs charset calls
      setupExecuteQuery({});

      await interview.update({
        scheduled_time: '2024-03-01T14:00:00Z'
      });

      expect(mockConnection.query).toHaveBeenCalled();
    });

    it('should throw error if update time has conflicts', async () => {
      const interview = new Interview({ ...mockInterview, id: 1, scheduled_time: '2024-03-01T10:00:00Z' });

      // 清空队列
      queryResponseQueue = [];

      // Mock conflict check returns conflicts
      // New time is 14:00, so a conflict would be an interview at 13:30-14:30 (overlaps)
      setupExecuteQuery([
        { id: 2, scheduled_time: '2024-03-01T13:30:00Z', duration: 60 }
      ]);

      // Mock UPDATE query (shouldn't be reached if conflict check works)
      setupExecuteQuery({});

      // The test should throw error before reaching UPDATE query
      await expect(interview.update({
        scheduled_time: '2024-03-01T14:00:00Z'
      })).rejects.toThrow('面试时间冲突');
    });

    it('should throw error if no valid fields to update', async () => {
      const interview = new Interview({ ...mockInterview, id: 1 });

      await expect(interview.update({})).rejects.toThrow('没有需要更新的字段');
    });

    it('should ignore non-allowed fields', async () => {
      const interview = new Interview({ ...mockInterview, id: 1 });

      // Mock UPDATE query - executeQuery needs charset calls
      setupExecuteQuery({});

      await interview.update({
        status: 'completed',
        invalid_field: 'should be ignored',
        id: 999
      });

      expect(interview.status).toBe('completed');
      expect(interview.invalid_field).toBeUndefined();
    });
  });

  describe('delete()', () => {
    it('should delete interview successfully', async () => {
      const interview = new Interview({ ...mockInterview, id: 1 });

      setupExecuteQuery({});

      const result = await interview.delete();

      expect(result).toBe(true);
    });

    it('should handle database errors', async () => {
      const interview = new Interview({ ...mockInterview, id: 1 });

      // 清空队列，添加rejection到正确的位置
      queryResponseQueue = [];
      queryResponseQueue.push([], [], []); // charset calls
      queryResponseQueue.push(Promise.reject(new Error('Delete failed')));

      await expect(interview.delete()).rejects.toThrow('Delete failed');
    });
  });

  describe('checkConflicts()', () => {
    it('should return empty array when no conflicts', async () => {
      const interview = new Interview(mockInterview);

      setupExecuteQuery([]);

      const conflicts = await interview.checkConflicts();

      expect(conflicts).toEqual([]);
    });

    it('should return conflicts when time overlaps', async () => {
      const interview = new Interview(mockInterview);

      setupExecuteQuery([
        {
          id: 2,
          candidate_name: '李四',
          scheduled_time: '2024-03-01T10:30:00Z',
          duration: 60
        }
      ]);

      const conflicts = await interview.checkConflicts();

      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].id).toBe(2);
    });

    it('should exclude specified interview ID from conflicts', async () => {
      const interview = new Interview(mockInterview);

      setupExecuteQuery([
        { id: 3, scheduled_time: '2024-03-01T10:30:00Z' }
      ]);

      const conflicts = await interview.checkConflicts(1);

      expect(conflicts).toHaveLength(1);
      // Verify the excluded ID was in the query
      const queryCall = mockConnection.query.mock.calls[mockConnection.query.mock.calls.length - 1];
      expect(queryCall[0]).toContain('AND i.id != ?');
    });
  });

  describe('findById()', () => {
    it('should find interview by ID', async () => {
      setupExecuteQuery([
        {
          id: 1,
          candidate_name: '张三',
          candidate_email: 'zhangsan@example.com',
          candidate_phone: '13800138000',
          position_title: '高级工程师',
          created_by_name: 'admin',
          interviewer_id: 2,
          candidate_id: 1,
          position_id: 1,
          interviewer_name: '面试官A',
          scheduled_time: '2024-03-01T10:00:00Z',
          duration: 60,
          status: 'scheduled'
        }
      ]);

      const interview = await Interview.findById(1);

      expect(interview).toBeInstanceOf(Interview);
      expect(interview.id).toBe(1);
      expect(interview.candidate_name).toBe('张三');
      expect(interview.position_title).toBe('高级工程师');
    });

    it('should return null if interview not found', async () => {
      setupExecuteQuery([]);

      const interview = await Interview.findById(999);

      expect(interview).toBeNull();
    });
  });

  describe('findAll()', () => {
    it('should return paginated interview list', async () => {
      // Mock count query
      setupExecuteQuery([{ total: 2 }]);

      // Mock data query
      setupExecuteQuery([
        { id: 1, candidate_name: '候选人1', position_title: '职位1' },
        { id: 2, candidate_name: '候选人2', position_title: '职位2' }
      ]);

      const result = await Interview.findAll({ page: 1, pageSize: 10 });

      expect(result.interviews).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.totalPages).toBe(1);
    });

    it('should filter by status when specified', async () => {
      setupExecuteQuery([{ total: 1 }]);
      setupExecuteQuery([{ id: 1, status: 'completed' }]);

      const result = await Interview.findAll({ status: 'completed', page: 1, pageSize: 10 });

      expect(result.interviews).toHaveLength(1);
    });

    it('should filter by interviewer_id when specified', async () => {
      setupExecuteQuery([{ total: 1 }]);
      setupExecuteQuery([{ id: 1, interviewer_id: 2 }]);

      const result = await Interview.findAll({ interviewer_id: 2, page: 1, pageSize: 10 });

      expect(result.interviews).toHaveLength(1);
    });

    it('should filter by candidate_id when specified', async () => {
      setupExecuteQuery([{ total: 1 }]);
      setupExecuteQuery([{ id: 1, candidate_id: 1 }]);

      const result = await Interview.findAll({ candidate_id: 1, page: 1, pageSize: 10 });

      expect(result.interviews).toHaveLength(1);
    });

    it('should filter by position_id when specified', async () => {
      setupExecuteQuery([{ total: 1 }]);
      setupExecuteQuery([{ id: 1, position_id: 1 }]);

      const result = await Interview.findAll({ position_id: 1, page: 1, pageSize: 10 });

      expect(result.interviews).toHaveLength(1);
    });

    it('should filter by interview_type when specified', async () => {
      setupExecuteQuery([{ total: 1 }]);
      setupExecuteQuery([{ id: 1, interview_type: 'video' }]);

      const result = await Interview.findAll({ interview_type: 'video', page: 1, pageSize: 10 });

      expect(result.interviews).toHaveLength(1);
    });

    it('should filter by date range when specified', async () => {
      setupExecuteQuery([{ total: 1 }]);
      setupExecuteQuery([{ id: 1 }]);

      const result = await Interview.findAll({
        date_from: '2024-03-01',
        date_to: '2024-03-31',
        page: 1,
        pageSize: 10
      });

      expect(result.interviews).toHaveLength(1);
    });

    it('should search across multiple fields', async () => {
      setupExecuteQuery([{ total: 1 }]);
      setupExecuteQuery([{ id: 1, candidate_name: '搜索结果' }]);

      const result = await Interview.findAll({ search: '张三', page: 1, pageSize: 10 });

      expect(result.interviews).toHaveLength(1);
    });

    it('should filter by created_by when specified', async () => {
      setupExecuteQuery([{ total: 1 }]);
      setupExecuteQuery([{ id: 1 }]);

      const result = await Interview.findAll({ created_by: 1, page: 1, pageSize: 10 });

      expect(result.interviews).toHaveLength(1);
    });

    it('should calculate pagination correctly', async () => {
      setupExecuteQuery([{ total: 25 }]);
      setupExecuteQuery([]);

      const result = await Interview.findAll({ page: 2, pageSize: 10 });

      expect(result.pagination.totalPages).toBe(3);
      expect(result.pagination.current).toBe(2);
    });
  });

  describe('getStatistics()', () => {
    it('should return overall statistics', async () => {
      const mockStats = {
        total_interviews: 100,
        scheduled_interviews: 20,
        in_progress_interviews: 5,
        completed_interviews: 60,
        cancelled_interviews: 10,
        no_show_interviews: 5,
        today_interviews: 3,
        this_week_interviews: 15,
        passed_interviews: 40,
        average_score: 78.5
      };

      setupExecuteQuery([mockStats]);

      const stats = await Interview.getStatistics();

      expect(stats.total_interviews).toBe(100);
      expect(stats.completed_interviews).toBe(60);
      expect(stats.average_score).toBe(78.5);
    });

    it('should return statistics for specific user', async () => {
      setupExecuteQuery([{ total_interviews: 10 }]);

      const stats = await Interview.getStatistics(1);

      expect(stats.total_interviews).toBe(10);
    });
  });

  describe('getInterviewerAvailability()', () => {
    it('should return interviewer availability for date', async () => {
      const mockAvailability = [
        { scheduled_time: '2024-03-01T10:00:00Z', duration: 60 },
        { scheduled_time: '2024-03-01T14:00:00Z', duration: 90 }
      ];

      // 清空队列并使用setupExecuteQuery
      queryResponseQueue = [];
      setupExecuteQuery(mockAvailability);

      const availability = await Interview.getInterviewerAvailability(2, '2024-03-01');

      expect(availability).toHaveLength(2);
      expect(availability[0].scheduled_time).toBe('2024-03-01T10:00:00Z');
    });

    it('should return empty array when no interviews scheduled', async () => {
      // 清空队列
      queryResponseQueue = [];
      setupExecuteQuery([]);

      const availability = await Interview.getInterviewerAvailability(2, '2024-03-01');

      expect(availability).toEqual([]);
    });
  });

  describe('getCalendarData()', () => {
    it('should return calendar data with all fields', async () => {
      const mockCalendarData = [
        {
          id: 1,
          scheduled_time: '2024-03-01T10:00:00Z',
          duration: 60,
          status: 'scheduled',
          interview_type: 'onsite',
          interview_round: 1,
          candidate_name: '张三',
          position_title: '高级工程师',
          interviewer_name: '面试官A'
        }
      ];

      // 清空队列并使用setupExecuteQuery
      queryResponseQueue = [];
      setupExecuteQuery(mockCalendarData);

      const calendarData = await Interview.getCalendarData({
        interviewer_id: 2,
        start_date: '2024-03-01',
        end_date: '2024-03-31'
      });

      expect(calendarData).toHaveLength(1);
      expect(calendarData[0].title).toBe('张三 - 高级工程师');
      expect(calendarData[0].start).toBe('2024-03-01T10:00:00Z');
      expect(calendarData[0].end).toBeInstanceOf(Date);
      expect(calendarData[0].status).toBe('scheduled');
    });

    it('should filter by interviewer_id when specified', async () => {
      setupExecuteQuery([{ id: 1, candidate_name: 'Test', position_title: 'Position', interviewer_name: 'Interviewer', scheduled_time: '2024-03-01T10:00:00Z', duration: 60, status: 'scheduled', interview_type: 'video', interview_round: 1 }]);

      const result = await Interview.getCalendarData({ interviewer_id: 2 });

      expect(result).toHaveLength(1);
    });

    it('should filter by date range when specified', async () => {
      setupExecuteQuery([{ id: 1, candidate_name: 'Test', position_title: 'Position', interviewer_name: 'Interviewer', scheduled_time: '2024-03-01T10:00:00Z', duration: 60, status: 'scheduled', interview_type: 'video', interview_round: 1 }]);

      const result = await Interview.getCalendarData({
        start_date: '2024-03-01',
        end_date: '2024-03-31'
      });

      expect(result).toHaveLength(1);
    });

    it('should filter by created_by when specified', async () => {
      setupExecuteQuery([{ id: 1, candidate_name: 'Test', position_title: 'Position', interviewer_name: 'Interviewer', scheduled_time: '2024-03-01T10:00:00Z', duration: 60, status: 'scheduled', interview_type: 'video', interview_round: 1 }]);

      const result = await Interview.getCalendarData({ created_by: 1 });

      expect(result).toHaveLength(1);
    });

    it('should calculate end time based on duration', async () => {
      const startTime = '2024-03-01T10:00:00Z';
      const duration = 90;

      setupExecuteQuery([{
        id: 1,
        scheduled_time: startTime,
        duration: duration,
        status: 'scheduled',
        interview_type: 'video',
        interview_round: 1,
        candidate_name: 'Test',
        position_title: 'Position',
        interviewer_name: 'Interviewer'
      }]);

      const result = await Interview.getCalendarData();

      const expectedEndTime = new Date(new Date(startTime).getTime() + duration * 60000);
      expect(result[0].end.getTime()).toBeCloseTo(expectedEndTime.getTime(), -2);
    });
  });

  describe('toJSON()', () => {
    it('should return interview data as plain object', () => {
      const interview = new Interview({
        ...mockInterview,
        id: 1,
        candidate_name: '张三',
        position_title: '高级工程师',
        created_by_name: 'admin'
      });

      const json = interview.toJSON();

      expect(json).not.toBeInstanceOf(Interview);
      expect(json.id).toBe(1);
      expect(json.candidate_name).toBe('张三');
      expect(json.position_title).toBe('高级工程师');
    });

    it('should include all relevant fields', () => {
      const interview = new Interview({
        ...mockInterview,
        id: 1,
        candidate_name: '张三',
        candidate_email: 'test@example.com',
        candidate_phone: '13800138000',
        candidate_status: 'new',
        position_title: '高级工程师',
        created_by_name: 'admin'
      });

      const json = interview.toJSON();

      expect(json).toHaveProperty('id');
      expect(json).toHaveProperty('candidate_id');
      expect(json).toHaveProperty('candidate_name');
      expect(json).toHaveProperty('candidate_email');
      expect(json).toHaveProperty('candidate_phone');
      expect(json).toHaveProperty('candidate_status');
      expect(json).toHaveProperty('position_id');
      expect(json).toHaveProperty('position_title');
      expect(json).toHaveProperty('interviewer_id');
      expect(json).toHaveProperty('interviewer_name');
      expect(json).toHaveProperty('scheduled_time');
      expect(json).toHaveProperty('duration');
      expect(json).toHaveProperty('location');
      expect(json).toHaveProperty('meeting_link');
      expect(json).toHaveProperty('interview_type');
      expect(json).toHaveProperty('interview_round');
      expect(json).toHaveProperty('status');
      expect(json).toHaveProperty('notes');
      expect(json).toHaveProperty('feedback');
      expect(json).toHaveProperty('score');
      expect(json).toHaveProperty('result');
      expect(json).toHaveProperty('created_by');
      expect(json).toHaveProperty('created_by_name');
      expect(json).toHaveProperty('created_at');
      expect(json).toHaveProperty('updated_at');
    });
  });

  describe('constructor', () => {
    it('should create interview with all fields', () => {
      const interview = new Interview(mockInterview);

      expect(interview.id).toBe(1);
      expect(interview.candidate_id).toBe(1);
      expect(interview.position_id).toBe(1);
      expect(interview.interviewer_id).toBe(2);
      expect(interview.scheduled_time).toBe('2024-03-01T10:00:00Z');
      expect(interview.status).toBe('scheduled');
    });

    it('should use default status when not provided', () => {
      const interview = new Interview({
        candidate_id: 1,
        position_id: 1,
        interviewer_id: 2,
        interviewer_name: '面试官A',
        scheduled_time: '2024-03-01T10:00:00Z'
      });

      expect(interview.status).toBe('scheduled');
    });

    it('should use default duration when not provided', () => {
      const interview = new Interview({
        candidate_id: 1,
        position_id: 1,
        interviewer_id: 2,
        interviewer_name: '面试官A',
        scheduled_time: '2024-03-01T10:00:00Z'
      });

      expect(interview.duration).toBe(60);
    });

    it('should use default round when not provided', () => {
      const interview = new Interview({
        candidate_id: 1,
        position_id: 1,
        interviewer_id: 2,
        interviewer_name: '面试官A',
        scheduled_time: '2024-03-01T10:00:00Z'
      });

      expect(interview.interview_round).toBe(1);
    });

    it('should set id to null when not provided', () => {
      const interview = new Interview({
        candidate_id: 1,
        position_id: 1,
        interviewer_id: 2,
        interviewer_name: '面试官A',
        scheduled_time: '2024-03-01T10:00:00Z'
      });

      expect(interview.id).toBeNull();
    });
  });
});
