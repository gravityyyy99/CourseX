import React, { useState, useRef, useEffect } from 'react';
import { useCourse } from '../context/CourseContext';
import { 
  Play, 
  CheckCircle2, 
  Circle, 
  FileText, 
  ChevronRight, 
  ChevronDown, 
  Maximize2, 
  ArrowLeft,
  ExternalLink,
  Video,
  RotateCcw,
  Clock
} from 'lucide-react';
import { formatDriveEmbedUrl, isEmbeddableVideo } from '../utils/driveHelper';

export function CourseViewer({ onBackToCourses }) {
  const { 
    activeCourse, 
    activeSection, 
    activeVideo, 
    selectVideo, 
    toggleVideoCompletion,
    savePlaybackPosition,
    getPlaybackPosition
  } = useCourse();

  const videoRef = useRef(null);
  const [resumedTime, setResumedTime] = useState(0);
  const [showResumeBanner, setShowResumeBanner] = useState(false);

  useEffect(() => {
    if (activeCourse && activeVideo) {
      const pos = getPlaybackPosition(activeCourse.id, activeVideo.id);
      if (pos > 3) {
        setResumedTime(pos);
        setShowResumeBanner(true);
      } else {
        setShowResumeBanner(false);
      }
    }
  }, [activeVideo?.id, activeCourse?.id]);

  const [expandedSections, setExpandedSections] = useState(() => {
    const initial = {};
    if (activeCourse?.sections) {
      activeCourse.sections.forEach(s => { initial[s.id] = true; });
    }
    return initial;
  });

  // Current view mode in center stage: 'video' | 'note'
  const [activeStageMode, setActiveStageMode] = useState('video');
  const [selectedNote, setSelectedNote] = useState(null);
  const [theaterMode, setTheaterMode] = useState(false);

  if (!activeCourse) {
    return (
      <div className="empty-catalog-state glass-panel" style={{ maxWidth: 500, margin: '80px auto' }}>
        <h3>No course selected</h3>
        <button onClick={onBackToCourses} className="btn-primary-sm" style={{ marginTop: 12 }}>
          Back to Courses
        </button>
      </div>
    );
  }

  const toggleSection = (secId) => {
    setExpandedSections(prev => ({
      ...prev,
      [secId]: !prev[secId]
    }));
  };

  const handleNextVideo = () => {
    if (!activeCourse || !activeSection || !activeVideo) return;
    
    if (!activeVideo.completed) {
      toggleVideoCompletion(activeCourse.id, activeSection.id, activeVideo.id);
    }

    const currentVideoIndex = activeSection.videos.findIndex(v => v.id === activeVideo.id);
    if (currentVideoIndex < activeSection.videos.length - 1) {
      const nextVideo = activeSection.videos[currentVideoIndex + 1];
      selectVideo(activeCourse.id, activeSection.id, nextVideo.id);
      setActiveStageMode('video');
      return;
    }

    const currentSectionIndex = activeCourse.sections.findIndex(s => s.id === activeSection.id);
    if (currentSectionIndex < activeCourse.sections.length - 1) {
      const nextSec = activeCourse.sections[currentSectionIndex + 1];
      if (nextSec.videos && nextSec.videos.length > 0) {
        selectVideo(activeCourse.id, nextSec.id, nextSec.videos[0].id);
        setActiveStageMode('video');
        setExpandedSections(prev => ({ ...prev, [nextSec.id]: true }));
      }
    }
  };

  const handleSelectNote = (note) => {
    setSelectedNote(note);
    setActiveStageMode('note');
  };

  const handleSelectVideo = (courseId, sectionId, videoId) => {
    selectVideo(courseId, sectionId, videoId);
    setActiveStageMode('video');
  };

  const videoStreamUrl = activeVideo ? formatDriveEmbedUrl(activeVideo.videoUrl) : '';
  const noteEmbedUrl = selectedNote ? formatDriveEmbedUrl(selectedNote.fileUrl) : '';

  return (
    <div className={`course-viewer-page ${theaterMode ? 'theater-layout' : ''}`}>
      {/* Top Header */}
      <div className="viewer-top-bar glass-panel">
        <div className="breadcrumbs-group">
          <button className="breadcrumb-btn" onClick={onBackToCourses}>
            <ArrowLeft size={15} /> All Courses
          </button>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current-course">{activeCourse.title}</span>
          {activeSection && (
            <>
              <span className="breadcrumb-sep">/</span>
              <span className="breadcrumb-season-tag">{activeSection.title}</span>
            </>
          )}
        </div>

        <div className="viewer-top-controls">
          {selectedNote && (
            <div className="stage-mode-switcher">
              <button 
                className={`mode-btn ${activeStageMode === 'video' ? 'active' : ''}`}
                onClick={() => setActiveStageMode('video')}
              >
                <Video size={13} /> Video
              </button>
              <button 
                className={`mode-btn ${activeStageMode === 'note' ? 'active' : ''}`}
                onClick={() => setActiveStageMode('note')}
              >
                <FileText size={13} /> Document
              </button>
            </div>
          )}

          <button 
            className="btn-control-icon"
            onClick={() => setTheaterMode(!theaterMode)}
            title="Toggle Big Screen Mode"
          >
            <Maximize2 size={15} />
            <span>{theaterMode ? 'Standard' : 'Big Screen'}</span>
          </button>
        </div>
      </div>

      <div className="viewer-body-grid">
        {/* Left / Sidebar: Clean Sections List */}
        <aside className="drive-structure-sidebar glass-panel">
          <div className="sidebar-header">
            <h4 className="drive-folder-name" title={activeCourse.title}>
              {activeCourse.title}
            </h4>
          </div>

          <div className="folder-tree-scrollable">
            {(!activeCourse.sections || activeCourse.sections.length === 0) ? (
              <p className="no-items-hint" style={{ padding: 16 }}>No sections created yet.</p>
            ) : (
              activeCourse.sections.map((section) => {
                const isExpanded = expandedSections[section.id];
                const isCurrentSection = activeSection?.id === section.id;
                const totalItems = (section.videos?.length || 0) + (section.notes?.length || 0);

                return (
                  <div key={section.id} className={`tree-season-node ${isCurrentSection ? 'is-active-season' : ''}`}>
                    {/* Section Title Accordion */}
                    <div 
                      className="tree-season-header"
                      onClick={() => toggleSection(section.id)}
                    >
                      <div className="season-header-left">
                        {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                        <span className="tree-season-title">{section.title}</span>
                      </div>
                      <span className="season-stats-pill">
                        {totalItems}
                      </span>
                    </div>

                    {/* Section Contents - Direct clean list, no unnecessary "videos and notes" headers */}
                    {isExpanded && (
                      <div className="tree-season-children animate-fade-in">
                        {/* Videos direct list */}
                        {section.videos && section.videos.length > 0 && (
                          <div className="tree-lectures-list">
                            {section.videos.map((vid) => {
                              const isCurrent = activeVideo?.id === vid.id && activeStageMode === 'video';
                              return (
                                <div 
                                  key={vid.id}
                                  className={`tree-lecture-item ${isCurrent ? 'active-lecture' : ''}`}
                                  onClick={() => handleSelectVideo(activeCourse.id, section.id, vid.id)}
                                >
                                  <button 
                                    className="lecture-check-btn"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleVideoCompletion(activeCourse.id, section.id, vid.id);
                                    }}
                                    title={vid.completed ? "Mark uncompleted" : "Mark completed"}
                                  >
                                    {vid.completed ? (
                                      <CheckCircle2 size={15} className="text-green" />
                                    ) : (
                                      <Circle size={15} className="text-dim" />
                                    )}
                                  </button>

                                  <div className="lecture-title-col">
                                    <span className="lecture-title-text" title={vid.title}>
                                      • {vid.title}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Notes direct list */}
                        {section.notes && section.notes.length > 0 && (
                          <div className="tree-notes-list">
                            {section.notes.map((n) => {
                              const isNoteActive = selectedNote?.id === n.id && activeStageMode === 'note';
                              return (
                                <div 
                                  key={n.id}
                                  className={`tree-note-item ${isNoteActive ? 'active-note' : ''}`}
                                  onClick={() => handleSelectNote(n)}
                                  title="View document"
                                >
                                  <FileText size={13} className="text-purple" />
                                  <span className="note-title-text">{n.title}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {(!section.videos || section.videos.length === 0) && (!section.notes || section.notes.length === 0) && (
                          <p className="no-items-hint">No content in this section.</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* Right / Center: Big Screen Stage */}
        <main className="viewer-main-stage">
          {activeStageMode === 'video' ? (
            /* VIDEO PLAYER VIEW */
            <div className="video-player-container glass-panel">
              <div className="video-player-screen">
                {activeVideo ? (
                  isEmbeddableVideo(videoStreamUrl) ? (
                    <iframe 
                      src={videoStreamUrl}
                      title={activeVideo.title}
                      className="responsive-video-iframe"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                      allowFullScreen
                    ></iframe>
                  ) : (
                    <video 
                      ref={videoRef}
                      key={activeVideo.id}
                      src={videoStreamUrl}
                      controls
                      autoPlay
                      playsInline
                      className="responsive-video-iframe"
                      style={{ objectFit: 'contain', background: '#000' }}
                      onLoadedMetadata={(e) => {
                        const pos = getPlaybackPosition(activeCourse.id, activeVideo.id);
                        if (pos > 0 && pos < e.target.duration - 5) {
                          e.target.currentTime = pos;
                        }
                      }}
                      onTimeUpdate={(e) => {
                        if (e.target.currentTime > 0) {
                          savePlaybackPosition(activeCourse.id, activeVideo.id, e.target.currentTime);
                        }
                      }}
                    >
                      Your browser does not support HTML5 video.
                    </video>
                  )
                ) : (
                  <div className="no-video-placeholder">
                    <Play size={48} className="text-dim" />
                    <p>Select a video to start playing.</p>
                  </div>
                )}
              </div>

              {/* Automatic Resume Notification Banner */}
              {showResumeBanner && resumedTime > 3 && (
                <div className="playback-resume-toast glass-panel animate-fade-in">
                  <div className="resume-toast-info">
                    <Clock size={14} className="text-cyan" />
                    <span>Resumed playback from <strong>{Math.floor(resumedTime / 60)}:{String(Math.floor(resumedTime % 60)).padStart(2, '0')}</strong></span>
                  </div>
                  <button 
                    className="btn-restart-video"
                    onClick={() => {
                      if (videoRef.current) {
                        videoRef.current.currentTime = 0;
                      }
                      savePlaybackPosition(activeCourse.id, activeVideo.id, 0);
                      setShowResumeBanner(false);
                      setResumedTime(0);
                    }}
                    title="Start lecture from beginning"
                  >
                    <RotateCcw size={12} />
                    <span>Start Over</span>
                  </button>
                  <button 
                    className="toast-dismiss-btn"
                    onClick={() => setShowResumeBanner(false)}
                    title="Dismiss"
                  >
                    ✕
                  </button>
                </div>
              )}

              {activeVideo && (
                <div className="video-meta-bar">
                  <div className="video-heading-info">
                    <span className="season-number-badge">
                      {activeSection?.title || 'Section'}
                    </span>
                    <h2 className="current-video-title">
                      {activeVideo.title}
                    </h2>
                    <div className="video-meta-details-row">
                      {resumedTime > 0 && (
                        <span className="badge badge-outline playback-indicator" title="Your progress is automatically saved to your account">
                          <Clock size={11} className="text-cyan" />
                          <span>Saved at {Math.floor(resumedTime / 60)}:{String(Math.floor(resumedTime % 60)).padStart(2, '0')}</span>
                        </span>
                      )}
                      {activeVideo.videoUrl && (
                        <a 
                          href={activeVideo.videoUrl}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="btn-drive-direct-link"
                        >
                          <ExternalLink size={13} />
                          <span>Open in New Tab</span>
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="video-action-controls">
                    <button 
                      className="btn-complete-next"
                      onClick={handleNextVideo}
                    >
                      <CheckCircle2 size={16} />
                      <span>Next Video</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* IN-WEBSITE DOCUMENT & NOTES VIEWER */
            <div className="document-viewer-container glass-panel animate-fade-in">
              <div className="doc-viewer-header">
                <div className="doc-header-left">
                  <FileText size={18} className="text-purple" />
                  <div>
                    <h3 className="doc-title-text">{selectedNote?.title}</h3>
                    <span className="doc-sub-text">In-Website Document Viewer</span>
                  </div>
                </div>

                <div className="doc-header-actions">
                  <button 
                    className="btn-secondary-sm"
                    onClick={() => setActiveStageMode('video')}
                  >
                    <Video size={14} />
                    <span>Back to Video</span>
                  </button>
                  {selectedNote?.fileUrl && (
                    <a 
                      href={selectedNote.fileUrl}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn-primary-sm"
                    >
                      <ExternalLink size={13} />
                      <span>Open File Tab</span>
                    </a>
                  )}
                </div>
              </div>

              <div className="doc-viewer-screen">
                {noteEmbedUrl ? (
                  <iframe 
                    src={noteEmbedUrl}
                    title={selectedNote?.title || "Document"}
                    className="responsive-doc-iframe"
                    allow="fullscreen"
                  ></iframe>
                ) : (
                  <div className="no-video-placeholder">
                    <FileText size={48} className="text-dim" />
                    <p>No document URL provided for this note.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
