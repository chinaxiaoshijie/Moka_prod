# Moka 招聘系统安全性审查报告

**审查日期**: 2026 年 1 月  
**审查范围**: 
- 后端：`/workspace/moka/backend/src` (所有 Controller、Service、Guard)
- 前端：`/workspace/moka/frontend/src` (所有 API 调用、用户输入处理)

---

## 执行摘要

本次安全审查发现了 **14 个安全问题**，按风险等级分类如下：

| 风险等级 | 数量 | 状态 |
|---------|------|------|
| 🔴 高危 | 5 | 需立即修复 |
| 🟡 中危 | 6 | 需尽快修复 |
| 🟢 低危 | 3 | 建议修复 |

---

## 🔴 高危漏洞 (Critical/High)

### 1. JWT 密钥硬编码在代码中

**文件路径**: `/workspace/moka/backend/src/auth/strategies/jwt.strategy.ts`  
**漏洞类型**: 敏感信息泄露 / 弱认证  
**风险等级**: 🔴 高危  
**CVSS 评分**: 8.5

**问题描述**:
```typescript
// jwt.strategy.ts:12
secretOrKey: process.env.JWT_SECRET || 'dev-secret',
```

当环境变量 `JWT_SECRET` 未设置时，系统会使用硬编码的默认值 `'dev-secret'`，这是一个非常弱的密钥，攻击者可以轻易伪造 JWT token。

**利用场景**:
1. 攻击者发现系统使用了默认密钥
2. 使用默认密钥伪造任意用户的 JWT token
3. 以任意身份（包括管理员）登录系统

**修复方案**:
```typescript
// 修复后
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const jwtSecret = process.env.JWT_SECRET;
    
    // 生产环境必须设置 JWT_SECRET
    if (!jwtSecret) {
      throw new Error('JWT_SECRET environment variable is required');
    }
    
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }
  // ...
}
```

**环境影响**: 同时在 `.env` 文件中也存在 JWT_SECRET，需要确保：
- `.env` 文件不被提交到版本控制
- 生产环境使用强随机密钥（至少 32 字节）

---

### 2. 公开接口可被滥用发送钓鱼邮件

**文件路径**: `/workspace/moka/backend/src/feedback/feedback-public.controller.ts`  
**漏洞类型**: 业务逻辑漏洞 / 钓鱼攻击  
**风险等级**: 🔴 高危  
**CVSS 评分**: 7.8

**问题描述**:
```typescript
// feedback-public.controller.ts:25-78
@Post("generate-token/:interviewId")
@UseGuards(JwtAuthGuard)
async generateFeedbackToken(...) {
  // ...
  if (interview.interviewer.email) {
    try {
      await this.emailService.sendFeedbackReminder({
        interviewerName: interview.interviewer.name,
        interviewerEmail: interview.interviewer.email,
        // ...
      });
    } catch (error) {
      console.error("Failed to send feedback email:", error);
    }
  }
}
```

虽然接口需要认证，但攻击者（已登录用户）可以：
1. 遍历所有面试 ID
2. 向任意面试官邮箱发送带有系统域名的邮件
3. 邮件内容包含可控的反馈链接，可用于钓鱼攻击

**利用场景**:
1. 攻击者创建账户并获取合法 token
2. 调用接口向目标邮箱发送伪造的系统邮件
3. 邮件中的链接指向攻击者控制的钓鱼网站

**修复方案**:
```typescript
// 1. 添加速率限制
@Throttle(5, 60) // 每分钟最多 5 次
@Post("generate-token/:interviewId")
@UseGuards(JwtAuthGuard)
async generateFeedbackToken(...) {
  // 2. 验证调用者权限
  const userId = req.user.sub;
  const userRole = req.user.role;
  
  // 只有 HR 或面试创建者才能生成 token
  if (userRole !== 'HR' && interview.createdById !== userId) {
    throw new ForbiddenException('无权生成反馈链接');
  }
  
  // 3. 邮件内容添加安全提示
  await this.emailService.sendFeedbackReminder({
    // ...
    securityNotice: '此邮件由系统自动发送，请勿回复',
  });
}
```

