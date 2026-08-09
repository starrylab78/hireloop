import fs from 'node:fs/promises';
import pdfParse from 'pdf-parse';

// A curated, extendable skill vocabulary used for lightweight keyword extraction.
// This is intentionally simple (no external NLP API) per the "keyword extraction" spec.
const SKILL_VOCAB = [
  'javascript', 'typescript', 'react', 'node.js', 'nodejs', 'express', 'mongodb', 'mongoose',
  'postgresql', 'mysql', 'redis', 'docker', 'kubernetes', 'aws', 'gcp', 'azure', 'graphql',
  'rest api', 'python', 'django', 'flask', 'java', 'spring', 'go', 'golang', 'rust', 'c++',
  'html', 'css', 'tailwind', 'sass', 'next.js', 'vue', 'angular', 'redux', 'webpack', 'vite',
  'git', 'ci/cd', 'jenkins', 'terraform', 'machine learning', 'data science', 'sql', 'nosql',
  'agile', 'scrum', 'product management', 'ui/ux', 'figma', 'project management',
  'communication', 'leadership', 'stripe', 'razorpay', 'jest', 'cypress', 'testing', 'microservices',
];

const EXPERIENCE_REGEX = /(\d+)\+?\s*(?:years?|yrs?)\s*(?:of\s*)?experience/i;

export async function extractTextFromResume(filePath, mimeType) {
  if (mimeType === 'application/pdf') {
    const buffer = await fs.readFile(filePath);
    const data = await pdfParse(buffer);
    return data.text;
  }
  // .txt or plain text fallback
  return fs.readFile(filePath, 'utf-8');
}

/** Very simple keyword-based "NLP" extraction — no external API required. */
export function parseResumeText(rawText) {
  const text = rawText.toLowerCase();

  const skills = SKILL_VOCAB.filter((skill) => {
    // Word-boundary match so short/substring-prone terms (e.g. "go") don't
    // false-positive inside unrelated words (e.g. "mongodb").
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(?:^|[^a-z0-9])${escaped}(?:$|[^a-z0-9])`, 'i').test(text);
  });

  const expMatch = rawText.match(EXPERIENCE_REGEX);
  const experienceYears = expMatch ? parseInt(expMatch[1], 10) : 0;

  // Naive name guess: first non-empty line that looks like "First Last" (2-4 words, capitalized).
  const firstLines = rawText.split('\n').map((l) => l.trim()).filter(Boolean).slice(0, 5);
  const nameGuess = firstLines.find((l) => /^([A-Z][a-z]+\s?){2,4}$/.test(l)) || '';

  return {
    nameGuess,
    skills,
    experienceYears,
  };
}

/** Keyword-overlap match score (%) between a candidate's resume text and a job description. */
export function computeMatchScore(resumeText, jobDescriptionText) {
  const tokenize = (s) =>
    new Set(
      s
        .toLowerCase()
        .replace(/[^a-z0-9+.\s]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 2)
    );

  const resumeTokens = tokenize(resumeText || '');
  const jobTokens = tokenize(jobDescriptionText || '');
  if (jobTokens.size === 0) return 0;

  let overlap = 0;
  for (const token of jobTokens) {
    if (resumeTokens.has(token)) overlap += 1;
  }

  return Math.round((overlap / jobTokens.size) * 100);
}
