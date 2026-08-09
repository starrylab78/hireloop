import { describe, it, expect } from 'vitest';
import { buildDocFrequency, buildTermVector, cosineSimilarity, rankSimilarJobs } from '../../src/services/similarity.js';

describe('cosineSimilarity', () => {
  it('returns 1 for identical vectors', () => {
    const v = { react: 2, typescript: 1 };
    expect(cosineSimilarity(v, v)).toBeCloseTo(1, 5);
  });

  it('returns 0 for vectors with no overlapping terms', () => {
    expect(cosineSimilarity({ react: 1 }, { python: 1 })).toBe(0);
  });

  it('returns 0 when either vector is empty', () => {
    expect(cosineSimilarity({}, { react: 1 })).toBe(0);
  });
});

describe('TF-IDF pipeline', () => {
  const corpus = [
    'react frontend engineer tailwind css',
    'node.js backend engineer mongodb express',
    'react typescript frontend developer',
  ];

  it('scores two frontend-heavy docs as more similar than frontend vs backend', () => {
    const df = buildDocFrequency(corpus);
    const frontendA = buildTermVector(corpus[0], df, corpus.length);
    const frontendB = buildTermVector(corpus[2], df, corpus.length);
    const backend = buildTermVector(corpus[1], df, corpus.length);

    const frontendSim = cosineSimilarity(frontendA, frontendB);
    const crossSim = cosineSimilarity(frontendA, backend);

    expect(frontendSim).toBeGreaterThan(crossSim);
  });
});

describe('rankSimilarJobs', () => {
  it('ranks and filters out zero-similarity jobs, respecting topN', () => {
    const source = { react: 1, frontend: 1 };
    const candidates = [
      { _id: 'a', termVector: { react: 1, frontend: 1 } }, // identical
      { _id: 'b', termVector: { python: 1 } }, // unrelated -> filtered out
      { _id: 'c', termVector: { react: 0.5 } }, // partial overlap
    ];
    const ranked = rankSimilarJobs(source, candidates, 5);
    expect(ranked.map((r) => r.job._id)).toEqual(['a', 'c']);
  });
});
