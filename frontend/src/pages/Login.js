import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);

  const demoAccounts = [
    { role: 'Admin', email: 'admin@kedvasshygieneproducts.com', pass: 'KdV@dm1n#2026!xQ', icon: 'bi-shield-lock-fill', color: '#dc3545' },
    { role: 'Production', email: 'production@kedvasshygieneproducts.com', pass: 'KdV@prod#2026!pT', icon: 'bi-gear-wide-connected', color: '#fd7e14' },
    { role: 'Sales Team', email: 'sales@kedvasshygieneproducts.com', pass: 'KdV@sales#2026!sT', icon: 'bi-bag-check-fill', color: '#0d6efd' },
    { role: 'Despatch', email: 'despatch@kedvasshygieneproducts.com', pass: 'KdV@desp#2026!dT', icon: 'bi-truck', color: '#6f42c1' },
    { role: 'Billing/Accounts', email: 'billing@kedvasshygieneproducts.com', pass: 'KdV@bill#2026!bT', icon: 'bi-receipt-cutoff', color: '#198754' },
    { role: 'Managerial', email: 'manager@kedvasshygieneproducts.com', pass: 'KdV@mng#2026!pL', icon: 'bi-briefcase-fill', color: '#0dcaf0' },
  ];

  const [companyName] = useState(() => {
    try {
      const cached = localStorage.getItem('ehn_company_settings');
      if (cached) {
        const parsed = JSON.parse(cached);
        return parsed?.company?.name || 'Kedvass Hygiene Products';
      }
    } catch (e) {}
    return 'Kedvass Hygiene Products';
  });

  const [companyLogo] = useState(() => {
    try {
      const cached = localStorage.getItem('ehn_company_settings');
      if (cached) {
        const parsed = JSON.parse(cached);
        return parsed?.company?.logo || '';
      }
    } catch (e) {}
    return '';
  });

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(email, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally { setLoading(false); }
  };

  const handleQuickLogin = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="login-page">
      {/* Left side green panel with blurry banner image background */}
      <div 
        className="login-left position-relative"
        style={{
          background: `linear-gradient(135deg, rgba(30, 77, 43, 0.85) 0%, rgba(15, 41, 23, 0.92) 100%), url('/login-bg.jpg') center/cover no-repeat`,
        }}
      >
        <div className="login-brand d-flex align-items-center gap-3 mb-4">
          {companyLogo ? (
            <img 
              src={companyLogo} 
              alt="Company Logo" 
              className="rounded-circle shadow-sm" 
              style={{ width: 64, height: 64, objectFit: 'contain', background: '#fff', padding: '3px', border: '3px solid #4CAF50' }} 
            />
          ) : (
            <div className="login-brand-icon rounded-circle shadow-sm" style={{ width: 64, height: 64, background: '#1E4D2B', color: '#fff', border: '3px solid #4CAF50', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem' }}>
              <i className="bi bi-building"></i>
            </div>
          )}
          <div>
            <div className="login-brand-name">{companyName}</div>
            <div className="login-brand-sub" style={{ color: '#4CAF50', fontWeight: 600, fontSize: '0.78rem' }}>EHN ONE GATEWAY & AUTOMATION</div>
          </div>
        </div>

        <h2 className="login-headline text-white fw-bold mb-3">
          Quality &bull; Trust &bull; Everyday Hygienic Need
        </h2>

        <p className="login-desc text-white-50 mb-4" style={{ fontSize: '0.95rem', lineHeight: 1.6 }}>
          Authorized ERP Gateway, Automated WhatsApp Reminders & Stock Inventory Register.<br />
          <span className="fw-semibold text-white" style={{ fontSize: '0.88rem' }}>
            From the makers of Rosinol &bull; Since 1984
          </span>
        </p>

        <div className="d-flex flex-wrap align-items-center gap-2 pt-3 border-top border-light border-opacity-25" style={{ fontSize: '0.78rem' }}>
          <span className="text-white-50"><i className="bi bi-robot text-success me-1"></i> Automated WhatsApp Engine</span>
          <span className="text-white-50">&bull;</span>
          <span className="text-white-50"><i className="bi bi-shield-check text-success me-1"></i> 256-Bit SSL</span>
          <span className="text-white-50">&bull;</span>
          <span className="text-white-50"><i className="bi bi-person-badge text-success me-1"></i> 6 Role Security</span>
        </div>
      </div>

      {/* Right side login form */}
      <div className="login-right">
        <div className="login-card" style={{ maxWidth: 460 }}>
          <div className="login-card-header text-center mb-4">
            <h3 className="fw-bold">Sign In to EHN ONE</h3>
            <p className="text-muted small">Select your Department Role or enter credentials</p>
          </div>

          <form onSubmit={handleSubmit}>
            {error && (
              <div className="alert-v danger" style={{ marginBottom: 16 }}>
                <i className="bi bi-exclamation-circle"></i> {error}
              </div>
            )}

            <div className="form-group-v mb-3">
              <label className="form-label fw-semibold">User Email Address</label>
              <div className="input-icon-wrap">
                <i className="bi bi-envelope input-icon"></i>
                <input
                  type="email"
                  className="form-control"
                  placeholder="admin@kedvasshygieneproducts.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-group-v mb-3">
              <label className="form-label fw-semibold">Password</label>
              <div className="input-icon-wrap">
                <i className="bi bi-lock input-icon"></i>
                <input
                  type={showPass ? 'text' : 'password'}
                  className="form-control"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  className="input-icon-right"
                  onClick={() => setShowPass((v) => !v)}
                  tabIndex={-1}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  <i className={`bi ${showPass ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                </button>
              </div>
            </div>

            <button className="btn-v primary w-100 mt-2 style-cursor" type="submit" disabled={loading}
              style={{ justifyContent: 'center', padding: '11px', fontWeight: 600 }}>
              {loading
                ? <><span className="spinner-border spinner-border-sm me-2"></span>Signing in…</>
                : <><i className="bi bi-box-arrow-in-right me-1"></i> Sign In to Account</>}
            </button>
          </form>

          {/* Quick Select Role Login Buttons */}
          <div className="mt-4 pt-3 border-top">
            <div className="text-muted text-uppercase fw-bold small text-center mb-2" style={{ fontSize: '0.72rem', letterSpacing: '0.5px' }}>
              Quick Login Accounts (6 Roles)
            </div>
            <div className="row g-2">
              {demoAccounts.map((acc, idx) => (
                <div className="col-6" key={idx}>
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm w-100 text-start d-flex align-items-center gap-2 py-2 px-2 shadow-xs"
                    onClick={() => handleQuickLogin(acc.email, acc.pass)}
                    style={{ fontSize: '0.78rem', borderRadius: '6px' }}
                  >
                    <i className={`bi ${acc.icon}`} style={{ color: acc.color, fontSize: '1.05rem' }}></i>
                    <div className="text-truncate">
                      <div className="fw-bold text-dark">{acc.role}</div>
                      <div className="text-muted" style={{ fontSize: '0.68rem' }}>Click to fill</div>
                    </div>
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