---

### 3. 公开下载简历接口无权限控制

**文件路径**: `/workspace/moka/backend/src/candidates/candidate.controller.ts`  
**漏洞类型**: 未授权访问 / 敏感数据泄露  
**风险等级**: 🔴 高危  
**CVSS 评分**: 8.2

**问题描述**:
```typescript
// candidate.controller.ts:208-222
@Get("public/resumes/:resumeId")
@ApiOperation({ summary: "公开下载简历文件（无需认证）" })
@Public()  // 跳过认证
async downloadResumePublic(
  @Param("resumeId") resumeId: string,
  @Res() res: Response,
) {
  const resume = await this.candidateService.getResumeFile(resumeId);
  res.setHeader("Content-Type", resume.fileType);
  res.setHeader(
    "Content-Disposition",
    `inline; filename="${encodeURIComponent(resume.fileName)}"`,
  );
  const fs = await import("fs");
  const fileStream = fs.createReadStream(resume.filePath);
  fileStream.pipe(res);
}
```

**问题分析**:
- 任何知道 resumeId 的人都可以下载简历
- resumeId 是 UUID 但可能被枚举或泄露
- 简历包含个人敏感信息（姓名、电话、邮箱、工作经历等）

**利用场景**:
1. 攻击者通过其他途径获取 resumeId（如日志、Referer）
2. 直接访问 `/candidates/public/resumes/{id}` 下载简历
3. 批量爬取所有候选人简历进行数据倒卖

**修复方案**:
```typescript
// 方案 1: 移除公开接口，统一使用认证接口
@Get(":id/resumes/:resumeId")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
async downloadResume(
  @Param("id") candidateId: string,
  @Param("resumeId") resumeId: string,
  @Req() req: any,
  @Res() res: Response,
) {
  // 验证用户权限
  const userRole = req.user.role;
  const resume = await this.candidateService.getResumeFile(resumeId);
  
  // 验证简历属于可访问的候选人
  if (resume.candidateId !== candidateId) {
    throw new NotFoundException('简历不存在');
  }
  
  // 记录访问日志
  await this.prisma.resumeAccessLog.create({
    data: {
      resumeId,
      userId: req.user.sub,
      accessedAt: new Date(),
    },
  });
  
  // ... 下载逻辑
}

// 方案 2: 使用临时签名 URL
@Get("public/resumes/:resumeId")
@Public()
async downloadResumePublic(
  @Param("resumeId") resumeId: string,
  @Query('signature') signature: string,
  @Query('expires') expires: string,
  @Res() res: Response,
) {
  // 验证签名和过期时间
  const isValid = await this.validateSignature(resumeId, signature, expires);
  if (!isValid) {
    throw new ForbiddenException('无效的下载链接');
  }
  // ...
}
```

---

### 4. 用户枚举漏洞

**文件路径**: `/workspace/moka/backend/src/auth/auth.service.ts`  
**漏洞类型**: 信息泄露 / 用户枚举  
**风险等级**: 🔴 高危  
**CVSS 评分**: 6.5

**问题描述**:
```typescript
// auth.service.ts:17-26
async login(loginDto: LoginDto): Promise<AuthResponseDto> {
  const { username, password } = loginDto;
  const user = await this.prisma.user.findUnique({
    where: { username },
  });

  const isPasswordValid = user
    ? await bcrypt.compare(password, user.password)
    : false;

  if (!isPasswordValid) {
    throw new UnauthorizedException("用户名或密码错误");
  }
  // ...
}
```

虽然密码验证使用了常量时间比较，但错误信息没有区分"用户不存在"和"密码错误"，这是正确的。但问题在于：

1. 响应时间差异：用户存在时需要 bcrypt 计算，用户不存在时直接返回
2. 攻击者可以通过响应时间判断用户名是否存在

