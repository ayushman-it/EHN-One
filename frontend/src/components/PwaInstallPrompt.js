import React, { useState, useEffect } from 'react';

// Global window event listener to capture beforeinstallprompt before components mount
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    window.deferredPwaPrompt = e;
    window.dispatchEvent(new Event('ehn_pwa_prompt_available'));
  });
}

export default function PwaInstallPrompt({ mode = 'both' }) {
  const [deferredPrompt, setDeferredPrompt] = useState(() => window.deferredPwaPrompt || null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);

  useEffect(() => {
    // Check if app is already running in standalone mode (PWA installed)
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
      setIsAppInstalled(true);
    }

    const updatePromptState = () => {
      if (window.deferredPwaPrompt) {
        setDeferredPrompt(window.deferredPwaPrompt);
        
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
        const dismissedRecently = localStorage.getItem('ehn_pwa_dismissed');
        const now = Date.now();

        if (isMobile && (!dismissedRecently || now - Number(dismissedRecently) > 24 * 60 * 60 * 1000)) {
          setShowBottomSheet(true);
        }
      }
    };

    updatePromptState();

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      window.deferredPwaPrompt = e;
      setDeferredPrompt(e);
      updatePromptState();
    };

    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setDeferredPrompt(null);
      window.deferredPwaPrompt = null;
      setShowBottomSheet(false);
      setShowGuideModal(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('ehn_pwa_prompt_available', updatePromptState);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('ehn_pwa_prompt_available', updatePromptState);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const triggerInstall = async () => {
    const activePrompt = window.deferredPwaPrompt || deferredPrompt;

    if (activePrompt) {
      try {
        activePrompt.prompt();
        const choice = await activePrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setIsAppInstalled(true);
          setShowBottomSheet(false);
        }
        window.deferredPwaPrompt = null;
        setDeferredPrompt(null);
        return;
      } catch (err) {
        console.error('Error triggering PWA prompt:', err);
      }
    }

    // If native prompt is not yet available, show clean step-by-step installation guide modal
    setShowGuideModal(true);
  };

  const dismissBottomSheet = () => {
    setShowBottomSheet(false);
    localStorage.setItem('ehn_pwa_dismissed', Date.now().toString());
  };

  if (isAppInstalled) {
    return null;
  }

  // Footer Button for Desktop / Sidebar Footer
  if (mode === 'button') {
    return (
      <>
        <div className="pwa-desktop-footer-install mt-auto pt-2 border-top">
          <button
            type="button"
            className="btn btn-sm btn-outline-success w-100 fw-bold d-flex align-items-center justify-content-center gap-1.5 py-1.5 shadow-sm style-cursor"
            onClick={triggerInstall}
            style={{ fontSize: '0.74rem', letterSpacing: '0.3px', borderRadius: '6px' }}
          >
            <i className="bi bi-laptop text-success"></i> Download Desktop App
          </button>
        </div>

        {/* Desktop Step-by-Step Installation Guide Modal fallback */}
        {showGuideModal && (
          <div 
            className="modal-overlay" 
            style={{ zIndex: 999999 }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowGuideModal(false); }}
          >
            <div className="modal-box" style={{ maxWidth: 520 }}>
              <div className="modal-box-header bg-success text-white p-3 d-flex justify-content-between align-items-center">
                <div className="fw-bold"><i className="bi bi-laptop me-2"></i>Install EHN One ERP Application</div>
                <button className="btn-close btn-close-white" onClick={() => setShowGuideModal(false)}></button>
              </div>
              <div className="modal-box-body p-3.5 bg-white">
                <div className="alert alert-success d-flex align-items-center gap-2 py-2 mb-3">
                  <i className="bi bi-shield-check text-success" style={{ fontSize: '1.4rem' }}></i>
                  <div className="small fw-semibold">Install EHN One ERP as a standalone app on your PC or Mac!</div>
                </div>

                <ol className="mb-3 ps-3 text-dark small" style={{ lineHeight: 1.6 }}>
                  <li className="mb-2">Look at your browser's top address bar (URL bar).</li>
                  <li className="mb-2">Click the <strong><i className="bi bi-download text-primary me-1"></i>Install Icon</strong> or 3-Dots menu icon in Google Chrome / Edge.</li>
                  <li className="mb-2">Select <strong>"Install EHN One Gateway App"</strong>.</li>
                  <li>Enjoy 1-tap desktop launch & full offline capability!</li>
                </ol>
              </div>
              <div className="modal-box-footer p-2 bg-light border-top text-end">
                <button className="btn-v primary btn-sm" onClick={() => setShowGuideModal(false)}>Got It!</button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      {/* MOBILE PROFESSIONAL BOTTOM SHEET */}
      {showBottomSheet && (
        <div 
          className="pwa-bottom-sheet-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.55)',
            backdropFilter: 'blur(3px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            animation: 'fadeIn 0.25s ease-out'
          }}
          onClick={(e) => { if (e.target === e.currentTarget) dismissBottomSheet(); }}
        >
          <div 
            className="pwa-bottom-sheet-card bg-white w-100 p-4 rounded-top-4 shadow-lg"
            style={{
              maxWidth: 500,
              borderTop: '4px solid #1E4D2B',
              animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {/* Drag Handle */}
            <div className="d-flex justify-content-center mb-3">
              <div style={{ width: 40, height: 4, backgroundColor: '#E0E0E0', borderRadius: 2 }}></div>
            </div>

            <div className="d-flex align-items-start gap-3 mb-3">
              <div 
                className="pwa-app-icon-badge rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                style={{
                  width: 54,
                  height: 54,
                  background: 'linear-gradient(135deg, #1E4D2B 0%, #0F2917 100%)',
                  color: '#ffffff',
                  boxShadow: '0 4px 12px rgba(30, 77, 43, 0.3)',
                  border: '2px solid #4CAF50'
                }}
              >
                <i className="bi bi-box-seam-fill" style={{ fontSize: '1.75rem' }}></i>
              </div>
              <div className="flex-grow-1">
                <h6 className="fw-bold text-dark mb-1" style={{ letterSpacing: '-0.2px' }}>
                  Install EHN One ERP App
                </h6>
                <p className="text-muted small mb-0" style={{ fontSize: '0.78rem', lineHeight: 1.35 }}>
                  Add to Mobile Home Screen for instant 1-tap launch, offline capability & fast field order booking.
                </p>
              </div>
            </div>

            <div className="d-flex align-items-center gap-2 pt-2">
              <button 
                type="button" 
                className="btn btn-light btn-sm text-secondary fw-bold flex-grow-1 py-2"
                onClick={dismissBottomSheet}
                style={{ fontSize: '0.82rem' }}
              >
                Not Now
              </button>
              <button 
                type="button" 
                className="btn btn-success btn-sm fw-bold text-white flex-grow-1 py-2 shadow-sm d-flex align-items-center justify-content-center gap-1.5"
                onClick={triggerInstall}
                style={{ fontSize: '0.82rem', background: '#1E4D2B', borderColor: '#1E4D2B' }}
              >
                <i className="bi bi-download"></i> Install App Now
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
