/**
 * 批量导入服务
 * 支持从Excel文件批量导入候选人数据
 */

const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const { query } = require('../config/database');

class ImportService {
  constructor() {
    this.importDir = path.join(__dirname, '../../imports');
    this.ensureImportDir();
  }

  /**
   * 确保导入目录存在
   */
  ensureImportDir() {
    if (!fs.existsSync(this.importDir)) {
      fs.mkdirSync(this.importDir, { recursive: true });
    }
  }

  /**
   * 批量导入候选人
   */
  async importCandidates(filepath, options = {}) {
    const { skipDuplicates = true, defaultStatus = 'new' } = options;

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filepath);

    const worksheet = workbook.worksheets[0];

    if (!worksheet) {
      throw new Error('Excel文件为空');
    }

    const results = {
      total: 0,
      success: 0,
      failed: 0,
      skipped: 0,
      errors: []
    };

    const candidates = [];
    let headerRow = null;

    // 查找表头行
    worksheet.eachRow((row, rowNumber) => {
      const firstCell = row.getCell(1).text;
      if (firstCell.includes('姓名') || firstCell.includes('ID') || firstCell === 'id') {
        headerRow = row;
        return false; // 停止迭代
      }
    });

    if (!headerRow) {
      throw new Error('未找到表头行，请确保Excel包含表头');
    }

    // 构建列映射
    const columnMap = {};
    headerRow.eachCell((cell, colNumber) => {
      const header = cell.text.toLowerCase().replace(/[\s_]/g, '');
      if (header.includes('姓名') || header === 'name') columnMap.name = colNumber;
      else if (header.includes('邮箱') || header === 'email') columnMap.email = colNumber;
      else if (header.includes('手机') || header.includes('电话') || header === 'phone') columnMap.phone = colNumber;
      else if (header.includes('学历') || header === 'education') columnMap.education = colNumber;
      else if (header.includes('学校') || header === 'school') columnMap.school = colNumber;
      else if (header.includes('专业') || header === 'major') columnMap.major = colNumber;
      else if (header.includes('工作年限') || header === 'experienceyears' || header === 'experience') columnMap.experience_years = colNumber;
      else if (header.includes('当前公司') || header === 'currentcompany') columnMap.current_company = colNumber;
      else if (header.includes('当前职位') || header === 'currentposition') columnMap.current_position = colNumber;
      else if (header.includes('技能') || header === 'skills') columnMap.skills = colNumber;
    });

    // 读取数据行（从表头下一行开始）
    const startRow = headerRow.number + 1;

