const { z } = require("zod");

/**
 * Express middleware factory — validates req.body against a Zod schema.
 * On failure returns 422 with a list of field errors.
 */
const validate = (schema) => (req, res, next) => {
  try {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        message: "Validation error",
        errors: result.error.errors.map(e => ({
          field: e.path.join("."),
          message: e.message
        }))
      });
    }

    req.body = result.data;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { validate };

// ─── User ─────────────────────────────────────────────────────────────────────
const userRegisterSchema = z.object({
  name:      z.string().min(2).max(100),
  email:     z.string().email(),
  phone:     z.string().min(7).max(20),
  address:   z.string().max(255).optional(),
  latitude:  z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  password:  z.string().min(6),
});

const userLoginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

// ─── Admin ────────────────────────────────────────────────────────────────────
const adminRegisterSchema = z.object({
  name:     z.string().min(2).max(100),
  email:    z.string().email(),
  password: z.string().min(8),
});

const adminLoginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

// ─── Hospital ─────────────────────────────────────────────────────────────────
const hospitalRegisterSchema = z.object({
  name:      z.string().min(2).max(200),
  email:     z.string().email(),
  phone:     z.string().min(7).max(20),
  address:   z.string().max(255).optional(),
  latitude:  z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  password:  z.string().min(8),
});

const hospitalLoginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

// ─── Shared ───────────────────────────────────────────────────────────────────
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword:     z.string().min(6),
});

module.exports = {
  validate,
  userRegisterSchema,     userLoginSchema,
  adminRegisterSchema,    adminLoginSchema,
  hospitalRegisterSchema, hospitalLoginSchema,
  changePasswordSchema,
};