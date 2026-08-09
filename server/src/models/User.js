import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const { Schema } = mongoose;

const candidateProfileSchema = new Schema(
  {
    headline: { type: String, trim: true, default: '' },
    skills: [{ type: String, trim: true }],
    experienceYears: { type: Number, default: 0 },
    location: { type: String, trim: true, default: '' },
    resumeUrl: { type: String, default: '' },
    resumeText: { type: String, default: '' }, // parsed text, used for match scoring
    savedSearches: [
      {
        name: String,
        query: Schema.Types.Mixed,
        createdAt: { type: Date, default: Date.now },
      },
    ],
    savedJobs: [{ type: Schema.Types.ObjectId, ref: 'Job' }],
  },
  { _id: false }
);

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // Optional: users who sign up via Google/LinkedIn OAuth have no local password.
    passwordHash: { type: String, required: false },
    role: { type: String, enum: ['candidate', 'recruiter', 'admin'], default: 'candidate', required: true },

    // OAuth identities linked to this account (Google / LinkedIn "sign in with" flows).
    oauthProviders: {
      google: { id: String, email: String },
      linkedin: { id: String, email: String },
    },

    // Recruiter-specific
    companyName: { type: String, trim: true },
    companyWebsite: { type: String, trim: true },
    companySlug: { type: String, trim: true, lowercase: true, unique: true, sparse: true, index: true },
    companyLogoUrl: { type: String, default: '' },
    companyDescription: { type: String, default: '', maxlength: 2000 },

    // Team seats: if set, this recruiter is a MEMBER of an org (owner or invited teammate).
    // The org's owner subscription is the source of truth for plan/feature-gating for all members.
    organization: { type: Schema.Types.ObjectId, ref: 'Organization', default: null },

    // Subscription snapshot (source of truth is the Subscription collection;
    // this is denormalized onto the user for fast reads / feature gating)
    plan: { type: String, enum: ['free', 'growth', 'scale'], default: 'free' },
    razorpayCustomerId: { type: String, index: true },

    candidateProfile: { type: candidateProfileSchema, default: () => ({}) },

    refreshTokenVersion: { type: Number, default: 0 }, // bump to invalidate all refresh tokens
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = function comparePassword(plain) {
  if (!this.passwordHash) return Promise.resolve(false); // OAuth-only account has no local password
  return bcrypt.compare(plain, this.passwordHash);
};

userSchema.statics.hashPassword = function hashPassword(plain) {
  return bcrypt.hash(plain, 12); // cost factor 12 per spec
};

userSchema.methods.toSafeJSON = function toSafeJSON() {
  const obj = this.toObject();
  obj.hasPassword = Boolean(obj.passwordHash); // lets the client know if this is an OAuth-only account, without ever sending the hash
  delete obj.passwordHash;
  delete obj.refreshTokenVersion;
  return obj;
};

export default mongoose.model('User', userSchema);
