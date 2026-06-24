const { query } = require('../config/database');

/**
 * Interview Conflict Detection Service
 * Detects scheduling conflicts for interviews
 */
class ConflictDetectionService {
  /**
   * Check for interview conflicts
   * @param {Object} interviewData - The interview data to check
   * @param {number} interviewData.scheduled_time - Interview start time (Date or timestamp)
   * @param {number} interviewData.duration - Interview duration in minutes
   * @param {number} interviewData.interviewer_id - Interviewer ID
   * @param {number} interviewData.candidate_id - Candidate ID
   * @returns {Promise<Object>} - Conflict detection result
   */
  static async checkConflicts(interviewData) {
    const { scheduled_time, duration = 60, interviewer_id, candidate_id } = interviewData;

    // Parse scheduled time
    const startTime = new Date(scheduled_time);
    const endTime = new Date(startTime.getTime() + duration * 60 * 1000);

    // Check interviewer availability
    const interviewerConflicts = await this.checkInterviewerAvailability(
      interviewer_id,
      startTime,
      endTime,
      interviewData.id // exclude current interview when updating
    );

    // Check candidate availability
    const candidateConflicts = await this.checkCandidateAvailability(
      candidate_id,
      startTime,
      endTime,
      interviewData.id
    );

    const hasConflicts = interviewerConflicts.length > 0 || candidateConflicts.length > 0;

    return {
      hasConflicts,
      conflicts: {
        interviewer: interviewerConflicts,
        candidate: candidateConflicts
      },
      summary: this.generateConflictSummary(interviewerConflicts, candidateConflicts)
    };
  }

  /**
   * Check if interviewer has conflicting interviews
   */
  static async checkInterviewerAvailability(interviewerId, startTime, endTime, excludeInterviewId = null) {
    try {
      let sql = `
        SELECT
          id,
          candidate_id,
          scheduled_time,
          duration,
          status,
          title
        FROM interviews
        WHERE interviewer_id = ?
          AND status IN ('scheduled', 'confirmed')
          AND (
            (scheduled_time <= ? AND DATE_ADD(scheduled_time, INTERVAL duration MINUTE) > ?) OR
            (scheduled_time < ? AND DATE_ADD(scheduled_time, INTERVAL duration MINUTE) >= ?) OR
            (scheduled_time >= ? AND scheduled_time < ?)
          )
      `;

      const params = [
        interviewerId,
        startTime, startTime,
        endTime, endTime,
        startTime, endTime
      ];

      // Exclude current interview when updating
      if (excludeInterviewId) {
        sql += ' AND id != ?';
        params.push(excludeInterviewId);
      }

      sql += ' ORDER BY scheduled_time ASC';

      const conflicts = await query(sql, params);

      return conflicts.map(interview => ({
        type: 'interviewer_conflict',
        interview_id: interview.id,
        title: interview.title,
        scheduled_time: interview.scheduled_time,
        duration: interview.duration,
        overlap_minutes: this.calculateOverlapMinutes(
          startTime,
          endTime,
          interview.scheduled_time,
          interview.duration
        ),
        severity: this.determineSeverity(
          startTime,
          endTime,
          interview.scheduled_time,
          interview.duration
        )
      }));

    } catch (error) {
      console.error('检查面试官可用性错误:', error);
      return [];
    }
  }

