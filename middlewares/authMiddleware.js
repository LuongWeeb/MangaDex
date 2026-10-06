const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

// Middleware bắt buộc phải đăng nhập
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ message: 'Vui lòng đăng nhập để tiếp tục' });
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
  
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ' });
    }
    req.user = decoded;
    next();
  });
}

// Middleware tùy chọn (nếu có token thì giải mã, không thì tiếp tục quyền Guest)
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    req.user = null;
    return next();
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (!err && decoded) {
      req.user = decoded;
    } else {
      req.user = null;
    }
    next();
  });
}

// Middleware kiểm tra phân quyền (RBAC)
function checkRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Chưa xác thực người dùng' });
    }
    
    // allowedRoles có thể là mảng tên role ['Admin', 'Uploader'] hoặc role_id [1, 2]
    const roleName = req.user.role_name;
    const roleId = req.user.role_id;
    
    const hasRole = allowedRoles.includes(roleName) || allowedRoles.includes(roleId);
    if (!hasRole) {
      return res.status(403).json({ message: 'Bạn không có quyền truy cập chức năng này' });
    }
    next();
  };
}

module.exports = {
  JWT_SECRET,
  verifyToken,
  optionalAuth,
  checkRole
};
