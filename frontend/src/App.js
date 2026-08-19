import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, NavLink, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth, ROLES } from './context/AuthContext';
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
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './App.css';

/* ─────────────────────────────────────────────
   Sidebar menu — each item has `permission`
   so only allowed items are shown per role
───────────────────────────────────────────── */
const MENU = [
  {
    section: 'Main',
    items: [
      { to: '/',             icon: 'bi-speedometer2',      label: 'Dashboard',        permission: 'dashboard.view' },
    ],
  },
  {
    section: 'Inventory',
    items: [
      { to: '/products',     icon: 'bi-box-seam',          label: 'Products',         permission: 'products.view' },
      { to: '/transactions', icon: 'bi-arrow-left-right',  label: 'Transactions',     permission: 'transactions.view' },
      { to: '/stock-in',     icon: 'bi-arrow-down-circle', label: 'Stock In',         permission: 'transactions.stockin' },
      { to: '/stock-out',    icon: 'bi-arrow-up-circle',   label: 'Stock Out',        permission: 'transactions.stockout' },
      { to: '/low-stock',    icon: 'bi-exclamation-triangle', label: 'Low Stock Alerts', permission: 'lowstock.view' },
      { to: '/invoices',     icon: 'bi-receipt',           label: 'Invoices',         permission: 'products.view' },
    ],
  },
  {
    section: 'Catalogue',
    items: [
      { to: '/customers',   icon: 'bi-people',            label: 'Customers',        permission: 'products.view' },
      { to: '/categories',   icon: 'bi-tag',               label: 'Categories',       permission: 'categories.view' },
      { to: '/suppliers',    icon: 'bi-truck',             label: 'Suppliers',        permission: 'suppliers.view' },
      { to: '/warehouse',    icon: 'bi-building',          label: 'Warehouse',        permission: 'warehouse.view' },
    ],
  },
  {
    section: 'Reports',
    items: [
      { to: '/reports',      icon: 'bi-bar-chart-line',    label: 'Reports',          permission: 'reports.view' },
      { to: '/analytics',    icon: 'bi-graph-up-arrow',    label: 'Analytics',        permission: 'analytics.view' },
    ],
  },
  {
    section: 'Administration',
    items: [
      { to: '/automations', icon: 'bi-lightning-charge',   label: 'Automations',      permission: 'settings.view' },
      { to: '/settings',     icon: 'bi-gear',              label: 'Settings',         permission: 'settings.view' },
      { to: '/users',        icon: 'bi-people',            label: 'User Management',  permission: 'users.view' },
      { to: '/support',      icon: 'bi-headset',           label: 'Support Helpdesk' },
    ],
  },
];

/* ── Protected Route ── */
function ProtectedRoute({ permission, children }) {
  const { user, can } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  // If user doesn't have permission, redirect to dashboard instead of showing Access Denied
  if (permission && !can(permission)) return <Navigate to="/" replace />;
  return children;
}

function ComingSoon() {
  return (
    <div className="empty-state-v" style={{ paddingTop: 80 }}>
      <i className="bi bi-tools"></i>
      <h5>Coming Soon</h5>
      <p>This feature is under development</p>
    </div>
  );
}