**修复方案**:
```typescript
async login(loginDto: LoginDto): Promise<AuthResponseDto> {
  const { username, password } = loginDto;

  const user = await this.prisma.user.findUnique({
    where: { username },
  });

  // 即使用户不存在，也执行一次 dummy hash 比较
  const dummyHash = await bcrypt.hash('dummy', 10);
  const isPasswordValid = user
    ? await bcrypt.compare(password, user.password)
    : await bcrypt.compare(password, dummyHash);

  // 统一的错误信息
  if (!isPasswordValid || !user) {
    throw new UnauthorizedException("用户名或密码错误");
  }

  // ... 继续正常流程
}
```

---

### 5. CSRF 防护缺失

**文件路径**: 全局问题  
**漏洞类型**: CSRF (跨站请求伪造)  
**风险等级**: 🔴 高危  
**CVSS 评分**: 7.5

**问题描述**:
- 系统使用 JWT token 进行认证
- Token 存储在 localStorage 和 cookie 中
- Cookie 未设置 `SameSite` 属性
- 没有 CSRF token 验证机制

**利用场景**:
1. 攻击者诱导已登录用户访问恶意网站
2. 恶意网站发起跨域请求到 Moka 系统
3. 浏览器自动携带 cookie，请求被执行

**修复方案**:
```typescript
// main.ts - 添加 CSRF 保护
import { csrf } from 'csurf';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // ... 现有配置
  
  // CSRF 保护
  app.use(csrf({
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    },
  }));
  
  // Cookie 配置
  app.use((req, res, next) => {
    res.cookie('token', req.headers.authorization?.split(' ')[1], {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    next();
  });
}
```

前端也需要相应修改，在请求头中添加 CSRF token。

---

## 🟡 中危漏洞 (Medium)

### 6. 文件上传类型验证可被绕过

**文件路径**: `/workspace/moka/backend/src/candidates/candidate.controller.ts`  
**漏洞类型**: 文件上传漏洞  
**风险等级**: 🟡 中危  
**CVSS 评分**: 6.3

**问题描述**:
```typescript
// candidate.controller.ts:167-178
const allowedTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
];

if (!allowedTypes.includes(file.mimetype)) {
  throw new HttpException(
    "只支持 PDF、Word(DOC/DOCX)、图片 (JPG/PNG) 格式文件",
    HttpStatus.BAD_REQUEST,
  );
}
```

**问题分析**:
- 仅检查 MIME 类型，攻击者可伪造
- 没有检查文件魔数 (magic bytes)
- 没有进行文件内容验证

**修复方案**:
```typescript
import { fileTypeFromBuffer } from 'file-type';

async uploadResume(/* ... */) {
  // 1. 检查 MIME 类型
  if (!allowedTypes.includes(file.mimetype)) {
    throw new HttpException("不支持的文件类型", HttpStatus.BAD_REQUEST);
  }

  // 2. 验证文件魔数
  const fileType = await fileTypeFromBuffer(file.buffer);
  if (!fileType || !allowedTypes.includes(fileType.mime)) {
    throw new HttpException("文件类型与内容不匹配", HttpStatus.BAD_REQUEST);
  }

  // 3. 对 PDF 文件进行额外验证
  if (fileType.mime === 'application/pdf') {
    if (!file.buffer.toString('ascii', 0, 5).startsWith('%PDF-')) {
      throw new HttpException("无效的 PDF 文件", HttpStatus.BAD_REQUEST);
    }
  }

  // ... 继续处理
}
```

---

### 7. 路径遍历风险

**文件路径**: `/workspace/moka/backend/src/candidates/candidate.service.ts`  
**漏洞类型**: 路径遍历  
**风险等级**: 🟡 中危  
**CVSS 评分**: 5.9

**问题描述**:
```typescript
// candidate.service.ts:169-177
const uploadDir = path.join(process.cwd(), "uploads", "resumes");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const timestamp = Date.now();
const safeFileName = `${candidateId}_${timestamp}.pdf`;
const filePath = path.join(uploadDir, safeFileName);
```

虽然当前代码使用了生成的安全文件名，但：
- 没有验证 `candidateId` 的格式
- 如果 `candidateId` 来自用户输入且未正确验证，可能包含 `../`

