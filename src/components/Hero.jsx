import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useCourse } from '../context/CourseContext';
import { BookOpen, ShieldCheck, ArrowRight, Play, Clock, Sparkles } from 'lucide-react';

export function Hero({ onBrowseCourses, onOpenAuth, onResumeWatching }) {
  const { currentUser } = useAuth();
  const { lastWatched } = useCourse();

  return (
    <section className="hero-section">
      <div className="glow-sphere cyan-glow"></div>
      <div className="glow-sphere indigo-glow"></div>

      <div className="hero-content-wrapper">
        <div className="hero-logo-banner">
          <img 
            src="/coursex-logo.jpg" 
            alt="CourseX" 
            className="hero-aesthetic-logo" 
            style={{ width: 84, height: 84, objectFit: 'contain', borderRadius: 18 }}
          />
        </div>

        <h1 className="hero-headline">
          <span className="gradient-brand-text">CourseX</span>
        </h1>

        <p className="hero-subheadline">
          The platform where you get structured courses organized by sections and lectures with Google Drive integration and study resources.
        </p>

        {/* Continue Watching / Resume Card */}
        {lastWatched && lastWatched.videoTitle && (
          <div 
            className="hero-resume-card glass-panel glow-hover animate-fade-in"
            onClick={() => onResumeWatching && onResumeWatching(lastWatched)}
            title="Click to resume this lecture right where you left off"
          >
            <div className="resume-icon-circle">
              <Play size={15} fill="currentColor" />
            </div>
            <div className="resume-details">
              <div className="resume-tag-row">
                <span className="resume-pill">CONTINUE WATCHING</span>
                {lastWatched.currentTime > 0 && (
                  <span className="resume-time-tag">
                    <Clock size={11} />
                    <span>{Math.floor(lastWatched.currentTime / 60)}:{String(Math.floor(lastWatched.currentTime % 60)).padStart(2, '0')}</span>
                  </span>
                )}
              </div>
              <h4 className="resume-title">{lastWatched.videoTitle}</h4>
              <p className="resume-course-info">
                {lastWatched.courseTitle} {lastWatched.sectionTitle ? `• ${lastWatched.sectionTitle}` : ''}
              </p>
            </div>
            <div className="resume-arrow-btn">
              <span>Resume</span>
              <ArrowRight size={14} />
            </div>
          </div>
        )}

        <div className="hero-cta-group">
          <button 
            className="btn-hero-primary glow-hover"
            onClick={onBrowseCourses}
          >
            <BookOpen size={18} />
            <span>Browse Courses</span>
          </button>

          {!currentUser && (
            <button 
              className="btn-hero-secondary"
              onClick={() => onOpenAuth('login')}
            >
              <ShieldCheck size={18} />
              <span>Sign In with 2FA</span>
              <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
