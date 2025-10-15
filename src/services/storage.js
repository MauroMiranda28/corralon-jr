export const storage = {
  get(key, fallback = null) {
    const raw = localStorage.getItem(key);
    try { return raw == null ? fallback : JSON.parse(raw); }
    catch { return fallback; }
  },
  set(key, value) { localStorage.setItem(key, JSON.stringify(value)); },
  remove(key) { localStorage.removeItem(key); },
};
