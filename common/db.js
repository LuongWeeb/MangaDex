require('dotenv').config();
const mysql = require('mysql2');

// Tạo Connection Pool giúp tự động phục hồi kết nối và xử lý nhiều truy vấn đồng thời
const pool = mysql.createPool({
  connectionLimit: 10,
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'doc_truyen_online',
  port: Number(process.env.DB_PORT) || 3306,
  charset: 'utf8mb4'
});

// Kiểm tra kết nối thử nghiệm khi khởi động
pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Lỗi kết nối CSDL MySQL:', err.message);
  } else {
    console.log('✅ Kết nối MySQL Pool thành công!');
    connection.release();
  }
});

module.exports = pool;