  /**
   * Check if candidate has conflicting interviews
   */
  static async checkCandidateAvailability(candidateId, startTime, endTime, excludeInterviewId = null) {
    try {
      let sql = `
        SELECT
          id,
          interviewer_id,
          scheduled_time,
          duration,
          status,
          title
        FROM interviews
        WHERE candidate_id = ?
          AND status IN ('scheduled', 'confirmed')
          AND (
            (scheduled_time <= ? AND DATE_ADD(scheduled_time, INTERVAL duration MINUTE) > ?) OR
            (scheduled_time < ? AND DATE_ADD(scheduled_time, INTERVAL duration MINUTE) >= ?) OR
            (scheduled_time >= ? AND scheduled_time < ?)
          )
      `;

      const params = [
        candidateId,
        startTime, startTime,
        endTime, endTime,
        startTime, endTime
      ];

      if (excludeInterviewId) {
        sql += ' AND id != ?';
        params.push(excludeInterviewId);
      }

      sql += ' ORDER BY scheduled_time ASC';

      const conflicts = await query(sql, params);

      return conflicts.map(interview => ({
        type: 'candidate_conflict',
        interview_id: interview.id,
        title: interview.title,
        scheduled_time: interview.scheduled_time,
        duration: interview.duration,
        overlap_minutes: this.calculateOverlapMinutes(
          startTime,
          endTime,
          interview.scheduled_time,
          interview.duration
        ),
        severity: this.determineSeverity(
          startTime,
          endTime,
          interview.scheduled_time,
          interview.duration
        )
      }));

    } catch (error) {
      console.error('检查候选人可用性错误:', error);
      return [];
    }
  }

  /**
   * Calculate overlap minutes between two time ranges
   */
  static calculateOverlapMinutes(start1, end1, start2, duration2) {
    const s1 = new Date(start1).getTime();
    const e1 = new Date(end1).getTime();
    const s2 = new Date(start2).getTime();
    const e2 = s2 + duration2 * 60 * 1000;

    const overlapStart = Math.max(s1, s2);
    const overlapEnd = Math.min(e1, e2);

    if (overlapStart >= overlapEnd) {
      return 0;
    }

    return Math.round((overlapEnd - overlapStart) / (60 * 1000));
  }

  /**
   * Determine conflict severity based on overlap
   */
  static determineSeverity(start1, end1, start2, duration2) {
    const overlapMinutes = this.calculateOverlapMinutes(start1, end1, start2, duration2);

    if (overlapMinutes === 0) {
      return 'none';
    } else if (overlapMinutes <= 5) {
      return 'low'; // Brief overlap, might be acceptable
    } else if (overlapMinutes <= 15) {
      return 'medium'; // Moderate overlap
    } else {
      return 'high'; // Significant overlap
    }
  }

  /**
   * Generate a human-readable conflict summary
   */
  static generateConflictSummary(interviewerConflicts, candidateConflicts) {
    const summary = [];

    if (interviewerConflicts.length > 0) {
      const count = interviewerConflicts.length;
      const highSeverity = interviewerConflicts.filter(c => c.severity === 'high').length;
      summary.push(
        `面试官有 ${count} 个时间冲突${highSeverity > 0 ? `（其中 ${highSeverity} 个严重）` : ''}`
      );
    }

    if (candidateConflicts.length > 0) {
      const count = candidateConflicts.length;
      const highSeverity = candidateConflicts.filter(c => c.severity === 'high').length;
      summary.push(
        `候选人有 ${count} 个时间冲突${highSeverity > 0 ? `（其中 ${highSeverity} 个严重）` : ''}`
      );
    }

    if (summary.length === 0) {
      return '未发现时间冲突';
    }

    return summary.join('；');
  }

