
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 5.22.0
 * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
 */
Prisma.prismaVersion = {
  client: "5.22.0",
  engine: "605197351a3c8bdd595af2d2a9bc3025bca48ea2"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.NotFoundError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`NotFoundError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  username: 'username',
  password: 'password',
  name: 'name',
  email: 'email',
  role: 'role',
  avatarUrl: 'avatarUrl',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PositionScalarFieldEnum = {
  id: 'id',
  title: 'title',
  description: 'description',
  requirements: 'requirements',
  salaryMin: 'salaryMin',
  salaryMax: 'salaryMax',
  headcount: 'headcount',
  hiredCount: 'hiredCount',
  inProgressCount: 'inProgressCount',
  status: 'status',
  location: 'location',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CandidateScalarFieldEnum = {
  id: 'id',
  name: 'name',
  phone: 'phone',
  email: 'email',
  positionId: 'positionId',
  status: 'status',
  source: 'source',
  resumeUrl: 'resumeUrl',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.InterviewProcessScalarFieldEnum = {
  id: 'id',
  candidateId: 'candidateId',
  positionId: 'positionId',
  currentRound: 'currentRound',
  totalRounds: 'totalRounds',
  status: 'status',
  hasHRRound: 'hasHRRound',
  createdById: 'createdById',
  createdAt: 'createdAt',
  completedAt: 'completedAt'
};

exports.Prisma.InterviewRoundScalarFieldEnum = {
  id: 'id',
  processId: 'processId',
  roundNumber: 'roundNumber',
  interviewerId: 'interviewerId',
  isHRRound: 'isHRRound',
  roundType: 'roundType'
};

exports.Prisma.InterviewScalarFieldEnum = {
  id: 'id',
  candidateId: 'candidateId',
  positionId: 'positionId',
  interviewerId: 'interviewerId',
  type: 'type',
  format: 'format',
  startTime: 'startTime',
  endTime: 'endTime',
  location: 'location',
  meetingUrl: 'meetingUrl',
  meetingNumber: 'meetingNumber',
  status: 'status',
  createdAt: 'createdAt',
  createdById: 'createdById',
  processId: 'processId',
  roundNumber: 'roundNumber',
  isHRRound: 'isHRRound'
};

exports.Prisma.InterviewFeedbackScalarFieldEnum = {
  id: 'id',
  interviewId: 'interviewId',
  interviewerId: 'interviewerId',
  result: 'result',
  strengths: 'strengths',
  weaknesses: 'weaknesses',
  overallRating: 'overallRating',
  notes: 'notes',
  createdAt: 'createdAt'
};

exports.Prisma.NotificationScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  type: 'type',
  title: 'title',
  content: 'content',
  read: 'read',
  link: 'link',
  createdAt: 'createdAt'
};

exports.Prisma.ResumeFileScalarFieldEnum = {
  id: 'id',
  candidateId: 'candidateId',
  fileName: 'fileName',
  fileType: 'fileType',
  fileSize: 'fileSize',
  filePath: 'filePath',
  fileUrl: 'fileUrl',
  uploadedBy: 'uploadedBy',
  isActive: 'isActive',
  uploadedAt: 'uploadedAt'
};

exports.Prisma.CandidateMentionScalarFieldEnum = {
  id: 'id',
  candidateId: 'candidateId',
  interviewerId: 'interviewerId',
  mentionedById: 'mentionedById',
  message: 'message',
  status: 'status',
  viewedAt: 'viewedAt',
  createdAt: 'createdAt'
};

exports.Prisma.FeedbackTokenScalarFieldEnum = {
  id: 'id',
  interviewId: 'interviewId',
  interviewerId: 'interviewerId',
  token: 'token',
  expiresAt: 'expiresAt',
  usedAt: 'usedAt',
  isUsed: 'isUsed',
  createdAt: 'createdAt'
};

exports.Prisma.CandidateStatusHistoryScalarFieldEnum = {
  id: 'id',
  candidateId: 'candidateId',
  oldStatus: 'oldStatus',
  newStatus: 'newStatus',
  reason: 'reason',
  changedBy: 'changedBy',
  relatedInterviewId: 'relatedInterviewId',
  createdAt: 'createdAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};
exports.Role = exports.$Enums.Role = {
  HR: 'HR',
  INTERVIEWER: 'INTERVIEWER'
};

exports.PositionStatus = exports.$Enums.PositionStatus = {
  OPEN: 'OPEN',
  PAUSED: 'PAUSED',
  CLOSED: 'CLOSED'
};

exports.CandidateStatus = exports.$Enums.CandidateStatus = {
  PENDING: 'PENDING',
  SCREENING: 'SCREENING',
  INTERVIEW_1: 'INTERVIEW_1',
  INTERVIEW_2: 'INTERVIEW_2',
  INTERVIEW_3: 'INTERVIEW_3',
  HIRED: 'HIRED',
  REJECTED: 'REJECTED'
};

exports.CandidateSource = exports.$Enums.CandidateSource = {
  BOSS: 'BOSS',
  REFERRAL: 'REFERRAL',
  HEADHUNTER: 'HEADHUNTER',
  WEBSITE: 'WEBSITE'
};

exports.ProcessStatus = exports.$Enums.ProcessStatus = {
  IN_PROGRESS: 'IN_PROGRESS',
  WAITING_HR: 'WAITING_HR',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
};

exports.InterviewType = exports.$Enums.InterviewType = {
  INTERVIEW_1: 'INTERVIEW_1',
  INTERVIEW_2: 'INTERVIEW_2',
  INTERVIEW_3: 'INTERVIEW_3'
};

exports.InterviewFormat = exports.$Enums.InterviewFormat = {
  ONLINE: 'ONLINE',
  OFFLINE: 'OFFLINE'
};

exports.InterviewStatus = exports.$Enums.InterviewStatus = {
  SCHEDULED: 'SCHEDULED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
};

exports.FeedbackResult = exports.$Enums.FeedbackResult = {
  PASS: 'PASS',
  FAIL: 'FAIL',
  PENDING: 'PENDING'
};

exports.NotificationType = exports.$Enums.NotificationType = {
  INTERVIEW_REMINDER: 'INTERVIEW_REMINDER',
  FEEDBACK_REQUEST: 'FEEDBACK_REQUEST',
  PROCESS_UPDATE: 'PROCESS_UPDATE',
  SYSTEM: 'SYSTEM'
};

exports.MentionStatus = exports.$Enums.MentionStatus = {
  PENDING: 'PENDING',
  VIEWED: 'VIEWED',
  RESPONDED: 'RESPONDED'
};

exports.Prisma.ModelName = {
  User: 'User',
  Position: 'Position',
  Candidate: 'Candidate',
  InterviewProcess: 'InterviewProcess',
  InterviewRound: 'InterviewRound',
  Interview: 'Interview',
  InterviewFeedback: 'InterviewFeedback',
  Notification: 'Notification',
  ResumeFile: 'ResumeFile',
  CandidateMention: 'CandidateMention',
  FeedbackToken: 'FeedbackToken',
  CandidateStatusHistory: 'CandidateStatusHistory'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
