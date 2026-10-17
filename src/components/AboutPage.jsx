import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, HardDrive, BookOpen, User, Mail, Award, CheckCircle2 } from 'lucide-react';

export function AboutPage({ onBrowseCourses }) {
  const { adminProfile } = useAuth();

  return (
    <div className="about-page-container">
      {/* Header */}
      <div className="about-header-banner glass-panel">
        <h1 className="about-page-title">About Us</h1>
        <p className="about-page-subtitle">
          Learn more about the CourseX learning architecture and our team.
        </p>
      </div>

      <div className="about-sections-grid">
        {/* Section 1: About the Website / CourseX */}
        <section className="about-card glass-panel">
          <div className="card-badge-line">
            <span className="badge badge-cyan">
              <HardDrive size={12} /> The Platform
            </span>
          </div>
          <h2 className="about-card-title">About CourseX</h2>
          <p className="about-card-desc">
            {adminProfile.aboutPlatform || 
              "CourseX is a modern e-learning platform engineered to transform raw Google Drive folders and cloud media into structured, section-by-section masterclasses with synchronized in-app video streaming and embedded document reading."}
          </p>

          <div className="platform-highlights-list">
            <div className="highlight-item">
              <CheckCircle2 size={16} className="text-cyan" />
              <span>Direct Google Drive video integration with embedded playback.</span>
            </div>
            <div className="highlight-item">
              <CheckCircle2 size={16} className="text-cyan" />
              <span>In-website document and note viewing without external redirections.</span>
            </div>
            <div className="highlight-item">
              <CheckCircle2 size={16} className="text-cyan" />
              <span>Multi-section curriculum organization with lecture reordering.</span>
            </div>
            <div className="highlight-item">
              <CheckCircle2 size={16} className="text-cyan" />
              <span>Protected with enforced Two-Factor Authentication (2FA).</span>
            </div>
          </div>
        </section>

        {/* Section 2: About the Admin / Creator */}
        <section className="about-card glass-panel">
          <div className="card-badge-line">
            <span className="badge badge-purple">
              <User size={12} /> Leadership
            </span>
          </div>
          <h2 className="about-card-title">About the Instructor & Admin</h2>

          <div className="admin-profile-showcase">
            <div className="admin-avatar-frame">
              <img 
                src={adminProfile.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80"} 
                alt={adminProfile.name} 
                className="admin-large-avatar"
              />
            </div>
            <div className="admin-info-col">
              <h3 className="admin-display-name">{adminProfile.name}</h3>
              <p className="admin-display-title">{adminProfile.title}</p>
              <div className="admin-contact-pill">
                <Mail size={12} />
                <span>{adminProfile.email}</span>
              </div>
            </div>
          </div>

          <p className="about-card-desc admin-bio-text">
            {adminProfile.bio || 
              "Passionate educator and systems architect. CourseX was founded to eliminate disorganized video folders and deliver structured, distraction-free learning directly to ambitious students worldwide."}
          </p>
        </section>
      </div>
    </div>
  );
}
