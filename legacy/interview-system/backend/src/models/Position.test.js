// Mock database module before requiring Position
const mockConnection = {
  query: jest.fn(),
  release: jest.fn()
};

const mockPool = {
  getConnection: jest.fn().mockResolvedValue(mockConnection)
};

jest.mock('../config/database', () => ({
  pool: mockPool,
  query: jest.fn()
}));

const Position = require('./Position');

describe('Position Model', () => {
  let mockPosition;

  beforeEach(() => {
    jest.clearAllMocks();

    // 创建测试职位数据
    mockPosition = {
      id: 1,
      title: 'Software Engineer',
      department: '技术部',
      description: '负责后端开发',
      requirements: '3年以上经验',
      salary_min: 150000,
      salary_max: 250000,
      location: '北京',
      status: 'active',
      type: 'fulltime',
      level: 'senior',
      headcount: 3
    };
  });

  describe('findById()', () => {
    it('should find position by ID', async () => {
      const mockResult = [[{
        id: 1,
        title: 'Software Engineer',
        department: '技术部',
        status: 'active'
      }]];

      // Set up the query to return different results (3 charset calls + 1 actual query)
      // connection.query returns [rows, fields], executeQuery returns result[0]
      mockConnection.query
        .mockResolvedValueOnce([[]]) // SET NAMES - returns empty rows
        .mockResolvedValueOnce([[]]) // SET CHARACTER SET - returns empty rows
        .mockResolvedValueOnce([[]]) // SET character_set_connection - returns empty rows
        .mockResolvedValueOnce(mockResult); // Actual query - returns [rows]

      const position = await Position.findById(1);

      expect(position).toBeInstanceOf(Position);
      expect(position.id).toBe(1);
      expect(mockPool.getConnection).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
    });

    it('should return null if position not found', async () => {
      // Set up empty results (3 charset calls + 1 empty actual query)
      mockConnection.query
        .mockResolvedValueOnce([[]]) // SET NAMES
        .mockResolvedValueOnce([[]]) // SET CHARACTER SET
        .mockResolvedValueOnce([[]]) // SET character_set_connection
        .mockResolvedValueOnce([[]]); // Empty result - no rows

      const position = await Position.findById(999);

      expect(position).toBeNull();
      expect(mockPool.getConnection).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
    });
  });

  describe('findAll()', () => {
    it('should return paginated position list', async () => {
      const mockPositions = [
        { id: 1, title: 'Software Engineer', department: '技术部' },
        { id: 2, title: 'Product Manager', department: '产品部' }
      ];

      // Mock COUNT query (3 charset calls + 1 count query)
      mockConnection.query
        .mockResolvedValueOnce([[]]) // SET NAMES
        .mockResolvedValueOnce([[]]) // SET CHARACTER SET
        .mockResolvedValueOnce([[]]) // SET character_set_connection
        .mockResolvedValueOnce([[{ total: 2 }]]); // COUNT query - returns [[{total: 2}]]

      // Mock data query (3 charset calls + 1 actual query)
      mockConnection.query
        .mockResolvedValueOnce([[]]) // SET NAMES
        .mockResolvedValueOnce([[]]) // SET CHARACTER SET
        .mockResolvedValueOnce([[]]) // SET character_set_connection
        .mockResolvedValueOnce([mockPositions]); // Data query - returns [[row1, row2]]

      const result = await Position.findAll({ page: 1, pageSize: 10 });

      expect(result.positions).toBeDefined();
      expect(result.pagination).toBeDefined();
      expect(mockPool.getConnection).toHaveBeenCalled();
    });

    it('should filter by department', async () => {
      // Setup query chain to return results
      mockConnection.query
        .mockResolvedValueOnce([[]]) // SET NAMES
        .mockResolvedValueOnce([[]]) // SET CHARACTER SET
        .mockResolvedValueOnce([[]]) // SET character_set_connection
        .mockResolvedValueOnce([[{ total: 1 }]]) // COUNT
        .mockResolvedValueOnce([[]]) // SET NAMES
        .mockResolvedValueOnce([[]]) // SET CHARACTER SET
        .mockResolvedValueOnce([[]]) // SET character_set_connection
        .mockResolvedValueOnce([[{ id: 1, department: '技术部' }]]); // Data

      const result = await Position.findAll({
        department: '技术部',
        page: 1,
        pageSize: 10
      });

      expect(result.positions).toBeDefined();
      expect(mockPool.getConnection).toHaveBeenCalled();
    });

    it('should filter by status', async () => {
      mockConnection.query
        .mockResolvedValueOnce([[]]) // SET NAMES
        .mockResolvedValueOnce([[]]) // SET CHARACTER SET
        .mockResolvedValueOnce([[]]) // SET character_set_connection
        .mockResolvedValueOnce([[{ total: 1 }]]) // COUNT
        .mockResolvedValueOnce([[]]) // SET NAMES
        .mockResolvedValueOnce([[]]) // SET CHARACTER SET
        .mockResolvedValueOnce([[]]) // SET character_set_connection
        .mockResolvedValueOnce([[{ id: 1, status: 'active' }]]); // Data

      const result = await Position.findAll({ status: 'active', page: 1, pageSize: 10 });

      expect(result.positions).toBeDefined();
    });

    it('should filter by level', async () => {
      mockConnection.query
        .mockResolvedValueOnce([[]]) // SET NAMES
        .mockResolvedValueOnce([[]]) // SET CHARACTER SET
        .mockResolvedValueOnce([[]]) // SET character_set_connection
        .mockResolvedValueOnce([[{ total: 1 }]]) // COUNT
        .mockResolvedValueOnce([[]]) // SET NAMES
        .mockResolvedValueOnce([[]]) // SET CHARACTER SET
        .mockResolvedValueOnce([[]]) // SET character_set_connection
        .mockResolvedValueOnce([[{ id: 1, level: 'senior' }]]); // Data

      const result = await Position.findAll({ level: 'senior', page: 1, pageSize: 10 });

      expect(result.positions).toBeDefined();
    });

    it('should filter by type', async () => {
      mockConnection.query
        .mockResolvedValueOnce([[]]) // SET NAMES
        .mockResolvedValueOnce([[]]) // SET CHARACTER SET
        .mockResolvedValueOnce([[]]) // SET character_set_connection
        .mockResolvedValueOnce([[{ total: 1 }]]) // COUNT
        .mockResolvedValueOnce([[]]) // SET NAMES
        .mockResolvedValueOnce([[]]) // SET CHARACTER SET
        .mockResolvedValueOnce([[]]) // SET character_set_connection
        .mockResolvedValueOnce([[{ id: 1, type: 'fulltime' }]]); // Data

      const result = await Position.findAll({ type: 'fulltime', page: 1, pageSize: 10 });

      expect(result.positions).toBeDefined();
    });

    it('should filter by priority', async () => {
      mockConnection.query
        .mockResolvedValueOnce([[]]) // SET NAMES
        .mockResolvedValueOnce([[]]) // SET CHARACTER SET
        .mockResolvedValueOnce([[]]) // SET character_set_connection
        .mockResolvedValueOnce([[{ total: 1 }]]) // COUNT
        .mockResolvedValueOnce([[]]) // SET NAMES
        .mockResolvedValueOnce([[]]) // SET CHARACTER SET
        .mockResolvedValueOnce([[]]) // SET character_set_connection
        .mockResolvedValueOnce([[{ id: 1, priority: 'high' }]]); // Data

      const result = await Position.findAll({ priority: 'high', page: 1, pageSize: 10 });

      expect(result.positions).toBeDefined();
    });

    it('should filter by location', async () => {
      mockConnection.query
        .mockResolvedValueOnce([[]]) // SET NAMES
        .mockResolvedValueOnce([[]]) // SET CHARACTER SET
        .mockResolvedValueOnce([[]]) // SET character_set_connection
        .mockResolvedValueOnce([[{ total: 1 }]]) // COUNT
        .mockResolvedValueOnce([[]]) // SET NAMES
        .mockResolvedValueOnce([[]]) // SET CHARACTER SET
        .mockResolvedValueOnce([[]]) // SET character_set_connection
        .mockResolvedValueOnce([[{ id: 1, location: '北京' }]]); // Data

      const result = await Position.findAll({ location: '北京', page: 1, pageSize: 10 });

      expect(result.positions).toBeDefined();
    });

    it('should filter by active_only', async () => {
      mockConnection.query
        .mockResolvedValueOnce([[]]) // SET NAMES
        .mockResolvedValueOnce([[]]) // SET CHARACTER SET
        .mockResolvedValueOnce([[]]) // SET character_set_connection
        .mockResolvedValueOnce([[{ total: 1 }]]) // COUNT
        .mockResolvedValueOnce([[]]) // SET NAMES
        .mockResolvedValueOnce([[]]) // SET CHARACTER SET
        .mockResolvedValueOnce([[]]) // SET character_set_connection
        .mockResolvedValueOnce([[{ id: 1, status: 'active' }]]); // Data

      const result = await Position.findAll({ active_only: true, page: 1, pageSize: 10 });

      expect(result.positions).toBeDefined();
    });

    it('should filter by expired_only', async () => {
      mockConnection.query
        .mockResolvedValueOnce([[]]) // SET NAMES
        .mockResolvedValueOnce([[]]) // SET CHARACTER SET
        .mockResolvedValueOnce([[]]) // SET character_set_connection
        .mockResolvedValueOnce([[{ total: 1 }]]) // COUNT
        .mockResolvedValueOnce([[]]) // SET NAMES
        .mockResolvedValueOnce([[]]) // SET CHARACTER SET
        .mockResolvedValueOnce([[]]) // SET character_set_connection
        .mockResolvedValueOnce([[{ id: 1 }]]); // Data

      const result = await Position.findAll({ expired_only: true, page: 1, pageSize: 10 });

      expect(result.positions).toBeDefined();
    });

    it('should filter by created_by', async () => {
      mockConnection.query
        .mockResolvedValueOnce([[]]) // SET NAMES
        .mockResolvedValueOnce([[]]) // SET CHARACTER SET
        .mockResolvedValueOnce([[]]) // SET character_set_connection
        .mockResolvedValueOnce([[{ total: 1 }]]) // COUNT
        .mockResolvedValueOnce([[]]) // SET NAMES
        .mockResolvedValueOnce([[]]) // SET CHARACTER SET
        .mockResolvedValueOnce([[]]) // SET character_set_connection
        .mockResolvedValueOnce([[{ id: 1, created_by: 1 }]]); // Data

      const result = await Position.findAll({ created_by: 1, page: 1, pageSize: 10 });

      expect(result.positions).toBeDefined();
    });

    it('should search across multiple fields', async () => {
      mockConnection.query
        .mockResolvedValueOnce([[]]) // SET NAMES
        .mockResolvedValueOnce([[]]) // SET CHARACTER SET
        .mockResolvedValueOnce([[]]) // SET character_set_connection
        .mockResolvedValueOnce([[{ total: 1 }]]) // COUNT
        .mockResolvedValueOnce([[]]) // SET NAMES
        .mockResolvedValueOnce([[]]) // SET CHARACTER SET
        .mockResolvedValueOnce([[]]) // SET character_set_connection
        .mockResolvedValueOnce([[{ id: 1, title: 'Software Engineer' }]]); // Data

      const result = await Position.findAll({ search: 'Software', page: 1, pageSize: 10 });

      expect(result.positions).toBeDefined();
    });

    it('should handle findById errors', async () => {
      mockConnection.query.mockRejectedValue(new Error('Database error'));

      await expect(Position.findById(1)).rejects.toThrow('Database error');
    });
  });

  describe('getStatistics()', () => {
    it('should return position statistics', async () => {
      const mockStats = {
        total_positions: 50,
        active_positions: 35,
        closed_positions: 15,
        departments_count: 5
      };

      // Set up query chain (3 charset calls + 1 actual query)
      mockConnection.query
        .mockResolvedValueOnce([[]]) // SET NAMES
        .mockResolvedValueOnce([[]]) // SET CHARACTER SET
        .mockResolvedValueOnce([[]]) // SET character_set_connection
        .mockResolvedValueOnce([[mockStats]]); // Actual query - returns [[stats]]

      const stats = await Position.getStatistics();

      expect(stats.total_positions).toBe(50);
      expect(stats.active_positions).toBe(35);
      expect(mockPool.getConnection).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
    });

    it('should handle getStatistics errors', async () => {
      mockConnection.query.mockRejectedValue(new Error('Stats error'));

      await expect(Position.getStatistics()).rejects.toThrow('Stats error');
    });
  });

  describe('getDepartmentStatistics()', () => {
    it('should return department statistics', async () => {
      const mockDeptStats = [
        { department: '技术部', total: 20, active: 18, closed: 2 },
        { department: '产品部', total: 15, active: 15, closed: 0 }
      ];

      // Set up query chain (3 charset calls + 1 actual query)
      mockConnection.query
        .mockResolvedValueOnce([[]]) // SET NAMES
        .mockResolvedValueOnce([[]]) // SET CHARACTER SET
        .mockResolvedValueOnce([[]]) // SET character_set_connection
        .mockResolvedValueOnce([mockDeptStats]); // Actual query - returns [[row1, row2]]

      const stats = await Position.getDepartmentStatistics();

      expect(stats).toHaveLength(2);
      expect(stats[0].department).toBe('技术部');
      expect(mockPool.getConnection).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
    });

    it('should handle getDepartmentStatistics errors', async () => {
      mockConnection.query.mockRejectedValue(new Error('Stats failed'));

      await expect(Position.getDepartmentStatistics()).rejects.toThrow('Stats failed');
    });
  });

  describe('toJSON()', () => {
    it('should return JSON representation', () => {
      const position = new Position({
        ...mockPosition,
        headcount_filled: 2
      });

      const json = position.toJSON();

      expect(json.id).toBe(1);
      expect(json.title).toBe('Software Engineer');
      expect(json.department).toBe('技术部');
      expect(json.completion_rate).toBeDefined();
    });

    it('should include can_close flag', () => {
      const position = new Position({
        ...mockPosition,
        headcount: 3,
        headcount_filled: 3
      });

      const json = position.toJSON();

      expect(json.can_close).toBe(true);
    });
  });

  describe('canClose()', () => {
    it('should return true when headcount is filled', () => {
      const position = new Position({
        headcount: 3,
        headcount_filled: 3
      });

      expect(position.canClose()).toBe(true);
    });

    it('should return false when headcount not filled', () => {
      const position = new Position({
        headcount: 3,
        headcount_filled: 1
      });

      expect(position.canClose()).toBe(false);
    });
  });

  describe('getCompletionRate()', () => {
    it('should calculate completion rate correctly', () => {
      const position = new Position({
        headcount: 5,
        headcount_filled: 3
      });

      expect(position.getCompletionRate()).toBe(60);
    });

    it('should return 0 when headcount is 0', () => {
      const position = new Position({
        headcount: 0,
        headcount_filled: 0
      });

      expect(position.getCompletionRate()).toBe(0);
    });
  });

  describe('create()', () => {
    it('should create a new position', async () => {
      const newPosition = new Position({
        title: 'Senior Developer',
        department: '技术部',
        level: 'senior',
        type: 'fulltime',
        location: '北京',
        salary_min: 200000,
        salary_max: 300000,
        description: 'Senior role',
        requirements: '5+ years experience',
        headcount: 2,
        created_by: 1
      });

      const createdPosition = {
        id: 10,
        title: 'Senior Developer',
        department: '技术部',
        level: 'senior',
        type: 'fulltime',
        location: '北京',
        salary_min: 200000,
        salary_max: 300000,
        description: 'Senior role',
        requirements: '5+ years experience',
        headcount: 2,
        created_by: 1,
        interview_count: 0,
        hired_count: 0
      };

      // Setup query chain - 7 charset calls + 1 insert + 3 charset for findById + 1 select
      mockConnection.query
        .mockResolvedValueOnce([[]]) // SET NAMES
        .mockResolvedValueOnce([[]]) // SET CHARACTER SET
        .mockResolvedValueOnce([[]]) // SET character_set_connection
        .mockResolvedValueOnce([[{ insertId: 10 }]]) // INSERT query
        .mockResolvedValueOnce([[]]) // SET NAMES for findById
        .mockResolvedValueOnce([[]]) // SET CHARACTER SET
        .mockResolvedValueOnce([[]]) // SET character_set_connection
        .mockResolvedValueOnce([[createdPosition]]); // findById result

      const result = await newPosition.create();

      expect(result.id).toBe(10);
      expect(mockPool.getConnection).toHaveBeenCalled();
    });

    it('should handle create errors', async () => {
      const position = new Position({
        title: 'Test Position',
        department: '技术部',
        headcount: 1
      });

      mockConnection.query.mockRejectedValue(new Error('Database error'));

      await expect(position.create()).rejects.toThrow('Database error');
    });
  });

  describe('update()', () => {
    it('should update position fields', async () => {
      const position = new Position({
        id: 1,
        title: 'Old Title',
        department: '技术部'
      });

      // Setup query chain
      mockConnection.query
        .mockResolvedValueOnce([[]]) // SET NAMES
        .mockResolvedValueOnce([[]]) // SET CHARACTER SET
        .mockResolvedValueOnce([[]]) // SET character_set_connection
        .mockResolvedValueOnce([]); // UPDATE query

      const result = await position.update({
        title: 'New Title',
        salary_min: 150000
      });

      expect(result.title).toBe('New Title');
      expect(result.salary_min).toBe(150000);
    });

    it('should throw error when no fields to update', async () => {
      const position = new Position({
        id: 1,
        title: 'Test'
      });

      await expect(position.update({})).rejects.toThrow('没有需要更新的字段');
    });

    it('should ignore invalid fields', async () => {
      const position = new Position({
        id: 1,
        title: 'Test',
        department: '技术部'
      });

      // Setup query chain
      mockConnection.query
        .mockResolvedValueOnce([[]]) // SET NAMES
        .mockResolvedValueOnce([[]]) // SET CHARACTER SET
        .mockResolvedValueOnce([[]]) // SET character_set_connection
        .mockResolvedValueOnce([]); // UPDATE query

      const result = await position.update({
        title: 'Updated',
        invalid_field: 'should be ignored'
      });

      expect(result.title).toBe('Updated');
    });
  });

  describe('delete()', () => {
    it('should delete position', async () => {
      const position = new Position({
        id: 1,
        title: 'Test Position'
      });

      // Setup query chain - first check interviews, then delete
      mockConnection.query
        .mockResolvedValueOnce([[]]) // SET NAMES
        .mockResolvedValueOnce([[]]) // SET CHARACTER SET
        .mockResolvedValueOnce([[]]) // SET character_set_connection
        .mockResolvedValueOnce([[{ count: 0 }]]) // Check interviews
        .mockResolvedValueOnce([[]]) // SET NAMES
        .mockResolvedValueOnce([[]]) // SET CHARACTER SET
        .mockResolvedValueOnce([[]]) // SET character_set_connection
        .mockResolvedValueOnce([]); // DELETE query

      const result = await position.delete();

      expect(result).toBe(true);
      expect(mockConnection.release).toHaveBeenCalled();
    });

    it('should throw error when position has interviews', async () => {
      const position = new Position({
        id: 1,
        title: 'Test Position'
      });

      // Setup query chain - check interviews
      mockConnection.query
        .mockResolvedValueOnce([[]]) // SET NAMES
        .mockResolvedValueOnce([[]]) // SET CHARACTER SET
        .mockResolvedValueOnce([[]]) // SET character_set_connection
        .mockResolvedValueOnce([[{ count: 5 }]]); // Has interviews

      await expect(position.delete()).rejects.toThrow('该职位下有关联的面试记录，无法删除');
    });
  });

  describe('updateProgress()', () => {
    it('should update position progress', async () => {
      const position = new Position({
        id: 1,
        title: 'Test Position',
        headcount: 5,
        headcount_filled: 2
      });

      const updatedData = {
        id: 1,
        title: 'Test Position',
        headcount: 5,
        headcount_filled: 3
      };

      // Setup query chain - UPDATE query + findById
      mockConnection.query
        .mockResolvedValueOnce([[]]) // SET NAMES for UPDATE
        .mockResolvedValueOnce([[]]) // SET CHARACTER SET for UPDATE
        .mockResolvedValueOnce([[]]) // SET character_set_connection for UPDATE
        .mockResolvedValueOnce([]) // UPDATE query
        .mockResolvedValueOnce([[]]) // SET NAMES for findById
        .mockResolvedValueOnce([[]]) // SET CHARACTER SET for findById
        .mockResolvedValueOnce([[]]) // SET character_set_connection for findById
        .mockResolvedValueOnce([[updatedData]]); // findById result

      const result = await position.updateProgress();

      expect(result.headcount_filled).toBe(3);
      expect(mockConnection.query).toHaveBeenCalled();
    });

    it('should handle updateProgress errors', async () => {
      const position = new Position({
        id: 1,
        title: 'Test Position'
      });

      mockConnection.query.mockRejectedValue(new Error('Update failed'));

      await expect(position.updateProgress()).rejects.toThrow('Update failed');
    });
  });
});
