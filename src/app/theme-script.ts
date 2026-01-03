/**
 * Theme initialization script to prevent FOUC
 * This should be injected in the <head> before the body loads
 */
export const themeScript = `
(function() {
  const colorThemeKeyName = 'color-theme';
  
  let theme = localStorage.getItem(colorThemeKeyName);
  if (!theme) {
    theme = { value: 'light', system: true };
  } else if (theme === 'dark' || theme === 'light') {
    theme = { value: theme, system: false };
    localStorage.setItem(colorThemeKeyName, JSON.stringify(theme));
  } else {
    try {
      theme = JSON.parse(theme);
    } catch {
      theme = { value: 'light', system: true };
    }
  }
  
  let themeValue = theme.value;
  if (theme.system) {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      themeValue = 'dark';
    } else {
      themeValue = 'light';
    }
  }
  
  if (themeValue === 'light') {
    document.documentElement.classList.remove('dark');
  } else {
    document.documentElement.classList.add('dark');
  }
})();
`.trim()



