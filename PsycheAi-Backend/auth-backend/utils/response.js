const success = (res, data, message = "Success", statusCode = 200) =>
  res.status(statusCode).json({ success: true, message, data });

const error = (res, message = "Something went wrong", statusCode = 500, details = null) => {
  const payload = { success: false, message };
  if (details) payload.details = details;
  return res.status(statusCode).json(payload);
};

module.exports = { success, error };