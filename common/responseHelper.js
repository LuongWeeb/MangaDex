function formatSuccess(data, message = 'Success') {
  return { success: true, message, data };
}

function formatError(message = 'Error', errors = null) {
  return { success: false, message, errors };
}

exports.success = (res, data, message = 'Success', code = 200) => {
  return res.status(code).json(formatSuccess(data, message));
};

exports.error = (res, message = 'Error', code = 500, errors = null) => {
  return res.status(code).json(formatError(message, errors));
};

exports.formatSuccess = formatSuccess;
exports.formatError = formatError;
