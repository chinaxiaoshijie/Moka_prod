require('dotenv').config();
const redis = require('redis');

// Redis连接配置
const redisConfig = {
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379
  },
  password: process.env.REDIS_PASSWORD || undefined,
  // 连接池配置
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
};

// 创建Redis客户端
const redisClient = redis.createClient(redisConfig);

// 连接事件处理
redisClient.on('connect', () => {
  console.log('✅ Redis连接成功');
});

redisClient.on('error', (err) => {
  console.error('❌ Redis连接错误:', err.message);
  // 在开发环境下，Redis连接失败不应该阻止应用启动
  if (process.env.NODE_ENV === 'production') {
    console.error('生产环境Redis连接失败，部分功能可能不可用');
  }
});

redisClient.on('reconnecting', () => {
  console.log('🔄 Redis正在重连...');
});

redisClient.on('ready', () => {
  console.log('✅ Redis已就绪');
});

// 连接Redis
async function connectRedis() {
  try {
    await redisClient.connect();
    return true;
  } catch (error) {
    console.error('❌ Redis连接失败:', error.message);
    // 开发环境下允许无Redis启动
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
    return false;
  }
}

// 测试Redis连接
async function testConnection() {
  try {
    await redisClient.ping();
    return true;
  } catch (error) {
    return false;
  }
}

// 获取登录尝试次数
async function getLoginAttempts(key) {
  try {
    const data = await redisClient.get(`login_attempts:${key}`);
    if (!data) return { count: 0, lastAttempt: null };
    return JSON.parse(data);
  } catch (error) {
    console.error('获取登录尝试失败:', error);
    return { count: 0, lastAttempt: null };
  }
}

// 设置登录尝试次数
async function setLoginAttempts(key, attempts) {
  try {
    // 设置24小时过期
    await redisClient.setEx(
      `login_attempts:${key}`,
      24 * 60 * 60,
      JSON.stringify(attempts)
    );
  } catch (error) {
    console.error('设置登录尝试失败:', error);
  }
}

// 删除登录尝试记录
async function deleteLoginAttempts(key) {
  try {
    await redisClient.del(`login_attempts:${key}`);
  } catch (error) {
    console.error('删除登录尝试失败:', error);
  }
}

// 检查并增加登录尝试次数
async function checkAndIncrementAttempts(key) {
  try {
    const current = await getLoginAttempts(key);
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;

    // 如果超过5次且在1小时内
    if (current.count >= 5 && current.lastAttempt > oneHourAgo) {
      return {
        allowed: false,
        count: current.count,
        lastAttempt: current.lastAttempt
      };
    }

    // 重置计数（超过1小时）
    if (current.lastAttempt && current.lastAttempt <= oneHourAgo) {
      const newAttempts = { count: 1, lastAttempt: now };
      await setLoginAttempts(key, newAttempts);
      return { allowed: true, count: 1, lastAttempt: now };
    }

    // 增加计数
    const newAttempts = {
      count: (current.count || 0) + 1,
      lastAttempt: now
    };
    await setLoginAttempts(key, newAttempts);
    return { allowed: true, ...newAttempts };

  } catch (error) {
    console.error('检查登录尝试失败:', error);
    // 失败时允许登录（降级处理）
    return { allowed: true, count: 0, lastAttempt: null };
  }
}

// 清除登录尝试记录
async function clearAttempts(key) {
  await deleteLoginAttempts(key);
}

// 缓存辅助函数
const cacheUtils = {
  // 获取缓存
  async get(key) {
    try {
      const data = await redisClient.get(`cache:${key}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('获取缓存失败:', error);
      return null;
    }
  },

  // 设置缓存
  async set(key, value, ttl = 3600) {
    try {
      await redisClient.setEx(
        `cache:${key}`,
        ttl,
        JSON.stringify(value)
      );
    } catch (error) {
      console.error('设置缓存失败:', error);
    }
  },

  // 删除缓存
  async delete(key) {
    try {
      await redisClient.del(`cache:${key}`);
    } catch (error) {
      console.error('删除缓存失败:', error);
    }
  },

  // 删除匹配模式的所有缓存
  async deletePattern(pattern) {
    try {
      const keys = await redisClient.keys(`cache:${pattern}`);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    } catch (error) {
      console.error('批量删除缓存失败:', error);
    }
  }
};

// 优雅关闭
async function closeRedis() {
  try {
    await redisClient.quit();
    console.log('Redis连接已关闭');
  } catch (error) {
    console.error('关闭Redis连接失败:', error);
  }
}

module.exports = {
  redisClient,
  connectRedis,
  testConnection,
  checkAndIncrementAttempts,
  clearAttempts,
  cacheUtils,
  closeRedis
};
