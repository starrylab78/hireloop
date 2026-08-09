import Anthropic from '@anthropic-ai/sdk';

const client = process.env.ANTHROPIC_API_KEY ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }) : null;

const SYSTEM_PROMPT = `You write clear, honest job descriptions for a job board called HireLoop.
Output clean HTML using only these tags: <p>, <ul>, <li>, <strong>, <h3>.
Structure: a 1-2 sentence intro paragraph, then an <h3>What you'll do</h3> with a bullet list,
then an <h3>What we're looking for</h3> with a bullet list. No preamble, no markdown, no code fences —
return ONLY the HTML.`;

/**
 * Generates a draft job description from a title + rough bullet points.
 * Returns { html, source: 'ai' | 'template' } — falls back to a filled-in template
 * (no external call) if ANTHROPIC_API_KEY isn't configured, so the feature degrades
 * gracefully instead of hard-failing in environments without a key set up.
 */
export async function generateJobDescription({ title, companyName, bullets, tone }) {
  if (!client) {
    return { html: templateFallback({ title, companyName, bullets }), source: 'template' };
  }

  const userPrompt = [
    `Job title: ${title}`,
    companyName ? `Company: ${companyName}` : null,
    tone ? `Tone: ${tone}` : null,
    bullets?.length ? `Rough notes from the recruiter:\n${bullets.map((b) => `- ${b}`).join('\n')}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 700,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const html = response.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('\n')
    .trim();

  return { html, source: 'ai' };
}

function templateFallback({ title, companyName, bullets = [] }) {
  const bulletItems = bullets.length
    ? bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join('')
    : '<li>Add your own responsibilities here</li>';
  return `<p>${escapeHtml(companyName || 'We')} ${companyName ? 'is' : 'are'} hiring a <strong>${escapeHtml(title)}</strong>.</p>
<h3>What you'll do</h3>
<ul>${bulletItems}</ul>
<h3>What we're looking for</h3>
<ul><li>Add your requirements here</li></ul>`;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
