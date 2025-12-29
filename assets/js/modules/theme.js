import { setCookie, getCookie } from './utils.js';

export function setTheme(theme) {
  if (theme === 'dark') {
    document.documentElement.classList.remove('theme-light');
    document.documentElement.classList.add('theme-dark');
  } else {
    document.documentElement.classList.remove('theme-dark');
    document.documentElement.classList.add('theme-light');
  }
  setCookie('theme', theme);
}

export function getCurrentTheme() {
  return document.documentElement.classList.contains('theme-dark') ? 'dark' : 'light';
}

export function handleThemeToggle() {
  const themeToggles = document.querySelectorAll('.theme-toggle');
  if (!themeToggles || themeToggles.length === 0) return;

  themeToggles.forEach((toggleEl) => {
    toggleEl.addEventListener('click', () => {
      const currentTheme = getCurrentTheme();
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

      // Add transition animation class
      toggleEl.classList.add('theme-transitioning');

      // Remove animation class after animation completes
      setTimeout(() => {
        toggleEl.classList.remove('theme-transitioning');
      }, 600);

      setTheme(newTheme);
    });
  });
}

export function initTheme() {
  // Check for saved theme preference or default to light
  const savedTheme = getCookie('theme') || 'light';
  setTheme(savedTheme);
}

