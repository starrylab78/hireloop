import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(8).max(72),
  role: z.enum(['candidate', 'recruiter']).default('candidate'),
  companyName: z.string().trim().max(150).optional(),
  companyWebsite: z.string().trim().url().max(200).optional().or(z.literal('')),
});

export const loginSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(1),
});

export const updateAccountProfileSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  email: z.string().trim().email().toLowerCase().optional(),
  companyName: z.string().trim().max(150).optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().optional(), // optional only because OAuth-only accounts may be setting one for the first time
  newPassword: z.string().min(8).max(72),
});
