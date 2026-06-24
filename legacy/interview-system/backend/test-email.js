require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('📧 测试QQ邮箱SMTP配置\n');
console.log('配置信息:');
console.log('  HOST:', process.env.EMAIL_HOST);
console.log('  PORT:', process.env.EMAIL_PORT);
console.log('  SECURE:', process.env.EMAIL_SECURE);
console.log('  USER:', process.env.EMAIL_USER);
console.log('  FROM:', process.env.EMAIL_FROM);
console.log('');

const config = {
  host: process.env.EMAIL_HOST || 'smtp.qq.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === 'true',
  requireTLS: process.env.EMAIL_PORT === '587',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
};

console.log('🔄 正在连接SMTP服务器...');

const transporter = nodemailer.createTransport(config);

transporter.verify(function(error, success) {
  if (error) {
    console.error('❌ SMTP连接失败!');
    console.error('错误代码:', error.code);
    console.error('错误信息:', error.message);
    console.error('');
    console.error('💡 可能的原因:');
    console.error('  1. 授权码错误（请确认是16位授权码，不是QQ密码）');
    console.error('  2. SMTP服务未开启（请到QQ邮箱开启SMTP服务）');
    console.error('  3. 网络连接问题');
    process.exit(1);
  } else {
    console.log('✅ SMTP连接成功!');
    console.log('');

    // 发送测试邮件
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: '37895149@qq.com',
      subject: '面试管理系统 - 邮件服务测试',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 10px; }
            .info-box { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #667eea; }
            .footer { text-align: center; color: #666; font-size: 14px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 邮件服务测试成功</h1>
            </div>
            <div class="content">
              <p>恭喜！面试管理系统的邮件服务已成功配置。</p>

              <div class="info-box">
                <h3>✅ 测试信息</h3>
                <p><strong>发送时间:</strong> ${new Date().toLocaleString('zh-CN')}</p>
                <p><strong>发送服务器:</strong> smtp.qq.com</p>
                <p><strong>发件人:</strong> 37895149@qq.com</p>
                <p><strong>收件人:</strong> 37895149@qq.com</p>
              </div>

              <p>如果您收到这封邮件，说明：</p>
              <ul>
                <li>✅ SMTP配置正确</li>
                <li>✅ 授权码有效</li>
                <li>✅ 邮件服务正常工作</li>
              </ul>

              <div class="footer">
                <p>面试管理系统邮件服务</p>
                <p>发送时间: ${new Date().toLocaleString('zh-CN')}</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('❌ 邮件发送失败!');
        console.error('错误:', error.message);
        process.exit(1);
      } else {
        console.log('✅ 测试邮件发送成功!');
        console.log('📧 Message ID:', info.messageId);
        console.log('');
        console.log('📥 请检查邮箱: 37895149@qq.com');
        console.log('   (如果没有在收件箱，请检查垃圾邮件文件夹)');
        console.log('');
        console.log('🎉 邮件服务配置完成！');
        process.exit(0);
      }
    });
  }
});
