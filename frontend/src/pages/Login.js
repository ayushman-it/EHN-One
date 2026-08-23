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
          <span className="text-white-50"><i className="bi bi-person-badge text-success me-1"></i> RBAC Security</span>
        </div>
      </div>

      {/* Right side login form */}
      <div className="login-right">
        <div className="login-card">
          <div className="login-card-header">
            <h3>Welcome back</h3>
            <p>Sign in to access EHN One Gateway & Automation</p>
          </div>

          <form onSubmit={handleSubmit}>
            {error && (
              <div className="alert-v danger" style={{ marginBottom: 16 }}>
                <i className="bi bi-exclamation-circle"></i> {error}
              </div>
            )}

            <div className="form-group-v">
              <label className="form-label">Email Address</label>
              <div className="input-icon-wrap">
                <i className="bi bi-envelope input-icon"></i>
                <input
                  type="email"
                  className="form-control"
                  placeholder="admin@ehnone.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-group-v">
              <label className="form-label">Password</label>
              <div className="input-icon-wrap">
                <i className="bi bi-lock input-icon"></i>
                <input
                  type={showPass ? 'text' : 'password'}
                  className="form-control"
                  placeholder="Enter your password"
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
              style={{ justifyContent: 'center', padding: '11px' }}>
              {loading
                ? <><span className="spinner-border spinner-border-sm me-2"></span>Signing in…</>
                : <><i className="bi bi-box-arrow-in-right me-1"></i> Sign In</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
