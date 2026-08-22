export const DEFAULT_THEME = {
  primaryColor: '#7367f0',
  bodyBgColor: '#f8f7fa',
  textColor: '#2f2b3d',
  sidebarBgColor: '#ffffff',
  sidebarTheme: 'light', // light | dark | navy | purple | custom
  appStyle: 'software', // software | modern
};

export const COLOR_SWATCHES = [
  { name: 'Vuexy Electric Purple', color: '#7367f0' },
  { name: 'Enterprise Sapphire Blue', color: '#2563eb' },
  { name: 'Tally Emerald Green', color: '#059669' },
  { name: 'Deep Crimson Red', color: '#dc2626' },
  { name: 'Midnight Purple', color: '#7c3aed' },
  { name: 'Dark Slate Charcoal', color: '#1e293b' },
];

export const PRESET_THEMES = [
  {
    id: 'tally_prime_classic',
    name: 'Tally Prime Gold & Teal Classic',
    primaryColor: '#0284c7',
    bodyBgColor: '#f0f9ff',
    textColor: '#0f172a',
    sidebarBgColor: '#0f172a',
    sidebarTheme: 'navy',
    appStyle: 'software',
    desc: 'Authentic Tally Prime Teal Header & Navy Sidebar Desktop ERP Theme'
  },
  {
    id: 'busy_erp_slate',
    name: 'Busy ERP Slate & Emerald',
    primaryColor: '#059669',
    bodyBgColor: '#f0fdf4',
    textColor: '#064e3b',
    sidebarBgColor: '#064e3b',
    sidebarTheme: 'dark',
    appStyle: 'software',
    desc: 'Busy ERP Desktop style with high-contrast emerald & dark slate palette'
  },
  {
    id: 'sap_enterprise_dark',
    name: 'SAP Enterprise Dark Mode',
    primaryColor: '#3b82f6',
    bodyBgColor: '#0f172a',
    textColor: '#f8fafc',
    sidebarBgColor: '#1e293b',
    sidebarTheme: 'navy',
    appStyle: 'software',
    desc: 'High-density SAP ERP Dark Mode with electric blue accents'
  },
  {
    id: 'ehn_purple_classic',
    name: 'EHN One Purple Classic',
    primaryColor: '#7367f0',
    bodyBgColor: '#f8f7fa',
    textColor: '#2f2b3d',
    sidebarBgColor: '#ffffff',
    sidebarTheme: 'light',
    appStyle: 'software',
    desc: 'Clean corporate violet theme with sharp desktop software edges'
  }
];

export function getThemeConfig() {
  try {
    const saved = localStorage.getItem('ehn_theme_config');
    if (saved) return { ...DEFAULT_THEME, ...JSON.parse(saved) };
  } catch (e) {
    console.error('Error reading theme config:', e);
  }
  return DEFAULT_THEME;
}

export function applyThemeConfig(config = DEFAULT_THEME) {
  const root = document.documentElement;
  const primary = config.primaryColor || '#7367f0';
  const bodyBg = config.bodyBgColor || '#f8f7fa';
  const textColor = config.textColor || '#2f2b3d';
  const sidebarBg = config.sidebarBgColor || '#ffffff';
  const isSoftware = (config.appStyle || 'software') === 'software';

  // Apply CSS Variables
  root.style.setProperty('--primary', primary);
  root.style.setProperty('--primary-light', `${primary}26`);
  root.style.setProperty('--sidebar-hover-bg', `${primary}14`);
  root.style.setProperty('--sidebar-active-bg', `linear-gradient(72.47deg, ${primary} 22.16%, ${primary}cc 76.47%)`);

  // Custom Colors
  root.style.setProperty('--body-bg', bodyBg);
  root.style.setProperty('--text-main', textColor);
  document.body.style.backgroundColor = bodyBg;
  document.body.style.color = textColor;

  // Sharp software edges vs modern web rounded corners
  root.style.setProperty('--radius', isSoftware ? '2px' : '8px');
  root.style.setProperty('--card-radius', isSoftware ? '2px' : '10px');
  root.style.setProperty('--btn-radius', isSoftware ? '2px' : '6px');
  root.style.setProperty('--modal-radius', isSoftware ? '2px' : '12px');

  // Sidebar Theme background
  if (config.sidebarTheme === 'dark') {
    root.style.setProperty('--sidebar-bg', '#1e1e2d');
    root.style.setProperty('--sidebar-border', '#2b2b40');
    root.style.setProperty('--sidebar-text', '#a6a8b8');
    root.style.setProperty('--sidebar-active-text', '#ffffff');
  } else if (config.sidebarTheme === 'navy') {
    root.style.setProperty('--sidebar-bg', '#0f172a');
    root.style.setProperty('--sidebar-border', '#1e293b');
    root.style.setProperty('--sidebar-text', '#94a3b8');
    root.style.setProperty('--sidebar-active-text', '#ffffff');
  } else if (config.sidebarTheme === 'purple') {
    root.style.setProperty('--sidebar-bg', '#181824');
    root.style.setProperty('--sidebar-border', '#262638');
    root.style.setProperty('--sidebar-text', '#a0a0b8');
    root.style.setProperty('--sidebar-active-text', '#ffffff');
  } else if (config.sidebarTheme === 'custom') {
    root.style.setProperty('--sidebar-bg', sidebarBg);
    root.style.setProperty('--sidebar-border', 'rgba(75,70,92,0.15)');
    root.style.setProperty('--sidebar-text', 'rgba(75,70,92,0.85)');
    root.style.setProperty('--sidebar-active-text', '#ffffff');
  } else {
    // Default Light
    root.style.setProperty('--sidebar-bg', sidebarBg || '#ffffff');
    root.style.setProperty('--sidebar-border', 'rgba(75,70,92,0.12)');
    root.style.setProperty('--sidebar-text', 'rgba(75,70,92,0.78)');
    root.style.setProperty('--sidebar-active-text', '#ffffff');
  }
}

export function saveThemeConfig(config) {
  try {
    localStorage.setItem('ehn_theme_config', JSON.stringify(config));
    applyThemeConfig(config);
  } catch (e) {
    console.error('Error saving theme config:', e);
  }
}
