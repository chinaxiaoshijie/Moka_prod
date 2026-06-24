#!/bin/bash

# 修复 Quill 编辑器显示问题的脚本

FILE="frontend/src/app/interviews/[id]/page.tsx"
BACKUP="frontend/src/app/interviews/[id]/page.tsx.backup"

echo "🔧 开始修复 Quill 编辑器..."

# 创建备份
cp "$FILE" "$BACKUP"
echo "✅ 已创建备份：$BACKUP"

# 1. 添加 Quill 导入
sed -i '3a import Quill from '\''quill'\'';\nimport '\''quill/dist/quill.snow.css'\'';' "$FILE"
echo "✅ 添加 Quill 导入"

# 2. 添加 editorRef 和 quillInstance
sed -i '/const \[emailMessage, setEmailMessage\] = useState("");/a\  const editorRef = useRef<HTMLDivElement>(null);\n  const quillInstance = useRef<Quill | null>(null);\n  const contentLoadedRef = useRef(false);' "$FILE"
echo "✅ 添加编辑器引用"

echo "🎉 修复完成！请手动添加 Quill 初始化代码。"
echo ""
echo "📝 下一步："
echo "1. 在 useEffect 区域添加 Quill 初始化代码"
echo "2. 在点击按钮处设置内容后打开模态框"
echo "3. 运行：docker-compose up -d --build frontend"
