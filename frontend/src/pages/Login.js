import React, { useState } from 'react';
import { useAuth, MOCK_USERS, ROLES } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message);
    } finally { setLoading(false); }
  };

  const quickLogin = (user) => {
    setEmail(user.email);
    setPassword(user.password);
    setError('');
  };

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="login-brand">
          <div className="login-brand-icon">
            <i className="bi bi-box-seam"></i>
          </div>
          <div>
            <div className="login-brand-name">EHN One</div>
            <div className="login-brand-sub">Inventory Management System</div>
          </div>
        </div>
        <h2 className="login-headline">
          Smart inventory<br />management starts here
        </h2>
        <p className="login-desc">
          Track stock levels, manage products, record transactions, and get real-time alerts — all in one place.
        </p>
        <div className="login-features">
          {[
            { icon: 'bi-bar-chart-line', text: 'Real-time stock analytics' },
            { icon: 'bi-bell',           text: 'Low stock alerts' },
            { icon: 'bi-shield-check',   text: 'Role-based access control' },
            { icon: 'bi-arrow-left-right', text: 'Full transaction history' },
          ].map((f) => (
            <div key={f.text} className="login-feature-item">
              <i className={`bi ${f.icon}`}></i>
              <span>{f.text}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="login-right">
        <div className="login-card">
          <div className="login-card-header">
            <h3>Welcome back 👋</h3>
            <p>Sign in to your account to continue</p>
          </div>

          {/* Quick login pills */}
          <div className="login-quick">
            <div className="login-quick-label">Quick login as:</div>
            <div className="login-quick-pills">
              {MOCK_USERS.map((u) => {
                const role = ROLES[u.role];
                return (
                  <button
                    key={u.id}
                    type="button"
                    className={`login-quick-pill role-${u.role}`}
                    onClick={() => quickLogin(u)}
                  >
                    <i className={`bi ${role.icon}`}></i>
                    {role.label}
                  </button>
                );
              })}
            </div>
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
                  placeholder="you@example.com"
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

            <button className="btn-v primary w-100 mt-2" type="submit" disabled={loading}
              style={{ justifyContent: 'center', padding: '11px' }}>
              {loading
                ? <><span className="spinner-border spinner-border-sm me-2"></span>Signing in…</>
                : <><i className="bi bi-box-arrow-in-right"></i> Sign In</>}
            </button>
          </form>

          {/* Role info table */}
          <div className="login-roles-info">
            <div className="login-roles-title">Demo Credentials</div>
            <table className="login-roles-table">
              <thead>
                <tr><th>Role</th><th>Email</th><th>Password</th></tr>
              </thead>
              <tbody>
                {MOCK_USERS.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <span className={`badge-v ${ROLES[u.role].color}`}>
                        <i className={`bi ${ROLES[u.role].icon}`}></i>
                        {ROLES[u.role].label}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.78rem' }}>{u.email}</td>
                    <td><code style={{ fontSize: '0.78rem' }}>{u.password}</code></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
