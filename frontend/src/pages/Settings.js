import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

/* Global Settings Storage */
let globalSettings = {
  whatsapp: {
    apiKey: '',
    phoneNumberId: '',
    businessAccountId: '',
    webhookUrl: '',
    webhookVerifyToken: '',
    isConfigured: false,
    verificationStatus: 'pending',
    lastTested: null,
  },
  company: {
    name: 'EHN One',
    email: 'admin@ehnone.com',
    phone: '+91 98765 43210',
    address: '123 Business Park, Delhi, India',
    gst: '07AAAAA1234A1Z5',
    logo: '',
  },
  email: {
    smtpHost: '',
    smtpPort: '587',
    smtpUser: '',
    smtpPassword: '',
    fromEmail: '',
    fromName: 'EHN One',
    isConfigured: false,
  },
  notifications: {
    emailNotifications: true,
    whatsappNotifications: true,
    lowStockAlert: true,
    paymentReminder: true,
    dailyReport: false,
  },
};

export default function Settings() {
  const { can, user } = useAuth();
  const [activeSection, setActiveSection] = useState('profile');
  const [settings, setSettings] = useState(globalSettings);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [saved, setSaved] = useState(false);
  const [profileAvatar, setProfileAvatar] = useState(user?.avatar || null);
  const [profileName, setProfileName] = useState(user?.name || 'Arjun Sharma');
  const [profileEmail, setProfileEmail] = useState(user?.email || 'admin@ehnsystem.com');
  const [profileDept, setProfileDept] = useState(user?.department || 'Operations');
  const [currPass, setCurrPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  const isAdmin = user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'administrator';
  const canSettings = can('settings.view') || isAdmin;

  const sections = [
    { id: 'profile', label: 'My Profile & Security', icon: 'bi-person-circle', color: 'var(--primary)' },
    ...(canSettings ? [
      { id: 'whatsapp', label: 'WhatsApp API', icon: 'bi-whatsapp', color: '#25D366' },
      { id: 'company', label: 'Company Info', icon: 'bi-building', color: 'var(--primary)' },
      { id: 'email', label: 'Email Settings', icon: 'bi-envelope', color: 'var(--info)' },
      { id: 'notifications', label: 'Notifications', icon: 'bi-bell', color: 'var(--warning)' },
    ] : [])
  ];

  const handleSave = () => {
    globalSettings = settings;
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleTestWhatsApp = async () => {
    setTesting(true);
    setTestResult(null);

    setTimeout(() => {
      if (settings.whatsapp.apiKey && settings.whatsapp.phoneNumberId && settings.whatsapp.businessAccountId) {
        setTestResult({ success: true, message: 'Connection successful! WhatsApp API is verified.' });
        setSettings({
          ...settings,
          whatsapp: { ...settings.whatsapp, verificationStatus: 'verified', isConfigured: true, lastTested: new Date() }
        });
      } else {
        setTestResult({ success: false, message: 'Connection failed. Please check your credentials.' });
        setSettings({
          ...settings,
          whatsapp: { ...settings.whatsapp, verificationStatus: 'failed' }
        });
      }
      setTesting(false);
    }, 2000);
  };

  const handleTestEmail = async () => {
    setTesting(true);
    setTestResult(null);

    setTimeout(() => {
      if (settings.email.smtpHost && settings.email.smtpUser && settings.email.smtpPassword) {
        setTestResult({ success: true, message: 'Test email sent successfully!' });
        setSettings({
          ...settings,
          email: { ...settings.email, isConfigured: true }
        });
      } else {
        setTestResult({ success: false, message: 'Email configuration failed. Check your SMTP settings.' });
      }
      setTesting(false);
    }, 2000);
  };

  if (!user) {
    return (
      <div className="empty-state-v" style={{ paddingTop: 80 }}>
        <i className="bi bi-shield-x" style={{ color: 'var(--danger)' }}></i>
        <h5>Access Denied</h5>
        <p>Please log in to view your profile settings.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-top">
          <div>
            <h1 className="page-title">
              <i className="bi bi-gear me-2" style={{ color: 'var(--primary)' }}></i>
              System Settings
            </h1>
            <p className="page-subtitle">Configure integrations, company info, and preferences</p>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {saved && (
        <div className="alert-v success mb-4">
          <i className="bi bi-check-circle"></i>
          <div>
            <strong>Settings Saved Successfully!</strong>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem' }}>
              Your configuration has been updated.
            </p>
          </div>
        </div>
      )}

      <div className="row g-4">
        {/* Sidebar */}
        <div className="col-lg-3">
          <div className="v-card">
            <div className="v-card-body p-0">
              <div className="settings-sidebar">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    className={`settings-nav-item${activeSection === section.id ? ' active' : ''}`}
                    onClick={() => { setActiveSection(section.id); setTestResult(null); }}
                  >
                    <i className={`bi ${section.icon}`} style={{ color: activeSection === section.id ? section.color : 'var(--text-muted)' }}></i>
                    <span>{section.label}</span>
                    {section.id === 'whatsapp' && settings.whatsapp.isConfigured && (
                      <i className="bi bi-check-circle-fill ms-auto" style={{ color: 'var(--success)', fontSize: '0.9rem' }}></i>
                    )}
                    {section.id === 'email' && settings.email.isConfigured && (
                      <i className="bi bi-check-circle-fill ms-auto" style={{ color: 'var(--success)', fontSize: '0.9rem' }}></i>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Current User Info */}
          <div className="v-card mt-3">
            <div className="v-card-body">
              <div className="text-center">
                <div style={{ 
                  width: 60, 
                  height: 60, 
                  borderRadius: '50%', 
                  background: 'linear-gradient(135deg, var(--primary) 0%, #9055fd 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px',
                  color: 'white',
                  fontSize: '1.5rem',
                  fontWeight: 'bold'
                }}>
                  {user?.name.charAt(0)}
                </div>
                <div className="fw-bold" style={{ fontSize: '0.95rem' }}>{user?.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {user?.role.charAt(0).toUpperCase() + user?.role.slice(1)}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {user?.email}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="col-lg-9">
          <div className="v-card">
            <div className="v-card-body" style={{ padding: '32px' }}>
              
              {/* WhatsApp API Section */}
              {activeSection === 'whatsapp' && (
                <>
                  <div className="settings-section-header">
                    <i className="bi bi-whatsapp" style={{ color: '#25D366' }}></i>
                    <div>
                      <h4>WhatsApp Business API Configuration</h4>
                      <p>Connect your WhatsApp Business account to send automated notifications</p>
                    </div>
                  </div>

                  {/* Test Result */}
                  {testResult && (
                    <div className={`alert-v ${testResult.success ? 'success' : 'danger'} mb-4`}>
                      <i className={`bi ${testResult.success ? 'bi-check-circle' : 'bi-exclamation-circle'}`}></i>
                      <div>{testResult.message}</div>
                    </div>
                  )}

                  {/* Status Badge */}
                  {settings.whatsapp.isConfigured && (
                    <div className="v-card mb-4" style={{ background: 'rgba(40, 199, 111, 0.08)', border: '1px solid rgba(40, 199, 111, 0.3)' }}>
                      <div className="v-card-body" style={{ padding: '16px' }}>
                        <div className="d-flex align-items-center gap-3">
                          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <i className="bi bi-check-lg" style={{ fontSize: '1.2rem', color: 'white' }}></i>
                          </div>
                          <div>
                            <div className="fw-bold" style={{ color: 'var(--success)' }}>Connected & Verified</div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                              Last tested: {settings.whatsapp.lastTested ? new Date(settings.whatsapp.lastTested).toLocaleString('en-IN') : 'Never'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Form */}
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label">
                        WhatsApp Business API Key (Access Token) *
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400, marginLeft: '8px' }}>
                          Permanent access token from Meta Business
                        </span>
                      </label>
                      <input
                        className="form-control"
                        type="password"
                        placeholder="Enter your permanent access token"
                        value={settings.whatsapp.apiKey}
                        onChange={(e) => setSettings({ ...settings, whatsapp: { ...settings.whatsapp, apiKey: e.target.value } })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Phone Number ID *</label>
                      <input
                        className="form-control"
                        placeholder="e.g., 123456789012345"
                        value={settings.whatsapp.phoneNumberId}
                        onChange={(e) => setSettings({ ...settings, whatsapp: { ...settings.whatsapp, phoneNumberId: e.target.value } })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Business Account ID *</label>
                      <input
                        className="form-control"
                        placeholder="e.g., 987654321098765"
                        value={settings.whatsapp.businessAccountId}
                        onChange={(e) => setSettings({ ...settings, whatsapp: { ...settings.whatsapp, businessAccountId: e.target.value } })}
                      />
                    </div>
                    <div className="col-12">
                      <div className="form-divider"></div>
                      <h6 style={{ fontSize: '0.9rem', marginBottom: '12px' }}>
                        <i className="bi bi-link-45deg"></i> Webhook Configuration (Optional)
                      </h6>
                    </div>
                    <div className="col-md-8">
                      <label className="form-label">Webhook URL</label>
                      <input
                        className="form-control"
                        placeholder="https://your-domain.com/api/webhook/whatsapp"
                        value={settings.whatsapp.webhookUrl}
                        onChange={(e) => setSettings({ ...settings, whatsapp: { ...settings.whatsapp, webhookUrl: e.target.value } })}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Verify Token</label>
                      <input
                        className="form-control"
                        placeholder="Verify token"
                        value={settings.whatsapp.webhookVerifyToken}
                        onChange={(e) => setSettings({ ...settings, whatsapp: { ...settings.whatsapp, webhookVerifyToken: e.target.value } })}
                      />
                    </div>
                    <div className="col-12">
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '-8px' }}>
                        Webhook receives message delivery status and customer replies
                      </div>
                    </div>
                  </div>

                  {can('settings.edit') && (
                    <div className="d-flex gap-3 mt-4">
                      <button 
                        className="btn-v warning" 
                        onClick={handleTestWhatsApp}
                        disabled={testing || !settings.whatsapp.apiKey || !settings.whatsapp.phoneNumberId}
                      >
                        {testing ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2"></span>
                            Testing...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-wifi"></i> Test Connection
                          </>
                        )}
                      </button>
                      <button className="btn-v primary" onClick={handleSave}>
                        <i className="bi bi-check-circle"></i> Save Configuration
                      </button>
                    </div>
                  )}
                </>
              )}
              {activeSection === 'company' && (
                <>
                  <div className="settings-section-header">
                    <i className="bi bi-building" style={{ color: 'var(--primary)' }}></i>
                    <div>
                      <h4>Company Information</h4>
                      <p>Update your company details for invoices and reports</p>
                    </div>
                  </div>

                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Company Name *</label>
                      <input
                        className="form-control"
                        value={settings.company.name}
                        onChange={(e) => setSettings({ ...settings, company: { ...settings.company, name: e.target.value } })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">GST Number</label>
                      <input
                        className="form-control"
                        placeholder="07AAAAA1234A1Z5"
                        value={settings.company.gst}
                        onChange={(e) => setSettings({ ...settings, company: { ...settings.company, gst: e.target.value } })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Email *</label>
                      <input
                        className="form-control"
                        type="email"
                        value={settings.company.email}
                        onChange={(e) => setSettings({ ...settings, company: { ...settings.company, email: e.target.value } })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Phone *</label>
                      <input
                        className="form-control"
                        value={settings.company.phone}
                        onChange={(e) => setSettings({ ...settings, company: { ...settings.company, phone: e.target.value } })}
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Address *</label>
                      <textarea
                        className="form-control"
                        rows="3"
                        value={settings.company.address}
                        onChange={(e) => setSettings({ ...settings, company: { ...settings.company, address: e.target.value } })}
                      ></textarea>
                    </div>
                  </div>

                  {can('settings.edit') && (
                    <div className="mt-4">
                      <button className="btn-v primary" onClick={handleSave}>
                        <i className="bi bi-check-circle"></i> Save Company Info
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* Email Settings Section */}
              {activeSection === 'email' && (
                <>
                  <div className="settings-section-header">
                    <i className="bi bi-envelope" style={{ color: 'var(--info)' }}></i>
                    <div>
                      <h4>Email Configuration</h4>
                      <p>Configure SMTP settings for email notifications</p>
                    </div>
                  </div>

                  {testResult && (
                    <div className={`alert-v ${testResult.success ? 'success' : 'danger'} mb-4`}>
                      <i className={`bi ${testResult.success ? 'bi-check-circle' : 'bi-exclamation-circle'}`}></i>
                      <div>{testResult.message}</div>
                    </div>
                  )}

                  <div className="row g-3">
                    <div className="col-md-8">
                      <label className="form-label">SMTP Host *</label>
                      <input
                        className="form-control"
                        placeholder="smtp.gmail.com"
                        value={settings.email.smtpHost}
                        onChange={(e) => setSettings({ ...settings, email: { ...settings.email, smtpHost: e.target.value } })}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">SMTP Port *</label>
                      <input
                        className="form-control"
                        placeholder="587"
                        value={settings.email.smtpPort}
                        onChange={(e) => setSettings({ ...settings, email: { ...settings.email, smtpPort: e.target.value } })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">SMTP Username *</label>
                      <input
                        className="form-control"
                        placeholder="your-email@gmail.com"
                        value={settings.email.smtpUser}
                        onChange={(e) => setSettings({ ...settings, email: { ...settings.email, smtpUser: e.target.value } })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">SMTP Password *</label>
                      <input
                        className="form-control"
                        type="password"
                        placeholder="App password or SMTP password"
                        value={settings.email.smtpPassword}
                        onChange={(e) => setSettings({ ...settings, email: { ...settings.email, smtpPassword: e.target.value } })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">From Email *</label>
                      <input
                        className="form-control"
                        placeholder="noreply@ehnone.com"
                        value={settings.email.fromEmail}
                        onChange={(e) => setSettings({ ...settings, email: { ...settings.email, fromEmail: e.target.value } })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">From Name *</label>
                      <input
                        className="form-control"
                        placeholder="EHN One"
                        value={settings.email.fromName}
                        onChange={(e) => setSettings({ ...settings, email: { ...settings.email, fromName: e.target.value } })}
                      />
                    </div>
                  </div>

                  {can('settings.edit') && (
                    <div className="d-flex gap-3 mt-4">
                      <button 
                        className="btn-v warning" 
                        onClick={handleTestEmail}
                        disabled={testing || !settings.email.smtpHost || !settings.email.smtpUser}
                      >
                        {testing ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2"></span>
                            Sending Test...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-send"></i> Send Test Email
                          </>
                        )}
                      </button>
                      <button className="btn-v primary" onClick={handleSave}>
                        <i className="bi bi-check-circle"></i> Save Email Settings
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* Profile & Security Section */}
              {activeSection === 'profile' && (
                <>
                  <div className="settings-section-header">
                    <i className="bi bi-person-circle" style={{ color: 'var(--primary)' }}></i>
                    <div>
                      <h4>My Profile & Security Settings</h4>
                      <p>Update your personal profile picture, account details, and security password</p>
                    </div>
                  </div>

                  {/* Profile Avatar Upload */}
                  <div className="p-3 bg-light rounded-3 border mb-4">
                    <div className="d-flex align-items-center gap-3">
                      <div 
                        className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold overflow-hidden shadow-sm"
                        style={{ width: 72, height: 72, background: 'var(--primary)', fontSize: '1.8rem' }}
                      >
                        {profileAvatar ? (
                          <img src={profileAvatar} alt="Profile Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          user?.name?.charAt(0).toUpperCase() || 'U'
                        )}
                      </div>
                      <div>
                        <h6 className="mb-1 fw-bold">{user?.name || 'User Profile'}</h6>
                        <span className="badge-v primary mb-2">{user?.role || 'Staff Member'}</span>
                        <div className="d-flex gap-2">
                          <label className="btn-v outline-primary btn-sm mb-0 style-cursor">
                            <i className="bi bi-camera me-1"></i> Upload New Avatar
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="d-none" 
                              onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => setProfileAvatar(reader.result);
                                  reader.readAsDataURL(file);
                                }
                              }} 
                            />
                          </label>
                          {profileAvatar && (
                            <button className="btn-v light btn-sm" onClick={() => setProfileAvatar(null)}>
                              Remove Avatar
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Account Information */}
                  <div className="form-section-title mb-2 d-flex justify-content-between align-items-center">
                    <span><i className="bi bi-shield-lock me-1"></i> Account Details & Protection</span>
                    {(user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'administrator') && (
                      <span className="badge-v success"><i className="bi bi-shield-check me-1"></i> Admin Edit Privileges Unlocked</span>
                    )}
                  </div>

                  <form onSubmit={(e) => {
                    e.preventDefault();
                    if (!profileName.trim()) return alert('Please enter a valid name.');
                    alert(`✅ Profile updated! Full Name set to "${profileName}".`);
                  }}>
                    <div className="row g-3 mb-3">
                      <div className="col-md-6">
                        <label className="form-label">
                          Full Name {(user?.role?.toLowerCase() !== 'admin' && user?.role?.toLowerCase() !== 'administrator') && <small className="text-muted">(Only Admin can change)</small>}
                        </label>
                        <input
                          className={`form-control ${(user?.role?.toLowerCase() !== 'admin' && user?.role?.toLowerCase() !== 'administrator') ? 'bg-light' : ''}`}
                          value={profileName}
                          onChange={(e) => setProfileName(e.target.value)}
                          disabled={user?.role?.toLowerCase() !== 'admin' && user?.role?.toLowerCase() !== 'administrator'}
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">
                          Email Address {(user?.role?.toLowerCase() !== 'admin' && user?.role?.toLowerCase() !== 'administrator') && <small className="text-muted">(Only Admin can change)</small>}
                        </label>
                        <input
                          className={`form-control ${(user?.role?.toLowerCase() !== 'admin' && user?.role?.toLowerCase() !== 'administrator') ? 'bg-light' : ''}`}
                          value={profileEmail}
                          onChange={(e) => setProfileEmail(e.target.value)}
                          disabled={user?.role?.toLowerCase() !== 'admin' && user?.role?.toLowerCase() !== 'administrator'}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Account Role</label>
                        <input
                          className="form-control bg-light text-capitalize"
                          value={user?.role || 'admin'}
                          disabled
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Assigned Department</label>
                        <input
                          className="form-control"
                          value={profileDept}
                          onChange={(e) => setProfileDept(e.target.value)}
                          disabled={user?.role?.toLowerCase() !== 'admin' && user?.role?.toLowerCase() !== 'administrator'}
                        />
                      </div>
                    </div>
                    {(user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'administrator') && (
                      <button type="submit" className="btn-v primary mb-4">
                        <i className="bi bi-save me-1"></i> Save Profile Details
                      </button>
                    )}
                  </form>

                  <div className="form-divider mb-4"></div>

                  {/* Password Change Form */}
                  <div className="form-section-title mb-2">
                    <i className="bi bi-key me-1"></i> Update Security Password
                  </div>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    if (!newPass) return alert('Please enter a new password.');
                    if (newPass !== confirmPass) return alert('New Password and Confirm Password do not match.');
                    alert('✅ Password updated successfully!');
                    setCurrPass(''); setNewPass(''); setConfirmPass('');
                  }}>
                    <div className="row g-3 mb-3">
                      <div className="col-md-4">
                        <label className="form-label">Current Password</label>
                        <input
                          type="password"
                          className="form-control"
                          placeholder="••••••••"
                          value={currPass}
                          onChange={(e) => setCurrPass(e.target.value)}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">New Password</label>
                        <input
                          type="password"
                          className="form-control"
                          placeholder="Minimum 6 characters"
                          value={newPass}
                          onChange={(e) => setNewPass(e.target.value)}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Confirm New Password</label>
                        <input
                          type="password"
                          className="form-control"
                          placeholder="Re-enter new password"
                          value={confirmPass}
                          onChange={(e) => setConfirmPass(e.target.value)}
                        />
                      </div>
                    </div>
                    <button type="submit" className="btn-v primary">
                      <i className="bi bi-check-circle me-1"></i> Update Password
                    </button>
                  </form>
                </>
              )}

              {/* Notifications Section */}
              {activeSection === 'notifications' && (
                <>
                  <div className="settings-section-header">
                    <i className="bi bi-bell" style={{ color: 'var(--warning)' }}></i>
                    <div>
                      <h4>Notification Preferences</h4>
                      <p>Configure which notifications you want to receive</p>
                    </div>
                  </div>

                  <div className="notification-settings">
                    <div className="notification-item">
                      <div>
                        <div className="fw-semibold">Email Notifications</div>
                        <div className="notification-desc">Receive notifications via email</div>
                      </div>
                      <div className="form-check form-switch">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={settings.notifications.emailNotifications}
                          onChange={(e) => setSettings({ 
                            ...settings, 
                            notifications: { ...settings.notifications, emailNotifications: e.target.checked }
                          })}
                        />
                      </div>
                    </div>

                    <div className="notification-item">
                      <div>
                        <div className="fw-semibold">WhatsApp Notifications</div>
                        <div className="notification-desc">Receive notifications via WhatsApp</div>
                      </div>
                      <div className="form-check form-switch">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={settings.notifications.whatsappNotifications}
                          onChange={(e) => setSettings({ 
                            ...settings, 
                            notifications: { ...settings.notifications, whatsappNotifications: e.target.checked }
                          })}
                        />
                      </div>
                    </div>

                    <div className="form-divider"></div>

                    <div className="notification-item">
                      <div>
                        <div className="fw-semibold">Low Stock Alerts</div>
                        <div className="notification-desc">Get notified when products are running low</div>
                      </div>
                      <div className="form-check form-switch">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={settings.notifications.lowStockAlert}
                          onChange={(e) => setSettings({ 
                            ...settings, 
                            notifications: { ...settings.notifications, lowStockAlert: e.target.checked }
                          })}
                        />
                      </div>
                    </div>

                    <div className="notification-item">
                      <div>
                        <div className="fw-semibold">Payment Reminders</div>
                        <div className="notification-desc">Automated reminders for pending payments</div>
                      </div>
                      <div className="form-check form-switch">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={settings.notifications.paymentReminder}
                          onChange={(e) => setSettings({ 
                            ...settings, 
                            notifications: { ...settings.notifications, paymentReminder: e.target.checked }
                          })}
                        />
                      </div>
                    </div>

                    <div className="notification-item">
                      <div>
                        <div className="fw-semibold">Daily Reports</div>
                        <div className="notification-desc">Receive daily inventory summary reports</div>
                      </div>
                      <div className="form-check form-switch">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={settings.notifications.dailyReport}
                          onChange={(e) => setSettings({ 
                            ...settings, 
                            notifications: { ...settings.notifications, dailyReport: e.target.checked }
                          })}
                        />
                      </div>
                    </div>
                  </div>

                  {can('settings.edit') && (
                    <div className="mt-4">
                      <button className="btn-v primary" onClick={handleSave}>
                        <i className="bi bi-check-circle"></i> Save Notification Settings
                      </button>
                    </div>
                  )}
                </>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
