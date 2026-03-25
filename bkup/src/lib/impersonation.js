const KEY = 'impersonated_user';

export const impersonation = {
  start(user) {
    localStorage.setItem(KEY, JSON.stringify(user));
    window.location.href = '/';
  },
  stop() {
    localStorage.removeItem(KEY);
    window.location.href = '/admin';
  },
  get() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  isActive() {
    return !!localStorage.getItem(KEY);
  }
};