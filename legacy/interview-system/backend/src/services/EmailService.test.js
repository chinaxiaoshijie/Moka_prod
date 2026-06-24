// Mock nodemailer before importing EmailService
jest.mock('nodemailer', () => {
  const mockSendMail = jest.fn().mockResolvedValue({
    messageId: 'test-message-id',
    response: '250 OK'
  });

  const mockVerify = jest.fn((callback) => callback(null, true));

  const mockTransporter = {
    sendMail: mockSendMail,
    verify: mockVerify
  };

  return {
    createTransport: jest.fn(() => mockTransporter)
  };
});

// Set environment variables before importing
process.env.EMAIL_ENABLED = 'true';
process.env.EMAIL_HOST = 'smtp.test.com';
process.env.EMAIL_PORT = '587';
process.env.EMAIL_USER = 'test@test.com';
process.env.EMAIL_PASS = 'testpass';
process.env.EMAIL_FROM = 'test@test.com';
process.env.COMPANY_NAME = 'Test Company';

const nodemailer = require('nodemailer');
const EmailService = require('./EmailService');

describe('EmailService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Ensure service is initialized
    if (!EmailService.initialized) {
      EmailService.initialize();
    }
  });

  describe('initialize()', () => {
    it('should initialize the email service', () => {
      expect(EmailService.initialized).toBe(true);
      expect(EmailService.transporter).toBeDefined();
      // Note: createTransport is called during module loading, not in test
    });

    it('should not initialize twice', () => {
      const initialTransporter = EmailService.transporter;
      EmailService.initialize();
      expect(EmailService.transporter).toBe(initialTransporter);
    });
  });

  describe('renderTemplate()', () => {
    it('should render interview_invitation template', () => {
      const result = EmailService.renderTemplate('interview_invitation', {
        candidateName: 'John Doe',
        positionTitle: 'Software Engineer',
        interviewDate: '2024-03-01',
        interviewTime: '10:00',
        interviewType: '视频面试',
        interviewerName: 'Jane Smith',
        interviewerPhone: '1234567890',
        meetingUrl: 'https://meet.example.com',
        location: '',
        notes: 'Please bring your resume',
        companyName: 'Test Company',
        companyPhone: '9876543210',
        companyEmail: 'hr@test.com'
      });

      expect(result.subject).toContain('面试邀请');
      expect(result.html).toContain('John Doe');
      expect(result.html).toContain('Software Engineer');
      expect(result.html).toContain('2024-03-01');
      expect(result.html).toContain('10:00');
      expect(result.html).toContain('https://meet.example.com');
    });

    it('should handle conditional {{#if}} blocks correctly', () => {
      const result = EmailService.renderTemplate('interview_invitation', {
        candidateName: 'Jane Doe',
        positionTitle: 'Developer',
        interviewDate: '2024-03-01',
        interviewTime: '14:00',
        interviewType: '现场面试',
        interviewerName: 'Bob',
        interviewerPhone: '111',
        meetingUrl: '', // Empty - should not show meeting link
        location: 'Office Building A',
        notes: '',
        companyName: 'TestCo'
      });

      expect(result.html).toContain('Office Building A');
      expect(result.html).not.toContain('点击加入会议');
    });

    it('should throw error for unknown template', () => {
      expect(() => {
        EmailService.renderTemplate('unknown_template', {});
      }).toThrow('模板 unknown_template 不存在');
    });
  });

  describe('sendEmail()', () => {
    it('should send email successfully', async () => {
      const result = await EmailService.sendEmail(
        'test@example.com',
        'Test Subject',
        '<p>Test HTML</p>',
        'Test Text'
      );

      expect(result.messageId).toBeDefined();
      expect(EmailService.transporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'test@test.com',
          to: 'test@example.com',
          subject: 'Test Subject',
          html: '<p>Test HTML</p>'
        })
      );
    });

    it('should send to multiple recipients', async () => {
      const result = await EmailService.sendEmail(
        ['test1@example.com', 'test2@example.com'],
        'Test Subject',
        '<p>Test HTML</p>'
      );

      expect(result.messageId).toBeDefined();
      expect(EmailService.transporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test1@example.com, test2@example.com'
        })
      );
    });

    it('should handle attachments', async () => {
      const attachments = [
        { filename: 'test.pdf', path: '/path/to/test.pdf' }
      ];

      const result = await EmailService.sendEmail(
        'test@example.com',
        'Test Subject',
        '<p>Test HTML</p>',
        'Test Text',
        attachments
      );

      expect(result.messageId).toBeDefined();
      expect(EmailService.transporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          attachments
        })
      );
    });
  });

  describe('sendInterviewInvitation()', () => {
    it('should send interview invitation email', async () => {
      const result = await EmailService.sendInterviewInvitation({
        to: 'candidate@example.com',
        candidateName: 'John Doe',
        positionTitle: 'Senior Developer',
        interviewDate: '2024-03-15',
        interviewTime: '14:00',
        interviewType: '视频面试',
        interviewerName: 'Jane Smith',
        interviewerPhone: '1234567890',
        meetingUrl: 'https://meet.example.com/abc123',
        location: '',
        notes: 'Please prepare a coding demonstration',
        companyName: 'TechCorp',
        companyPhone: '555-1234',
        companyEmail: 'hr@techcorp.com'
      });

      expect(result.messageId).toBeDefined();
      expect(EmailService.transporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'candidate@example.com',
          subject: expect.stringContaining('面试邀请')
        })
      );
    });

    it('should use default company name if not provided', async () => {
      const result = await EmailService.sendInterviewInvitation({
        to: 'candidate@example.com',
        candidateName: 'Jane Doe',
        positionTitle: 'Developer',
        interviewDate: '2024-03-15',
        interviewTime: '10:00',
        interviewType: '现场面试',
        interviewerName: 'Bob',
        interviewerPhone: '111',
        location: 'Office 123'
      });

      expect(result.messageId).toBeDefined();
    });
  });

  describe('sendInterviewReminder()', () => {
    it('should send interview reminder email', async () => {
      const result = await EmailService.sendInterviewReminder({
        to: 'interviewer@example.com',
        interviewerName: 'Jane Smith',
        candidateName: 'John Doe',
        positionTitle: 'Senior Developer',
        interviewDate: '2024-03-15',
        interviewTime: '14:00',
        round: '技术面试',
        meetingUrl: 'https://meet.example.com/xyz',
        companyName: 'TechCorp'
      });

      expect(result.messageId).toBeDefined();
      expect(EmailService.transporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'interviewer@example.com',
          subject: expect.stringContaining('面试提醒')
        })
      );
    });
  });

  describe('sendFeedbackRequest()', () => {
    it('should send feedback request email', async () => {
      const result = await EmailService.sendFeedbackRequest({
        to: 'interviewer@example.com',
        interviewerName: 'Jane Smith',
        candidateName: 'John Doe',
        positionTitle: 'Senior Developer',
        interviewDate: '2024-03-15',
        interviewTime: '14:00',
        overdueTime: '24小时',
        feedbackUrl: 'https://app.example.com/feedback/123',
        companyName: 'TechCorp'
      });

      expect(result.messageId).toBeDefined();
      expect(EmailService.transporter.sendMail).toHaveBeenCalled();
    });
  });

  describe('sendOffer()', () => {
    it('should send offer email', async () => {
      const result = await EmailService.sendOffer({
        to: 'candidate@example.com',
        candidateName: 'John Doe',
        positionTitle: 'Senior Developer',
        department: 'Engineering',
        startDate: '2024-04-01',
        location: 'Remote',
        salaryMin: 150000,
        salaryMax: 200000,
        replyDeadline: '2024-03-20',
        companyName: 'TechCorp',
        companyPhone: '555-1234'
      });

      expect(result.messageId).toBeDefined();
      expect(EmailService.transporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringContaining('录用通知')
        })
      );
    });
  });

  describe('sendTestEmail()', () => {
    it('should send test email', async () => {
      const result = await EmailService.sendTestEmail('test@example.com');

      expect(result.messageId).toBeDefined();
      expect(EmailService.transporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: '邮件服务测试',
          to: 'test@example.com'
        })
      );
    });
  });

  describe('sendBulkEmails()', () => {
    it('should send bulk emails with different templates', async () => {
      const recipients = [
        {
          to: 'candidate1@example.com',
          candidateName: 'John Doe',
          positionTitle: 'Developer',
          interviewDate: '2024-03-15',
          interviewTime: '10:00',
          interviewType: '视频面试',
          interviewerName: 'Jane',
          interviewerPhone: '123'
        },
        {
          to: 'candidate2@example.com',
          candidateName: 'Jane Smith',
          positionTitle: 'Designer',
          interviewDate: '2024-03-15',
          interviewTime: '11:00',
          interviewType: '现场面试',
          interviewerName: 'Bob',
          interviewerPhone: '456'
        }
      ];

      const results = await EmailService.sendBulkEmails(
        recipients,
        'interview_invitation',
        { companyName: 'TestCorp' }
      );

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
    });

    it('should handle errors in bulk sending', async () => {
      // Mock sendMail to fail for first recipient
      EmailService.transporter.sendMail
        .mockRejectedValueOnce(new Error('Send failed'))
        .mockResolvedValueOnce({ messageId: 'test-2' });

      const recipients = [
        { to: 'fail@example.com', candidateName: 'Fail', interviewDate: '2024-03-15', interviewTime: '10:00', interviewerName: 'Test', interviewerPhone: '123' },
        { to: 'success@example.com', candidateName: 'Success', interviewDate: '2024-03-15', interviewTime: '11:00', interviewerName: 'Test', interviewerPhone: '456' }
      ];

      const results = await EmailService.sendBulkEmails(
        recipients,
        'interview_invitation',
        { companyName: 'TestCorp' }
      );

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(false);
      expect(results[1].success).toBe(true);
    });
  });
});
