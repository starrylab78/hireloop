import mongoose from 'mongoose';

const { Schema } = mongoose;

const talentPoolEntrySchema = new Schema(
  {
    // Scoped to the org's owner id, so all team members share one talent pool.
    recruiter: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    candidate: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    sourceApplication: { type: Schema.Types.ObjectId, ref: 'Application', default: null },
    sourceJobTitle: { type: String, default: '' },
    notes: { type: String, default: '', maxlength: 2000 },
    tags: [{ type: String, trim: true }],
    lastContactedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

talentPoolEntrySchema.index({ recruiter: 1, candidate: 1 }, { unique: true });

export default mongoose.model('TalentPoolEntry', talentPoolEntrySchema);