  /**
   * Find available time slots for scheduling
   * @param {Object} options - Search options
   * @param {number} options.interviewer_id - Interviewer ID
   * @param {number} options.candidate_id - Candidate ID (optional)
   * @param {Date} options.start_date - Search start date
   * @param {Date} options.end_date - Search end date
   * @param {number} options.duration - Required duration in minutes
   * @param {number} options.working_hour_start - Working day start hour (default 9)
   * @param {number} options.working_hour_end - Working day end hour (default 18)
   */
  static async findAvailableSlots(options) {
    const {
      interviewer_id,
      candidate_id,
      start_date,
      end_date,
      duration = 60,
      working_hour_start = 9,
      working_hour_end = 18
    } = options;

    try {
      // Get existing interviews for the date range
      const sql = `
        SELECT
          interviewer_id,
          candidate_id,
          scheduled_time,
          duration
        FROM interviews
        WHERE status IN ('scheduled', 'confirmed')
          AND scheduled_time >= ?
          AND scheduled_time <= ?
          AND (interviewer_id = ? ${candidate_id ? `OR candidate_id = ${candidate_id}` : ''})
        ORDER BY scheduled_time ASC
      `;

      const existingInterviews = await query(sql, [start_date, end_date, interviewer_id]);

      // Generate available slots
      const availableSlots = [];
      const slotInterval = 30; // 30-minute intervals

      let currentDate = new Date(start_date);
      const endDate = new Date(end_date);

      while (currentDate <= endDate) {
        // Skip weekends
        const dayOfWeek = currentDate.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          // Generate time slots for this day
          let slotTime = new Date(currentDate);
          slotTime.setHours(working_hour_start, 0, 0, 0);

          const dayEndTime = new Date(currentDate);
          dayEndTime.setHours(working_hour_end, 0, 0, 0);

          while (slotTime.getTime() + duration * 60 * 1000 <= dayEndTime.getTime()) {
            const slotEndTime = new Date(slotTime.getTime() + duration * 60 * 1000);

            // Check if this slot has any conflicts
            const hasConflict = existingInterviews.some(interview => {
              const interviewStart = new Date(interview.scheduled_time);
              const interviewEnd = new Date(
                interviewStart.getTime() + interview.duration * 60 * 1000
              );

              return (
                (slotTime < interviewEnd && slotEndTime > interviewStart)
              );
            });

            if (!hasConflict) {
              availableSlots.push({
                start_time: new Date(slotTime),
                end_time: slotEndTime,
                duration
              });
            }

            // Move to next slot
            slotTime = new Date(slotTime.getTime() + slotInterval * 60 * 1000);
          }
        }

        // Move to next day
        currentDate = new Date(currentDate);
        currentDate.setDate(currentDate.getDate() + 1);
        currentDate.setHours(0, 0, 0, 0);
      }

      return {
        available_slots: availableSlots.slice(0, 20), // Limit to 20 slots
        total_count: availableSlots.length
      };

    } catch (error) {
      console.error('查找可用时间段错误:', error);
      throw error;
    }
  }

  /**
   * Get daily conflict statistics
   */
  static async getDailyConflicts(date) {
    try {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      // Get all interviews for the day
      const sql = `
        SELECT
          id,
          interviewer_id,
          candidate_id,
          scheduled_time,
          duration,
          status
        FROM interviews
        WHERE scheduled_time >= ? AND scheduled_time <= ?
          AND status IN ('scheduled', 'confirmed')
        ORDER BY scheduled_time ASC
      `;

      const interviews = await query(sql, [startDate, endDate]);

      // Check for conflicts
      const conflicts = [];
      const checked = new Set();

      for (const interview of interviews) {
        const key = `${interview.id}`;

        for (const other of interviews) {
          const otherKey = `${other.id}`;
          if (key === otherKey || checked.has(`${key}-${otherKey}`)) {
            continue;
          }

          // Check if they share interviewer or candidate
          if (interview.interviewer_id === other.interviewer_id ||
              interview.candidate_id === other.candidate_id) {

            const iStart = new Date(interview.scheduled_time).getTime();
            const iEnd = iStart + interview.duration * 60 * 1000;
            const oStart = new Date(other.scheduled_time).getTime();
            const oEnd = oStart + other.duration * 60 * 1000;

            if (iStart < oEnd && iEnd > oStart) {
              conflicts.push({
                interview_1: interview.id,
                interview_2: other.id,
                interviewer_conflict: interview.interviewer_id === other.interviewer_id,
                candidate_conflict: interview.candidate_id === other.candidate_id,
                overlap_minutes: Math.round(Math.min(iEnd, oEnd) - Math.max(iStart, oStart)) / (60 * 1000)
              });
            }

            checked.add(`${key}-${otherKey}`);
            checked.add(`${otherKey}-${key}`);
          }
        }
      }

      return {
        date,
        total_interviews: interviews.length,
        conflicts_found: conflicts.length,
        conflicts
      };

    } catch (error) {
      console.error('获取每日冲突统计错误:', error);
      throw error;
    }
  }
}

module.exports = ConflictDetectionService;
