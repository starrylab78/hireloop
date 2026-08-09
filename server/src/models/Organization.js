import mongoose from 'mongoose';

const { Schema } = mongoose;

const organizationSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    members: [
      {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        role: { type: String, enum: ['owner', 'member'], default: 'member' },
        joinedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

/** All user ids that should share visibility into jobs/applicants/plan (owner + accepted members). */
organizationSchema.methods.memberUserIds = function memberUserIds() {
  return this.members.map((m) => m.user);
};

export default mongoose.model('Organization', organizationSchema);
