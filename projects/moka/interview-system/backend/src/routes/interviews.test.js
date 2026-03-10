const request = require('supertest');
const express = require('express');

// Mock config before importing anything else
jest.mock('../config/redis', () => ({
  getRedisClient: jest.fn(),
  closeRedisClient: jest.fn()
}));

// Mock models
jest.mock('../models/Interview');
jest.mock('../models/Candidate');
jest.mock('../models/Position');
jest.mock('../models/User');
jest.mock('../config/database');

// Mock validation middleware
jest.mock('../middleware/validation', () => ({
  validate: jest.fn(() => (req, res, next) => next()),
  interviewSchemas: {
    create: {},
    update: {},
    feedback: {},
    status: {},
    batchCreate: {}
  }
}));

// Mock auth middleware
jest.mock('../middleware/auth', () => ({
  authenticate: jest.fn((req, res, next) => {
    req.user = { id: 1, username: 'testuser', email: 'test@example.com', role: 'admin' };
    next();
  }),
  authorize: jest.fn((roles) => (req, res, next) => next())
}));

// Mock services
jest.mock('../services/ConflictDetectionService', () => ({
  checkConflicts: jest.fn().mockResolvedValue([])
}));

const Interview = require('../models/Interview');
const Candidate = require('../models/Candidate');
const Position = require('../models/Position');
const { authenticate, authorize } = require('../middleware/auth');
const ConflictDetectionService = require('../services/ConflictDetectionService');

// 导入路由
const interviewRouter = require('./interviews');

// 创建 Express app
const app = express();
app.use(express.json());
app.use('/api/interviews', interviewRouter);

// 设置测试环境变量
process.env.JWT_SECRET = 'test-jwt-secret-key';

// 增加测试超时时间
jest.setTimeout(30000);

