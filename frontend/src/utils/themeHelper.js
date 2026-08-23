export const DEFAULT_THEME = {
  primaryColor: '#1E4D2B', // Deep Green
  bodyBgColor: '#f4fbf5',  // Mint-tinted Light App Background
  textColor: '#0f2917',    // Deep Forest Slate Text
  sidebarBgColor: '#ffffff',
  sidebarTheme: 'light',   // light | dark | navy | purple | custom
  appStyle: 'software',    // software | modern
};

export const COLOR_SWATCHES = [
  { name: 'Kedvass Deep Green (Brand)', color: '#1E4D2B' },
  { name: 'Kedvass Leaf Green', color: '#4CAF50' },
  { name: 'Kedvass Mint Green Accent', color: '#DAF2DB' },
  { name: 'Forest Dark Green', color: '#0f2917' },
  { name: 'Soft Sage Green', color: '#a7f3d0' },
  { name: 'Dark Slate Charcoal', color: '#1e293b' },
];

export const PRESET_THEMES = [
  {
    id: 'kedvass_brand_theme',
    name: 'Kedvass Hygiene Brand Theme (Official)',
    primaryColor: '#1E4D2B',
    bodyBgColor: '#f4fbf5',
    textColor: '#0f2917',
    sidebarBgColor: '#ffffff',
    sidebarTheme: 'light',
    appStyle: 'software',
    desc: 'Official Kedvass Hygiene Products Palette (Deep Green #1E4D2B, Leaf Green #4CAF50, Mint Green #DAF2DB)'
  },
  {
    id: 'kedvass_leaf_emerald',
    name: 'Kedvass Leaf & Emerald Green',
    primaryColor: '#4CAF50',
    bodyBgColor: '#f0fdf4',
    textColor: '#0f2917',
    sidebarBgColor: '#ffffff',
    sidebarTheme: 'light',
    appStyle: 'software',
    desc: 'Vibrant Leaf Green #4CAF50 with Mint Green accents'
  },
  {
    id: 'kedvass_dark_forest',
    name: 'Kedvass Dark Forest ERP Mode',
    primaryColor: '#4CAF50',
    bodyBgColor: '#0f2917',
    textColor: '#f4fbf5',
    sidebarBgColor: '#1E4D2B',
    sidebarTheme: 'dark',
    appStyle: 'software',
    desc: 'Deep Forest Dark Mode with Leaf Green highlights'
  }
];

export function getThemeConfig() {
  try {
    const saved = localStorage.getItem('ehn_theme_config');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (!parsed?.primaryColor || ['#7367f0', '#0284c7', '#2563eb', '#3b82f6', '#059669'].includes(parsed?.primaryColor)) {
        parsed.primaryColor = '#1E4D2B';
        parsed.bodyBgColor = '#f4fbf5';
        parsed.textColor = '#0f2917';
        localStorage.setItem('ehn_theme_config', JSON.stringify(parsed));
      }
      return { ...DEFAULT_THEME, ...parsed };
    }
  } catch (e) {
    console.error('Error reading theme config:', e);
  }
  return DEFAULT_THEME;
}

export function applyThemeConfig(config = DEFAULT_THEME) {
  const root = document.documentElement;
  const primary = config.primaryColor || '#1E4D2B';
  const bodyBg = config.bodyBgColor || '#f4fbf5';
  const textColor = config.textColor || '#0f2917';
  const sidebarBg = config.sidebarBgColor || '#ffffff';
  const isSoftware = (config.appStyle || 'software') === 'software';

  // Apply CSS Variables
  root.style.setProperty('--primary', primary);
  root.style.setProperty('--primary-light', `${primary}26`);
  root.style.setProperty('--leaf-green', '#4CAF50');
  root.style.setProperty('--mint-green', '#DAF2DB');
  root.style.setProperty('--sidebar-hover-bg', `${primary}14`);
  root.style.setProperty('--sidebar-active-bg', `linear-gradient(72.47deg, ${primary} 22.16%, #4CAF50 90%)`);

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
