'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function FeishuCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      setStatus('error');
      setMessage(error === 'access_denied' ? '您取消了授权' : '授权失败');
      try { window.opener.postMessage({ type: 'feishu-bind-error' }, '*'); } catch (e) {}
      setTimeout(() => window.close(), 2000);
      return;
    }

    if (!code || !state) {
      setStatus('error');
      setMessage('缺少必要参数');
      setTimeout(() => window.close(), 2000);
      return;
    }

    // 调用后端 callback API
    fetch('/api/auth/feishu/callback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, state }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (res.ok && data.success) {
          setStatus('success');
          setMessage(data.name || '飞书账号');
          try {
            window.opener.postMessage({ type: 'feishu-bind-success', openId: data.openId }, '*');
          } catch (e) {}
          setTimeout(() => window.close(), 1500);
        } else {
          setStatus('error');
          setMessage(data.message || '绑定失败');
          try { window.opener.postMessage({ type: 'feishu-bind-error' }, '*'); } catch (e) {}
          setTimeout(() => window.close(), 2000);
        }
      })
      .catch(() => {
        setStatus('error');
        setMessage('网络错误');
        try { window.opener.postMessage({ type: 'feishu-bind-error' }, '*'); } catch (e) {}
        setTimeout(() => window.close(), 2000);
      });
  }, [searchParams]);

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      <div style={{
        background: 'white', borderRadius: 16, padding: '48px 40px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)', textAlign: 'center', maxWidth: 400,
      }}>
        {status === 'loading' && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
            <div style={{ fontSize: 22, fontWeight: 600, color: '#1a1a2e', marginBottom: 8 }}>正在绑定飞书账号...</div>
            <div style={{ fontSize: 14, color: '#666', lineHeight: 1.6 }}>请稍候，系统正在处理您的授权请求</div>
          </>
        )}
        {status === 'success' && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <div style={{ fontSize: 22, fontWeight: 600, color: '#1a1a2e', marginBottom: 8 }}>绑定成功！</div>
            <div style={{ fontSize: 14, color: '#4caf50', lineHeight: 1.6 }}>飞书账号 &quot;{message}&quot; 已绑定</div>
          </>
        )}
        {status === 'error' && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
            <div style={{ fontSize: 22, fontWeight: 600, color: '#1a1a2e', marginBottom: 8 }}>绑定失败</div>
            <div style={{ fontSize: 14, color: '#f44336', lineHeight: 1.6 }}>{message}</div>
          </>
        )}
      </div>
    </div>
  );
}