/* ── Sidebar ── */
function Sidebar({ open, onClose }) {
  const { can, user, roleInfo } = useAuth();
  const location = useLocation();
  useEffect(() => { onClose(); }, [location.pathname]); // eslint-disable-line

  const visibleMenu = MENU.map((group) => ({
    ...group,
    items: group.items.filter((item) => can(item.permission)),
  })).filter((group) => group.items.length > 0);

  return (
    <>
      <div className={`sidebar-overlay${open ? ' show' : ''}`} onClick={onClose} aria-hidden="true" />

      <aside className={`sidebar${open ? ' open' : ''}`} aria-label="Sidebar navigation">
        {/* Logo */}
        <div className="sidebar-header">
          <span className="sidebar-logo">
            <span className="sidebar-logo-icon"><i className="bi bi-box-seam"></i></span>
            <span className="sidebar-logo-text">
              EHN One
              <span className="sidebar-logo-sub">Inventory System</span>
            </span>
          </span>
          <button className="sidebar-close-btn" onClick={onClose} aria-label="Close sidebar">
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          {visibleMenu.map((group) => (
            <div key={group.section}>
              <div className="sidebar-section-title">{group.section}</div>
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
                >
                  <i className={`bi ${item.icon} sidebar-link-icon`}></i>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Footer — logged-in user */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user?.name}</div>
              <div className="sidebar-user-role">
                {roleInfo && (
                  <span className={`sidebar-role-badge role-${user?.role}`}>
                    <i className={`bi ${roleInfo.icon}`}></i> {roleInfo.label}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

/* ── Top Navbar ── */
function Navbar({ onToggle }) {
  const { user, logout, roleInfo } = useAuth();
  const navigate = useNavigate();
  const [dropOpen, setDropOpen] = useState(false);

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropOpen) return;
    const handler = () => setDropOpen(false);
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropOpen]);

  return (
    <header className="main-navbar">
      <button className="navbar-hamburger" onClick={onToggle} aria-label="Toggle sidebar">
        <i className="bi bi-list"></i>
      </button>

      <div className="navbar-search">
        <i className="bi bi-search search-icon"></i>
        <input type="text" placeholder="Search products, transactions…" aria-label="Search" />
      </div>

      <div className="navbar-right">
        <span className="d-none d-lg-flex align-items-center gap-1 me-2" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <i className="bi bi-calendar3"></i> {today}
        </span>

        <NotificationDropdown />

        <button
          className="navbar-icon-btn d-none d-md-flex"
          aria-label="Fullscreen"
          onClick={() => {
            if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
            else document.exitFullscreen().catch(() => {});
          }}
        >
          <i className="bi bi-fullscreen"></i>
        </button>

        <div style={{ width: 1, height: 24, background: 'var(--border-color)', margin: '0 4px' }}></div>

        {/* User dropdown */}
        <div className="navbar-user-wrap" onMouseDown={(e) => e.stopPropagation()}>
          <button className="navbar-user" onClick={() => setDropOpen((v) => !v)} aria-haspopup="true" aria-expanded={dropOpen}>
            <div className={`navbar-user-avatar role-avatar-${user?.role}`}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="d-none d-md-block text-start">
              <div className="navbar-user-name">{user?.name}</div>
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
              {/* User info header */}
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
                <i className="bi bi-person me-2"></i> My Profile
              </button>
              <button className="navbar-dropdown-item" onClick={() => { setDropOpen(false); navigate('/settings'); }}>
                <i className="bi bi-gear me-2"></i> Settings
              </button>
              <button className="navbar-dropdown-item" onClick={() => { setDropOpen(false); navigate('/support'); }}>
                <i className="bi bi-headset me-2"></i> Support Helpdesk
              </button>
              <div className="navbar-dropdown-divider"></div>
              <button className="navbar-dropdown-item danger" onClick={() => { setDropOpen(false); logout(); }}>
                <i className="bi bi-box-arrow-right me-2"></i> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

/* ── Main App (after login) ── */
function AppInner() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  if (!user) return <Login />;

  return (
    <div className="layout-wrapper">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content-wrap">
        <Navbar onToggle={() => setSidebarOpen((v) => !v)} />
        <main className="main-content">
          <Routes>
            <Route path="/login" element={<Navigate to="/" replace />} />

            <Route path="/" element={
              <ProtectedRoute permission="dashboard.view"><Dashboard /></ProtectedRoute>
            } />
            <Route path="/products" element={
              <ProtectedRoute permission="products.view"><Products /></ProtectedRoute>
            } />
            <Route path="/transactions" element={
              <ProtectedRoute permission="transactions.view"><Transactions /></ProtectedRoute>
            } />
            <Route path="/stock-in" element={
              <ProtectedRoute permission="transactions.stockin"><Transactions defaultType="in" /></ProtectedRoute>
            } />
            <Route path="/stock-out" element={
              <ProtectedRoute permission="transactions.stockout"><Transactions defaultType="out" /></ProtectedRoute>
            } />
            <Route path="/low-stock" element={
              <ProtectedRoute permission="lowstock.view"><Dashboard showLowStockOnly /></ProtectedRoute>
            } />
            <Route path="/invoices" element={
              <ProtectedRoute permission="products.view"><Invoices /></ProtectedRoute>
            } />
            <Route path="/customers"  element={<ProtectedRoute permission="products.view"><Customers /></ProtectedRoute>} />
            <Route path="/categories" element={<ProtectedRoute permission="categories.view"><Categories /></ProtectedRoute>} />
            <Route path="/suppliers"  element={<ProtectedRoute permission="suppliers.view"><Suppliers /></ProtectedRoute>} />
            <Route path="/warehouse"  element={<ProtectedRoute permission="warehouse.view"><Warehouse /></ProtectedRoute>} />
            <Route path="/reports"    element={<ProtectedRoute permission="reports.view"><Reports /></ProtectedRoute>} />
            <Route path="/analytics"  element={<ProtectedRoute permission="analytics.view"><Reports /></ProtectedRoute>} />
            <Route path="/automations" element={<ProtectedRoute permission="settings.view"><Automations /></ProtectedRoute>} />
            <Route path="/settings"   element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/users"      element={<ProtectedRoute permission="users.view"><Users /></ProtectedRoute>} />
            <Route path="/support"    element={<ProtectedRoute><Support /></ProtectedRoute>} />
            <Route path="*"           element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginRoute />} />
          <Route path="*"     element={<AppInner />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

function LoginRoute() {
  const { user } = useAuth();
  return user ? <Navigate to="/" replace /> : <Login />;
}
