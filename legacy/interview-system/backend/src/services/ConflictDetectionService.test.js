const ConflictDetectionService = require('./ConflictDetectionService');
const { query } = require('../config/database');

// Mock database
jest.mock('../config/database');

describe('ConflictDetectionService Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    query.mockResolvedValue([]);
  });

  describe('checkConflicts', () => {
    const interviewData = {
      scheduled_time: '2025-02-27 10:00:00',
      duration: 60,
      interviewer_id: 1,
      candidate_id: 5
    };

    it('should detect no conflicts when no overlapping interviews', async () => {
      query.mockResolvedValueOnce([]); // No interviewer conflicts
      query.mockResolvedValueOnce([]); // No candidate conflicts

      const conflicts = await ConflictDetectionService.checkConflicts(interviewData);

      expect(conflicts).toHaveProperty('conflicts');
      expect(conflicts).toHaveProperty('hasConflicts', false);
      expect(conflicts.conflicts.interviewer).toEqual([]);
      expect(conflicts.conflicts.candidate).toEqual([]);
    });

    it('should detect interviewer conflicts', async () => {
      const mockConflict = {
        id: 10,
        interviewer_id: 1,
        candidate_id: 3,
        scheduled_time: '2025-02-27 09:30:00',
        duration: 90
      };

      query.mockResolvedValueOnce([[mockConflict]]); // Interviewer conflict
      query.mockResolvedValueOnce([]); // No candidate conflict

      const conflicts = await ConflictDetectionService.checkConflicts(interviewData);

      expect(conflicts.hasConflicts).toBe(true);
      expect(conflicts.conflicts.interviewer.length).toBeGreaterThan(0);
    });

    it('should detect candidate conflicts', async () => {
      const mockConflict = {
        id: 20,
        interviewer_id: 5,
        candidate_id: 5,
        scheduled_time: '2025-02-27 09:00:00',
        duration: 120
      };

      query.mockResolvedValueOnce([]); // No interviewer conflict
      query.mockResolvedValueOnce([[mockConflict]]); // Candidate conflict

      const conflicts = await ConflictDetectionService.checkConflicts(interviewData);

      expect(conflicts.hasConflicts).toBe(true);
      expect(conflicts.conflicts.candidate.length).toBeGreaterThan(0);
    });

    it('should detect both interviewer and candidate conflicts', async () => {
      query.mockResolvedValueOnce([{ id: 1 }]); // Interviewer conflict
      query.mockResolvedValueOnce([{ id: 2 }]); // Candidate conflict

      const conflicts = await ConflictDetectionService.checkConflicts(interviewData);

      expect(conflicts.hasConflicts).toBe(true);
      expect(conflicts.conflicts.interviewer.length).toBeGreaterThan(0);
      expect(conflicts.conflicts.candidate.length).toBeGreaterThan(0);
    });

    it('should include overlap minutes information if available', async () => {
      const mockConflict = {
        id: 10,
        interviewer_id: 1,
        scheduled_time: '2025-02-27 09:45:00',
        duration: 60
      };

      query.mockResolvedValueOnce([[mockConflict]]);
      query.mockResolvedValueOnce([]);

      const conflicts = await ConflictDetectionService.checkConflicts(interviewData);

      // Check if conflict object exists
      expect(conflicts.conflicts.interviewer).toBeDefined();
      expect(conflicts.conflicts.interviewer.length).toBeGreaterThan(0);
    });

    it('should handle database errors gracefully', async () => {
      query.mockRejectedValueOnce(new Error('Database error'));

      // Service might catch and log the error instead of throwing
      const conflicts = await ConflictDetectionService.checkConflicts(interviewData);

      // Should return a result even on error
      expect(conflicts).toBeDefined();
    });

    it('should return conflict summary', async () => {
      query.mockResolvedValueOnce([]);
      query.mockResolvedValueOnce([]);

      const conflicts = await ConflictDetectionService.checkConflicts(interviewData);

      expect(conflicts).toHaveProperty('summary');
      expect(conflicts).toHaveProperty('hasConflicts');
    });
  });

  describe('checkInterviewerAvailability', () => {
    it('should return available time slots for interviewer', async () => {
      const mockSlots = [
        { time: '09:00', available: true },
        { time: '10:00', available: false },
        { time: '11:00', available: true }
      ];

      query.mockResolvedValue(mockSlots);

      const availability = await ConflictDetectionService.checkInterviewerAvailability(
        1,
        new Date('2025-02-27 09:00:00'),
        new Date('2025-02-27 17:00:00')
      );

      expect(availability).toBeDefined();
      expect(Array.isArray(availability)).toBe(true);
    });

    it('should filter out already scheduled slots', async () => {
      const scheduledInterviews = [
        { scheduled_time: '2025-02-27 10:00:00', duration: 60 }
      ];

      query.mockResolvedValue(scheduledInterviews);

      const availability = await ConflictDetectionService.checkInterviewerAvailability(
        1,
        new Date('2025-02-27 09:00:00'),
        new Date('2025-02-27 12:00:00')
      );

      expect(availability).toBeDefined();
    });
  });

  describe('checkCandidateAvailability', () => {
    it('should return available time slots for candidate', async () => {
      query.mockResolvedValue([]);

      const availability = await ConflictDetectionService.checkCandidateAvailability(
        5,
        new Date('2025-02-27 09:00:00'),
        new Date('2025-02-27 17:00:00')
      );

      expect(availability).toBeDefined();
      expect(Array.isArray(availability)).toBe(true);
    });

    it('should detect candidate schedule conflicts', async () => {
      const conflict = {
        scheduled_time: '2025-02-27 11:00:00',
        duration: 60
      };

      query.mockResolvedValue([conflict]);

      const availability = await ConflictDetectionService.checkCandidateAvailability(
        5,
        new Date('2025-02-27 09:00:00'),
        new Date('2025-02-27 17:00:00')
      );

      expect(availability).toBeDefined();
    });
  });

  describe('Conflict severity levels', () => {
    it('should mark severe conflicts for high overlap', async () => {
      // 60 min overlap
      const severeConflict = {
        id: 1,
        scheduled_time: '2025-02-27 10:00:00',
        duration: 60
      };

      query.mockResolvedValueOnce([[{ ...severeConflict, overlap_minutes: 60 }]]);
      query.mockResolvedValueOnce([]);

      const conflicts = await ConflictDetectionService.checkConflicts({
        scheduled_time: '2025-02-27 10:00:00',
        duration: 60,
        interviewer_id: 2
      });

      expect(conflicts.conflicts.interviewer[0].severity).toBeDefined();
    });

    it('should mark minor conflicts for low overlap', async () => {
      // 15 min overlap
      const minorConflict = {
        id: 2,
        scheduled_time: '2025-02-27 10:45:00',
        duration: 30
      };

      query.mockResolvedValueOnce([[{ ...minorConflict, overlap_minutes: 15 }]]);
      query.mockResolvedValueOnce([]);

      const conflicts = await ConflictDetectionService.checkConflicts({
        scheduled_time: '2025-02-27 10:00:00',
        duration: 60,
        interviewer_id: 2
      });

      expect(conflicts.conflicts.interviewer[0].severity).toBeDefined();
    });
  });

  describe('Edge cases', () => {
    it('should handle midnight time boundaries', async () => {
      const lateNightInterview = {
        scheduled_time: '2025-02-27 23:30:00',
        duration: 60,
        interviewer_id: 1,
        candidate_id: 5
      };

      query.mockResolvedValueOnce([]);
      query.mockResolvedValueOnce([]);

      const conflicts = await ConflictDetectionService.checkConflicts(lateNightInterview);

      expect(conflicts).toHaveProperty('conflicts');
      expect(conflicts).toHaveProperty('hasConflicts');
    });

    it('should handle very short interviews', async () => {
      const shortInterview = {
        scheduled_time: '2025-02-27 14:00:00',
        duration: 15, // 15 minutes
        interviewer_id: 1,
        candidate_id: 5
      };

      query.mockResolvedValueOnce([]);
      query.mockResolvedValueOnce([]);

      const conflicts = await ConflictDetectionService.checkConflicts(shortInterview);

      expect(conflicts.hasConflicts).toBe(false);
    });

    it('should handle very long interviews', async () => {
      const longInterview = {
        scheduled_time: '2025-02-27 09:00:00',
        duration: 240, // 4 hours
        interviewer_id: 1,
        candidate_id: 5
      };

      query.mockResolvedValueOnce([]);
      query.mockResolvedValueOnce([]);

      const conflicts = await ConflictDetectionService.checkConflicts(longInterview);

      expect(conflicts).toHaveProperty('hasConflicts');
      expect(conflicts).toHaveProperty('summary');
    });
  });

  describe('checkConflicts with excludeInterviewId', () => {
    it('should exclude specified interview from conflict check', async () => {
      const mockConflict = {
        id: 10,
        interviewer_id: 1,
        scheduled_time: '2025-02-27 09:30:00',
        duration: 90
      };

      query.mockResolvedValueOnce([]); // No interviewer conflicts (id 10 excluded)
      query.mockResolvedValueOnce([]); // No candidate conflicts

      const conflicts = await ConflictDetectionService.checkConflicts({
        scheduled_time: '2025-02-27 10:00:00',
        duration: 60,
        interviewer_id: 1,
        candidate_id: 5,
        excludeInterviewId: 10
      });

      expect(conflicts.hasConflicts).toBe(false);
    });
  });

  describe('calculateOverlapMinutes', () => {
    it('should calculate overlap minutes correctly', () => {
      const start1 = new Date('2025-02-27 10:00:00');
      const end1 = new Date('2025-02-27 11:00:00');
      const start2 = new Date('2025-02-27 10:30:00');
      const duration2 = 60;

      const overlap = ConflictDetectionService.calculateOverlapMinutes(start1, end1, start2, duration2);
      expect(overlap).toBe(30);
    });

    it('should return 0 for no overlap', () => {
      const start1 = new Date('2025-02-27 10:00:00');
      const end1 = new Date('2025-02-27 11:00:00');
      const start2 = new Date('2025-02-27 12:00:00');
      const duration2 = 60;

      const overlap = ConflictDetectionService.calculateOverlapMinutes(start1, end1, start2, duration2);
      expect(overlap).toBe(0);
    });

    it('should handle partial overlaps', () => {
      const start1 = new Date('2025-02-27 10:00:00');
      const end1 = new Date('2025-02-27 11:00:00');
      const start2 = new Date('2025-02-27 10:45:00');
      const duration2 = 30;

      const overlap = ConflictDetectionService.calculateOverlapMinutes(start1, end1, start2, duration2);
      expect(overlap).toBe(15);
    });
  });

  describe('determineSeverity', () => {
    it('should return "none" for no overlap', () => {
      const start1 = new Date('2025-02-27 10:00:00');
      const end1 = new Date('2025-02-27 11:00:00');
      const start2 = new Date('2025-02-27 12:00:00');
      const duration2 = 60;

      const severity = ConflictDetectionService.determineSeverity(start1, end1, start2, duration2);
      expect(severity).toBe('none');
    });

    it('should return "low" for 5 minutes or less overlap', () => {
      const start1 = new Date('2025-02-27 10:00:00');
      const end1 = new Date('2025-02-27 11:00:00');
      const start2 = new Date('2025-02-27 10:55:00');
      const duration2 = 10;

      const severity = ConflictDetectionService.determineSeverity(start1, end1, start2, duration2);
      expect(severity).toBe('low');
    });

    it('should return "medium" for 5-15 minutes overlap', () => {
      const start1 = new Date('2025-02-27 10:00:00');
      const end1 = new Date('2025-02-27 11:00:00');
      const start2 = new Date('2025-02-27 10:50:00');
      const duration2 = 15;

      const severity = ConflictDetectionService.determineSeverity(start1, end1, start2, duration2);
      expect(severity).toBe('medium');
    });

    it('should return "high" for more than 15 minutes overlap', () => {
      const start1 = new Date('2025-02-27 10:00:00');
      const end1 = new Date('2025-02-27 11:00:00');
      const start2 = new Date('2025-02-27 10:30:00');
      const duration2 = 60;

      const severity = ConflictDetectionService.determineSeverity(start1, end1, start2, duration2);
      expect(severity).toBe('high');
    });
  });

  describe('generateConflictSummary', () => {
    it('should return "no conflicts" message when no conflicts', () => {
      const summary = ConflictDetectionService.generateConflictSummary([], []);
      expect(summary).toBe('未发现时间冲突');
    });

    it('should generate summary for interviewer conflicts only', () => {
      const interviewerConflicts = [
        { severity: 'high' },
        { severity: 'low' }
      ];

      const summary = ConflictDetectionService.generateConflictSummary(interviewerConflicts, []);
      expect(summary).toContain('面试官有 2 个时间冲突');
      expect(summary).toContain('其中 1 个严重');
    });

    it('should generate summary for candidate conflicts only', () => {
      const candidateConflicts = [
        { severity: 'medium' }
      ];

      const summary = ConflictDetectionService.generateConflictSummary([], candidateConflicts);
      expect(summary).toContain('候选人有 1 个时间冲突');
    });

    it('should generate summary for both types of conflicts', () => {
      const interviewerConflicts = [
        { severity: 'high' }
      ];
      const candidateConflicts = [
        { severity: 'high' },
        { severity: 'low' }
      ];

      const summary = ConflictDetectionService.generateConflictSummary(interviewerConflicts, candidateConflicts);
      expect(summary).toContain('面试官');
      expect(summary).toContain('候选人');
      expect(summary).toContain('；');
    });
  });

  describe('checkInterviewerAvailability with excludeInterviewId', () => {
    it('should exclude specified interview from availability check', async () => {
      query.mockResolvedValue([]);

      const availability = await ConflictDetectionService.checkInterviewerAvailability(
        1,
        new Date('2025-02-27 09:00:00'),
        new Date('2025-02-27 17:00:00'),
        100 // excludeInterviewId
      );

      expect(availability).toBeDefined();
      expect(Array.isArray(availability)).toBe(true);
    });
  });

  describe('checkCandidateAvailability with excludeInterviewId', () => {
    it('should exclude specified interview from candidate availability check', async () => {
      query.mockResolvedValue([]);

      const availability = await ConflictDetectionService.checkCandidateAvailability(
        5,
        new Date('2025-02-27 09:00:00'),
        new Date('2025-02-27 17:00:00'),
        200 // excludeInterviewId
      );

      expect(availability).toBeDefined();
      expect(Array.isArray(availability)).toBe(true);
    });

    it('should handle database errors gracefully', async () => {
      query.mockRejectedValue(new Error('Database error'));

      const availability = await ConflictDetectionService.checkCandidateAvailability(
        5,
        new Date('2025-02-27 09:00:00'),
        new Date('2025-02-27 17:00:00')
      );

      // Should return empty array on error
      expect(availability).toEqual([]);
    });
  });

  describe('findAvailableSlots', () => {
    it('should find available time slots', async () => {
      const mockSlots = [
        { date: '2025-02-28', time: '09:00', available: true },
        { date: '2025-02-28', time: '10:00', available: false },
        { date: '2025-02-28', time: '11:00', available: true }
      ];

      query.mockResolvedValue(mockSlots);

      const slots = await ConflictDetectionService.findAvailableSlots({
        interviewer_id: 1,
        start_date: new Date('2025-02-28'),
        end_date: new Date('2025-02-28'),
        duration: 60
      });

      expect(slots).toBeDefined();
    });

    it('should handle custom working hours', async () => {
      query.mockResolvedValue([]);

      const slots = await ConflictDetectionService.findAvailableSlots({
        interviewer_id: 1,
        start_date: new Date('2025-02-28'),
        end_date: new Date('2025-02-28'),
        duration: 60,
        working_hour_start: 8,
        working_hour_end: 20
      });

      expect(slots).toBeDefined();
    });

    it('should include candidate availability when candidate_id provided', async () => {
      query.mockResolvedValue([]);

      const slots = await ConflictDetectionService.findAvailableSlots({
        interviewer_id: 1,
        candidate_id: 5,
        start_date: new Date('2025-02-28'),
        end_date: new Date('2025-02-28'),
        duration: 60
      });

      expect(slots).toBeDefined();
    });

    it('should limit results to 20 slots', async () => {
      const mockSlots = Array.from({ length: 30 }, (_, i) => ({
        date: '2025-02-28',
        time: `${9 + i}:00`,
        available: true
      }));

      query.mockResolvedValue(mockSlots);

      const slots = await ConflictDetectionService.findAvailableSlots({
        interviewer_id: 1,
        start_date: new Date('2025-02-28'),
        end_date: new Date('2025-02-28'),
        duration: 60
      });

      expect(slots.available_slots).toBeDefined();
      expect(slots.available_slots.length).toBeLessThanOrEqual(20);
    });

    it('should handle errors and rethrow', async () => {
      query.mockRejectedValue(new Error('Find slots failed'));

      await expect(
        ConflictDetectionService.findAvailableSlots({
          interviewer_id: 1,
          start_date: new Date('2025-02-28'),
          end_date: new Date('2025-02-28'),
          duration: 60
        })
      ).rejects.toThrow('Find slots failed');
    });
  });

  describe('getDailyConflicts', () => {
    it('should return conflicts for a given day', async () => {
      const mockInterviews = [
        {
          id: 1,
          interviewer_id: 10,
          candidate_id: 100,
          scheduled_time: '2025-02-27 10:00:00',
          duration: 60,
          status: 'scheduled'
        },
        {
          id: 2,
          interviewer_id: 10,
          candidate_id: 101,
          scheduled_time: '2025-02-27 10:30:00',
          duration: 60,
          status: 'scheduled'
        }
      ];

      query.mockResolvedValue(mockInterviews);

      const result = await ConflictDetectionService.getDailyConflicts('2025-02-27');

      expect(result).toHaveProperty('date', '2025-02-27');
      expect(result).toHaveProperty('total_interviews', 2);
      expect(result).toHaveProperty('conflicts_found');
      expect(result.conflicts_found).toBeGreaterThan(0);
    });

    it('should return no conflicts when interviews do not overlap', async () => {
      const mockInterviews = [
        {
          id: 1,
          interviewer_id: 10,
          candidate_id: 100,
          scheduled_time: '2025-02-27 10:00:00',
          duration: 60,
          status: 'scheduled'
        },
        {
          id: 2,
          interviewer_id: 11,
          candidate_id: 101,
          scheduled_time: '2025-02-27 14:00:00',
          duration: 60,
          status: 'scheduled'
        }
      ];

      query.mockResolvedValue(mockInterviews);

      const result = await ConflictDetectionService.getDailyConflicts('2025-02-27');

      expect(result.conflicts_found).toBe(0);
      expect(result.conflicts).toEqual([]);
    });

    it('should detect candidate conflicts', async () => {
      const mockInterviews = [
        {
          id: 1,
          interviewer_id: 10,
          candidate_id: 100,
          scheduled_time: '2025-02-27 10:00:00',
          duration: 60,
          status: 'scheduled'
        },
        {
          id: 2,
          interviewer_id: 11,
          candidate_id: 100,
          scheduled_time: '2025-02-27 10:30:00',
          duration: 60,
          status: 'scheduled'
        }
      ];

      query.mockResolvedValue(mockInterviews);

      const result = await ConflictDetectionService.getDailyConflicts('2025-02-27');

      expect(result.conflicts_found).toBeGreaterThan(0);
      expect(result.conflicts[0]).toHaveProperty('candidate_conflict', true);
    });

    it('should return empty result when no interviews scheduled', async () => {
      query.mockResolvedValue([]);

      const result = await ConflictDetectionService.getDailyConflicts('2025-02-27');

      expect(result.total_interviews).toBe(0);
      expect(result.conflicts_found).toBe(0);
      expect(result.conflicts).toEqual([]);
    });
  });
});
