import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CourseProvider, useCourse } from './context/CourseContext';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { CourseCatalog } from './components/CourseCatalog';
import { CourseViewer } from './components/CourseViewer';
import { AdminPanel } from './components/AdminPanel';
import { AboutPage } from './components/AboutPage';
import { AuthModal } from './components/AuthModal';
import { ShieldCheck } from 'lucide-react';
import './App.css';

function MainLayout() {
  const [currentView, setCurrentView] = useState('home'); // 'home' | 'courses' | 'about' | 'viewer' | 'admin'
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState('login');

  const { isAdmin } = useAuth();
  const { setActiveCourseId, selectVideo } = useCourse();

  const handleOpenAuth = (tab = 'login') => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };

  const handleSelectCourse = (courseId) => {
    setActiveCourseId(courseId);
    setCurrentView('viewer');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResumeWatching = (lastWatched) => {
    if (!lastWatched) return;
    selectVideo(lastWatched.courseId, lastWatched.sectionId, lastWatched.videoId);
    setCurrentView('viewer');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateAdmin = (courseId) => {
    if (courseId) setActiveCourseId(courseId);
    setCurrentView('admin');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="app-root">
      {/* Top Navigation */}
      <Navbar 
        currentView={currentView} 
        setView={(view) => {
          if (view === 'admin' && !isAdmin) {
            handleOpenAuth('login');
            return;
          }
          setCurrentView(view);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenAuth={handleOpenAuth}
      />

      {/* Main Content Area */}
      <main className="app-main-content">
        {currentView === 'home' && (
          <>
            <Hero 
              onBrowseCourses={() => {
                setCurrentView('courses');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onOpenAuth={handleOpenAuth}
              onResumeWatching={handleResumeWatching}
            />
            <CourseCatalog 
              onSelectCourse={handleSelectCourse} 
              onNavigateAdmin={handleNavigateAdmin}
            />
          </>
        )}

        {currentView === 'courses' && (
          <CourseCatalog 
            onSelectCourse={handleSelectCourse}
            onNavigateAdmin={handleNavigateAdmin}
          />
        )}

        {currentView === 'about' && (
          <AboutPage 
            onBrowseCourses={() => {
              setCurrentView('courses');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {currentView === 'viewer' && (
          <CourseViewer 
            onBackToCourses={() => setCurrentView('courses')}
          />
        )}

        {currentView === 'admin' && (
          isAdmin ? (
            <AdminPanel 
              onNavigateToCourse={(courseId) => {
                setActiveCourseId(courseId);
                setCurrentView('viewer');
              }}
            />
          ) : (
            <div className="empty-catalog-state glass-panel" style={{ maxWidth: 500, margin: '80px auto' }}>
              <ShieldCheck size={48} className="text-purple" />
              <h3>Admin Authorization Required</h3>
              <p>Please sign in with your administrator ID and password to access course management.</p>
              <button 
                className="btn-submit-auth" 
                style={{ marginTop: 16 }}
                onClick={() => handleOpenAuth('login')}
              >
                Sign In as Admin
              </button>
            </div>
          )
        )}
      </main>

      {/* Clean Footer */}
      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-brand" onClick={() => setCurrentView('home')} style={{ cursor: 'pointer' }}>
            <img 
              src="/coursex-logo.jpg" 
              alt="CourseX" 
              className="brand-logo-img" 
              style={{ width: 28, height: 28 }}
            />
            <div className="brand-fallback-text" style={{ fontSize: 18 }}>
              <span className="brand-name">Course</span>
              <span className="brand-x">X</span>
            </div>
          </div>

          <div className="footer-links-row">
            <button className="footer-nav-link" onClick={() => setCurrentView('home')}>Home</button>
            <button className="footer-nav-link" onClick={() => setCurrentView('courses')}>Courses</button>
            <button className="footer-nav-link" onClick={() => setCurrentView('about')}>About Us</button>
          </div>

          <div className="footer-badges">
            <span className="badge badge-outline">
              <ShieldCheck size={12} /> 2FA Protected
            </span>
          </div>
        </div>
      </footer>

      {/* 2FA & Auth Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)}
        initialTab={authModalTab}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CourseProvider>
        <MainLayout />
      </CourseProvider>
    </AuthProvider>
  );
}
