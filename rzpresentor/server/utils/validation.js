const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email) {
  return typeof email === 'string' && EMAIL_RE.test(email.trim());
}

export function validateUsername(username) {
  return typeof username === 'string' && /^[a-zA-Z0-9_-]{3,30}$/.test(username.trim());
}

export function validatePassword(password) {
  return typeof password === 'string' && password.length >= 8;
}

export function validateSlug(slug) {
  return /^[a-z0-9-]{1,100}$/.test(slug);
}

export function sanitize(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[<>&"']/g, c => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;'
  })[c]);
}
