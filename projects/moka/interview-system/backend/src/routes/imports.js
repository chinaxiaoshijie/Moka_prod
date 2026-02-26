/**
 * 批量导入API路由
 */

const express = require('express');
const router = express.Router();
const importService = require('../services/ImportService');
const multer = require('multer');
const path = require('path');

// 配置文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../imports'));
  },
  filename: (req, file, cb) => {
    const uniqueName = `import-${Date.now()}-${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== '.xlsx' && ext !== '.xls') {
      return cb(new Error('只支持Excel文件格式（.xlsx, .xls）'));
    }
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

/**
 * 批量导入候选人
 * POST /api/imports/candidates
 */
router.post('/candidates', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '请上传Excel文件'
      });
    }

    const { skip_duplicates = 'true', default_status = 'new' } = req.body;

    const options = {
      skipDuplicates: skip_duplicates === 'true',
      defaultStatus: default_status
    };

    const results = await importService.importCandidates(req.file.path, options);

    // 删除上传的临时文件
    importService.deleteFile(req.file.filename);

    res.json({
      success: true,
      message: '导入完成',
      data: results
    });
  } catch (error) {
    console.error('导入候选人失败:', error);

    // 删除上传的临时文件
    if (req.file) {
      importService.deleteFile(req.file.filename);
    }

    res.status(500).json({
      success: false,
      message: '导入失败: ' + error.message
    });
  }
});

/**
 * 下载候选人导入模板
 * GET /api/imports/candidates-template
 */
router.get('/candidates-template', async (req, res) => {
  try {
    const { filename, filepath } = await importService.generateCandidateTemplate();

    res.download(filepath, filename, (err) => {
      if (err) {
        console.error('模板下载失败:', err);
      }

      // 删除临时文件
      setTimeout(() => {
        importService.deleteFile(filename);
      }, 5000);
    });
  } catch (error) {
    console.error('生成模板失败:', error);
    res.status(500).json({
      success: false,
      message: '生成模板失败: ' + error.message
    });
  }
});

module.exports = router;
