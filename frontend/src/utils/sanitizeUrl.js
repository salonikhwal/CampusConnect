/**
 * Sanitizes URLs to prevent Cross-Site Scripting (XSS) via `javascript:`, `data:`, or `vbscript:` schemes
 * in anchor tags.
 *
 * @param {string|null|undefined} url - User-provided URL
 * @returns {string} Safe URL or '#' if dangerous / invalid
 */
export const sanitizeUrl = (url) => {
  if (!url || typeof url !== 'string') {
    return '#';
  }

  const trimmed = url.trim();

  // Explicitly block dangerous script pseudo-protocols
  if (/^(javascript|data|vbscript):/i.test(trimmed)) {
    return '#';
  }

  // Safe protocols: HTTP, HTTPS, mailto
  if (/^https?:\/\//i.test(trimmed) || /^mailto:/i.test(trimmed)) {
    return trimmed;
  }

  // Relative internal application path
  if (trimmed.startsWith('/')) {
    return trimmed;
  }

  // If provided as e.g. "github.com/user/repo", prepend "https://"
  if (/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(\/.*)?$/.test(trimmed)) {
    return `https://${trimmed}`;
  }

  return '#';
};
