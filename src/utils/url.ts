export const PUBLIC_APP_URL =
  'https://ais-pre-2ein27xynyp2rm77tv3zb3-825098834613.asia-east1.run.app';

export function getPublicShareUrl(): string {
  if (typeof window === 'undefined') {
    return PUBLIC_APP_URL;
  }

  try {
    const href = window.location.href;
    // If running in development container (private to developer), convert to public shared preview
    if (href.includes('ais-dev-')) {
      return href.replace('ais-dev-', 'ais-pre-');
    }
    // If running inside AI Studio iframe or local testing
    if (
      href.includes('aistudio.google.com') ||
      href.includes('google.com') ||
      href.includes('localhost') ||
      href.includes('127.0.0.1') ||
      href.startsWith('about:')
    ) {
      return PUBLIC_APP_URL;
    }
    return href;
  } catch {
    return PUBLIC_APP_URL;
  }
}
