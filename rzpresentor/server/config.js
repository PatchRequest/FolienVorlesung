import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';

// Slide images live in the sibling images/ directory of the lecture repo
// (shared with the presenterm sources and scripts/render-mermaid.js).
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export default {
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',
  sessionSecret: process.env.SESSION_SECRET || 'dev-secret-change-me',
  dbPath: process.env.DB_PATH || './data/rzpresenter.db',
  uploadDir: process.env.UPLOAD_DIR || './data/uploads',
  maxUploadSizeMb: parseInt(process.env.MAX_UPLOAD_SIZE_MB || '10', 10),
  allowRegistration: process.env.ALLOW_REGISTRATION !== 'false',
  imagesDir: process.env.IMAGES_DIR || path.resolve(projectRoot, '..', 'images'),
};
