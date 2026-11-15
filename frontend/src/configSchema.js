// Public configuration only. Never put credentials in this object.
export function validateConfig(value) {
  if (!value || !['demo', 'production'].includes(value.environment)) {
    throw new Error('ENVIRONMENT должен быть demo или production');
  }
  const address = value.operationsApiUrl;
  if (address != null && typeof address !== 'string') {
    throw new Error('Некорректный адрес API операций');
  }
  const url = address?.trim() || null;
  if (url) {
    const parsed = new URL(url, 'https://configuration.invalid');
    const relative = url.startsWith('/') && !url.startsWith('//');
    const absolute = /^https?:\/\//i.test(url);
    if ((!relative && !absolute) || !['http:', 'https:'].includes(parsed.protocol) ||
        parsed.username || parsed.password || parsed.search || parsed.hash || url.includes('\\')) {
      throw new Error('API URL должен быть публичным HTTP(S)-адресом или путём /api/... без секретов');
    }
  }
  return Object.freeze({ environment: value.environment, operationsApiUrl: url });
}
