/**
 * 数据导出服务
 * 支持导出候选人、面试、反馈等数据为Excel格式
 */

const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

class ExportService {
  constructor() {
    this.exportDir = path.join(__dirname, '../../exports');
    this.ensureExportDir();
  }

  /**
   * 确保导出目录存在
   */
  ensureExportDir() {
    if (!fs.existsSync(this.exportDir)) {
      fs.mkdirSync(this.exportDir, { recursive: true });
    }
  }

  /**
   * 导出候选人列表
   */
  async exportCandidates(candidates, filters = {}) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('候选人列表');

    // 设置列
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: '姓名', key: 'name', width: 15 },
      { header: '邮箱', key: 'email', width: 25 },
      { header: '手机号', key: 'phone', width: 15 },
      { header: '学历', key: 'education', width: 10 },
      { header: '学校', key: 'school', width: 20 },
      { header: '专业', key: 'major', width: 20 },
      { header: '工作年限', key: 'experience_years', width: 12 },
      { header: '当前公司', key: 'current_company', width: 20 },
      { header: '当前职位', key: 'current_position', width: 20 },
      { header: '技能', key: 'skills', width: 30 },
      { header: '状态', key: 'status', width: 12 },
      { header: '创建时间', key: 'created_at', width: 20 }
    ];

    // 样式设置
    this.styleHeader(worksheet);

    // 添加数据
    const educationMap = {
      'phd': '博士',
      'master': '硕士',
      'bachelor': '本科',
      'college': '大专',
      'other': '其他'
    };

    const statusMap = {
      'new': '新候选人',
      'contacted': '已联系',
      'interviewed': '面试中',
      'offered': '已录用',
      'hired': '已入职',
      'rejected': '已拒绝'
    };

    candidates.forEach(candidate => {
      worksheet.addRow({
        id: candidate.id,
        name: candidate.name || '',
        email: candidate.email || '',
        phone: candidate.phone || '',
        education: educationMap[candidate.education] || candidate.education || '',
        school: candidate.school || '',
        major: candidate.major || '',
        experience_years: candidate.experience_years || 0,
        current_company: candidate.current_company || '',
        current_position: candidate.current_position || '',
        skills: candidate.skills || '',
        status: statusMap[candidate.status] || candidate.status || '',
        created_at: candidate.created_at ? new Date(candidate.created_at).toLocaleString('zh-CN') : ''
      });
    });

    // 自动筛选
    worksheet.autoFilter = {
      from: 'A1',
      to: `M${candidates.length + 1}`
    };

    const filename = `candidates-${Date.now()}.xlsx`;
    const filepath = path.join(this.exportDir, filename);
    await workbook.xlsx.writeFile(filepath);

    return { filename, filepath, count: candidates.length };
  }

  /**
   * 导出面试列表
   */
  async exportInterviews(interviews, filters = {}) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('面试列表');

    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: '候选人', key: 'candidate_name', width: 15 },
      { header: '职位', key: 'position_title', width: 20 },
      { header: '面试官', key: 'interviewer_name', width: 15 },
      { header: '面试日期', key: 'interview_date', width: 15 },
      { header: '面试时间', key: 'interview_time', width: 12 },
      { header: '面试类型', key: 'interview_type', width: 12 },
      { header: '面试地点', key: 'location', width: 30 },
      { header: '会议链接', key: 'meeting_url', width: 40 },
      { header: '状态', key: 'status', width: 12 },
      { header: '反馈状态', key: 'feedback_status', width: 12 },
      { header: '创建时间', key: 'created_at', width: 20 }
    ];

    this.styleHeader(worksheet);

    const typeMap = {
      'online': '线上面试',
      'offline': '现场面试',
      'phone': '电话面试'
    };

    const statusMap = {
      'scheduled': '已安排',
      'confirmed': '已确认',
      'completed': '已完成',
      'cancelled': '已取消'
    };

    const feedbackStatusMap = {
      'pending': '待提交',
      'submitted': '已提交'
    };

    interviews.forEach(interview => {
      worksheet.addRow({
        id: interview.id,
        candidate_name: interview.candidate_name || '',
        position_title: interview.position_title || '',
        interviewer_name: interview.interviewer_name || '',
        interview_date: interview.interview_date || '',
        interview_time: interview.interview_time || '',
        interview_type: typeMap[interview.interview_type] || interview.interview_type || '',
        location: interview.location || '',
        meeting_url: interview.meeting_url || '',
        status: statusMap[interview.status] || interview.status || '',
        feedback_status: feedbackStatusMap[interview.feedback_status] || interview.feedback_status || '',
        created_at: interview.created_at ? new Date(interview.created_at).toLocaleString('zh-CN') : ''
      });
    });

    worksheet.autoFilter = {
      from: 'A1',
      to: `L${interviews.length + 1}`
    };

    const filename = `interviews-${Date.now()}.xlsx`;
    const filepath = path.join(this.exportDir, filename);
    await workbook.xlsx.writeFile(filepath);

    return { filename, filepath, count: interviews.length };
  }

  /**
   * 导出反馈列表
   */
  async exportFeedbacks(feedbacks, filters = {}) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('面试反馈');

    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: '候选人', key: 'candidate_name', width: 15 },
      { header: '职位', key: 'position_title', width: 20 },
      { header: '面试官', key: 'interviewer_name', width: 15 },
      { header: '面试日期', key: 'interview_date', width: 15 },
      { header: '专业能力', key: 'technical_score', width: 12 },
      { header: '沟通能力', key: 'communication_score', width: 12 },
      { header: '综合评分', key: 'overall_score', width: 12 },
      { header: '推荐结果', key: 'recommendation', width: 12 },
      { header: '评价内容', key: 'comments', width: 50 },
      { header: '创建时间', key: 'created_at', width: 20 }
    ];

    this.styleHeader(worksheet);

    const recommendationMap = {
      'strong_hire': '强烈推荐',
      'hire': '推荐',
      'neutral': '中立',
      'no_hire': '不推荐'
    };

    feedbacks.forEach(feedback => {
      worksheet.addRow({
        id: feedback.id,
        candidate_name: feedback.candidate_name || '',
        position_title: feedback.position_title || '',
        interviewer_name: feedback.interviewer_name || '',
        interview_date: feedback.interview_date || '',
        technical_score: feedback.technical_score || 0,
        communication_score: feedback.communication_score || 0,
        overall_score: feedback.overall_score || 0,
        recommendation: recommendationMap[feedback.recommendation] || feedback.recommendation || '',
        comments: feedback.comments || '',
        created_at: feedback.created_at ? new Date(feedback.created_at).toLocaleString('zh-CN') : ''
      });
    });

    worksheet.autoFilter = {
      from: 'A1',
      to: `K${feedbacks.length + 1}`
    };

    const filename = `feedbacks-${Date.now()}.xlsx`;
    const filepath = path.join(this.exportDir, filename);
    await workbook.xlsx.writeFile(filepath);

    return { filename, filepath, count: feedbacks.length };
  }

  /**
   * 导出职位列表
   */
  async exportPositions(positions, filters = {}) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('职位列表');

    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: '职位名称', key: 'title', width: 25 },
      { header: '部门', key: 'department', width: 15 },
      { header: '职位类型', key: 'employment_type', width: 12 },
      { header: '工作地点', key: 'location', width: 20 },
      { header: '薪资范围', key: 'salary_range', width: 15 },
      { header: '工作年限', key: 'experience_required', width: 12 },
      { header: '学历要求', key: 'education_required', width: 12 },
      { header: '状态', key: 'status', width: 12 },
      { header: '创建时间', key: 'created_at', width: 20 }
    ];

    this.styleHeader(worksheet);

    const employmentTypeMap = {
      'full_time': '全职',
      'part_time': '兼职',
      'contract': '合同工',
      'intern': '实习'
    };

    const statusMap = {
      'active': '招聘中',
      'paused': '已暂停',
      'closed': '已关闭'
    };

    positions.forEach(position => {
      worksheet.addRow({
        id: position.id,
        title: position.title || '',
        department: position.department || '',
        employment_type: employmentTypeMap[position.employment_type] || position.employment_type || '',
        location: position.location || '',
        salary_range: position.salary_range || '',
        experience_required: position.experience_required || '',
        education_required: position.education_required || '',
        status: statusMap[position.status] || position.status || '',
        created_at: position.created_at ? new Date(position.created_at).toLocaleString('zh-CN') : ''
      });
    });

    worksheet.autoFilter = {
      from: 'A1',
      to: `J${positions.length + 1}`
    };

    const filename = `positions-${Date.now()}.xlsx`;
    const filepath = path.join(this.exportDir, filename);
    await workbook.xlsx.writeFile(filepath);

    return { filename, filepath, count: positions.length };
  }

  /**
   * 设置表头样式
   */
  styleHeader(worksheet) {
    const headerRow = worksheet.getRow(1);
    headerRow.font = {
      bold: true,
      color: { argb: 'FFFFFFFF' }
    };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    headerRow.alignment = {
      vertical: 'middle',
      horizontal: 'center'
    };
    headerRow.height = 25;

    // 冻结首行
    worksheet.views = [
      { state: 'frozen', xSplit: 0, ySplit: 1 }
    ];
  }

  /**
   * 删除导出文件
   */
  deleteFile(filename) {
    const filepath = path.join(this.exportDir, filename);
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      return true;
    }
    return false;
  }

  /**
   * 获取文件下载路径
   */
  getDownloadUrl(filename) {
    return `/api/exports/download/${filename}`;
  }
}

module.exports = new ExportService();
