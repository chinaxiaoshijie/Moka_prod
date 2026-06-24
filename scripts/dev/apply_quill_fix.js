const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend/src/app/interviews/[id]/page.tsx');
const backupPath = filePath + '.backup2';

console.log('🔧 开始修复 Quill 编辑器...\n');

// 读取文件
let content = fs.readFileSync(filePath, 'utf-8');

// 创建备份
fs.writeFileSync(backupPath, content);
console.log('✅ 已创建备份:', backupPath);

// 1. 添加导入
if (!content.includes('import Quill')) {
  content = content.replace(
    'import { useState, useEffect, useRef } from "react";',
    'import Quill from \'quill\';\nimport \'quill/dist/quill.snow.css\';\n\nimport { useState, useEffect, useRef } from "react";'
  );
  console.log('✅ 添加 Quill 导入');
}

// 2. 添加引用
if (!content.includes('editorRef')) {
  content = content.replace(
    'const [emailMessage, setEmailMessage] = useState("");',
    'const [emailMessage, setEmailMessage] = useState("");\n  const editorRef = useRef<HTMLDivElement>(null);\n  const quillInstance = useRef<Quill | null>(null);\n  const contentLoadedRef = useRef(false);'
  );
  console.log('✅ 添加编辑器引用');
}

// 3. 添加格式化函数
if (!content.includes('const formatDate')) {
  const formatFunctions = `
  const formatDate = (dateStr: string) => {
    const utcDate = new Date(dateStr);
    let day = utcDate.getUTCDate();
    let hour = utcDate.getUTCHours() + 8;
    if (hour >= 24) day += 1;
    return \`\${utcDate.getUTCFullYear()}年\${utcDate.getUTCMonth() + 1}月\${day}日\`;
  };

  const formatTime = (dateStr: string) => {
    const utcDate = new Date(dateStr);
    let hour = utcDate.getUTCHours() + 8;
    if (hour >= 24) hour -= 24;
    return \`\${String(hour).padStart(2, '0')}:\${String(utcDate.getUTCMinutes()).padStart(2, '0')}\`;
  };

`;
  // 在 formatDateTime 后添加
  const formatDateTimeEnd = content.indexOf('};', content.indexOf('const formatDateTime'));
  if (formatDateTimeEnd !== -1) {
    content = content.slice(0, formatDateTimeEnd + 2) + formatFunctions + content.slice(formatDateTimeEnd + 2);
    console.log('✅ 添加 formatDate 和 formatTime 函数');
  }
}

// 保存文件
fs.writeFileSync(filePath, content);
console.log('\n✅ 文件已更新');
console.log('\n📝 下一步请手动添加:');
console.log('1. Quill 初始化 useEffect');
console.log('2. 内容加载 useEffect');
console.log('3. 修改按钮点击逻辑');
console.log('4. 修改编辑器 div 添加 ref');
console.log('\n📖 详细说明请查看：QUILL_FIX_COMPLETE.md');
