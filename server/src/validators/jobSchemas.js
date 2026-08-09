import { z } from 'zod';

export const createJobSchema = z.object({
  title: z.string().trim().min(3).max(150),
  companyName: z.string().trim().min(1).max(150),
  descriptionHtml: z.string().min(20).max(20000), // sanitized server-side before persisting
  location: z.string().trim().max(150).optional().default(''),
  workMode: z.enum(['remote', 'hybrid', 'onsite']).default('onsite'),
  experienceLevel: z.enum(['entry', 'mid', 'senior', 'lead']).default('mid'),
  employmentType: z.enum(['full-time', 'part-time', 'contract', 'internship']).default('full-time'),
  salaryMin: z.number().nonnegative().nullable().optional(),
  salaryMax: z.number().nonnegative().nullable().optional(),
  currency: z.string().length(3).default('INR'),
  skills: z.array(z.string().trim().min(1).max(40)).max(30).default([]),
  defaultInterviewMode: z.enum(['onsite', 'video', 'phone']).optional().default('video'),
  defaultInterviewLocation: z.string().trim().max(300).optional().default(''),
});

export const updateJobSchema = createJobSchema.partial().extend({
  status: z.enum(['active', 'closed', 'draft']).optional(),
});

export const jobQuerySchema = z.object({
  q: z.string().trim().max(150).optional(),
  location: z.string().trim().max(150).optional(),
  workMode: z.enum(['remote', 'hybrid', 'onsite']).optional(),
  experienceLevel: z.enum(['entry', 'mid', 'senior', 'lead']).optional(),
  salaryMin: z.coerce.number().nonnegative().optional(),
  salaryMax: z.coerce.number().nonnegative().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(12),
});

export const stageUpdateSchema = z.object({
  stage: z.enum(['applied', 'screened', 'interviewed', 'offered', 'hired', 'rejected']),
});

export const scheduleInterviewSchema = z.object({
  scheduledAt: z.coerce.date(),
  mode: z.enum(['onsite', 'video', 'phone']).default('video'),
  location: z.string().trim().max(300).optional().default(''),
  notes: z.string().trim().max(1000).optional().default(''),
});
