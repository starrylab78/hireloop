import mongoose from 'mongoose';

const { Schema } = mongoose;

// Stores the result of a payment-related mutation keyed by client-supplied
// Idempotency-Key header, so retries return the original response instead
// of double-charging / double-creating a checkout session.
const idempotencyKeySchema = new Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    route: { type: String, required: true },
    statusCode: { type: Number },
    responseBody: { type: Schema.Types.Mixed },
    createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 }, // TTL 24h
  },
  { timestamps: false }
);

export default mongoose.model('IdempotencyKey', idempotencyKeySchema);
