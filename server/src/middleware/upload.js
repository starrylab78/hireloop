import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { nanoid } from 'nanoid';
import { extractTextFromResume, parseResumeText } from '../services/resumeParser.js';

const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${nanoid(12)}${ext}`);
  },
});

const ALLOWED_MIME = new Set(['application/pdf', 'text/plain']);

function fileFilter(_req, file, cb) {
  if (!ALLOWED_MIME.has(file.mimetype)) {
    return cb(new Error('Only PDF or plain-text resumes are accepted'));
  }
  cb(null, true);
}

export const uploadResume = multer({
  storage,
  fileFilter,
  limits: { fileSize: (Number(process.env.MAX_RESUME_SIZE_MB) || 5) * 1024 * 1024 },
}).single('resume');

/** Runs after multer places the file on disk: extracts text + attaches req.resumeText / req.resumeParsed */
export async function parseUploadedResume(req, _res, next) {
  try {
    if (!req.file) return next();
    const text = await extractTextFromResume(req.file.path, req.file.mimetype);
    req.resumeText = text;
    req.resumeParsed = parseResumeText(text);
    next();
  } catch (err) {
    next(err);
  }
}