    for (let rowNumber = startRow; rowNumber <= worksheet.rowCount; rowNumber++) {
      const row = worksheet.getRow(rowNumber);
      const name = columnMap.name ? row.getCell(columnMap.name).text?.trim() : '';

      // 跳过空行
      if (!name) {
        continue;
      }

      results.total++;

      try {
        const candidate = {
          name: name,
          email: columnMap.email ? row.getCell(columnMap.email).text?.trim() : '',
          phone: columnMap.phone ? row.getCell(columnMap.phone).text?.trim() : '',
          education: columnMap.education ? this.parseEducation(row.getCell(columnMap.education).text) : null,
          school: columnMap.school ? row.getCell(columnMap.school).text?.trim() : '',
          major: columnMap.major ? row.getCell(columnMap.major).text?.trim() : '',
          experience_years: columnMap.experience_years ? this.parseExperience(row.getCell(columnMap.experience_years).text) : 0,
          current_company: columnMap.current_company ? row.getCell(columnMap.current_company).text?.trim() : '',
          current_position: columnMap.current_position ? row.getCell(columnMap.current_position).text?.trim() : '',
          skills: columnMap.skills ? row.getCell(columnMap.skills).text?.trim() : '',
          status: defaultStatus,
          created_at: new Date(),
          updated_at: new Date()
        };

        // 验证必填字段
        if (!candidate.name) {
          throw new Error('姓名不能为空');
        }

        if (!candidate.email && !candidate.phone) {
          throw new Error('邮箱和手机号至少需要填写一个');
        }

        // 检查重复
        if (skipDuplicates) {
          const existing = await query(
            'SELECT id FROM candidates WHERE email = ? OR phone = ?',
            [candidate.email, candidate.phone]
          );

          if (existing.length > 0) {
            results.skipped++;
            results.errors.push({
              row: rowNumber,
              name: candidate.name,
              error: '已存在相同邮箱或手机号的候选人'
            });
            continue;
          }
        }

        candidates.push(candidate);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          row: rowNumber,
          name: name || '未知',
          error: error.message
        });
      }
    }

    // 批量插入数据库
    if (candidates.length > 0) {
      const sql = `
        INSERT INTO candidates (
          name, email, phone, education, school, major,
          experience_years, current_company, current_position,
          skills, status, created_at, updated_at
        ) VALUES ?
      `;

      const values = candidates.map(c => [
        c.name,
        c.email,
        c.phone,
        c.education,
        c.school,
        c.major,
        c.experience_years,
        c.current_company,
        c.current_position,
        c.skills,
        c.status,
        c.created_at,
        c.updated_at
      ]);

      await query(sql, [values]);
    }

    return results;
  }

  /**
   * 解析学历
   */
  parseEducation(text) {
    if (!text) return null;

    const map = {
      '博士': 'phd',
      '硕士': 'master',
      '研究生': 'master',
      '本科': 'bachelor',
      '大专': 'college',
      '专科': 'college',
      '高职': 'college'
    };

    for (const [key, value] of Object.entries(map)) {
      if (text.includes(key)) {
        return value;
      }
    }

    // 检查英文值
    const normalized = text.toLowerCase().trim();
    if (['phd', 'master', 'bachelor', 'college', 'other'].includes(normalized)) {
      return normalized;
    }

    return 'other';
  }

  /**
   * 解析工作年限
   */
  parseExperience(text) {
    if (!text) return 0;

    // 提取数字
    const match = text.match(/(\d+(\.\d+)?)/);
    if (match) {
      return parseFloat(match[1]);
    }

    // 关键字匹配
    if (text.includes('应届') || text.includes('无') || text.includes('0')) {
      return 0;
    }

    if (text.includes('实习')) {
      return 0;
    }

    return 0;
  }

  /**
   * 生成导入模板
   */
  async generateCandidateTemplate() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('候选人导入模板');

    // 设置表头
    worksheet.columns = [
      { header: '姓名*', key: 'name', width: 15 },
      { header: '邮箱*', key: 'email', width: 25 },
      { header: '手机号*', key: 'phone', width: 15 },
      { header: '学历', key: 'education', width: 10 },
      { header: '学校', key: 'school', width: 20 },
      { header: '专业', key: 'major', width: 20 },
      { header: '工作年限', key: 'experience_years', width: 12 },
      { header: '当前公司', key: 'current_company', width: 20 },
      { header: '当前职位', key: 'current_position', width: 20 },
      { header: '技能', key: 'skills', width: 30 }
    ];

    // 添加示例数据
    worksheet.addRow({
      name: '张三',
      email: 'zhangsan@example.com',
      phone: '13800138000',
      education: '本科',
      school: '清华大学',
      major: '计算机科学',
      experience_years: '3',
      current_company: '某科技公司',
      current_position: '前端工程师',
      skills: 'JavaScript, React, Vue'
    });

    worksheet.addRow({
      name: '李四',
      email: 'lisi@example.com',
      phone: '13900139000',
      education: '硕士',
      school: '北京大学',
      major: '软件工程',
      experience_years: '5',
      current_company: '某互联网公司',
      current_position: '后端工程师',
      skills: 'Java, Spring, MySQL'
    });

    // 添加说明工作表
    const infoSheet = workbook.addWorksheet('填写说明');

    const instructions = [
      ['导入说明', ''],
      ['', ''],
      ['必填项', '姓名、邮箱、手机号至少填写一项'],
      ['', ''],
      ['学历选项', '博士、硕士、本科、大专、其他'],
      ['', ''],
      ['工作年限', '填写数字，如：1、2、5等'],
      ['', ''],
      ['注意事项', '1. 姓名不能为空'],
      ['', '2. 邮箱和手机号至少填写一项'],
      ['', '3. 如果启用"跳过重复"，相同邮箱或手机号的记录将被跳过'],
      ['', '4. 学历可以使用中文或英文代码（phd/master/bachelor/college）']
    ];

    instructions.forEach(row => {
      infoSheet.addRow(row);
    });

    // 调整列宽
    infoSheet.getColumn(1).width = 20;
    infoSheet.getColumn(2).width = 50;

    const filename = `candidates-template-${Date.now()}.xlsx`;
    const filepath = path.join(this.importDir, filename);
    await workbook.xlsx.writeFile(filepath);

    return { filename, filepath };
  }

  /**
   * 删除导入文件
   */
  deleteFile(filename) {
    const filepath = path.join(this.importDir, filename);
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      return true;
    }
    return false;
  }
}

module.exports = new ImportService();
