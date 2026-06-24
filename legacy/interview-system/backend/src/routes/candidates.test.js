const request = require('supertest');
const express = require('express');

// Mock config before importing anything else
jest.mock('../config/redis', () => ({
  getRedisClient: jest.fn(),
  closeRedisClient: jest.fn()
}));

// Mock database
jest.mock('../config/database', () => ({
  pool: {
    getConnection: jest.fn().mockRejectedValue(new Error('Database not available in tests')),
    query: jest.fn().mockRejectedValue(new Error('Database not available in tests'))
  }
}));

// Mock models
jest.mock('../models/Candidate');
jest.mock('../models/User');

// Mock validation middleware
jest.mock('../middleware/validation', () => ({
  validate: jest.fn(() => (req, res, next) => next()),
  candidateSchemas: {
    create: {},
    update: {}
  }
}));

// Mock auth middleware
jest.mock('../middleware/auth', () => ({
  authenticate: jest.fn((req, res, next) => next()),
  authorize: jest.fn((roles) => (req, res, next) => next())
}));

const Candidate = require('../models/Candidate');
const { authenticate } = require('../middleware/auth');

// Import routes
const candidatesRouter = require('./candidates');

// Create Express app
const app = express();
app.use(express.json());

// Error handler
app.use((err, req, res, next) => {
  res.status(500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

app.use('/api/candidates', candidatesRouter);

jest.setTimeout(10000);

describe('Candidates Routes Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock authenticate middleware
    authenticate.mockImplementation((req, res, next) => {
      req.user = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: 'hr',
        department: '技术部'
      };
      next();
    });
  });

  describe('GET /api/candidates', () => {
    it('should get candidates list', async () => {
      const mockCandidates = [
        { id: 1, name: 'Candidate 1', status: 'pending' },
        { id: 2, name: 'Candidate 2', status: 'interviewed' }
      ];

      Candidate.findAll = jest.fn().mockResolvedValue({
        candidates: mockCandidates,
        pagination: {
          total: 2,
          page: 1,
          pageSize: 10,
          totalPages: 1
        }
      });

      const response = await request(app)
        .get('/api/candidates')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('获取候选人列表成功');
      expect(response.body.data).toBeDefined();
    });

    it('should filter by status', async () => {
      Candidate.findAll = jest.fn().mockResolvedValue({
        candidates: [{ id: 1, status: 'pending' }],
        pagination: { total: 1, page: 1, pageSize: 10 }
      });

      const response = await request(app)
        .get('/api/candidates?status=pending')
        .expect(200);

      expect(Candidate.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'pending' })
      );
    });

    it('should handle errors', async () => {
      Candidate.findAll = jest.fn().mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/candidates')
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/candidates/statistics', () => {
    it('should get candidates statistics', async () => {
      const mockStats = {
        total: 100,
        pending: 30,
        interviewed: 40,
        hired: 20,
        rejected: 10
      };

      Candidate.getStatistics = jest.fn().mockResolvedValue(mockStats);

      const response = await request(app)
        .get('/api/candidates/statistics')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('获取候选人统计成功');
      expect(response.body.data.total).toBe(100);
    });
  });

  describe('GET /api/candidates/search', () => {
    it('should search candidates', async () => {
      const mockResults = [
        { id: 1, name: 'John Doe', email: 'john@example.com' }
      ];

      Candidate.search = jest.fn().mockResolvedValue({
        candidates: mockResults,
        pagination: { total: 1, page: 1, pageSize: 10 }
      });

      const response = await request(app)
        .get('/api/candidates/search?q=John')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Candidate.search).toHaveBeenCalledWith('John', expect.any(Object));
    });

    it('should return 400 if search term is empty', async () => {
      const response = await request(app)
        .get('/api/candidates/search?q=')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('搜索关键词不能为空');
    });
  });

  describe('GET /api/candidates/:id', () => {
    it('should get candidate by id', async () => {
      const mockCandidate = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        status: 'pending',
        created_by: 1,
        toJSON: jest.fn().mockReturnValue({
          id: 1,
          name: 'John Doe',
          email: 'john@example.com',
          status: 'pending'
        })
      };

      Candidate.findById = jest.fn().mockResolvedValue(mockCandidate);

      const response = await request(app)
        .get('/api/candidates/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(1);
    });

    it('should return 404 if candidate not found', async () => {
      Candidate.findById = jest.fn().mockResolvedValue(null);

      const response = await request(app)
        .get('/api/candidates/999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('候选人不存在');
    });

    it('should return 403 if interviewer tries to access other interviewer candidate', async () => {
      const mockCandidate = {
        id: 1,
        created_by: 999, // Different interviewer
        toJSON: jest.fn().mockReturnValue({ id: 1, created_by: 999 })
      };

      authenticate.mockImplementation((req, res, next) => {
        req.user = { id: 1, role: 'interviewer' };
        next();
      });

      Candidate.findById = jest.fn().mockResolvedValue(mockCandidate);

      const response = await request(app)
        .get('/api/candidates/1')
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/candidates', () => {
    it('should create a new candidate', async () => {
      const newCandidateData = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        phone: '1234567890',
        education: '本科',
        experience_years: 3
      };

      // Mock Candidate constructor
      const mockInstance = {
        id: 1,
        ...newCandidateData,
        status: 'pending',
        created_by: 1,
        create: jest.fn().mockResolvedValue(),
        toJSON: jest.fn().mockReturnValue({
          id: 1,
          ...newCandidateData,
          status: 'pending'
        })
      };

      Candidate.mockImplementation(() => mockInstance);
      Candidate.findDuplicates = jest.fn().mockReturnValue([]);

      const response = await request(app)
        .post('/api/candidates')
        .send(newCandidateData)
        .expect(200); // responseUtils.success() returns 200 by default

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Jane Doe');
    });

    it('should return 400 if email already exists', async () => {
      const duplicateCandidate = {
        id: 1,
        email: 'existing@example.com',
        name: 'Existing User',
        phone: '9876543210',
        status: 'pending',
        toJSON: jest.fn().mockReturnValue({
          id: 1,
          email: 'existing@example.com',
          name: 'Existing User'
        })
      };

      Candidate.findDuplicates = jest.fn().mockReturnValue([duplicateCandidate]);

      const response = await request(app)
        .post('/api/candidates')
        .send({
          name: 'Jane Doe',
          email: 'existing@example.com'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('发现重复的候选人');
    });
  });

  describe('PUT /api/candidates/:id', () => {
    it('should update candidate', async () => {
      const mockCandidate = {
        id: 1,
        name: 'John Doe',
        update: jest.fn().mockResolvedValue(),
        toJSON: jest.fn().mockReturnValue({ id: 1, name: 'Updated Name' })
      };

      Candidate.findById = jest.fn().mockResolvedValue(mockCandidate);

      const response = await request(app)
        .put('/api/candidates/1')
        .send({ name: 'Updated Name' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockCandidate.update).toHaveBeenCalled();
    });

    it('should return 404 if candidate not found', async () => {
      Candidate.findById = jest.fn().mockResolvedValue(null);

      const response = await request(app)
        .put('/api/candidates/999')
        .send({ name: 'Updated' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/candidates/:id', () => {
    it('should delete candidate', async () => {
      const mockCandidate = {
        id: 1,
        delete: jest.fn().mockResolvedValue()
      };

      Candidate.findById = jest.fn().mockResolvedValue(mockCandidate);

      const response = await request(app)
        .delete('/api/candidates/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockCandidate.delete).toHaveBeenCalled();
    });

    it('should return 404 if candidate not found', async () => {
      Candidate.findById = jest.fn().mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/candidates/999')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/candidates/statistics', () => {
    it('should get candidate statistics', async () => {
      const mockStats = {
        total: 100,
        active: 80,
        hired: 15,
        rejected: 5
      };

      Candidate.getStatistics = jest.fn().mockResolvedValue(mockStats);

      const response = await request(app)
        .get('/api/candidates/statistics');

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(mockStats);
    });

    it('should filter by interviewer for interviewer role', async () => {
      const { authenticate } = require('../middleware/auth');
      authenticate.mockImplementationOnce((req, res, next) => {
        req.user = { id: 3, username: 'interviewer1', role: 'interviewer' };
        next();
      });

      Candidate.getStatistics = jest.fn().mockResolvedValue({});

      const response = await request(app)
        .get('/api/candidates/statistics');

      expect(response.status).toBe(200);
      expect(Candidate.getStatistics).toHaveBeenCalledWith(3);
    });
  });

  describe('GET /api/candidates/search', () => {
    it('should search candidates', async () => {
      const mockCandidates = [
        { id: 1, name: '张三', email: 'zhangsan@example.com' },
        { id: 2, name: '李四', email: 'lisi@example.com' }
      ];

      Candidate.search = jest.fn().mockResolvedValue({
        candidates: mockCandidates,
        pagination: { total: 2 }
      });

      const response = await request(app)
        .get('/api/candidates/search?q=张三');

      expect(response.status).toBe(200);
      expect(Candidate.search).toHaveBeenCalledWith('张三', expect.objectContaining({}));
    });

    it('should return 400 if search term is missing', async () => {
      const response = await request(app)
        .get('/api/candidates/search');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Error handling', () => {
    it('should handle findAll errors', async () => {
      Candidate.findAll = jest.fn().mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/candidates');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });

    it('should handle statistics errors', async () => {
      Candidate.getStatistics = jest.fn().mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/candidates/statistics');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });

    it('should handle search errors', async () => {
      Candidate.search = jest.fn().mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/candidates/search?q=测试');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });

    it('should handle getById errors', async () => {
      Candidate.findById = jest.fn().mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/candidates/1');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });

    it('should handle create errors', async () => {
      const errorInstance = {
        create: jest.fn().mockRejectedValue(new Error('Database error'))
      };
      Candidate.mockImplementation(() => errorInstance);
      Candidate.findDuplicates = jest.fn().mockReturnValue([]);

      const response = await request(app)
        .post('/api/candidates')
        .send({
          name: '测试候选人',
          email: 'test@example.com',
          phone: '13800138000'
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });

    it('should handle update errors', async () => {
      const mockInstance = {
        id: 1,
        update: jest.fn().mockRejectedValue(new Error('Database error'))
      };
      Candidate.findById = jest.fn().mockResolvedValue(mockInstance);

      const response = await request(app)
        .put('/api/candidates/1')
        .send({ name: '更新候选人' });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });

    it('should handle delete errors', async () => {
      const mockInstance = {
        id: 1,
        delete: jest.fn().mockRejectedValue(new Error('Database error'))
      };
      Candidate.findById = jest.fn().mockResolvedValue(mockInstance);

      const response = await request(app)
        .delete('/api/candidates/1');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });
});
