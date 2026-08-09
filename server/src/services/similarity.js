const STOPWORDS = new Set([
  'the', 'and', 'a', 'an', 'to', 'of', 'in', 'for', 'on', 'with', 'is', 'are', 'we', 'you',
  'our', 'will', 'be', 'as', 'at', 'or', 'this', 'that', 'your', 'have', 'has', 'from', 'by',
  'it', 'their', 'about', 'who', 'we\u2019re', 'their', 'not', 'can', 'all', 'able',
]);

function tokenize(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9+.\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

function termFrequency(tokens) {
  const tf = {};
  for (const t of tokens) tf[t] = (tf[t] || 0) + 1;
  const max = Math.max(...Object.values(tf), 1);
  for (const t of Object.keys(tf)) tf[t] = tf[t] / max; // normalized TF
  return tf;
}

/**
 * Builds a TF-IDF term vector for one document given the full corpus'
 * document frequency map (docFreq: term -> number of docs containing it)
 * and total doc count. Store the resulting vector on the Job document.
 */
export function buildTermVector(text, docFreq, totalDocs) {
  const tokens = tokenize(text);
  const tf = termFrequency(tokens);
  const vector = {};
  for (const [term, freq] of Object.entries(tf)) {
    const df = docFreq[term] || 1;
    const idf = Math.log((totalDocs + 1) / (df + 1)) + 1;
    vector[term] = freq * idf;
  }
  return vector;
}

export function buildDocFrequency(allTexts) {
  const docFreq = {};
  for (const text of allTexts) {
    const uniqueTerms = new Set(tokenize(text));
    for (const term of uniqueTerms) docFreq[term] = (docFreq[term] || 0) + 1;
  }
  return docFreq;
}

export function cosineSimilarity(vecA, vecB) {
  const keys = new Set([...Object.keys(vecA), ...Object.keys(vecB)]);
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (const k of keys) {
    const a = vecA[k] || 0;
    const b = vecB[k] || 0;
    dot += a * b;
    normA += a * a;
    normB += b * b;
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/** Ranks candidate jobs by cosine similarity to a source job's term vector. */
export function rankSimilarJobs(sourceVector, candidateJobs, topN = 5) {
  return candidateJobs
    .map((job) => ({ job, score: cosineSimilarity(sourceVector, job.termVector || {}) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);
}
