import mongoose from 'mongoose';

const { Schema } = mongoose;

// Records processed payment-provider webhook event ids, so replayed/duplicate
// deliveries (which all providers can send) are handled idempotently.
const webhookEventSchema = new Schema({
  eventId: { type: String, required: true, unique: true, index: true },
  type: { type: String, required: true },
  processedAt: { type: Date, default: Date.now },
});

export default mongoose.model('WebhookEvent', webhookEventSchema);
