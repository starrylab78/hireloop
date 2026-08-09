/**
 * validate({ body, params, query }) — pass Zod schemas per request part.
 * Replaces req.body/params/query with the *parsed* (coerced + defaulted) data.
 */
export function validate(schemas) {
  return function validator(req, res, next) {
    try {
      if (schemas.body) req.body = schemas.body.parse(req.body);
      if (schemas.params) req.params = schemas.params.parse(req.params);
      if (schemas.query) req.query = schemas.query.parse(req.query);
      next();
    } catch (err) {
      return res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: err.errors?.map((e) => ({ path: e.path.join('.'), message: e.message })) ?? String(err),
      });
    }
  };
}
