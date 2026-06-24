export function validate(schema, target = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      return res.status(400).json({ error: 'Validation failed', details: result.error.issues });
    }
    req[target] = result.data;
    return next();
  };
}