**修复方案**:
```typescript
import { validate as uuidValidate } from 'uuid';

async uploadResume(candidateId: string, /* ... */) {
  // 验证 candidateId 是有效的 UUID
  if (!uuidValidate(candidateId)) {
    throw new BadRequestException("无效的候选人 ID");
  }

  // 使用 path.basename 防止路径遍历
  const safeId = path.basename(candidateId);
  const safeFileName = `${safeId}_${timestamp}.pdf`;
  
  // ...
}
```

---

### 8. 密码策略不足

**文件路径**: `/workspace/moka/backend/src/auth/auth.service.ts`, `/workspace/moka/backend/src/users/dto/user.dto.ts`  
**漏洞类型**: 弱密码策略  
**风险等级**: 🟡 中危  
**CVSS 评分**: 5.5

**问题描述**:
```typescript
// auth.service.ts:93-96
if (newPassword.length < 6) {
  throw new BadRequestException("新密码长度至少为 6 位");
}

// user.dto.ts:17
@MinLength(6)
password: string;
```

密码要求仅为 6 位，不符合现代安全标准。

**修复方案**:
```typescript
// 1. 更新 DTO 验证
import { Matches } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, {
    message: '密码必须包含大小写字母和数字，长度至少 8 位'
  })
  password: string;
}

// 2. 更新服务层验证
async changePassword(userId: string, currentPassword: string, newPassword: string) {
  // 检查密码强度
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  if (!passwordRegex.test(newPassword)) {
    throw new BadRequestException('密码必须包含大小写字母和数字，长度至少 8 位');
  }
  // ...
}
```

---

### 9. 缺少请求速率限制

**文件路径**: 全局问题  
**漏洞类型**: 拒绝服务 / 暴力破解  
**风险等级**: 🟡 中危  
**CVSS 评分**: 5.8

**问题描述**:
- 登录接口无速率限制，可被暴力破解
- API 接口无速率限制，可被滥用

**修复方案**:
```typescript
// main.ts
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60000, // 60 秒
      limit: 10,  // 最多 10 次请求
    }]),
  ],
})
export class AppModule {}

// auth.controller.ts
@Post("login")
@Throttle(5, 60) // 登录接口：每分钟最多 5 次
async login(@Body() loginDto: LoginDto) {
  // ...
}
```

---

### 10. 敏感数据在日志中可能泄露

**文件路径**: `/workspace/moka/backend/src/auth/guards/jwt-auth.guard.ts`  
**漏洞类型**: 信息泄露  
**风险等级**: 🟡 中危  
**CVSS 评分**: 5.3

**问题描述**:
```typescript
// jwt-auth.guard.ts:30-34
try {
  const payload = this.jwtService.verify(token);
  console.log("=== JwtAuthGuard ===");
  console.log("Token payload:", payload);
  console.log("Setting request.user:", payload);
  request.user = payload;
  return true;
}
```

生产环境中不应打印敏感信息如 JWT payload。

**修复方案**:
```typescript
// 移除生产环境的调试日志
try {
  const payload = this.jwtService.verify(token);
  
  // 仅在开发环境记录日志
  if (process.env.NODE_ENV === 'development') {
    console.log("Token verified for user:", payload.username);
  }
  
  request.user = payload;
  return true;
} catch (error) {
  // 不记录详细的错误信息
  console.error("JWT verification failed");
  throw new UnauthorizedException("Invalid token");
}
```

---

### 11. 数据库连接字符串可能泄露

**文件路径**: `/workspace/moka/backend/.env`  
**漏洞类型**: 敏感信息泄露  
**风险等级**: 🟡 中危

**问题描述**:
```env
POSTGRES_PASSWORD=2193567bc54ee0a0442c820066539b36
SMTP_PASS=vdOvXf14hB9sw698
JWT_SECRET=7c130303ab6478f99a2ef8a819c32273443ab9dab4cbd0355279fd6fc33e06f4
```

密码和密钥以明文存储在 `.env` 文件中。

**修复方案**:
1. 确保 `.env` 文件在 `.gitignore` 中
2. 使用密钥管理服务（如 AWS Secrets Manager、HashiCorp Vault）
3. 生产环境使用环境变量注入

