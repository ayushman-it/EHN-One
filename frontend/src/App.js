import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, NavLink, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import NotificationDropdown from './components/NotificationDropdown';
import Dashboard    from './pages/Dashboard';
import Products     from './pages/Products';
import Transactions from './pages/Transactions';
import Users        from './pages/Users';
import Invoices     from './pages/Invoices';
import Suppliers    from './pages/Suppliers';
import Customers    from './pages/Customers';
import Warehouse    from './pages/Warehouse';
import Categories   from './pages/Categories';
import Automations  from './pages/Automations';
import Reports      from './pages/Reports';
import Settings     from './pages/Settings';
import Support      from './pages/Support';
import Login        from './pages/Login';
import { getThemeConfig, applyThemeConfig } from './utils/themeHelper';
import { getCustomMenuOrder } from './utils/menuHelper';
import { getCustomHotkeys } from './utils/hotkeyHelper';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './App.css';

/* Gateway Menu Structure */
const MENU = [
  {
    section: 'MAIN GATEWAY',
    collapsible: false,
    items: [
      { to: '/', icon: 'bi-speedometer2', label: 'Gateway Dashboard', permission: 'dashboard.view' },
    ],
  },
  {
    section: 'GATEWAY MASTERS',
    icon: 'bi-folder-symlink',
    collapsible: true,
    items: [
      { to: '/products',     icon: 'bi-box-seam',          label: 'Stock Items Master',  permission: 'products.view' },
      { to: '/categories',  icon: 'bi-tag',               label: 'Stock Groups',        permission: 'categories.view' },
      { to: '/customers',   icon: 'bi-people',            label: 'Customer Ledgers',    permission: 'products.view' },
      { to: '/suppliers',   icon: 'bi-truck',             label: 'Supplier Directory', permission: 'suppliers.view' },
      { to: '/warehouse',   icon: 'bi-building',          label: 'Godown Masters',      permission: 'warehouse.view' },
    ],
  },
  {
    section: 'VOUCHERS & TRANSACTIONS',
    icon: 'bi-boxes',
    collapsible: true,
    items: [
      { to: '/invoices',     icon: 'bi-receipt',           label: 'Sales Billing Voucher', permission: 'products.view' },
      { to: '/transactions', icon: 'bi-arrow-left-right',  label: 'Stock Ledger Daybook', permission: 'transactions.view' },
      { to: '/stock-in',     icon: 'bi-arrow-down-circle', label: 'Stock In Entry',       permission: 'transactions.stockin' },
      { to: '/stock-out',    icon: 'bi-arrow-up-circle',   label: 'Stock Out Entry',      permission: 'transactions.stockout' },
      { to: '/low-stock',    icon: 'bi-exclamation-triangle', label: 'Low Stock Alerts', permission: 'lowstock.view' },
    ],
  },
  {
    section: 'STATUTORY & REPORTS',
    icon: 'bi-bar-chart-steps',
    collapsible: true,
    items: [
      { to: '/reports',      icon: 'bi-bar-chart-line',    label: 'Financial Reports', permission: 'reports.view' },
      { to: '/analytics',    icon: 'bi-graph-up-arrow',    label: 'Business Analytics', permission: 'analytics.view' },
    ],
  },
  {
    section: 'SYSTEM & UTILITIES',
    icon: 'bi-shield-gear',
    collapsible: true,
    items: [
      { to: '/automations', icon: 'bi-lightning-charge',   label: 'Bot Automations',  permission: 'settings.view' },
      { to: '/settings',     icon: 'bi-gear',              label: 'System Settings',  permission: 'settings.view' },
      { to: '/users',        icon: 'bi-people',            label: 'User Security Roles', permission: 'users.view' },
      { to: '/support',      icon: 'bi-headset',           label: 'Support Helpdesk' },
    ],
  },
];

function ProtectedRoute({ permission, children }) {
  const { user, can } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (permission && !can(permission)) return <Navigate to="/" replace />;
  return children;
}

