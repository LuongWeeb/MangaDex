const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../common/db');
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// 1. Đăng ký tài khoản mới (Mặc định role_id = 3: User)
exports.register = (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Vui lòng điền đầy đủ tên đăng nhập, email và mật khẩu' });
  }

  if (username.length < 3 || password.length < 6) {
    return res.status(400).json({ message: 'Tên đăng nhập tối thiểu 3 ký tự, mật khẩu tối thiểu 6 ký tự' });
  }

  // Kiểm tra trùng username hoặc email
  const checkSql = 'SELECT id, username, email FROM users WHERE username = ? OR email = ? LIMIT 1';
  db.query(checkSql, [username.trim(), email.trim()], (err, existingUsers) => {
    if (err) return res.status(500).json({ error: err.message });
    if (existingUsers.length > 0) {
      const existing = existingUsers[0];
      if (existing.username.toLowerCase() === username.trim().toLowerCase()) {
        return res.status(409).json({ message: 'Tên đăng nhập đã tồn tại trên hệ thống' });
      }
      return res.status(409).json({ message: 'Email này đã được sử dụng' });
    }

    // Mã hóa mật khẩu
    const saltRounds = 10;
    const passwordHash = bcrypt.hashSync(password, saltRounds);
    const defaultAvatar = '/images/avatars/default.svg';
    const roleId = 3; // Reader / User

    const insertSql = `
      INSERT INTO users (role_id, username, email, password_hash, avatar_url)
      VALUES (?, ?, ?, ?, ?)
    `;
    db.query(insertSql, [roleId, username.trim(), email.trim(), passwordHash, defaultAvatar], (insertErr, result) => {
      if (insertErr) return res.status(500).json({ error: insertErr.message });

      const newUserId = result.insertId;
      const token = jwt.sign(
        { id: newUserId, username: username.trim(), email: email.trim(), role_id: roleId, role_name: 'User' },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      res.status(201).json({
        message: 'Đăng ký tài khoản thành công',
        token,
        user: {
          id: newUserId,
          username: username.trim(),
          email: email.trim(),
          role_id: roleId,
          role_name: 'User',
          avatar_url: defaultAvatar
        }
      });
    });
  });
};

// 2. Đăng nhập hệ thống (Bằng Username hoặc Email)
exports.login = (req, res) => {
  const { usernameOrEmail, password } = req.body;

  if (!usernameOrEmail || !password) {
    return res.status(400).json({ message: 'Vui lòng nhập tên đăng nhập/email và mật khẩu' });
  }

  const sql = `
    SELECT u.id, u.username, u.email, u.password_hash, u.avatar_url, u.role_id, u.is_banned, r.name AS role_name
    FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE u.username = ? OR u.email = ?
    LIMIT 1
  `;

  db.query(sql, [usernameOrEmail.trim(), usernameOrEmail.trim()], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) {
      return res.status(401).json({ message: 'Tài khoản hoặc mật khẩu không chính xác' });
    }

    const user = results[0];
    if (user.is_banned) {
      return res.status(403).json({ message: 'Tài khoản của bạn đã bị khóa bởi Quản trị viên!' });
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Tài khoản hoặc mật khẩu không chính xác' });
    }

    // Tạo JWT token thời hạn 7 ngày
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
        role_id: user.role_id,
        role_name: user.role_name
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      message: 'Đăng nhập thành công',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role_id: user.role_id,
        role_name: user.role_name,
        avatar_url: user.avatar_url
      }
    });
  });
};

// 3. Lấy thông tin tài khoản hiện tại từ Token
exports.getMe = (req, res) => {
  const sql = `
    SELECT u.id, u.username, u.email, u.avatar_url, u.full_name, u.gender, u.role_id, u.created_at, r.name AS role_name
    FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE u.id = ?
    LIMIT 1
  `;
  db.query(sql, [req.user.id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ message: 'Không tìm thấy thông tin tài khoản' });
    res.json({ user: results[0] });
  });
};
