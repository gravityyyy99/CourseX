import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, 
  Settings, 
  LogOut, 
  BookOpen, 
  Info,
  ChevronDown
} from 'lucide-react';

export function Navbar({ currentView, setView, onOpenAuth }) {
  const { currentUser, isAdmin, logout } = useAuth();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

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
            <div className="profile-container">
              <div 
                className="profile-badge-btn"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
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
