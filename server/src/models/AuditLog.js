import mongoose from 'mongoose';

const { Schema } = mongoose;

const auditLogSchema = new Schema(
  {
    actor: { type: Schema.Types.ObjectId, ref: 'User', default: null }, // null for system/webhook-originated events
    actorLabel: { type: String, default: 'system' }, // e.g. "razorpay-webhook", "user:<id>", "admin:<id>"
    action: { type: String, required: true }, // e.g. "subscription.created", "plan.changed"
    targetType: { type: String, default: 'Subscription' },
    targetId: { type: Schema.Types.ObjectId },
    metadata: { type: Schema.Types.Mixed, default: {} },
    ip: { type: String, default: '' },
  },
  { timestamps: true }
);

auditLogSchema.index({ action: 1, createdAt: -1 });

export default mongoose.model('AuditLog', auditLogSchema);