describe('Interview Routes Integration Tests', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock authenticate middleware
    authenticate.mockImplementation((req, res, next) => {
      req.user = { id: 1, username: 'testuser', email: 'test@example.com', role: 'admin' };
      next();
    });

    // Mock authorize middleware
    authorize.mockImplementation((roles) => (req, res, next) => next());
  });

  describe('GET /api/interviews', () => {
    it('should get interview list successfully', async () => {
      const mockInterviews = [
        { id: 1, candidate_name: 'John Doe', position_title: 'Software Engineer' },
        { id: 2, candidate_name: 'Jane Smith', position_title: 'Product Manager' }
      ];

      const mockResult = {
        interviews: mockInterviews,
        pagination: {
          page: 1,
          pageSize: 20,
          total: 2,
          totalPages: 1,
          hasNext: false,
          hasPrev: false
        }
      };

      Interview.findAll = jest.fn().mockResolvedValue(mockResult);

      const response = await request(app)
        .get('/api/interviews')
        .query({ page: 1, pageSize: 20 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination).toBeDefined();
    });

    it('should filter by status', async () => {
      const mockResult = {
        interviews: [{ id: 1, status: 'scheduled' }],
        pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1, hasNext: false, hasPrev: false }
      };

      Interview.findAll = jest.fn().mockResolvedValue(mockResult);

      const response = await request(app)
        .get('/api/interviews')
        .query({ status: 'scheduled' });

      expect(response.status).toBe(200);
      expect(Interview.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'scheduled' })
      );
    });

    it('should filter by interviewer_id', async () => {
      const mockResult = {
        interviews: [{ id: 1, interviewer_id: 5 }],
        pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1, hasNext: false, hasPrev: false }
      };

      Interview.findAll = jest.fn().mockResolvedValue(mockResult);

      const response = await request(app)
        .get('/api/interviews')
        .query({ interviewer_id: 5 });

      expect(response.status).toBe(200);
      expect(Interview.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ interviewer_id: 5 })
      );
    });
  });

  describe('GET /api/interviews/statistics', () => {
    it('should get interview statistics', async () => {
      const mockStats = {
        total: 100,
        scheduled: 30,
        completed: 50,
        cancelled: 20,
        today: 5
      };

      Interview.getStatistics = jest.fn().mockResolvedValue(mockStats);

      const response = await request(app)
        .get('/api/interviews/statistics');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.total).toBe(100);
    });
  });

  describe('GET /api/interviews/calendar', () => {
    it('should get calendar data', async () => {
      const mockCalendarData = [
        {
          date: '2025-02-27',
          interviews: [
            { id: 1, time: '10:00', candidate_name: 'John Doe' }
          ]
        }
      ];

      Interview.getCalendarData = jest.fn().mockResolvedValue(mockCalendarData);

      const response = await request(app)
        .get('/api/interviews/calendar')
        .query({ start_date: '2025-02-01', end_date: '2025-02-28' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter calendar by interviewer', async () => {
      const mockCalendarData = [];

      Interview.getCalendarData = jest.fn().mockResolvedValue(mockCalendarData);

      const response = await request(app)
        .get('/api/interviews/calendar')
        .query({ interviewer_id: 5 });

      expect(response.status).toBe(200);
      expect(Interview.getCalendarData).toHaveBeenCalledWith(
        expect.objectContaining({ interviewer_id: 5 })
      );
    });
  });

  describe('GET /api/interviews/:id', () => {
    it('should get interview by ID', async () => {
      const mockInterview = {
        id: 1,
        candidate_name: 'John Doe',
        position_title: 'Software Engineer',
        status: 'scheduled',
        scheduled_time: '2025-02-27 10:00',
        toJSON: jest.fn().mockReturnValue({
          id: 1,
          candidate_name: 'John Doe',
          position_title: 'Software Engineer',
          status: 'scheduled',
          scheduled_time: '2025-02-27 10:00'
        })
      };

      Interview.findById = jest.fn().mockResolvedValue(mockInterview);

      const response = await request(app)
        .get('/api/interviews/1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(1);
    });

    it('should return 404 if interview not found', async () => {
      Interview.findById = jest.fn().mockResolvedValue(null);

      const response = await request(app)
        .get('/api/interviews/999');

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/interviews', () => {
    it('should create interview successfully', async () => {
      const newInterview = {
        candidate_id: 1,
        position_id: 2,
        interviewer_id: 3,
        scheduled_time: '2025-02-27 10:00',
        interview_type: 'technical'
      };

      const mockCreatedInterview = {
        id: 1,
        ...newInterview,
        toJSON: jest.fn().mockReturnValue({ id: 1, ...newInterview })
      };

      const mockInterviewInstance = {
        create: jest.fn().mockResolvedValue(mockCreatedInterview),
        toJSON: jest.fn().mockReturnValue({ id: 1, ...newInterview })
      };

      Interview.mockImplementation(() => mockInterviewInstance);
      Interview.mockReturnValueOnce(mockInterviewInstance);

      Candidate.findById = jest.fn().mockResolvedValue({ id: 1, name: 'John Doe' });
      Position.findById = jest.fn().mockResolvedValue({ id: 2, title: 'Software Engineer' });

      const response = await request(app)
        .post('/api/interviews')
        .send(newInterview);

      expect([200, 201]).toContain(response.status);
      expect(response.body.success).toBe(true);
    });
  });

  describe('PUT /api/interviews/:id', () => {
    it('should update interview successfully', async () => {
      const updateData = {
        scheduled_time: '2025-02-28 14:00'
      };

      const mockInterview = {
        id: 1,
        candidate_id: 1,
        position_id: 2,
        update: jest.fn().mockResolvedValue({
          id: 1,
          ...updateData,
          toJSON: jest.fn().mockReturnValue({ id: 1, ...updateData })
        }),
        toJSON: jest.fn().mockReturnValue({ id: 1, ...updateData })
      };

      Interview.findById = jest.fn().mockResolvedValue(mockInterview);

      const response = await request(app)
        .put('/api/interviews/1')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 404 if interview not found', async () => {
      Interview.findById = jest.fn().mockResolvedValue(null);

      const response = await request(app)
        .put('/api/interviews/999')
        .send({ scheduled_time: '2025-02-28 14:00' });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/interviews/:id', () => {
    it('should delete interview successfully', async () => {
      const mockInterview = {
        id: 1,
        delete: jest.fn().mockResolvedValue()
      };

      Interview.findById = jest.fn().mockResolvedValue(mockInterview);
      Interview.delete = jest.fn().mockResolvedValue();

      const response = await request(app)
        .delete('/api/interviews/1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 404 if interview not found', async () => {
      Interview.findById = jest.fn().mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/interviews/999');

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/interviews/:id/feedback', () => {
    it('should add feedback to interview', async () => {
      const feedbackData = {
        feedback: 'Good technical skills',
        score: 85,
        result: 'pass'
      };

      const mockInterview = {
        id: 1,
        interviewer_id: 1,
        created_by: 1,
        update: jest.fn().mockResolvedValue({
          id: 1,
          ...feedbackData,
          toJSON: jest.fn().mockReturnValue({ id: 1, ...feedbackData })
        }),
        toJSON: jest.fn().mockReturnValue({ id: 1, ...feedbackData })
      };

      Interview.findById = jest.fn().mockResolvedValue(mockInterview);

      const response = await request(app)
        .post('/api/interviews/1/feedback')
        .send(feedbackData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/interviews/:id/status', () => {
    it('should update interview status', async () => {
      const statusData = {
        status: 'completed',
        notes: 'Interview went well'
      };

      const mockInterview = {
        id: 1,
        interviewer_id: 1,
        created_by: 1,
        update: jest.fn().mockResolvedValue({
          id: 1,
          ...statusData,
          toJSON: jest.fn().mockReturnValue({ id: 1, ...statusData })
        }),
        toJSON: jest.fn().mockReturnValue({ id: 1, ...statusData })
      };

      Interview.findById = jest.fn().mockResolvedValue(mockInterview);

      const response = await request(app)
        .post('/api/interviews/1/status')
        .send(statusData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/interviews/batch-create', () => {
    it('should create multiple interviews', async () => {
      const batchData = {
        interviews: [
          {
            candidate_id: 1,
            position_id: 2,
            interviewer_id: 3,
            scheduled_time: '2025-02-27 10:00'
          },
          {
            candidate_id: 4,
            position_id: 2,
            interviewer_id: 3,
            scheduled_time: '2025-02-27 11:00'
          }
        ]
      };

      const mockInterview1 = {
        id: 1,
        create: jest.fn().mockResolvedValue(),
        toJSON: jest.fn().mockReturnValue({ id: 1 })
      };

      const mockInterview2 = {
        id: 2,
        create: jest.fn().mockResolvedValue(),
        toJSON: jest.fn().mockReturnValue({ id: 2 })
      };

      Interview.mockImplementationOnce(() => mockInterview1)
        .mockImplementationOnce(() => mockInterview2);

      const response = await request(app)
        .post('/api/interviews/batch-create')
        .send(batchData);

      expect([200, 201]).toContain(response.status);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('POST /api/interviews/check-conflicts', () => {
    it('should check for scheduling conflicts', async () => {
      const ConflictDetectionService = require('../services/ConflictDetectionService');
      const conflicts = [
        {
          interviewer_id: 3,
          conflict_type: 'time_overlap',
          interview_id: 5
        }
      ];

      ConflictDetectionService.checkConflicts = jest.fn().mockResolvedValue(conflicts);

      const checkData = {
        scheduled_time: '2025-02-27 10:00',
        duration: 60,
        interviewer_id: 3,
        candidate_id: 1
      };

      const response = await request(app)
        .post('/api/interviews/check-conflicts')
        .send(checkData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/interviews/availability/:interviewerId/:date', () => {
    it('should get interviewer availability', async () => {
      const mockSlots = [
        { time: '09:00', available: true },
        { time: '10:00', available: false },
        { time: '11:00', available: true }
      ];

      Interview.getInterviewerAvailability = jest.fn().mockResolvedValue(mockSlots);

      const response = await request(app)
        .get('/api/interviews/availability/3/2025-02-27');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('Error handling and edge cases', () => {
    it('should handle findAll errors', async () => {
      Interview.findAll = jest.fn().mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/interviews');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });

    it('should handle statistics errors', async () => {
      Interview.getStatistics = jest.fn().mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/interviews/statistics');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });

    it('should handle calendar errors', async () => {
      Interview.getCalendarData = jest.fn().mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/interviews/calendar?interviewer_id=1&start_date=2025-01-01&end_date=2025-01-31');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });

    it('should handle getById errors', async () => {
      Interview.findById = jest.fn().mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/interviews/1');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });

    it('should handle create errors', async () => {
      const mockInstance = new Interview({});
      mockInstance.create = jest.fn().mockRejectedValue(new Error('Database error'));
      Interview.create = jest.fn().mockResolvedValue(mockInstance);

      const response = await request(app)
        .post('/api/interviews')
        .send({
          candidate_id: 1,
          position_id: 1,
          interviewer_id: 1,
          scheduled_time: '2025-02-27T10:00:00Z',
          duration: 60
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });

    it('should handle update errors', async () => {
      const mockInstance = {
        id: 1,
        update: jest.fn().mockRejectedValue(new Error('Database error'))
      };
      Interview.findById = jest.fn().mockResolvedValue(mockInstance);

      const response = await request(app)
        .put('/api/interviews/1')
        .send({ status: 'completed' });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });

    it('should handle delete errors', async () => {
      const mockInstance = {
        id: 1,
        delete: jest.fn().mockRejectedValue(new Error('Database error'))
      };
      Interview.findById = jest.fn().mockResolvedValue(mockInstance);

      const response = await request(app)
        .delete('/api/interviews/1');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });

    it('should handle getInterviewerAvailability errors', async () => {
      Interview.getInterviewerAvailability = jest.fn().mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/interviews/availability/3/2025-02-27');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });

    it('should handle checkConflicts errors', async () => {
      ConflictDetectionService.checkConflicts = jest.fn().mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .post('/api/interviews/check-conflicts')
        .send({
          candidate_id: 1,
          interviewer_id: 1,
          scheduled_time: '2025-02-27T10:00:00Z',
          duration: 60
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/interviews/calendar', () => {
    it('should get calendar data with filters', async () => {
      const mockCalendarData = [
        { date: '2025-02-27', interviews: [], available_slots: [] },
        { date: '2025-02-28', interviews: [], available_slots: [] }
      ];

      Interview.getCalendarData = jest.fn().mockResolvedValue(mockCalendarData);

      const response = await request(app)
        .get('/api/interviews/calendar?interviewer_id=1&start_date=2025-02-27&end_date=2025-02-28');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Interview.getCalendarData).toHaveBeenCalled();
    });

    it('should use interviewer filter for interviewer role', async () => {
      const { authenticate } = require('../middleware/auth');
      authenticate.mockImplementationOnce((req, res, next) => {
        req.user = { id: 3, username: 'interviewer1', role: 'interviewer' };
        next();
      });

      Interview.getCalendarData = jest.fn().mockResolvedValue([]);

      const response = await request(app)
        .get('/api/interviews/calendar?start_date=2025-02-27&end_date=2025-02-28');

      expect(response.status).toBe(200);
      expect(Interview.getCalendarData).toHaveBeenCalledWith(
        expect.objectContaining({
          created_by: 3
        })
      );
    });
  });

  describe('GET /api/interviews/statistics', () => {
    it('should get statistics for interviewer', async () => {
      const mockStats = {
        total: 100,
        completed: 80,
        pending: 15,
        cancelled: 5,
        completion_rate: 80
      };

      Interview.getStatistics = jest.fn().mockResolvedValue(mockStats);

      const response = await request(app)
        .get('/api/interviews/statistics');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockStats);
    });

    it('should filter by interviewer for interviewer role', async () => {
      const { authenticate } = require('../middleware/auth');
      authenticate.mockImplementationOnce((req, res, next) => {
        req.user = { id: 3, username: 'interviewer1', role: 'interviewer' };
        next();
      });

      Interview.getStatistics = jest.fn().mockResolvedValue({});

      const response = await request(app)
        .get('/api/interviews/statistics');

      expect(response.status).toBe(200);
      expect(Interview.getStatistics).toHaveBeenCalledWith(3);
    });
  });
});