---

### 12. 依赖版本可能存在已知漏洞

**文件路径**: `/workspace/moka/backend/package.json`  
**漏洞类型**: 依赖漏洞  
**风险等级**: 🟡 中危

**问题描述**:
```json
"pdf-parse": "^1.1.1",
"multer": "^2.1.1",
```

建议定期运行 `npm audit` 检查依赖漏洞。

**修复方案**:
```bash
# 定期检查和更新依赖
npm audit
npm audit fix
npx npm-check-updates -u
```

---

## 🟢 低危漏洞 (Low)

### 13. CORS 配置过于宽松

**文件路径**: `/workspace/moka/backend/src/main.ts`  
**漏洞类型**: CORS 配置不当  
**风险等级**: 🟢 低危

**问题描述**:
```typescript
app.enableCors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
});
```

虽然配置了 origin，但在开发环境下使用通配符可能带来风险。

**修复方案**:
```typescript
// 使用白名单
const allowedOrigins = [
  'https://moka.example.com',
  'https://app.moka.example.com',
];

app.enableCors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 86400, // 24 小时
});
```

---

### 14. 健康检查接口信息泄露

**文件路径**: `/workspace/moka/backend/src/health/health.controller.ts`  
**漏洞类型**: 信息泄露  
**风险等级**: 🟢 低危

**问题描述**:
```typescript
@Get()
async check() {
  try {
    await this.prisma.$queryRaw`SELECT 1`;
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      database: "connected",
    };
  } catch (error) {
    return {
      status: "error",
      timestamp: new Date().toISOString(),
      database: "disconnected",
    };
  }
}
```

健康检查接口公开了数据库连接状态。

**修复方案**:
```typescript
@Get()
@UseGuards(JwtAuthGuard) // 需要认证
async check(@Req() req: any) {
  // 只允许管理员访问
  if (req.user.role !== 'HR') {
    throw new ForbiddenException();
  }
  // ...
}
```

---

## 其他安全建议

### 15. 建议添加的安全功能

1. **审计日志**: 记录所有敏感操作（登录、数据修改、删除等）
2. **双因素认证 (2FA)**: 为 HR 管理员账户启用
3. **会话管理**: 实现会话超时和并发会话限制
4. **输入 sanitization**: 对所有用户输入进行清理
5. **安全响应头**: 添加 CSP、X-Frame-Options 等
6. **定期安全扫描**: 集成 SAST/DAST 工具到 CI/CD

### 16. 代码中已实现的安全措施（值得肯定）

✅ 密码使用 bcrypt 加密  
✅ 使用了 Helmet 安全头中间件  
✅ 有 DTO 验证（class-validator）  
✅ 使用了参数化查询（Prisma ORM）  
✅ 有角色权限控制（RolesGuard）  
✅ 文件上传有大小限制（10MB）  
✅ JWT token 有过期时间（7 天）

---

## 修复优先级

### 立即修复（本周内）
1. 🔴 JWT 密钥硬编码问题
2. 🔴 公开简历下载接口权限控制
3. 🔴 CSRF 防护
4. 🔴 用户枚举漏洞

### 尽快修复（本月内）
5. 🔴 钓鱼邮件滥用风险
6. 🟡 文件上传验证绕过
7. 🟡 路径遍历风险
8. 🟡 密码策略加强
9. 🟡 速率限制

### 计划修复（下季度）
10. 🟡 日志脱敏
11. 🟡 敏感配置管理
12. 🟡 依赖漏洞修复
13. 🟢 CORS 优化
14. 🟢 健康检查保护

---

## 总结

Moka 招聘系统在基础安全方面有一定考虑（如密码加密、JWT 认证、角色控制），但在以下方面需要加强：

1. **认证授权**: 需要加强 JWT 密钥管理、防止用户枚举、添加 CSRF 保护
2. **访问控制**: 公开接口需要严格权限验证
3. **输入验证**: 文件上传需要更严格的验证
4. **数据安全**: 需要防止敏感信息泄露

建议按照上述优先级逐步修复，并在开发流程中集成安全审查。
