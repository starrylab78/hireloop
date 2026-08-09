import IdempotencyKey from '../models/IdempotencyKey.js';

/**
 * requireIdempotencyKey — for POST routes that create payment provider checkout
 * sessions or trigger billing changes. Client must send an
 * `Idempotency-Key` header (a UUID generated once per user action).
 * On retry with the same key, we replay the stored response instead of
 * re-executing the handler (which could double-charge).
 */
export function requireIdempotencyKey(routeName) {
  return async function idempotencyGate(req, res, next) {
    const key = req.header('Idempotency-Key');
    if (!key) {
      return res.status(400).json({ error: 'Idempotency-Key header is required for this request', code: 'MISSING_IDEMPOTENCY_KEY' });
    }

    const existing = await IdempotencyKey.findOne({ key });
    if (existing) {
      if (String(existing.userId) !== String(req.user._id) || existing.route !== routeName) {
        return res.status(409).json({ error: 'Idempotency key conflict', code: 'IDEMPOTENCY_KEY_CONFLICT' });
      }
      return res.status(existing.statusCode || 200).json(existing.responseBody);
    }

    // Wrap res.json to capture + persist the response the first time through.
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      IdempotencyKey.create({
        key,
        userId: req.user._id,
        route: routeName,
        statusCode: res.statusCode,
        responseBody: body,
      }).catch((e) => console.error('[idempotency] failed to persist key', e));
      return originalJson(body);
    };

    next();
  };
}
