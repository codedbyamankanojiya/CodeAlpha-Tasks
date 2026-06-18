const errorHandler = (err, req, res, _next) => {
  console.error(err.stack);

  // Sequelize validation error
  if (err.name === 'SequelizeValidationError') {
    const messages = err.errors.map((e) => e.message);
    return res.status(400).json({ message: messages.join(', ') });
  }

  // Sequelize unique constraint error
  if (err.name === 'SequelizeUniqueConstraintError') {
    const messages = err.errors.map((e) => `${e.path} already exists`);
    return res.status(409).json({ message: messages.join(', ') });
  }

  // Sequelize database error (e.g. invalid type cast)
  if (err.name === 'SequelizeDatabaseError') {
    return res.status(400).json({ message: `Database error: ${err.message}` });
  }

  const status = err.statusCode || 500;
  res.status(status).json({ message: err.message || 'Internal server error' });
};

module.exports = errorHandler;
