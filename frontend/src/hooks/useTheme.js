import { useCallback, useEffect, useState } from 'react';

// Tema terang/gelap. Class "dark" pada <html> sudah dipasang lebih dulu oleh skrip di index.html.
export function useTheme() {
  const [gelap, setGelap] = useState(() => document.documentElement.classList.contains('dark'));

  useEffect(() => {
    document.documentElement.classList.toggle('dark', gelap);
    try { localStorage.setItem('theme', gelap ? 'dark' : 'light'); } catch { /* penyimpanan diblokir */ }
  }, [gelap]);

  const ganti = useCallback(() => setGelap((g) => !g), []);
  return { gelap, ganti };
}
