import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useEnrollment } from '../context/EnrollmentContext';
import { ShieldCheck, Lock, Mail, User, Phone, KeyRound, ArrowRight, X, AlertCircle, CheckCircle2, Sparkles } from 'lucide-react';

export function AuthModal({ isOpen, onClose, initialTab = 'login' }) {
  const { initiateLogin, verify2FA, cancel2FA, register, pending2FA, adminProfile } = useAuth();
  const { loginWithUniqueId } = useEnrollment();
  
  const [tab, setTab] = useState(initialTab); // 'login' | 'unique_id' | 'register'
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [uniqueCode, setUniqueCode] = useState('');
  const [name, setName] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      if (tab === 'login') {
        const result = initiateLogin(email, password);
        if (result.status === '2fa_required') {
          setOtpCode('');
        }
      } else if (tab === 'unique_id') {
        const res = loginWithUniqueId(uniqueCode);
        if (res.ok) {
          setSuccessMsg(res.message);
          setTimeout(() => {
            onClose();
          }, 1200);
        } else {
          setErrorMsg(res.message);
        }
      } else {
        if (!name.trim()) {
          throw new Error("Please enter your name.");
        }
        if (!email.trim()) {
          throw new Error("Please enter your Gmail / email address.");
        }
        if (!phone.trim()) {
          throw new Error("Please enter your phone number.");
        }
        register({ name, email, phone, password });
      }
    } catch (err) {
      setErrorMsg(err.message || "Authentication failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handle2FASubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      verify2FA(otpCode);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || "Invalid 2FA code.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    cancel2FA();
    setErrorMsg('');
    setSuccessMsg('');
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={handleClose}>
      <div className="modal-card glass-panel" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className="modal-close-btn" onClick={handleClose}>
          <X size={18} />
        </button>

        {!pending2FA ? (
          /* Step 1: Credentials Form */
          <div className="auth-step-wrapper">
            <div className="modal-header">
              <h2 className="modal-title">
                {tab === 'login' ? 'Sign In (Gmail + Password)' : tab === 'unique_id' ? 'Sign In with Unique ID' : 'Create Student Account'}
              </h2>
              <p className="modal-subtitle">
                {tab === 'login' 
                  ? 'Access your course curriculums using your registered Gmail & password.' 
                  : tab === 'unique_id'
                  ? 'Enter any one of your assigned Unique IDs to log in and unlock all your courses.'
                  : 'Register a new account to begin your learning journey.'}
              </p>
            </div>

            {/* Tab switch */}
            <div className="auth-tab-switch" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
              <button 
                type="button"
                className={`tab-btn ${tab === 'login' ? 'active' : ''}`}
                onClick={() => { setTab('login'); setErrorMsg(''); setSuccessMsg(''); }}
                style={{ fontSize: '0.82rem', padding: '8px 4px' }}
              >
                Gmail & PW
              </button>
              <button 
                type="button"
                className={`tab-btn ${tab === 'unique_id' ? 'active' : ''}`}
                onClick={() => { setTab('unique_id'); setErrorMsg(''); setSuccessMsg(''); }}
                style={{ fontSize: '0.82rem', padding: '8px 4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
              >
                <KeyRound size={13} />
                <span>Unique ID</span>
              </button>
              <button 
                type="button"
                className={`tab-btn ${tab === 'register' ? 'active' : ''}`}
                onClick={() => { setTab('register'); setErrorMsg(''); setSuccessMsg(''); }}
                style={{ fontSize: '0.82rem', padding: '8px 4px' }}
              >
                Register
              </button>
            </div>

            {successMsg && (
              <div className="alert-box-info animate-fade-in" style={{ 
                margin: '14px 0', 
                padding: '12px 14px', 
                borderRadius: 10, 
                background: 'rgba(16, 185, 129, 0.12)', 
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#a7f3d0',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontSize: '0.9rem',
                lineHeight: 1.4
              }}>
                <CheckCircle2 size={18} className="text-green" />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="auth-error-box">
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            {tab === 'unique_id' ? (
              <form onSubmit={handleCredentialsSubmit} className="auth-form">
                <div className="form-group">
                  <label>5–6 Character Course Unique ID</label>
                  <div className="input-with-icon">
                    <KeyRound size={18} className="input-icon text-cyan" />
                    <input 
                      type="text" 
                      placeholder="e.g. NAI892 or AI74K9"
                      value={uniqueCode}
                      onChange={(e) => setUniqueCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8))}
                      className="unique-code-input"
                      autoFocus
                      required
                    />
                  </div>
                  <span className="input-hint" style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: 6, display: 'block' }}>
                    If you enrolled in multiple courses, entering <strong>any one</strong> of your Unique IDs will instantly sign you in and unlock all of your enrolled courses!
                  </span>
                </div>

                <div className="security-notice">
                  <Sparkles size={14} className="text-cyan" />
                  <span>Instant student authentication & course catalog unlock</span>
                </div>

                <button 
                  type="submit" 
                  className="btn-submit-auth"
                  disabled={!uniqueCode.trim() || isLoading}
                >
                  {isLoading ? (
                    <span>Unlocking...</span>
                  ) : (
                    <>
                      <KeyRound size={16} />
                      <span>Sign In & Unlock All My Courses</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleCredentialsSubmit} className="auth-form">
                {tab === 'register' && (
                  <div className="form-group">
                  <label>Full Name</label>
                  <div className="input-with-icon">
                    <User size={16} className="input-icon" />
                    <input 
                      type="text" 
                      placeholder="Your full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>Gmail / Email Address</label>
                <div className="input-with-icon">
                  <Mail size={16} className="input-icon" />
                  <input 
                    type="email" 
                    placeholder="student@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {tab === 'register' && (
                <div className="form-group">
                  <label>Phone Number</label>
                  <div className="input-with-icon">
                    <Phone size={16} className="input-icon" />
                    <input 
                      type="tel" 
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>Password</label>
                <div className="input-with-icon">
                  <Lock size={16} className="input-icon" />
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="security-notice">
                <ShieldCheck size={14} className="text-cyan" />
                <span>Protected by Instant OTP Verification</span>
              </div>

              <button 
                type="submit" 
                className="btn-submit-auth"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span>Checking...</span>
                ) : (
                  <>
                    <span>Continue to OTP Verification</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      ) : (
          /* Step 2: 2-Factor Authentication Challenge */
          <div className="auth-step-wrapper animate-fade-in">
            <div className="modal-header text-center">
              <div className="two-fa-shield-icon">
                <ShieldCheck size={36} className="text-cyan" />
              </div>
              <h2 className="modal-title">Verification Code (OTP)</h2>
              <p className="modal-subtitle">
                Enter the 6-digit verification code sent to:
              </p>
              <div className="user-email-target-tag">
                <span>{pending2FA.userCandidate.email}</span>
                {pending2FA.userCandidate.phone && (
                  <span className="user-phone-tag">• {pending2FA.userCandidate.phone}</span>
                )}
                <span className={`badge ${pending2FA.userCandidate.role === 'admin' ? 'badge-purple' : 'badge-cyan'}`}>
                  {pending2FA.userCandidate.role.toUpperCase()}
                </span>
              </div>
            </div>

            {errorMsg && (
              <div className="auth-error-box">
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="otp-demo-hint-box">
              <div className="hint-header">
                <span>Verification Code:</span>
              </div>
              <div className="hint-code-row">
                <code className="totp-code-display">{pending2FA.expectedOTP}</code>
                <button 
                  type="button" 
                  className="btn-autofill-otp"
                  onClick={() => setOtpCode(pending2FA.expectedOTP)}
                >
                  Autofill
                </button>
              </div>
            </div>

            <form onSubmit={handle2FASubmit} className="auth-form">
              <div className="form-group">
                <label>6-Digit Code</label>
                <div className="input-with-icon">
                  <KeyRound size={16} className="input-icon" />
                  <input 
                    type="text" 
                    placeholder="Enter code"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="otp-input-field"
                    autoFocus
                    required
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="btn-submit-auth"
                disabled={otpCode.length < 6 || isLoading}
              >
                <CheckCircle2 size={16} />
                <span>Confirm & Sign In</span>
              </button>

              <button 
                type="button" 
                className="btn-back-link"
                onClick={cancel2FA}
              >
                ← Back to Credentials
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
