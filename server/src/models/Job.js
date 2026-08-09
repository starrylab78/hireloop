import mongoose from 'mongoose';

const { Schema } = mongoose;

const jobSchema = new Schema(
  {
    recruiter: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    companyName: { type: String, required: true, trim: true },
    descriptionHtml: { type: String, required: true }, // sanitized via DOMPurify before save
    descriptionText: { type: String, required: true }, // plain-text extraction, used for search/similarity
    location: { type: String, trim: true, default: '' },
    workMode: { type: String, enum: ['remote', 'hybrid', 'onsite'], default: 'onsite' },
    experienceLevel: { type: String, enum: ['entry', 'mid', 'senior', 'lead'], default: 'mid' },
    employmentType: { type: String, enum: ['full-time', 'part-time', 'contract', 'internship'], default: 'full-time' },
    salaryMin: { type: Number, default: null },
    salaryMax: { type: Number, default: null },
    currency: { type: String, default: 'INR' },
    skills: [{ type: String, trim: true, index: true }],
    status: { type: String, enum: ['active', 'closed', 'draft'], default: 'active', index: true },
    priorityListing: { type: Boolean, default: false }, // true for Scale-tier recruiters

    // Default interview details for this posting — recruiters can set these once
    // at post time and they'll pre-fill the per-candidate scheduling form.
    defaultInterviewMode: { type: String, enum: ['onsite', 'video', 'phone'], default: 'video' },
    defaultInterviewLocation: { type: String, default: '', trim: true }, // venue address, or a video-call link/instructions

    // TF-IDF style vector used for "similar jobs" cosine similarity (sparse term->weight map)
    termVector: { type: Schema.Types.Mixed, default: {} },

    views: { type: Number, default: 0 },
    applicationsCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

jobSchema.index({ title: 'text', descriptionText: 'text', companyName: 'text' });
jobSchema.index({ status: 1, priorityListing: -1, createdAt: -1 });

export default mongoose.model('Job', jobSchema);
