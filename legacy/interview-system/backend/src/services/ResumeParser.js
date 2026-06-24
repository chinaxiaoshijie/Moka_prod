const fs = require('fs');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const XLSX = require('xlsx');
const path = require('path');

/**
 * 简历解析服务
 */
class ResumeParser {
  /**
   * 解析PDF文件
   */
  static async parsePDF(filePath) {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdf(dataBuffer);
      return {
        text: data.text,
        numpages: data.numpages,
        info: data.info
      };
    } catch (error) {
      console.error('PDF解析错误:', error);
      throw new Error('PDF文件解析失败');
    }
  }

  /**
   * 解析Word文档
   */
  static async parseWord(filePath) {
    try {
      const result = await mammoth.extractRawText({ path: filePath });
      return {
        text: result.value,
        messages: result.messages
      };
    } catch (error) {
      console.error('Word文档解析错误:', error);
      throw new Error('Word文档解析失败');
    }
  }

  /**
   * 从简历文本中提取候选人信息
   */
  static extractCandidateInfo(text, filename) {
    const info = {
      name: '',
      email: '',
      phone: '',
      education: '',
      school: '',
      experience: 0,
      skills: '',
      currentCompany: '',
      currentPosition: ''
    };

    try {
      // 提取邮箱
      const emailMatch = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9.-]+)/g);
      if (emailMatch && emailMatch.length > 0) {
        info.email = emailMatch[0];
      }

      // 提取手机号
      const phoneMatch = text.match(/1[3-9]\d{9}/g);
      if (phoneMatch && phoneMatch.length > 0) {
        info.phone = phoneMatch[0];
      }

      // 提取学历关键词
      const educationKeywords = ['博士', '硕士', '研究生', '本科', '大专', '专科', '高中', '初中'];
      for (const keyword of educationKeywords) {
        if (text.includes(keyword)) {
          if (keyword === '研究生') {
            info.education = 'master';
          } else if (keyword === '大专' || keyword === '专科') {
            info.education = 'associate';
          } else if (keyword === '高中') {
            info.education = 'high_school';
          } else {
            info.education = keyword === '本科' ? 'bachelor' :
                         keyword === '硕士' ? 'master' :
                         keyword === '博士' ? 'doctor' : 'bachelor';
          }
          break;
        }
      }

      // 提取学校
      const schoolPatterns = [
        /(?:毕业于|毕业院校|教育经历).*?([^\s\n，。]{2,20}(?:大学|学院|学校))/g,
        /([^\s\n，。]{2,20}(?:大学|学院|学校)).*?(?:教育|学习|就读)/g
      ];

      for (const pattern of schoolPatterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
          info.school = match[1].trim();
          break;
        }
      }

      // 提取工作年限
      const expPatterns = [
        /(\d+)[\s年]*(?:工作|经验|工作经验)/,
        /(?:工作|经验|工作经验)[\s年]*(\d+)/
      ];

      for (const pattern of expPatterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
          info.experience = parseInt(match[1]);
          break;
        }
      }

      // 提取技能关键词
      const skillKeywords = [
        'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'Go', 'Rust',
        'React', 'Vue', 'Angular', 'Node.js', 'Express', 'Koa',
        'MySQL', 'PostgreSQL', 'MongoDB', 'Redis',
        'Docker', 'Kubernetes', 'AWS', '阿里云',
        'Git', 'Linux', 'Nginx'
      ];

      const foundSkills = skillKeywords.filter(skill =>
        text.toLowerCase().includes(skill.toLowerCase())
      );
      info.skills = foundSkills.join('、');

      // 提取当前公司
      const companyPatterns = [
        /(?:现任|目前|当前|在职).*?([^\s\n，。]{2,30}(?:公司|科技有限公司|网络科技|技术有限公司))/g,
        /([^\s\n，。]{2,30}(?:公司|科技有限公司|网络科技|技术有限公司)).*?(?:现任|目前|当前|在职)/g
      ];

      for (const pattern of companyPatterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
          info.currentCompany = match[1].trim();
          break;
        }
      }

      // 提取当前职位
      const positionPatterns = [
        /(?:现任|目前|当前|在职).*?([^\s\n，。]{2,30}(?:工程师|开发|经理|总监|专家))/g,
        /([^\s\n，。]{2,30}(?:工程师|开发|经理|总监|专家)).*?(?:现任|目前|当前|在职)/g
      ];

      for (const pattern of positionPatterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
          info.currentPosition = match[1].trim();
          break;
        }
      }

      // 如果文件名包含人名（中文姓名通常2-4个字符）
      const nameMatch = filename.match(/^([\u4e00-\u9fa5]{2,4})/);
      if (nameMatch) {
        info.name = nameMatch[1];
      }

    } catch (error) {
      console.error('提取候选人信息错误:', error);
    }

    return info;
  }

  /**
   * 统一解析接口
   */
  static async parse(filePath, filename) {
    const ext = path.extname(filename).toLowerCase();

    let result = {
      success: false,
      text: '',
      metadata: {}
    };

    try {
      if (ext === '.pdf') {
        const pdfData = await this.parsePDF(filePath);
        result.text = pdfData.text;
        result.metadata = {
          type: 'pdf',
          pages: pdfData.numpages
        };
      } else if (ext === '.doc' || ext === '.docx') {
        const wordData = await this.parseWord(filePath);
        result.text = wordData.text;
        result.metadata = {
          type: 'word'
        };
      } else {
        throw new Error('不支持的文件类型');
      }

      // 提取候选人信息
      result.candidateInfo = this.extractCandidateInfo(result.text, filename);
      result.success = true;

    } catch (error) {
      console.error('简历解析错误:', error);
      result.error = error.message;
    }

    return result;
  }

  /**
   * 删除文件
   */
  static async deleteFile(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return { success: true };
      }
      return { success: true, message: '文件不存在' };
    } catch (error) {
      console.error('删除文件错误:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 获取文件大小
   */
  static getFileSize(filePath) {
    try {
      const stats = fs.statSync(filePath);
      return stats.size;
    } catch (error) {
      return 0;
    }
  }

  /**
   * 格式化文件大小
   */
  static formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

module.exports = ResumeParser;
