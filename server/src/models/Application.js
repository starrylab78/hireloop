import mongoose from 'mongoose';

const { Schema } = mongoose;

export const PIPELINE_STAGES = ['applied', 'screened', 'interviewed', 'offered', 'hired', 'rejected'];

const applicationSchema = new Schema(
  {
    job: { type: Schema.Types.ObjectId, ref: 'Job', required: true, index: true },
    candidate: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    recruiter: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    resumeUrl: { type: String, required: true },
    resumeText: { type: String, default: '' },
    coverNote: { type: String, default: '', maxlength: 2000 },

    matchScore: { type: Number, default: 0 }, // keyword-overlap % vs job description

    stage: { type: String, enum: PIPELINE_STAGES, default: 'applied', index: true },
    stageHistory: [
      {
        stage: { type: String, enum: PIPELINE_STAGES },
        changedAt: { type: Date, default: Date.now },
        changedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      },
    ],

    interview: {
      scheduledAt: { type: Date, default: null },
      mode: { type: String, enum: ['onsite', 'video', 'phone'], default: 'video' },
      location: { type: String, default: '' }, // venue address, or a video-call link
      notes: { type: String, default: '', maxlength: 1000 },
      scheduledBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
      notifiedAt: { type: Date, default: null }, // when the candidate's email actually went out
    },
  },
  { timestamps: true }
);

applicationSchema.index({ job: 1, candidate: 1 }, { unique: true }); // one application per candidate per job

export default mongoose.model('Application', applicationSchema);
