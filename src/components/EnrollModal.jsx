import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useEnrollment } from '../context/EnrollmentContext';
import { 
  KeyRound, 
  Lock, 
  Unlock, 
  Mail, 
  Phone, 
  User, 
  ShieldCheck, 
  Sparkles, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  Send,
  Copy,
  Check
} from 'lucide-react';

export function EnrollModal({ isOpen, onClose, course, onOpenAuth, onUnlockSuccess }) {
  const { currentUser, isAdmin } = useAuth();
  const { verifyAndUnlock, submitAccessRequest } = useEnrollment();

  const [uniqueCode, setUniqueCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [requestSubmittedMsg, setRequestSubmittedMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Request state (no code auto-generation)
  const [requestMode, setRequestMode] = useState(false);
  const [requestName, setRequestName] = useState(currentUser?.name || '');
  const [requestEmail, setRequestEmail] = useState(currentUser?.email || '');
  const [requestPhone, setRequestPhone] = useState(currentUser?.phone || '');

  useEffect(() => {
    if (currentUser) {
      setRequestName(currentUser.name || '');
      setRequestEmail(currentUser.email || '');
      setRequestPhone(currentUser.phone || '');
    }
  }, [currentUser]);

  if (!isOpen || !course) return null;

  // If user is not logged in, show login/signup prompt
  if (!currentUser) {
    return (
      <div className="modal-backdrop" onClick={onClose}>
        <div className="modal-card glass-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>

          <div className="enroll-auth-prompt animate-fade-in text-center">
            <div className="enroll-course-banner">
              <img src={course.thumbnail} alt={course.title} className="enroll-modal-thumb" />
              <div className="enroll-banner-overlay">
                <span className="course-cat-tag">{course.category}</span>
                <h4>{course.title}</h4>
              </div>
            </div>

            <div className="enroll-prompt-content" style={{ padding: '24px 20px' }}>
              <div className="prompt-icon-badge">
                <Lock size={28} className="text-cyan" />
              </div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700, margin: '14px 0 8px' }}>
                Sign In to Enroll & Unlock
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: 20 }}>
                Please create a student account or sign in with your Gmail and phone number to activate your course access code.
              </p>

              <div className="enroll-auth-actions-col">
                <button 
                  className="btn-submit-auth"
                  onClick={() => {
                    onClose();
                    onOpenAuth('register');
                  }}
                >
                  <Sparkles size={16} />
                  <span>Create Account (Gmail + Phone)</span>
                  <ArrowRight size={16} />
                </button>

                <button 
                  className="btn-secondary-sm"
                  style={{ width: '100%', padding: '12px 16px', justifyContent: 'center' }}
                  onClick={() => {
                    onClose();
                    onOpenAuth('login');
                  }}
                >
                  <span>Already Have an Account? Sign In</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Handle Verify Unique ID
  const handleVerifySubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    const result = verifyAndUnlock(course.id, uniqueCode);
    setIsLoading(false);

    if (result.ok) {
      setSuccessMsg(result.message);
      if (onUnlockSuccess) {
        setTimeout(() => {
          onUnlockSuccess();
          onClose();
        }, 1200);
      }
    } else {
      setErrorMsg(result.message);
    }
  };

  // Handle Request Access to Admin
  const handleRequestSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    if (!requestEmail.trim()) {
      setErrorMsg('Please enter your Gmail address.');
      setIsLoading(false);
      return;
    }
    if (!requestPhone.trim()) {
      setErrorMsg('Please enter your phone number.');
      setIsLoading(false);
      return;
    }

    const res = submitAccessRequest({
      name: requestName || currentUser.name,
      email: requestEmail,
      phone: requestPhone,
      courseId: course.id,
      courseTitle: course.title
    });

    setIsLoading(false);
    if (res.ok) {
      setRequestSubmittedMsg(res.message);
      setRequestMode(false);
    } else {
      setErrorMsg(res.message);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card glass-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
        <button className="modal-close-btn" onClick={onClose}>
          <X size={18} />
        </button>

        {/* Course Header Banner */}
        <div className="enroll-course-mini-card">
          <img src={course.thumbnail} alt={course.title} className="mini-thumb" />
          <div className="mini-info">
            <span className="course-cat-tag">{course.category}</span>
            <h3 className="mini-title">{course.title}</h3>
            <span className="mini-meta">{course.sections?.length || 0} Sections • Locked Content</span>
          </div>
        </div>

        <div className="enroll-modal-body">
          {successMsg ? (
            <div className="enroll-success-state animate-fade-in text-center" style={{ padding: '24px 16px' }}>
              <div className="success-pulse-circle">
                <CheckCircle2 size={42} className="text-green" />
              </div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '14px 0 6px', color: '#10b981' }}>
                Course Unlocked!
              </h3>
              <p style={{ color: '#cbd5e1', fontSize: '0.92rem', marginBottom: 20 }}>
                {successMsg}
              </p>
              <div className="unlock-celebration-badge">
                <Sparkles size={16} className="text-cyan" />
                <span>Full access enabled on your account</span>
              </div>
            </div>
          ) : !requestMode ? (
            /* Enter Unique ID Form */
            <div className="enroll-form-view animate-fade-in">
              <div className="enroll-header-text">
                <h2 className="modal-title" style={{ fontSize: '1.35rem' }}>
                  Enter Course Unique ID
                </h2>
                <p className="modal-subtitle">
                  Enter the 5–6 character access code provided by your instructor or CourseX admin to unlock <strong>{course.title}</strong>.
                </p>
              </div>

              {/* User credentials tag */}
              <div className="enrolled-user-summary-tag">
                <div className="user-tag-left">
                  <User size={14} className="text-cyan" />
                  <span className="user-tag-name">{currentUser.name}</span>
                </div>
                <div className="user-tag-right">
                  <Mail size={12} className="text-dim" />
                  <span>{currentUser.email}</span>
                </div>
              </div>

              {requestSubmittedMsg && (
                <div className="alert-box-info animate-fade-in" style={{ 
                  margin: '14px 0', 
                  padding: '12px 14px', 
                  borderRadius: 10, 
                  background: 'rgba(16, 185, 129, 0.12)', 
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: '#a7f3d0',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  fontSize: '0.88rem',
                  lineHeight: 1.45
                }}>
                  <CheckCircle2 size={18} className="text-green" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <strong>Access Request Submitted!</strong>
                    <div style={{ marginTop: 2 }}>{requestSubmittedMsg}</div>
                  </div>
                </div>
              )}

              {errorMsg && (
                <div className="auth-error-box" style={{ marginTop: 14 }}>
                  <AlertCircle size={16} />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleVerifySubmit} className="enroll-code-form">
                <div className="form-group">
                  <label>5–6 Character Unique ID</label>
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
                  <span className="input-hint">
                    Unique IDs are course-specific and consist of capital letters and numbers.
                  </span>
                </div>

                <button 
                  type="submit" 
                  className="btn-submit-auth"
                  disabled={!uniqueCode.trim() || isLoading}
                >
                  {isLoading ? (
                    <span>Verifying Code...</span>
                  ) : (
                    <>
                      <Unlock size={17} />
                      <span>Unlock Course Now</span>
                      <ArrowRight size={17} />
                    </>
                  )}
                </button>
              </form>

              {/* Assistance / Request Access option */}
              <div className="enroll-footer-helpers">
                <button 
                  type="button" 
                  className="btn-link-action"
                  onClick={() => {
                    setErrorMsg('');
                    setRequestMode(true);
                  }}
                >
                  Don't have a Unique ID? Request Course Access from Admin
                </button>
              </div>
            </div>
          ) : (
            /* Request Access / Submit Details Mode */
            <div className="enroll-request-view animate-fade-in">
              <div className="enroll-header-text">
                <h2 className="modal-title" style={{ fontSize: '1.35rem' }}>
                  Request Unique Access ID
                </h2>
                <p className="modal-subtitle">
                  Submit your details directly to the CourseX Admin. Once approved, your course-specific Unique ID will be delivered to your <strong>Notifications</strong> (bell icon in the header).
                </p>
              </div>

              {errorMsg && (
                <div className="auth-error-box" style={{ marginTop: 14 }}>
                  <AlertCircle size={16} />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleRequestSubmit} className="enroll-request-form">
                <div className="form-group">
                  <label>Full Name</label>
                  <div className="input-with-icon">
                    <User size={16} className="input-icon" />
                    <input 
                      type="text" 
                      placeholder="Your name"
                      value={requestName}
                      onChange={(e) => setRequestName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Gmail / Email Address</label>
                  <div className="input-with-icon">
                    <Mail size={16} className="input-icon" />
                    <input 
                      type="email" 
                      placeholder="student@gmail.com"
                      value={requestEmail}
                      onChange={(e) => setRequestEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Phone Number</label>
                  <div className="input-with-icon">
                    <Phone size={16} className="input-icon" />
                    <input 
                      type="tel" 
                      placeholder="+91 98765 43210"
                      value={requestPhone}
                      onChange={(e) => setRequestPhone(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="request-notice-box">
                  <ShieldCheck size={16} className="text-cyan" />
                  <span>The Admin will review and approve your request from the Admin Panel.</span>
                </div>

                <div className="form-actions-row">
                  <button 
                    type="button" 
                    className="btn-secondary-sm"
                    onClick={() => setRequestMode(false)}
                  >
                    Back
                  </button>
                  <button 
                    type="submit" 
                    className="btn-submit-auth"
                    style={{ flex: 1 }}
                    disabled={isLoading}
                  >
                    <Send size={15} />
                    <span>Submit Access Request</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
