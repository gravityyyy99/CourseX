import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Lock, Mail, User, KeyRound, ArrowRight, X, AlertCircle, CheckCircle2 } from 'lucide-react';

export function AuthModal({ isOpen, onClose, initialTab = 'login' }) {
  const { initiateLogin, verify2FA, cancel2FA, register, pending2FA, adminProfile } = useAuth();
  
  const [tab, setTab] = useState(initialTab); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      if (tab === 'login') {
        const result = initiateLogin(email, password);
        if (result.status === '2fa_required') {
          setOtpCode('');
        }
      } else {
        if (!name.trim()) {
          throw new Error("Please enter your name.");
        }
        register({ name, email, password });
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
                {tab === 'login' ? 'Sign In to CourseX' : 'Create Student Account'}
              </h2>
              <p className="modal-subtitle">
                {tab === 'login' 
                  ? 'Access your course curriculums and learning resources.' 
                  : 'Register a new account to begin your learning journey.'}
              </p>
            </div>

            {/* Tab switch */}
            <div className="auth-tab-switch">
              <button 
                type="button"
                className={`tab-btn ${tab === 'login' ? 'active' : ''}`}
                onClick={() => { setTab('login'); setErrorMsg(''); }}
              >
                Sign In
              </button>
              <button 
                type="button"
                className={`tab-btn ${tab === 'register' ? 'active' : ''}`}
                onClick={() => { setTab('register'); setErrorMsg(''); }}
              >
                Register
              </button>
            </div>

            {errorMsg && (
              <div className="auth-error-box">
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

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
                <label>Email Address / ID</label>
                <div className="input-with-icon">
                  <Mail size={16} className="input-icon" />
                  <input 
                    type="email" 
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

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
                <span>Protected by Two-Factor Authentication</span>
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
                    <span>Continue to 2FA</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          /* Step 2: 2-Factor Authentication Challenge */
          <div className="auth-step-wrapper animate-fade-in">
            <div className="modal-header text-center">
              <div className="two-fa-shield-icon">
                <ShieldCheck size={36} className="text-cyan" />
              </div>
              <h2 className="modal-title">Two-Factor Authentication</h2>
              <p className="modal-subtitle">
                Enter the 6-digit verification code for:
              </p>
              <div className="user-email-target-tag">
                <span>{pending2FA.userCandidate.email}</span>
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
