import mongoose from 'mongoose';

const { Schema } = mongoose;

const subscriptionSchema = new Schema(
  {
    recruiter: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true, unique: true },
    razorpayCustomerId: { type: String, required: true, index: true },
    razorpaySubscriptionId: { type: String, index: true },
    plan: { type: String, enum: ['free', 'growth', 'scale'], default: 'free' },
    billingInterval: { type: String, enum: ['monthly', 'annual'], default: 'monthly' },
    status: {
      type: String,
      // Razorpay subscription statuses: https://razorpay.com/docs/payments/subscriptions/entities/#subscription-status
      enum: ['created', 'authenticated', 'active', 'pending', 'halted', 'cancelled', 'completed', 'expired', 'none'],
      default: 'none',
    },
    currentPeriodEnd: { type: Date },
    cancelAtCycleEnd: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('Subscription', subscriptionSchema);
