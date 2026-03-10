require('dotenv').config();
const mysql = require('mysql2/promise');

// 数据库连接配置
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'interview_system',
  charset: 'utf8mb4',
  timezone: '+08:00',
  // 连接池配置
  connectionLimit: 20,
  queueLimit: 0,
  // 强制使用UTF-8
  typeCast: function (field, next) {
    if (field.type === 'VAR_STRING' || field.type === 'STRING') {
      return field.string();
    }
    return next();
  }
};

// 创建连接池
const pool = mysql.createPool(dbConfig);

// 确保字符集正确设置
const ensureCharset = async (connection) => {
  try {
    await connection.query('SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci');
    await connection.query('SET CHARACTER SET utf8mb4');
    await connection.query('SET character_set_connection=utf8mb4');
  } catch (error) {
    console.error('设置字符集失败:', error);
  }
};

// 初始化连接池
(async () => {
  const connection = await pool.getConnection();
  await ensureCharset(connection);
  connection.release();
  console.log('✅ 数据库连接池已初始化，字符集: utf8mb4');
})();

// 测试数据库连接
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    await ensureCharset(connection);
    console.log('✅ 数据库连接成功');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    return false;
  }
}

// 执行查询
async function query(sql, params = []) {
  try {
    // 确保params是数组，并创建副本以避免预处理语句缓存问题
    const sqlParams = Array.isArray(params) ? [...params] : [];
    // 执行查询 - 使用 query 而不是 execute 避免预处理语句问题
    const [results] = await pool.query(sql, sqlParams);
    return results;
  } catch (error) {
    console.error('数据库查询错误:', error);
    console.error('SQL:', sql);
    console.error('Params:', JSON.stringify(params));
    throw error;
  }
}

// 开始事务
async function transaction(callback) {
  const connection = await pool.getConnection();
  await ensureCharset(connection);
  await connection.beginTransaction();

  try {
    const result = await callback(connection);
    await connection.commit();
    connection.release();
    return result;
  } catch (error) {
    await connection.rollback();
    connection.release();
    throw error;
  }
}

module.exports = {
  pool,
  query,
  transaction,
  testConnection
};
