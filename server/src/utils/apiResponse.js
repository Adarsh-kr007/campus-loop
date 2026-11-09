export function success(res, message, data = {}, status = 200) {
  return res.status(status).json({ success: true, message, data })
}

export function failure(res, message, status = 500, errors) {
  const body = { success: false, message }
  if (errors) body.errors = errors
  return res.status(status).json(body)
}
