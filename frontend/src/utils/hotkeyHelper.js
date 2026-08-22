/* ─────────────────────────────────────────────────────────────
   EHN One ERP Global Keyboard Shortcuts & Hotkey Manager Helper
───────────────────────────────────────────────────────────── */

export const DEFAULT_HOTKEYS = [
  { id: 'hk_search',      label: 'Focus Search Box / Filter', action: 'focus_search',  shortcut: 'F2',      category: 'Global Navigation' },
  { id: 'hk_add',         label: 'Create New Master / Voucher', action: 'add_item',     shortcut: 'F4',      category: 'Global Actions' },
  { id: 'hk_reports',     label: 'Open Financial Reports',    action: 'open_reports',   shortcut: 'F5',      category: 'Reports & Audit' },
  { id: 'hk_daybook',     label: 'Open Stock Ledger Daybook', action: 'open_daybook',   shortcut: 'F7',      category: 'Vouchers & Daybook' },
  { id: 'hk_billing',     label: 'Open Sales Billing Voucher',action: 'open_billing',   shortcut: 'F8',      category: 'Vouchers & Daybook' },
  { id: 'hk_analytics',   label: 'Open Business Analytics',   action: 'open_analytics', shortcut: 'F9',      category: 'Reports & Audit' },
  { id: 'hk_settings',    label: 'Open System Settings',      action: 'open_settings',  shortcut: 'F12',     category: 'System' },
  { id: 'hk_goto',        label: 'Go To Quick Search Modal',  action: 'open_goto',      shortcut: 'Alt+G',   category: 'Global Navigation' },
  { id: 'hk_export_csv',  label: 'Export Data to CSV',        action: 'export_csv',     shortcut: 'Alt+C',   category: 'Document Exports' },
  { id: 'hk_export_excel',label: 'Export Data to Excel',      action: 'export_excel',   shortcut: 'Alt+X',   category: 'Document Exports' },
  { id: 'hk_print_pdf',   label: 'Print PDF Document',        action: 'print_pdf',      shortcut: 'Alt+P',   category: 'Document Exports' },
  { id: 'hk_automations', label: 'Open Bot Automations',      action: 'open_automations',shortcut: 'Alt+A',  category: 'Utilities' },
  { id: 'hk_users',       label: 'Open User Security Roles',  action: 'open_users',     shortcut: 'Alt+U',   category: 'System' },
  { id: 'hk_suppliers',   label: 'Open Supplier Directory',   action: 'open_suppliers', shortcut: 'Alt+S',   category: 'Catalogue Masters' },
  { id: 'hk_warehouse',   label: 'Open Godown Masters',       action: 'open_warehouse', shortcut: 'Alt+W',   category: 'Catalogue Masters' },
  { id: 'hk_export_xml',  label: 'Export Tally XML Data',     action: 'export_xml',     shortcut: 'Alt+E',   category: 'Document Exports' },
];

export function getCustomHotkeys() {
  try {
    const saved = localStorage.getItem('ehn_custom_hotkeys');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading custom hotkeys:', e);
  }
  return DEFAULT_HOTKEYS;
}

export function saveCustomHotkeys(newHotkeys) {
  try {
    localStorage.setItem('ehn_custom_hotkeys', JSON.stringify(newHotkeys));
    window.dispatchEvent(new Event('ehn_hotkeys_updated'));
  } catch (e) {
    console.error('Error saving custom hotkeys:', e);
  }
}

export function resetCustomHotkeys() {
  try {
    localStorage.removeItem('ehn_custom_hotkeys');
    window.dispatchEvent(new Event('ehn_hotkeys_updated'));
  } catch (e) {
    console.error('Error resetting custom hotkeys:', e);
  }
}
