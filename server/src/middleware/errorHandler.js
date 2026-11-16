export function errorHandler(error, _req, res, next) {
  if (res.headersSent) {
    next(error)
    return
  }

  const status = Number.isInteger(error.status) ? error.status : 500
  const message =
    status === 500 && process.env.NODE_ENV === 'production'
      ? 'Something went wrong'
      : error.message || 'Something went wrong'

  res.status(status).json({
    error: {
      message,
    },
  })
}