/* Gateway Left Sidebar Navigation */
function Sidebar({ open, onClose }) {
  const { can, user } = useAuth();
  const location = useLocation();

  const [companyName, setCompanyName] = useState(() => {
    try {
      const cached = localStorage.getItem('ehn_company_settings');
      if (cached) {
        const parsed = JSON.parse(cached);
        return parsed?.company?.name || 'EHN One';
      }
    } catch (e) {}
    return 'EHN One';
  });

  const [companyLogo, setCompanyLogo] = useState(() => {
    try {
      const cached = localStorage.getItem('ehn_company_settings');
      if (cached) {
        const parsed = JSON.parse(cached);
        return parsed?.company?.logo || '';
      }
    } catch (e) {}
    return '';
  });

  const [openSections, setOpenSections] = useState({
    'GATEWAY MASTERS': true,
    'VOUCHERS & TRANSACTIONS': true,
    'STATUTORY & REPORTS': true,
    'SYSTEM & UTILITIES': true,
  });

  const [menuTree, setMenuTree] = useState(getCustomMenuOrder);

  useEffect(() => {
    const handleCompanyUpdate = () => {
      try {
        const cached = localStorage.getItem('ehn_company_settings');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed?.company?.name) setCompanyName(parsed.company.name);
          setCompanyLogo(parsed?.company?.logo || '');
        }
      } catch (e) {}
    };

    const handleMenuOrderUpdate = () => {
      setMenuTree(getCustomMenuOrder());
    };

    window.addEventListener('ehn_company_updated', handleCompanyUpdate);
    window.addEventListener('ehn_menu_order_updated', handleMenuOrderUpdate);
    window.addEventListener('storage', handleCompanyUpdate);
    window.addEventListener('storage', handleMenuOrderUpdate);
    return () => {
      window.removeEventListener('ehn_company_updated', handleCompanyUpdate);
      window.removeEventListener('ehn_menu_order_updated', handleMenuOrderUpdate);
      window.removeEventListener('storage', handleCompanyUpdate);
      window.removeEventListener('storage', handleMenuOrderUpdate);
    };
  }, []);

  useEffect(() => {
    onClose();
    menuTree.forEach((group) => {
      if (group.items.some((item) => item.to === location.pathname)) {
        setOpenSections((prev) => ({ ...prev, [group.section]: true }));
      }
    });
  }, [location.pathname, menuTree]); // eslint-disable-line

  const toggleSection = (sectionName) => {
    setOpenSections((prev) => ({ ...prev, [sectionName]: !prev[sectionName] }));
  };

  const visibleMenu = menuTree.map((group) => ({
    ...group,
    items: group.items.filter((item) => can(item.permission)),
  })).filter((group) => group.items.length > 0);

  return (
    <>
      <div className={`sidebar-overlay${open ? ' show' : ''}`} onClick={onClose} aria-hidden="true" />

      <aside className={`sidebar${open ? ' open' : ''}`} aria-label="Sidebar navigation">
        {/* Tally Header Logo Box */}
        <div className="sidebar-header border-bottom p-3">
          <div className="d-flex align-items-center justify-content-between">
            <span className="sidebar-logo d-flex align-items-center gap-2">
              {companyLogo ? (
                <img 
                  src={companyLogo} 
                  alt="Company Logo" 
                  className="rounded shadow-sm" 
                  style={{ width: 32, height: 32, objectFit: 'contain', background: '#fff', padding: '2px', border: '1px solid #cbd5e1' }} 
                />
              ) : (
                <span className="sidebar-logo-icon rounded d-flex align-items-center justify-content-center" style={{ width: 32, height: 32, background: 'var(--primary)', color: '#fff' }}>
                  <i className="bi bi-box-seam"></i>
                </span>
              )}
              <span className="sidebar-logo-text overflow-hidden">
                <span className="fw-bold d-block text-uppercase text-truncate" style={{ fontSize: '0.88rem', letterSpacing: '0.5px', lineHeight: 1.1 }}>{companyName}</span>
                <span className="text-muted small" style={{ fontSize: '0.68rem' }}>EHN One Gateway</span>
              </span>
            </span>
            <button className="sidebar-close-btn d-lg-none" onClick={onClose} aria-label="Close sidebar">
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
        </div>

        {/* Clean Aligned Gateway Menu Navigation */}
        <nav className="sidebar-nav p-2">
          {visibleMenu.map((group) => {
            const isCollapsible = group.collapsible;
            const isOpen = openSections[group.section] !== false;

            if (!isCollapsible) {
              return (
                <div key={group.section} className="sidebar-group-wrapper mb-2">
                  <div className="sidebar-section-title px-2 py-1 text-muted text-uppercase fw-bold" style={{ fontSize: '0.68rem', letterSpacing: '0.8px' }}>
                    {group.section}
                  </div>
                  {group.items.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === '/'}
                      className={({ isActive }) => `sidebar-link d-flex align-items-center gap-2 px-2.5 py-2 rounded-1 ${isActive ? 'active' : ''}`}
                    >
                      <i className={`bi ${item.icon} sidebar-link-icon`}></i>
                      <span className="fw-semibold text-truncate" style={{ fontSize: '0.82rem' }}>{item.label}</span>
                    </NavLink>
                  ))}
                </div>
              );
            }

            return (
              <div key={group.section} className="sidebar-group-wrapper mb-2">
                <button
                  type="button"
                  className={`sidebar-parent-btn w-100 d-flex align-items-center justify-content-between px-2.5 py-2 border-0 bg-transparent style-cursor ${isOpen ? 'expanded' : ''}`}
                  onClick={() => toggleSection(group.section)}
                >
                  <div className="d-flex align-items-center gap-2 overflow-hidden">
                    <i className={`bi ${group.icon} sidebar-parent-icon`}></i>
                    <span className="sidebar-parent-label fw-bold text-uppercase text-truncate" style={{ fontSize: '0.72rem', letterSpacing: '0.5px' }}>{group.section}</span>
                  </div>
                  <i className={`bi ${isOpen ? 'bi-chevron-down' : 'bi-chevron-right'} sidebar-chevron flex-shrink-0`} style={{ fontSize: '0.75rem' }}></i>
                </button>

                {isOpen && (
                  <div className="sidebar-nested-menu ps-2 mt-1">
                    {group.items.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) => `sidebar-link sidebar-nested-link d-flex align-items-center gap-2 px-2.5 py-1.5 rounded-1 ${isActive ? 'active' : ''}`}
                      >
                        <i className={`bi ${item.icon} sidebar-link-icon`}></i>
                        <span className="text-truncate" style={{ fontSize: '0.8rem' }}>{item.label}</span>
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Sidebar Footer User Info */}
        <div className="sidebar-footer p-2 border-top">
          <div className="d-flex align-items-center gap-2 px-2 py-1">
            <div className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-sm flex-shrink-0" style={{ width: 28, height: 28, background: 'var(--primary)', fontSize: '0.75rem' }}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="sidebar-user-info overflow-hidden">
              <div className="sidebar-user-name fw-bold text-truncate" style={{ fontSize: '0.8rem' }}>{user?.name}</div>
              <div className="text-muted text-truncate" style={{ fontSize: '0.68rem' }}>{user?.role?.toUpperCase()} | F.Y. 2026-27</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

/* Gateway of Tally Redesigned Top Header Navbar */
function Navbar({ onToggle, onOpenCommandPalette }) {
  const { user, logout, roleInfo } = useAuth();
  const navigate = useNavigate();
  const [dropOpen, setDropOpen] = useState(false);

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });

  useEffect(() => {
    if (!dropOpen) return;
    const handler = () => setDropOpen(false);
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropOpen]);

  return (
    <header className="main-navbar shadow-sm">
      <div className="d-flex align-items-center gap-2 flex-grow-1 min-w-0">
        <button className="navbar-hamburger d-lg-none" onClick={onToggle} aria-label="Toggle sidebar">
          <i className="bi bi-list"></i>
        </button>

        {/* Tally Go To Quick Search Command Box */}
        <div 
          className="navbar-search style-cursor d-flex align-items-center" 
          onClick={onOpenCommandPalette} 
          style={{ maxWidth: 320, width: '100%' }}
        >
          <i className="bi bi-search search-icon me-2 text-primary"></i>
          <input 
            type="text" 
            placeholder="[Alt+G] Go To Search Master / Voucher..." 
            readOnly 
            style={{ cursor: 'pointer', fontSize: '0.82rem' }} 
          />
        </div>

        {/* Quick Action Navigation Pills */}
        <div className="tally-top-menu-bar d-none d-lg-flex align-items-center gap-1 ms-2">
          <button className="tally-top-menu-btn" onClick={() => navigate('/invoices')}>
            <span className="key">F8</span> Billing
          </button>
          <button className="tally-top-menu-btn" onClick={() => navigate('/transactions')}>
            <span className="key">F7</span> Daybook
          </button>
          <button className="tally-top-menu-btn" onClick={() => navigate('/reports')}>
            <span className="key">F5</span> Reports
          </button>
          <button className="tally-top-menu-btn" onClick={() => navigate('/settings')}>
            <span className="key">F12</span> Settings
          </button>
        </div>
      </div>

      {/* Right-hand side Operator & Session Metadata */}
      <div className="navbar-right ms-auto d-flex align-items-center gap-2 flex-shrink-0">
        <span className="badge-v secondary d-none d-xl-inline-flex" style={{ fontSize: '0.7rem' }}>
          <i className="bi bi-building me-1"></i> F.Y. 2026-2027
        </span>

        <span className="d-none d-md-flex align-items-center gap-1 text-muted" style={{ fontSize: '0.75rem' }}>
          <i className="bi bi-calendar3"></i> {today}
        </span>

        <NotificationDropdown />

        <button
          className="navbar-icon-btn d-none d-md-flex"
          title="Toggle Fullscreen View"
          onClick={() => {
            if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
            else document.exitFullscreen().catch(() => {});
          }}
        >
          <i className="bi bi-fullscreen"></i>
        </button>

        <div style={{ width: 1, height: 22, background: 'var(--border-color)', margin: '0 4px' }}></div>

        {/* Operator Profile Dropdown */}
        <div className="navbar-user-wrap" onMouseDown={(e) => e.stopPropagation()}>
          <button className="navbar-user" onClick={() => setDropOpen((v) => !v)} aria-haspopup="true" aria-expanded={dropOpen}>
            <div className={`navbar-user-avatar role-avatar-${user?.role}`}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="d-none d-md-block text-start">
              <div className="navbar-user-name fw-bold">{user?.name}</div>
              {roleInfo && (
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1 }}>
                  {roleInfo.label}
                </div>
              )}
            </div>
            <i className="bi bi-chevron-down d-none d-md-block" style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}></i>
          </button>

          {dropOpen && (
            <div className="navbar-dropdown">
              <div className="navbar-dropdown-header">
                <div className={`nd-avatar role-avatar-${user?.role}`}>
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="nd-name">{user?.name}</div>
                  <div className="nd-email">{user?.email}</div>
                  {roleInfo && (
                    <span className={`badge-v ${roleInfo.color} mt-1`} style={{ fontSize: '0.68rem' }}>
                      <i className={`bi ${roleInfo.icon}`}></i> {roleInfo.label}
                    </span>
                  )}
                </div>
              </div>
              <div className="navbar-dropdown-divider"></div>
              <button className="navbar-dropdown-item" onClick={() => { setDropOpen(false); navigate('/settings'); }}>
                <i className="bi bi-gear"></i> System Settings
              </button>
              <button className="navbar-dropdown-item danger" onClick={logout}>
                <i className="bi bi-box-arrow-right"></i> Logout Operator Session
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

/* Tally Quick Command Navigation Palette Modal */
function TallyCommandPaletteModal({ onClose }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const allCommands = [
    { label: 'Stock Items Catalog Master', category: 'Masters', route: '/products', keyHint: 'F4', icon: 'bi-box-seam' },
    { label: 'Stock Groups & Item Categories', category: 'Masters', route: '/categories', keyHint: 'Alt+C', icon: 'bi-tag' },
    { label: 'Customer Ledgers (Sundry Debtors)', category: 'Masters', route: '/customers', keyHint: 'F3', icon: 'bi-people' },
    { label: 'Supplier Directory (Sundry Creditors)', category: 'Masters', route: '/suppliers', keyHint: 'Alt+S', icon: 'bi-truck' },
    { label: 'Godown & Warehouse Masters', category: 'Masters', route: '/warehouse', keyHint: 'Alt+W', icon: 'bi-building' },
    { label: 'Sales Billing Invoice Voucher', category: 'Vouchers', route: '/invoices', keyHint: 'F8', icon: 'bi-receipt' },
    { label: 'Stock Ledger Daybook', category: 'Vouchers', route: '/transactions', keyHint: 'F7', icon: 'bi-arrow-left-right' },
    { label: 'Stock In Goods Receipt Entry', category: 'Vouchers', route: '/stock-in', keyHint: 'Alt+G', icon: 'bi-arrow-down-circle' },
    { label: 'Stock Out Goods Issue Entry', category: 'Vouchers', route: '/stock-out', keyHint: 'Alt+O', icon: 'bi-arrow-up-circle' },
    { label: 'Low Stock Reorder Alerts', category: 'Vouchers', route: '/low-stock', keyHint: 'Alt+L', icon: 'bi-exclamation-triangle' },
    { label: 'Financial Statements & GSTR Audit', category: 'Reports', route: '/reports', keyHint: 'F5', icon: 'bi-bar-chart-line' },
    { label: 'Bot Automations & Reminders', category: 'Utilities', route: '/automations', keyHint: 'Alt+A', icon: 'bi-lightning-charge' },
    { label: 'Tally F12 System Settings', category: 'System', route: '/settings', keyHint: 'F12', icon: 'bi-gear' },
    { label: 'User Security & Roles Register', category: 'System', route: '/users', keyHint: 'Alt+U', icon: 'bi-shield-check' },
  ];

  const filteredCommands = allCommands.filter(c => 
    !query || c.label.toLowerCase().includes(query.toLowerCase()) || c.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box" style={{ maxWidth: 600 }}>
        <div className="modal-box-header d-flex align-items-center justify-content-between" style={{ background: 'var(--primary)', color: '#fff' }}>
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-search"></i>
            <span className="fw-bold">EHN ONE GATEWAY &mdash; GO TO QUICK COMMAND SEARCH</span>
          </div>
          <button className="close-btn text-white" onClick={onClose}><i className="bi bi-x-lg"></i></button>
        </div>
        <div className="modal-box-body p-3">
          <div className="search-box-v mb-3">
            <i className="bi bi-search"></i>
            <input 
              autoFocus
              type="text" 
              className="form-control" 
              placeholder="Type to jump to any register, master or report..." 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="list-group list-group-flush border rounded-2" style={{ maxHeight: '50vh', overflowY: 'auto' }}>
            {filteredCommands.map((cmd, idx) => (
              <button 
                key={idx}
                className="list-group-item list-group-item-action d-flex align-items-center justify-content-between p-2.5 style-cursor"
                onClick={() => { navigate(cmd.route); onClose(); }}
              >
                <div className="d-flex align-items-center gap-2">
                  <i className={`bi ${cmd.icon} text-primary`}></i>
                  <div>
                    <div className="fw-bold text-dark" style={{ fontSize: '0.85rem' }}>{cmd.label}</div>
                    <small className="text-muted" style={{ fontSize: '0.7rem' }}>{cmd.category}</small>
                  </div>
                </div>
                <span className="tally-key-hint">{cmd.keyHint}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);

  const [hotkeys, setHotkeys] = useState(getCustomHotkeys);

  useEffect(() => {
    const handleHotkeysUpdate = () => {
      setHotkeys(getCustomHotkeys());
    };
    window.addEventListener('ehn_hotkeys_updated', handleHotkeysUpdate);
    window.addEventListener('storage', handleHotkeysUpdate);
    return () => {
      window.removeEventListener('ehn_hotkeys_updated', handleHotkeysUpdate);
      window.removeEventListener('storage', handleHotkeysUpdate);
    };
  }, []);

  useEffect(() => {
    const gotoHotkey = hotkeys.find(h => h.action === 'open_goto')?.shortcut || 'Alt+G';
    const parts = gotoHotkey.toLowerCase().split('+');

    const handleGlobalKeyDown = (e) => {
      const matchAlt = parts.includes('alt') === e.altKey;
      const matchCtrl = parts.includes('ctrl') === e.ctrlKey;
      const matchShift = parts.includes('shift') === e.shiftKey;
      const keyChar = parts[parts.length - 1];

      if (matchAlt && matchCtrl && matchShift && e.key.toLowerCase() === keyChar) {
        e.preventDefault();
        setShowCommandPalette((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [hotkeys]);

  return (
    <div className="app-shell">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="app-main">
        <Navbar onToggle={() => setSidebarOpen((v) => !v)} onOpenCommandPalette={() => setShowCommandPalette(true)} />
        <main className="content-area">
          <Routes>
            <Route path="/"            element={<ProtectedRoute permission="dashboard.view"><Dashboard /></ProtectedRoute>} />
            <Route path="/products"    element={<ProtectedRoute permission="products.view"><Products /></ProtectedRoute>} />
            <Route path="/transactions" element={<ProtectedRoute permission="transactions.view"><Transactions /></ProtectedRoute>} />
            <Route path="/stock-in"    element={<ProtectedRoute permission="transactions.stockin"><Transactions defaultType="stock_in" /></ProtectedRoute>} />
            <Route path="/stock-out"   element={<ProtectedRoute permission="transactions.stockout"><Transactions defaultType="stock_out" /></ProtectedRoute>} />
            <Route path="/low-stock"   element={<ProtectedRoute permission="lowstock.view"><Dashboard showLowStockOnly /></ProtectedRoute>} />
            <Route path="/invoices"    element={<ProtectedRoute permission="products.view"><Invoices /></ProtectedRoute>} />
            <Route path="/customers"   element={<ProtectedRoute permission="products.view"><Customers /></ProtectedRoute>} />
            <Route path="/suppliers"   element={<ProtectedRoute permission="suppliers.view"><Suppliers /></ProtectedRoute>} />
            <Route path="/categories"  element={<ProtectedRoute permission="categories.view"><Categories /></ProtectedRoute>} />
            <Route path="/warehouse"   element={<ProtectedRoute permission="warehouse.view"><Warehouse /></ProtectedRoute>} />
            <Route path="/reports"     element={<ProtectedRoute permission="reports.view"><Reports /></ProtectedRoute>} />
            <Route path="/analytics"   element={<ProtectedRoute permission="analytics.view"><Reports defaultTab="overview" /></ProtectedRoute>} />
            <Route path="/automations" element={<ProtectedRoute permission="settings.view"><Automations /></ProtectedRoute>} />
            <Route path="/settings"    element={<ProtectedRoute permission="settings.view"><Settings /></ProtectedRoute>} />
            <Route path="/users"       element={<ProtectedRoute permission="users.view"><Users /></ProtectedRoute>} />
            <Route path="/support"     element={<Support />} />
            <Route path="*"            element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      {showCommandPalette && <TallyCommandPaletteModal onClose={() => setShowCommandPalette(false)} />}
    </div>
  );
}

export default function App() {
  useEffect(() => {
    const config = getThemeConfig();
    applyThemeConfig(config);
  }, []);

  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*"     element={<MainLayout />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
