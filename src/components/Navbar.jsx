import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useEnrollment } from '../context/EnrollmentContext';
import { 
  ShieldCheck, 
  Settings, 
  LogOut, 
  BookOpen, 
  Info,
  ChevronDown,
  Bell,
  KeyRound,
  Copy,
  Check,
  Clock,
  Sparkles,
  ArrowRight,
  ExternalLink
} from 'lucide-react';

export function Navbar({ currentView, setView, onOpenAuth }) {
  const { currentUser, isAdmin, logout } = useAuth();
  const { userNotifications, markNotificationRead, customers } = useEnrollment();

  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
  const [copiedNotifId, setCopiedNotifId] = useState(null);

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotificationDropdownOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Notifications calculation
  const unreadUserCount = userNotifications.filter(n => !n.read).length;
  const pendingAdminCount = isAdmin ? customers.filter(c => c.status === 'pending').length : 0;
  const totalBadgeCount = unreadUserCount + pendingAdminCount;

  // Student pending requests (if any)
  const studentPendingRequests = !isAdmin && currentUser ? customers.filter(c => 
    c.status === 'pending' && 
    ((c.email && c.email.toLowerCase() === currentUser.email?.toLowerCase()) ||
     (c.phone && currentUser.phone && c.phone.replace(/\D/g, '') === currentUser.phone.replace(/\D/g, '')))
  ) : [];

  const handleCopyCode = (id, code) => {
    navigator.clipboard.writeText(code);
    setCopiedNotifId(id);
    markNotificationRead(id);
    setTimeout(() => setCopiedNotifId(null), 2500);
  };

  return (
    <header className="navbar-container">
      <div className="navbar-content">
        {/* Brand / Logo using the requested aesthetic CourseX logo */}
        <div className="navbar-brand" onClick={() => setView('home')}>
          <div className="brand-logo-wrapper">
            <img 
              src="/coursex-logo.jpg" 
              alt="CourseX Logo" 
              className="brand-logo-img" 
              style={{ width: 34, height: 34, objectFit: 'contain', borderRadius: 8 }}
            />
            <div className="brand-fallback-text">
              <span className="brand-name">Course</span>
              <span className="brand-x">X</span>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="navbar-nav">
          <button 
            className={`nav-btn ${currentView === 'home' ? 'active' : ''}`}
            onClick={() => setView('home')}
          >
            Home
          </button>
          
          <button 
            className={`nav-btn ${currentView === 'courses' ? 'active' : ''}`}
            onClick={() => setView('courses')}
          >
            <BookOpen size={15} />
            Courses
          </button>

          <button 
            className={`nav-btn ${currentView === 'about' ? 'active' : ''}`}
            onClick={() => setView('about')}
          >
            <Info size={15} />
            About
          </button>

          {isAdmin && (
            <button 
              className={`nav-btn admin-nav-btn ${currentView === 'admin' ? 'active' : ''}`}
              onClick={() => setView('admin')}
            >
              <Settings size={15} />
              Admin Panel
              <span className="badge badge-purple admin-tag">ADMIN</span>
            </button>
          )}
        </nav>

        {/* Right Section: Auth & Profile */}
        <div className="navbar-actions">
          {currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* Notification Bell Section */}
              <div className="notification-bell-wrapper" ref={notifRef} style={{ position: 'relative' }}>
                <button 
                  className={`btn-notification-bell ${notificationDropdownOpen ? 'active' : ''}`}
                  onClick={() => {
                    setNotificationDropdownOpen(!notificationDropdownOpen);
                    setProfileDropdownOpen(false);
                  }}
                  title="Notifications & Course Unique IDs"
                  aria-label="Notifications"
                >
                  <Bell size={18} />
                  {totalBadgeCount > 0 && (
                    <span className="notification-unread-dot">
                      {totalBadgeCount > 9 ? '9+' : totalBadgeCount}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown Menu */}
                {notificationDropdownOpen && (
                  <div className="notifications-dropdown-menu glass-panel animate-fade-in">
                    <div className="notif-dropdown-header">
                      <div className="notif-title-row">
                        <Bell size={16} className="text-cyan" />
                        <span className="notif-heading">Notifications</span>
                      </div>
                      {totalBadgeCount > 0 && (
                        <span className="notif-badge-new">{totalBadgeCount} New</span>
                      )}
                    </div>

                    <div className="notif-list-scrollable">
                      {/* Admin Pending Access Requests Alert */}
                      {isAdmin && pendingAdminCount > 0 && (
                        <div 
                          className="notif-item-admin-alert"
                          onClick={() => {
                            setView('admin');
                            setNotificationDropdownOpen(false);
                          }}
                        >
                          <div className="notif-item-icon bg-amber-glow">
                            <Clock size={16} className="text-amber" />
                          </div>
                          <div className="notif-item-content">
                            <p className="notif-item-title text-amber">
                              {pendingAdminCount} Pending Course Access Request{pendingAdminCount > 1 ? 's' : ''}
                            </p>
                            <p className="notif-item-sub">Click to review, approve (✓), and issue Unique IDs</p>
                          </div>
                        </div>
                      )}

                      {/* Student Pending Requests Info */}
                      {studentPendingRequests.length > 0 && studentPendingRequests.map(req => (
                        <div key={req.id} className="notif-item-pending">
                          <div className="notif-item-icon bg-amber-glow">
                            <Clock size={16} className="text-amber" />
                          </div>
                          <div className="notif-item-content">
                            <p className="notif-item-title">Access Request Pending</p>
                            <p className="notif-item-sub">
                              Your request for <strong>{req.courseTitle}</strong> is under admin review. Once approved, your Unique ID will appear right here.
                            </p>
                          </div>
                        </div>
                      ))}

                      {/* Approved Unique ID Notifications (Permanent) */}
                      {userNotifications.length > 0 ? (
                        userNotifications.map(notif => {
                          const isCopied = copiedNotifId === notif.id;
                          return (
                            <div 
                              key={notif.id} 
                              className={`notif-item-card ${!notif.read ? 'unread' : ''}`}
                              onClick={() => markNotificationRead(notif.id)}
                            >
                              <div className="notif-item-header">
                                <div className="notif-item-icon bg-cyan-glow">
                                  <KeyRound size={16} className="text-cyan" />
                                </div>
                                <div style={{ flex: 1 }}>
                                  <div className="notif-course-title-row">
                                    <span className="notif-approved-label">Unique ID Approved!</span>
                                    <span className="notif-date-str">
                                      {new Date(notif.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                    </span>
                                  </div>
                                  <p className="notif-course-name">{notif.courseTitle}</p>
                                </div>
                              </div>

                              <div className="notif-code-display-box">
                                <div className="notif-code-left">
                                  <span className="code-label">Your Unique ID:</span>
                                  <code className="notif-code-pill">{notif.uniqueId}</code>
                                </div>
                                <button 
                                  type="button"
                                  className="btn-copy-notif-code"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopyCode(notif.id, notif.uniqueId);
                                  }}
                                  title="Copy Unique ID to clipboard"
                                >
                                  {isCopied ? <Check size={13} className="text-green" /> : <Copy size={13} />}
                                  <span>{isCopied ? 'Copied' : 'Copy'}</span>
                                </button>
                              </div>

                              <div className="notif-card-actions">
                                <button 
                                  className="btn-notif-unlock-link"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopyCode(notif.id, notif.uniqueId);
                                    setView('courses');
                                    setNotificationDropdownOpen(false);
                                  }}
                                >
                                  <span>Copy Code & Go to Courses</span>
                                  <ArrowRight size={13} />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        studentPendingRequests.length === 0 && (!isAdmin || pendingAdminCount === 0) && (
                          <div className="notif-empty-state">
                            <Sparkles size={28} className="text-dim" style={{ marginBottom: 8 }} />
                            <p className="notif-empty-title">No Notifications Yet</p>
                            <p className="notif-empty-sub">
                              When you request course access and the admin approves it, your permanent Unique ID will be delivered here.
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Profile Container */}
              <div className="profile-container" ref={profileRef}>
                <div 
                  className="profile-badge-btn"
                  onClick={() => {
                    setProfileDropdownOpen(!profileDropdownOpen);
                    setNotificationDropdownOpen(false);
                  }}
                >
                  <div className="avatar-wrapper">
                    <img 
                      src={currentUser.avatar} 
                      alt={currentUser.name} 
                      className="avatar-img" 
                    />
                    <span className="status-online-dot"></span>
                  </div>
                  <div className="user-details-summary">
                    <span className="user-name-text">{currentUser.name}</span>
                    <div className="user-role-line">
                      <span className={`role-pill ${currentUser.role === 'admin' ? 'role-admin' : 'role-user'}`}>
                        {currentUser.role.toUpperCase()}
                      </span>
                      <span className="two-fa-pill" title="2-Factor Authentication Verified">
                        <ShieldCheck size={11} /> 2FA
                      </span>
                    </div>
                  </div>
                  <ChevronDown size={14} className="text-muted" />
                </div>

                {profileDropdownOpen && (
                  <div className="profile-dropdown-menu glass-panel">
                    <div className="dropdown-header">
                      <p className="dd-name">{currentUser.name}</p>
                      <p className="dd-email">{currentUser.email}</p>
                      <div className="dd-badge-row">
                        <span className="badge badge-green">
                          <ShieldCheck size={12} /> 2FA Active
                        </span>
                      </div>
                    </div>
                    <div className="dropdown-divider"></div>
                  
                  {isAdmin && (
                    <button 
                      className="dropdown-item"
                      onClick={() => {
                        setView('admin');
                        setProfileDropdownOpen(false);
                      }}
                    >
                      <Settings size={15} />
                      Course Management & CMS
                    </button>
                  )}

                  <button 
                    className="dropdown-item"
                    onClick={() => {
                      setView('courses');
                      setProfileDropdownOpen(false);
                    }}
                  >
                    <BookOpen size={15} />
                    View Courses
                  </button>

                  <button 
                    className="dropdown-item"
                    onClick={() => {
                      setView('about');
                      setProfileDropdownOpen(false);
                    }}
                  >
                    <Info size={15} />
                    About Platform & Admin
                  </button>

                  <div className="dropdown-divider"></div>

                  <button 
                    className="dropdown-item text-rose"
                    onClick={() => {
                      logout();
                      setProfileDropdownOpen(false);
                    }}
                  >
                    <LogOut size={15} />
                    Log Out
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
            <div className="auth-action-buttons">
              <button 
                className="btn-login"
                onClick={() => onOpenAuth('login')}
              >
                Sign In
              </button>
              <button 
                className="btn-register"
                onClick={() => onOpenAuth('register')}
              >
                Register
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
