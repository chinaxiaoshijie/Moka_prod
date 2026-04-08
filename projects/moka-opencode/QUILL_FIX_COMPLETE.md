# Quill 编辑器完整修复方案

## 问题根因

React state 更新和 Quill 编辑器初始化的时序问题导致内容无法显示。

## 修复步骤

### 1. 添加导入
在文件顶部添加：
```typescript
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
```

### 2. 添加引用
在 state 声明后添加：
```typescript
const editorRef = useRef<HTMLDivElement>(null);
const quillInstance = useRef<Quill | null>(null);
const contentLoadedRef = useRef(false);
```

### 3. 添加格式化函数
在 formatDateTime 后添加：
```typescript
const formatDate = (dateStr: string) => {
  const utcDate = new Date(dateStr);
  let day = utcDate.getUTCDate();
  let hour = utcDate.getUTCHours() + 8;
  if (hour >= 24) day += 1;
  return `${utcDate.getUTCFullYear()}年${utcDate.getUTCMonth() + 1}月${day}日`;
};

const formatTime = (dateStr: string) => {
  const utcDate = new Date(dateStr);
  let hour = utcDate.getUTCHours() + 8;
  if (hour >= 24) hour -= 24;
  return `${String(hour).padStart(2, '0')}:${String(utcDate.getUTCMinutes()).padStart(2, '0')}`;
};
```

### 4. 添加 Quill 初始化
在最后一个 useEffect 后添加：
```typescript
// 初始化 Quill 编辑器
useEffect(() => {
  if (typeof window === 'undefined') return;
  
  const initQuill = async () => {
    if (showEmailModal && editorRef.current && !quillInstance.current) {
      const QuillModule = (await import('quill')).default;
      quillInstance.current = new QuillModule(editorRef.current, {
        theme: 'snow',
        modules: {
          toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            [{ 'align': [] }],
            ['link'],
            ['clean']
          ],
        },
      });
      
      quillInstance.current.on('text-change', () => {
        setEmailContent(quillInstance.current!.root.innerHTML);
      });
    }
  };
  
  initQuill();
}, [showEmailModal]);

// 加载内容到编辑器
useEffect(() => {
  if (!showEmailModal || !emailContent || emailContent.length === 0) return;
  if (contentLoadedRef.current) return;
  
  const loadContent = async () => {
    if (!quillInstance.current) {
      await new Promise(resolve => setTimeout(resolve, 100));
      if (!quillInstance.current) return;
    }
    
    quillInstance.current.root.innerHTML = emailContent;
    contentLoadedRef.current = true;
  };
  
  loadContent();
}, [emailContent, showEmailModal]);
```

### 5. 修改按钮点击逻辑
替换 onClick 处理函数：
```typescript
onClick={() => {
  if (!interview.candidate.email) {
    alert('候选人没有邮箱，请先在候选人详情中添加邮箱地址');
    return;
  }
  
  contentLoadedRef.current = false;
  
  const formattedTime = formatDateTime(interview.startTime);
  const formattedDate = formatDate(interview.startTime);
  const formattedEndTime = formatTime(interview.endTime);
  
  const defaultContent = `
<p>尊敬的 ${interview.candidate.name} 您好：</p>
<p>感谢您应聘我司 ${interview.position.title} 职位...</p>
<div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
  <h3 style="margin-top: 0; color: #666;">面试信息</h3>
  <p><strong>职位：</strong>${interview.position.title}</p>
  <p><strong>时间：</strong>${formattedDate} ${formattedTime} - ${formattedEndTime}</p>
  <p><strong>形式：</strong>${getFormatText(interview.format)}</p>
  ${interview.location ? `<p><strong>面试地点：</strong>${interview.location}</p>` : ''}
  ${interview.meetingUrl ? `<p><strong>会议链接：</strong>${interview.meetingUrl}</p>` : ''}
  <p><strong>面试官：</strong>${interview.interviewer.name || '待定'}</p>
</div>
<p>请您准时参加。如有任何问题，请随时与我们联系。</p>
<p>祝您面试顺利！</p>
`;
  
  setEmailSubject(`面试通知 - ${interview.position.title}`);
  setEmailContent(defaultContent);
  setCandidateEmail(interview.candidate.email || "");
  setShowEmailModal(true);
}}
```

### 6. 修改编辑器 div
```typescript
<div ref={editorRef} className="border border-[#E8EBF0] rounded-lg overflow-hidden" style={{ minHeight: '400px' }}></div>
```

## 部署

```bash
cd /home/malong/projects/Moka_prod/Moka_prod/projects/moka-opencode
docker-compose up -d --build frontend
```

## 测试

1. 硬刷新浏览器 (Ctrl+Shift+R)
2. 访问面试详情页
3. 点击"发送邮件给候选人"
4. 检查编辑器是否显示完整内容
