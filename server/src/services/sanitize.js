import { JSDOM } from 'jsdom';
import DOMPurifyFactory from 'dompurify';

const window = new JSDOM('').window;
const DOMPurify = DOMPurifyFactory(window);

const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'em', 'u', 's', 'ul', 'ol', 'li', 'h1', 'h2', 'h3',
  'blockquote', 'a', 'code', 'pre', 'hr',
];

/** Sanitize rich-text HTML coming from the Tiptap editor before it's persisted. */
export function sanitizeJobDescription(html) {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  });
}

/** Strip all tags to get plain text for search indexing / TF-IDF / match scoring. */
export function htmlToPlainText(html) {
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })
    .replace(/\s+/g, ' ')
    .trim();
}
