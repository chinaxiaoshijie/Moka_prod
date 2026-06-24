const Candidate = require('./Candidate');
const { query } = require('../config/database');

// Mock database module
jest.mock('../config/database');

describe('Candidate Model', () => {
  let mockCandidate;

  beforeEach(() => {
    // 重置所有 mocks
    jest.clearAllMocks();

    // 创建测试候选人数据
    mockCandidate = {
      id: 1,
      name: '张三',
      email: 'zhangsan@example.com',
      phone: '13800138000',
      gender: '男',
      age: 28,
      education: '本科',
      school: '清华大学',
      major: '计算机科学',
      experience_years: 5,
      current_company: '某科技公司',
      current_position: '高级工程师',
      current_salary: 25000,
      expected_salary: 30000,
      skills: 'JavaScript,React,Node.js',
      resume_url: '/resumes/zhangsan.pdf',
      resume_text: '张三的简历内容',
      source: 'manual',
      source_detail: null,
      status: 'new',
      notes: '优秀候选人',
      tags: ['前端', '全栈'],
      created_by: 1
    };
  });

  describe('create()', () => {
    it('should create a new candidate successfully', async () => {
      const candidate = new Candidate(mockCandidate);

      // Mock 插入操作
      query.mockResolvedValueOnce({
        insertId: 1
      });

      await candidate.create();

      expect(candidate.id).toBe(1);
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO candidates'),
        expect.arrayContaining([
          mockCandidate.name,
          mockCandidate.email,
          mockCandidate.phone,
          mockCandidate.gender,
          mockCandidate.age,
          mockCandidate.education,
          mockCandidate.school,
          mockCandidate.major,
          mockCandidate.experience_years,
          mockCandidate.current_company,
          mockCandidate.current_position,
          mockCandidate.current_salary,
          mockCandidate.expected_salary,
          mockCandidate.skills,
          mockCandidate.resume_url,
          mockCandidate.resume_text,
          mockCandidate.source,
          mockCandidate.source_detail,
          mockCandidate.status,
          mockCandidate.notes,
          JSON.stringify(mockCandidate.tags),
          mockCandidate.created_by
        ])
      );
    });

    it('should handle database errors', async () => {
      const candidate = new Candidate(mockCandidate);
      query.mockRejectedValueOnce(new Error('Database error'));

      await expect(candidate.create()).rejects.toThrow('Database error');
    });
  });

  describe('findById()', () => {
    it('should find candidate by ID', async () => {
      query.mockResolvedValueOnce([
        {
          id: 1,
          name: '张三',
          email: 'zhangsan@example.com',
          tags: '["前端", "全栈"]',
          created_by_name: 'admin'
        }
      ]);

      const candidate = await Candidate.findById(1);

      expect(candidate).toBeInstanceOf(Candidate);
      expect(candidate.id).toBe(1);
      expect(candidate.name).toBe('张三');
      expect(Array.isArray(candidate.tags)).toBe(true);
    });

    it('should return null if candidate not found', async () => {
      query.mockResolvedValueOnce([]);

      const candidate = await Candidate.findById(999);

      expect(candidate).toBeNull();
    });

    it('should parse tags from JSON string', async () => {
      query.mockResolvedValueOnce([
        {
          id: 1,
          name: '张三',
          tags: '["Java", "Spring"]'
        }
      ]);

      const candidate = await Candidate.findById(1);

      expect(candidate.tags).toEqual(['Java', 'Spring']);
    });
  });

  describe('findByEmailOrPhone()', () => {
    it('should find candidate by email', async () => {
      query.mockResolvedValueOnce([
        {
          id: 1,
          email: 'test@example.com',
          name: 'Test User'
        }
      ]);

      const candidate = await Candidate.findByEmailOrPhone('test@example.com', null);

      expect(candidate).toBeInstanceOf(Candidate);
      expect(candidate.email).toBe('test@example.com');
    });

    it('should find candidate by phone', async () => {
      query.mockResolvedValueOnce([
        {
          id: 1,
          phone: '13800138000',
          name: 'Test User'
        }
      ]);

      const candidate = await Candidate.findByEmailOrPhone(null, '13800138000');

      expect(candidate).toBeInstanceOf(Candidate);
      expect(candidate.phone).toBe('13800138000');
    });

    it('should find candidate by email OR phone', async () => {
      query.mockResolvedValueOnce([
        {
          id: 1,
          email: 'test@example.com',
          phone: '13800138000',
          name: 'Test User'
        }
      ]);

      const candidate = await Candidate.findByEmailOrPhone('test@example.com', '13800138000');

      expect(candidate).toBeInstanceOf(Candidate);
    });

    it('should return null if neither email nor phone provided', async () => {
      const candidate = await Candidate.findByEmailOrPhone(null, null);

      expect(candidate).toBeNull();
      expect(query).not.toHaveBeenCalled();
    });

    it('should return null if no match found', async () => {
      query.mockResolvedValueOnce([]);

      const candidate = await Candidate.findByEmailOrPhone('notfound@example.com', null);

      expect(candidate).toBeNull();
    });
  });

  describe('update() - static method', () => {
    it('should update candidate information', async () => {
      query.mockResolvedValueOnce([]);
      query.mockResolvedValueOnce([
        {
          id: 1,
          name: '李四',
          email: 'lisi@example.com',
          status: 'screening'
        }
      ]);

      const updatedCandidate = await Candidate.update(1, {
        name: '李四',
        status: 'screening'
      });

      expect(updatedCandidate.name).toBe('李四');
      expect(updatedCandidate.status).toBe('screening');
    });

    it('should stringify tags when updating', async () => {
      query.mockResolvedValueOnce([]);
      query.mockResolvedValueOnce([{ id: 1, tags: '[]' }]);

      await Candidate.update(1, {
        tags: ['React', 'Vue']
      });

      const updateCall = query.mock.calls[0];
      const jsonString = updateCall[1][updateCall[1].length - 2]; // tags value before id
      expect(jsonString).toBe(JSON.stringify(['React', 'Vue']));
    });

    it('should ignore undefined fields', async () => {
      query.mockResolvedValueOnce([]);
      query.mockResolvedValueOnce([{ id: 1, name: '张三' }]);

      await Candidate.update(1, {
        name: '张三',
        email: undefined,
        phone: undefined
      });

      expect(query).toHaveBeenCalled();
      const sql = query.mock.calls[0][0];
      expect(sql).toContain('name = ?');
      expect(sql).not.toContain('email = ?');
      expect(sql).not.toContain('phone = ?');
    });

    it('should ignore non-allowed fields', async () => {
      query.mockResolvedValueOnce([]);
      query.mockResolvedValueOnce([{ id: 1 }]);

      await Candidate.update(1, {
        name: '张三',
        invalid_field: 'should be ignored',
        id: 123
      });

      const sql = query.mock.calls[0][0];
      expect(sql).toContain('name = ?');
      expect(sql).not.toContain('invalid_field = ?');
    });

    it('should return original candidate if no valid updates', async () => {
      query.mockResolvedValueOnce([
        { id: 1, name: '张三', status: 'new' }
      ]);

      const result = await Candidate.update(1, {});

      expect(result).toBeInstanceOf(Candidate);
      expect(result.id).toBe(1);
    });
  });

  describe('findAll()', () => {
    it('should return paginated candidate list', async () => {
      const mockCandidates = [
        { id: 1, name: '候选人1' },
        { id: 2, name: '候选人2' }
      ];

      query.mockResolvedValueOnce([{ total: 2 }]);
      query.mockResolvedValueOnce(mockCandidates);

      const result = await Candidate.findAll({ page: 1, pageSize: 10 });

      expect(result.candidates).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.totalPages).toBe(1);
    });

    it('should filter by status when specified', async () => {
      query.mockResolvedValueOnce([{ total: 1 }]);
      query.mockResolvedValueOnce([{ id: 1, status: 'new' }]);

      const result = await Candidate.findAll({ status: 'new', page: 1, pageSize: 10 });

      expect(result.candidates).toHaveLength(1);
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE c.status = ?'),
        expect.arrayContaining(['new', expect.any(Number)])
      );
    });

    it('should filter by source when specified', async () => {
      query.mockResolvedValueOnce([{ total: 1 }]);
      query.mockResolvedValueOnce([{ id: 1, source: 'referral' }]);

      const result = await Candidate.findAll({ source: 'referral', page: 1, pageSize: 10 });

      expect(result.candidates).toHaveLength(1);
    });

    it('should filter by education when specified', async () => {
      query.mockResolvedValueOnce([{ total: 1 }]);
      query.mockResolvedValueOnce([{ id: 1, education: '硕士' }]);

      const result = await Candidate.findAll({ education: '硕士', page: 1, pageSize: 10 });

      expect(result.candidates).toHaveLength(1);
    });

    it('should filter by experience_years when specified', async () => {
      query.mockResolvedValueOnce([{ total: 1 }]);
      query.mockResolvedValueOnce([{ id: 1, experience_years: 5 }]);

      const result = await Candidate.findAll({ experience_years: 3, page: 1, pageSize: 10 });

      expect(result.candidates).toHaveLength(1);
    });

    it('should filter by created_by when specified', async () => {
      query.mockResolvedValueOnce([{ total: 1 }]);
      query.mockResolvedValueOnce([{ id: 1, created_by: 1 }]);

      const result = await Candidate.findAll({ created_by: 1, page: 1, pageSize: 10 });

      expect(result.candidates).toHaveLength(1);
    });

    it('should search across multiple fields', async () => {
      query.mockResolvedValueOnce([{ total: 1 }]);
      query.mockResolvedValueOnce([{ id: 1, name: 'Search Result' }]);

      const result = await Candidate.findAll({ search: 'JavaScript', page: 1, pageSize: 10 });

      expect(result.candidates).toHaveLength(1);
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('MATCH(c.resume_text)'),
        expect.any(Array)
      );
    });

    it('should calculate pagination correctly', async () => {
      query.mockResolvedValueOnce([{ total: 25 }]);
      query.mockResolvedValueOnce([]);

      const result = await Candidate.findAll({ page: 2, pageSize: 10 });

      expect(result.pagination.totalPages).toBe(3);
      expect(result.pagination.hasNext).toBe(true);
      expect(result.pagination.hasPrev).toBe(true);
    });

    it('should handle last page', async () => {
      query.mockResolvedValueOnce([{ total: 25 }]);
      query.mockResolvedValueOnce([]);

      const result = await Candidate.findAll({ page: 3, pageSize: 10 });

      expect(result.pagination.hasNext).toBe(false);
      expect(result.pagination.hasPrev).toBe(true);
    });

    it('should handle first page', async () => {
      query.mockResolvedValueOnce([{ total: 25 }]);
      query.mockResolvedValueOnce([]);

      const result = await Candidate.findAll({ page: 1, pageSize: 10 });

      expect(result.pagination.hasNext).toBe(true);
      expect(result.pagination.hasPrev).toBe(false);
    });
  });

  describe('update() - instance method', () => {
    it('should update candidate instance', async () => {
      const candidate = new Candidate(mockCandidate);
      candidate.id = 1;

      query.mockResolvedValueOnce([]);

      const updatedCandidate = await candidate.update({
        name: '李四',
        status: 'screening'
      });

      expect(updatedCandidate.name).toBe('李四');
      expect(updatedCandidate.status).toBe('screening');
    });

    it('should not call database if no valid updates', async () => {
      const candidate = new Candidate(mockCandidate);
      candidate.id = 1;

      const result = await candidate.update({});

      expect(result).toBe(candidate);
      expect(query).not.toHaveBeenCalled();
    });
  });

  describe('delete()', () => {
    it('should delete candidate successfully', async () => {
      const candidate = new Candidate(mockCandidate);
      candidate.id = 1;

      query.mockResolvedValueOnce({});

      const result = await candidate.delete();

      expect(result).toBe(true);
      expect(query).toHaveBeenCalledWith(
        'DELETE FROM candidates WHERE id = ?',
        [1]
      );
    });

    it('should handle database errors', async () => {
      const candidate = new Candidate(mockCandidate);
      candidate.id = 1;

      query.mockRejectedValueOnce(new Error('Delete failed'));

      await expect(candidate.delete()).rejects.toThrow('Delete failed');
    });
  });

  describe('findDuplicates()', () => {
    it('should find duplicates by email', async () => {
      query.mockResolvedValueOnce([
        { id: 2, email: 'test@example.com', name: 'Duplicate' }
      ]);

      const duplicates = await Candidate.findDuplicates('test@example.com', null, null);

      expect(duplicates).toHaveLength(1);
      expect(duplicates[0]).toBeInstanceOf(Candidate);
      expect(duplicates[0].email).toBe('test@example.com');
    });

    it('should find duplicates by phone', async () => {
      query.mockResolvedValueOnce([
        { id: 2, phone: '13800138000', name: 'Duplicate' }
      ]);

      const duplicates = await Candidate.findDuplicates(null, '13800138000', null);

      expect(duplicates).toHaveLength(1);
    });

    it('should find duplicates by name and contact', async () => {
      query.mockResolvedValueOnce([
        { id: 2, name: '张三', email: 'test@example.com' }
      ]);

      const duplicates = await Candidate.findDuplicates('test@example.com', '13800138000', '张三');

      expect(duplicates).toHaveLength(1);
    });

    it('should return empty array if no criteria provided', async () => {
      const duplicates = await Candidate.findDuplicates(null, null, null);

      expect(duplicates).toEqual([]);
      expect(query).not.toHaveBeenCalled();
    });

    it('should return empty array if no duplicates found', async () => {
      query.mockResolvedValueOnce([]);

      const duplicates = await Candidate.findDuplicates('unique@example.com', null, null);

      expect(duplicates).toEqual([]);
    });
  });

  describe('getStatistics()', () => {
    it('should return overall statistics', async () => {
      const mockStats = {
        total_candidates: 100,
        new_candidates: 20,
        screening_candidates: 15,
        interviewing_candidates: 30,
        offer_candidates: 10,
        hired_candidates: 15,
        rejected_candidates: 10,
        new_this_week: 5,
        new_this_month: 25
      };

      query.mockResolvedValueOnce([mockStats]);

      const stats = await Candidate.getStatistics();

      expect(stats.total_candidates).toBe(100);
      expect(stats.new_candidates).toBe(20);
      expect(stats.hired_candidates).toBe(15);
    });

    it('should return statistics for specific creator', async () => {
      query.mockResolvedValueOnce([{ total_candidates: 10 }]);

      const stats = await Candidate.getStatistics(1);

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE created_by = ?'),
        [1]
      );
    });
  });

  describe('search()', () => {
    it('should search candidates with relevance score', async () => {
      query.mockResolvedValueOnce([
        {
          id: 1,
          name: 'Search Result',
          relevance: 5.5,
          tags: '["search"]'
        }
      ]);

      const results = await Candidate.search('JavaScript');

      expect(results).toHaveLength(1);
      expect(results[0].relevance).toBeDefined();
    });

    it('should parse tags in search results', async () => {
      query.mockResolvedValueOnce([
        {
          id: 1,
          tags: '["Java", "Python"]',
          relevance: 3.2
        }
      ]);

      const results = await Candidate.search('developer');

      expect(results[0].tags).toEqual(['Java', 'Python']);
    });

    it('should handle pagination', async () => {
      query.mockResolvedValueOnce([]);

      await Candidate.search('test', { page: 2, pageSize: 20 });

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT ? OFFSET ?'),
        expect.arrayContaining(['test', expect.any(String), expect.any(String), expect.any(String), expect.any(String), 20, 20])
      );
    });

    it('should use default pagination options', async () => {
      query.mockResolvedValueOnce([]);

      await Candidate.search('test');

      expect(query).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining(['test', expect.any(String), expect.any(String), expect.any(String), expect.any(String), 20, 0])
      );
    });
  });

  describe('toJSON()', () => {
    it('should return candidate data as plain object', () => {
      const candidate = new Candidate({
        id: 1,
        name: '张三',
        email: 'test@example.com',
        tags: ['React', 'Vue']
      });

      const json = candidate.toJSON();

      expect(json).not.toBeInstanceOf(Candidate);
      expect(json.id).toBe(1);
      expect(json.name).toBe('张三');
    });

    it('should parse tags from string to array', () => {
      const candidate = new Candidate({
        id: 1,
        tags: '["tag1", "tag2"]'
      });

      const json = candidate.toJSON();

      expect(Array.isArray(json.tags)).toBe(true);
      expect(json.tags).toEqual(['tag1', 'tag2']);
    });

    it('should handle invalid JSON in tags', () => {
      const candidate = new Candidate({
        id: 1,
        tags: 'invalid-json'
      });

      const json = candidate.toJSON();

      expect(json.tags).toEqual([]);
    });

    it('should keep tags as array if already array', () => {
      const candidate = new Candidate({
        id: 1,
        tags: ['React', 'Vue']
      });

      const json = candidate.toJSON();

      expect(json.tags).toEqual(['React', 'Vue']);
    });
  });

  describe('constructor', () => {
    it('should create candidate with all fields', () => {
      const candidate = new Candidate(mockCandidate);

      expect(candidate.id).toBe(1);
      expect(candidate.name).toBe('张三');
      expect(candidate.email).toBe('zhangsan@example.com');
      expect(candidate.phone).toBe('13800138000');
      expect(candidate.status).toBe('new');
    });

    it('should use default status when not provided', () => {
      const candidate = new Candidate({
        name: '张三',
        email: 'test@example.com'
      });

      expect(candidate.status).toBe('new');
    });

    it('should use default source when not provided', () => {
      const candidate = new Candidate({
        name: '张三',
        email: 'test@example.com'
      });

      expect(candidate.source).toBe('manual');
    });

    it('should create empty candidate with no data', () => {
      const candidate = new Candidate();

      expect(candidate.id).toBeUndefined();
      expect(candidate.name).toBeUndefined();
    });
  });
});
