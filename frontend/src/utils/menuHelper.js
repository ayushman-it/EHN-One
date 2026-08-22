/* ─────────────────────────────────────────────────────────────
   EHN One ERP Sidebar Menu Manager & Custom Order Helper
───────────────────────────────────────────────────────────── */

export const DEFAULT_MENU_STRUCTURE = [
  {
    id: 'sec_main',
    section: 'MAIN GATEWAY',
    collapsible: false,
    items: [
      { id: 'item_dash', to: '/', icon: 'bi-speedometer2', label: 'Gateway Dashboard', permission: 'dashboard.view' },
    ],
  },
  {
    id: 'sec_masters',
    section: 'GATEWAY MASTERS',
    icon: 'bi-folder-symlink',
    collapsible: true,
    items: [
      { id: 'item_products',   to: '/products',     icon: 'bi-box-seam',          label: 'Stock Items Master',  permission: 'products.view' },
      { id: 'item_categories', to: '/categories',  icon: 'bi-tag',               label: 'Stock Groups',        permission: 'categories.view' },
      { id: 'item_customers',  to: '/customers',   icon: 'bi-people',            label: 'Customer Ledgers',    permission: 'products.view' },
      { id: 'item_suppliers',  to: '/suppliers',   icon: 'bi-truck',             label: 'Supplier Directory', permission: 'suppliers.view' },
      { id: 'item_warehouse',  to: '/warehouse',   icon: 'bi-building',          label: 'Godown Masters',      permission: 'warehouse.view' },
    ],
  },
  {
    id: 'sec_vouchers',
    section: 'VOUCHERS & TRANSACTIONS',
    icon: 'bi-boxes',
    collapsible: true,
    items: [
      { id: 'item_invoices',     to: '/invoices',     icon: 'bi-receipt',           label: 'Sales Billing Voucher', permission: 'products.view' },
      { id: 'item_transactions', to: '/transactions', icon: 'bi-arrow-left-right',  label: 'Stock Ledger Daybook', permission: 'transactions.view' },
      { id: 'item_stockin',      to: '/stock-in',     icon: 'bi-arrow-down-circle', label: 'Stock In Entry',       permission: 'transactions.stockin' },
      { id: 'item_stockout',     to: '/stock-out',    icon: 'bi-arrow-up-circle',   label: 'Stock Out Entry',      permission: 'transactions.stockout' },
      { id: 'item_lowstock',     to: '/low-stock',    icon: 'bi-exclamation-triangle', label: 'Low Stock Alerts', permission: 'lowstock.view' },
    ],
  },
  {
    id: 'sec_reports',
    section: 'STATUTORY & REPORTS',
    icon: 'bi-bar-chart-steps',
    collapsible: true,
    items: [
      { id: 'item_reports',   to: '/reports',      icon: 'bi-bar-chart-line',    label: 'Financial Reports', permission: 'reports.view' },
      { id: 'item_analytics', to: '/analytics',    icon: 'bi-graph-up-arrow',    label: 'Business Analytics', permission: 'analytics.view' },
    ],
  },
  {
    id: 'sec_system',
    section: 'SYSTEM & UTILITIES',
    icon: 'bi-shield-gear',
    collapsible: true,
    items: [
      { id: 'item_automations', to: '/automations', icon: 'bi-lightning-charge',   label: 'Bot Automations',  permission: 'settings.view' },
      { id: 'item_settings',    to: '/settings',     icon: 'bi-gear',              label: 'System Settings',  permission: 'settings.view' },
      { id: 'item_users',       to: '/users',        icon: 'bi-people',            label: 'User Security Roles', permission: 'users.view' },
      { id: 'item_support',     to: '/support',      icon: 'bi-headset',           label: 'Support Helpdesk' },
    ],
  },
];

export function getCustomMenuOrder() {
  try {
    const saved = localStorage.getItem('ehn_custom_menu_order');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading custom menu order:', e);
  }
  return DEFAULT_MENU_STRUCTURE;
}

export function saveCustomMenuOrder(newOrder) {
  try {
    localStorage.setItem('ehn_custom_menu_order', JSON.stringify(newOrder));
    window.dispatchEvent(new Event('ehn_menu_order_updated'));
  } catch (e) {
    console.error('Error saving custom menu order:', e);
  }
}

export function resetCustomMenuOrder() {
  try {
    localStorage.removeItem('ehn_custom_menu_order');
    window.dispatchEvent(new Event('ehn_menu_order_updated'));
  } catch (e) {
    console.error('Error resetting custom menu order:', e);
  }
}
