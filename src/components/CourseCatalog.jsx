import React, { useState } from 'react';
import { useCourse } from '../context/CourseContext';
import { useAuth } from '../context/AuthContext';
import { 
  Play, 
  Layers, 
  Clock, 
  Search, 
  ArrowRight,
  Settings,
  Plus
} from 'lucide-react';

export function CourseCatalog({ onSelectCourse, onNavigateAdmin }) {
  const { courses, setActiveCourseId } = useCourse();
  const { isAdmin } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCourses = courses.filter(course => {
    return course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
           course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
           course.category.toLowerCase().includes(searchQuery.toLowerCase());
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
          <h1 className="catalog-page-title">Courses</h1>
          <p className="catalog-page-desc">
            Select any course to view its curriculum, sections, and video lectures.
          </p>
        </div>

        <div className="catalog-search-box">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Courses Grid */}
      <div className="courses-grid">
        {filteredCourses.map((course) => {
          const totalVideos = (course.sections || []).reduce((acc, s) => acc + (s.videos?.length || 0), 0);

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
                      <button 
                        className="btn-admin-quick-edit"
                        title="Manage in Admin Panel"
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigateAdmin(course.id);
                        }}
                      >
                        <Settings size={14} />
                      </button>
                    )}
                    <button className="btn-open-course">
                      <span>Open Course</span>
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
