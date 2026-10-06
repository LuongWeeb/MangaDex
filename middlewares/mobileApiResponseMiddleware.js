const { formatSuccess, formatError } = require('../common/responseHelper');

module.exports = (req, res, next) => {
  const sendJson = res.json.bind(res);

  res.json = (payload) => {
    if (payload && typeof payload.success === 'boolean') {
      return sendJson(payload);
    }

    if (res.statusCode >= 400) {
      const message = payload?.message || (res.statusCode >= 500 ? 'Internal server error' : 'Request failed');
      const errors = payload?.errors || (res.statusCode < 500 ? payload?.error || null : null);
      return sendJson(formatError(message, errors));
    }

    if (payload && !Array.isArray(payload) && typeof payload === 'object') {
      const { message = 'Success', ...data } = payload;
      return sendJson(formatSuccess(data, message));
    }

    return sendJson(formatSuccess(payload));
  };

  next();
};
