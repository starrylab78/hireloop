export type Role = 'candidate' | 'recruiter' | 'admin';
export type PlanId = 'free' | 'growth' | 'scale';

export interface CandidateProfile {
  headline?: string;
  skills: string[];
  experienceYears: number;
  location?: string;
  resumeUrl?: string;
  resumeText?: string;
  savedSearches: { _id: string; name: string; query: Record<string, unknown> }[];
  savedJobs: string[] | Job[];
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: Role;
  plan: PlanId;
  companyName?: string;
  companyWebsite?: string;
  companySlug?: string;
  companyLogoUrl?: string;
  companyDescription?: string;
  organization?: string | null;
  hasPassword: boolean;
  candidateProfile?: CandidateProfile;
  createdAt: string;
}

export interface OrgMember {
  user: { _id: string; name: string; email: string };
  role: 'owner' | 'member';
  joinedAt: string;
}

export interface Organization {
  _id: string;
  name: string;
  owner: string;
  members: OrgMember[];
}

export interface TeamInvite {
  _id: string;
  email: string;
  status: 'pending' | 'accepted' | 'revoked' | 'expired';
  expiresAt: string;
}

export interface TalentPoolEntry {
  _id: string;
  candidate: { _id: string; name: string; email: string; candidateProfile?: Partial<CandidateProfile> };
  sourceJobTitle: string;
  notes: string;
  tags: string[];
  lastContactedAt: string | null;
  createdAt: string;
}

export type InterviewMode = 'onsite' | 'video' | 'phone';

export interface InterviewDetails {
  scheduledAt: string | null;
  mode: InterviewMode;
  location: string;
  notes: string;
  notifiedAt: string | null;
}

export interface Job {
  _id: string;
  title: string;
  companyName: string;
  descriptionHtml: string;
  descriptionText: string;
  location: string;
  workMode: 'remote' | 'hybrid' | 'onsite';
  experienceLevel: 'entry' | 'mid' | 'senior' | 'lead';
  employmentType: 'full-time' | 'part-time' | 'contract' | 'internship';
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string;
  skills: string[];
  status: 'active' | 'closed' | 'draft';
  priorityListing: boolean;
  defaultInterviewMode: InterviewMode;
  defaultInterviewLocation: string;
  views: number;
  applicationsCount: number;
  recruiter: { _id: string; name: string; companyName?: string } | string;
  createdAt: string;
}

export type PipelineStage = 'applied' | 'screened' | 'interviewed' | 'offered' | 'hired' | 'rejected';

export interface Application {
  _id: string;
  job: Job | string;
  candidate: { _id: string; name: string; email: string; candidateProfile?: Partial<CandidateProfile> } | string;
  recruiter: string;
  resumeUrl: string;
  matchScore: number;
  stage: PipelineStage;
  coverNote?: string;
  interview?: InterviewDetails;
  createdAt: string;
}

export interface PlanDefinition {
  id: PlanId;
  name: string;
  priceMonthlyINR: number;
  priceAnnualINR: number;
  maxActiveJobs: number;
  atsPipeline: boolean;
  applicantFiltering: boolean;
  csvExport: boolean;
  teamSeats: number;
  priorityListing: boolean;
  usageAnalytics: boolean;
}
