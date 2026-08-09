import { describe, it, expect } from 'vitest';
import { computeMatchScore, parseResumeText } from '../../src/services/resumeParser.js';

describe('computeMatchScore', () => {
  it('scores 0 for completely unrelated text', () => {
    const score = computeMatchScore('watercolor painting and ceramics', 'react typescript frontend engineer');
    expect(score).toBe(0);
  });

  it('scores higher for stronger keyword overlap', () => {
    const weak = computeMatchScore('graphic design', 'react typescript node.js mongodb express backend');
    const strong = computeMatchScore('react typescript node.js express engineer', 'react typescript node.js mongodb express backend');
    expect(strong).toBeGreaterThan(weak);
  });

  it('returns 0 when the job description is empty', () => {
    expect(computeMatchScore('react typescript', '')).toBe(0);
  });

  it('is capped at 100', () => {
    const score = computeMatchScore('react typescript node', 'react typescript node');
    expect(score).toBeLessThanOrEqual(100);
  });
});

describe('parseResumeText', () => {
  it('extracts known skills using word-boundary matching (no false positives)', () => {
    const parsed = parseResumeText('Experienced with mongodb, react, and node.js');
    expect(parsed.skills).toContain('mongodb');
    expect(parsed.skills).toContain('react');
    // "go" must NOT match inside "mongodb"
    expect(parsed.skills).not.toContain('go');
  });

  it('extracts years of experience from common phrasing', () => {
    expect(parseResumeText('5 years of experience in backend development').experienceYears).toBe(5);
    expect(parseResumeText('10+ years experience').experienceYears).toBe(10);
    expect(parseResumeText('no mention of tenure here').experienceYears).toBe(0);
  });

  it('guesses a name from an early capitalized line', () => {
    const parsed = parseResumeText('Jane Doe\nSoftware Engineer\n5 years experience');
    expect(parsed.nameGuess).toBe('Jane Doe');
  });
});
