import React, { useState } from 'react';
import { useCourse } from '../context/CourseContext';
import { useAuth } from '../context/AuthContext';
import { useEnrollment } from '../context/EnrollmentContext';
import { 
  Play, 
  Layers, 
  Clock, 
  Search, 
  ArrowRight,
  Settings,
  Plus,
  Lock,
  Sparkles,
  CheckCircle2,
  KeyRound,
  Trash2,
  X
} from 'lucide-react';

export function CourseCatalog({ onSelectCourse, onNavigateAdmin, onOpenAuth }) {
  const { courses, setActiveCourseId, deleteCourse } = useCourse();
  const { currentUser, isAdmin } = useAuth();
  const { isCourseUnlocked } = useEnrollment();
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDeleteCourseId, setConfirmDeleteCourseId] = useState(null);
  
  // If user signed in via Unique ID, default to showing their enrolled courses
  const [courseFilter, setCourseFilter] = useState(() => {
    return currentUser?.loginMethod === 'unique_id' ? 'enrolled' : 'all';
  });

  const enrolledCount = courses.filter(c => isCourseUnlocked(c.id)).length;

  const filteredCourses = courses.filter(course => {
    const matchesSearch = 
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (courseFilter === 'enrolled') {
      return matchesSearch && isCourseUnlocked(course.id);
    }
    return matchesSearch;
  });

  const handleOpenCourse = (courseId) => {
    setActiveCourseId(courseId);
    onSelectCourse(courseId);
  };

  return (
    <div className="catalog-page-container">
      {/* Top Header */}
      <div className="catalog-header-bar glass-panel">
        <div>
          <h1 className="catalog-page-title">Course Curriculum</h1>
          <p className="catalog-page-desc">
            {courseFilter === 'enrolled' 
              ? `Displaying your ${enrolledCount} enrolled & unlocked course(s).` 
              : 'Select any course to view its curriculum, sections, and video lectures.'}
          </p>

          {/* Filter Pills: All vs My Enrolled Courses */}
          {currentUser && (
            <div className="catalog-filter-tabs" style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button 
                type="button"
                className={`btn-subtab ${courseFilter === 'all' ? 'active' : ''}`}
                onClick={() => setCourseFilter('all')}
                style={{ padding: '6px 14px', fontSize: '0.84rem' }}
              >
                <span>All Courses ({courses.length})</span>
              </button>
              <button 
                type="button"
                className={`btn-subtab ${courseFilter === 'enrolled' ? 'active' : ''}`}
                onClick={() => setCourseFilter('enrolled')}
                style={{ padding: '6px 14px', fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Sparkles size={13} className="text-cyan" />
                <span>My Enrolled Courses</span>
                <span className="badge badge-green" style={{ padding: '1px 7px', fontSize: '0.72rem' }}>
                  {enrolledCount}
                </span>
              </button>
            </div>
          )}
        </div>

        <div className="catalog-actions-col" style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
          <div className="catalog-search-box">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {!currentUser && onOpenAuth && (
            <button 
              type="button"
              className="btn-link-action"
              onClick={() => onOpenAuth('unique_id')}
              style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <KeyRound size={13} className="text-cyan" />
              <span>Have a Unique ID? Sign In with Code</span>
            </button>
          )}
        </div>
      </div>

      {/* Courses Grid */}
      <div className="courses-grid">
        {filteredCourses.map((course) => {
          const totalVideos = (course.sections || []).reduce((acc, s) => acc + (s.videos?.length || 0), 0);
          const isUnlocked = isCourseUnlocked(course.id);

          return (
            <div 
              key={course.id} 
              className="course-card glass-panel glow-hover"
              onClick={() => handleOpenCourse(course.id)}
            >
              <div className="card-image-wrap">
                <img src={course.thumbnail} alt={course.title} className="card-thumb-img" />
                <div className="card-overlay-gradient"></div>
                <div className="card-seasons-badge">
                  <Layers size={13} className="text-cyan" />
                  <span>{course.sections?.length || 0} Sections</span>
                </div>
                <div className="card-lock-status-badge">
                  {isUnlocked ? (
                    <span className="badge badge-green-glow">Enrolled</span>
                  ) : (
                    <span className="badge badge-cyan-glow">Available to Buy</span>
                  )}
                </div>
              </div>

              <div className="card-content-body">
                <span className="course-cat-tag">{course.category}</span>
                <h3 className="course-card-title">{course.title}</h3>
                <p className="course-card-desc">{course.description}</p>

                <div className="card-footer-row">
                  <div className="footer-stats-group">
                    <span className="stat-unit">
                      <Play size={13} /> {totalVideos} Videos
                    </span>
                  </div>

                  <div className="card-actions-group">
                    {isAdmin && (
                      <>
                        <button 
                          type="button"
                          className="btn-admin-quick-edit"
                          title="Manage in Admin Panel"
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigateAdmin(course.id);
                          }}
                        >
                          <Settings size={14} />
                        </button>
                        {confirmDeleteCourseId === course.id ? (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }} onClick={(e) => e.stopPropagation()}>
                            <button 
                              type="button"
                              style={{
                                background: '#ef4444',
                                border: 'none',
                                color: '#fff',
                                padding: '6px 9px',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteCourse(course.id);
                                setConfirmDeleteCourseId(null);
                              }}
                              title="Confirm Delete"
                            >
                              Confirm
                            </button>
                            <button 
                              type="button"
                              style={{
                                background: 'rgba(255,255,255,0.1)',
                                border: 'none',
                                color: '#cbd5e1',
                                padding: '6px 7px',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                cursor: 'pointer'
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDeleteCourseId(null);
                              }}
                              title="Cancel"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        ) : (
                          <button 
                            type="button"
                            className="btn-admin-quick-delete"
                            title="Delete Course"
                            style={{
                              background: 'rgba(239, 68, 68, 0.12)',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              color: '#f87171',
                              padding: '7px 9px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.2s ease'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDeleteCourseId(course.id);
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </>
                    )}
                    <button className="btn-open-course">
                      <span>{isUnlocked ? 'Continue Learning' : 'Preview & Enroll'}</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredCourses.length === 0 && (
        <div className="empty-catalog-state glass-panel">
          <Search size={36} className="text-dim" />
          <h3>No courses found</h3>
          <p>Try searching for a different keyword or create a course in the Admin Panel.</p>
        </div>
      )}
    </div>
  );
}
