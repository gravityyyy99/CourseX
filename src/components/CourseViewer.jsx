import React, { useState, useRef, useEffect } from 'react';
import Hls from 'hls.js';
import { useCourse } from '../context/CourseContext';
import { useAuth } from '../context/AuthContext';
import { useEnrollment } from '../context/EnrollmentContext';
import { EnrollModal } from './EnrollModal';
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
  Clock,
  Sparkles,
  Lock,
  Unlock,
  KeyRound,
  ShieldCheck,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import { formatDriveEmbedUrl, isEmbeddableVideo, isTeraBoxUrl, isHlsUrl } from '../utils/driveHelper';

export function CourseViewer({ onBackToCourses, onOpenAuth }) {
  const { 
    activeCourse, 
    activeSection, 
    activeVideo, 
    selectVideo, 
    toggleVideoCompletion,
    savePlaybackPosition,
    getPlaybackPosition
  } = useCourse();

  const { isAdmin } = useAuth();
  const { isCourseUnlocked } = useEnrollment();
  const isUnlocked = isCourseUnlocked(activeCourse?.id);
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);

  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [resumedTime, setResumedTime] = useState(0);
  const [showResumeBanner, setShowResumeBanner] = useState(false);
  const [teraBoxLoading, setTeraBoxLoading] = useState(false);
  const [teraBoxError, setTeraBoxError] = useState(null);
  const [resolvedStreamUrl, setResolvedStreamUrl] = useState('');

  // Handle Playback Resume Position (only when unlocked)
  useEffect(() => {
    if (isUnlocked && activeCourse && activeVideo) {
      const pos = getPlaybackPosition(activeCourse.id, activeVideo.id);
      if (pos > 3) {
        setResumedTime(pos);
        setShowResumeBanner(true);
      } else {
        setShowResumeBanner(false);
      }
    }
  }, [activeVideo?.id, activeCourse?.id, isUnlocked]);

  // Handle Video URL Resolution (only when unlocked)
  useEffect(() => {
    if (!isUnlocked || !activeVideo) {
      setResolvedStreamUrl('');
      setTeraBoxError(null);
      setTeraBoxLoading(false);
      return;
    }

    const rawUrl = activeVideo.videoUrl || '';
    const isTera = isTeraBoxUrl(rawUrl);
    const isHls = isHlsUrl(rawUrl);

    if (isHls) {
      setResolvedStreamUrl(rawUrl);
      setTeraBoxError(null);
      setTeraBoxLoading(false);
      return;
    }

    if (isTera) {
      let isMounted = true;
      setTeraBoxLoading(true);
      setTeraBoxError(null);

      fetch(`/api/resolve-terabox?url=${encodeURIComponent(rawUrl)}`)
        .then(res => res.json())
        .then(data => {
          if (!isMounted) return;
          if (data && data.ok && data.streamUrl) {
            setResolvedStreamUrl(data.streamUrl);
            setTeraBoxError(null);
          } else {
            setTeraBoxError(data?.error || 'Could not stream TeraBox video directly');
          }
        })
        .catch(() => {
          if (!isMounted) return;
          setTeraBoxError('Failed to connect to TeraBox streaming server');
        })
        .finally(() => {
          if (isMounted) setTeraBoxLoading(false);
        });

      return () => {
        isMounted = false;
      };
    }

    // Direct / Embed URL
    setResolvedStreamUrl(formatDriveEmbedUrl(rawUrl));
    setTeraBoxError(null);
    setTeraBoxLoading(false);
  }, [activeVideo?.id, activeVideo?.videoUrl]);

  // Setup HLS / Video player whenever resolvedStreamUrl or activeVideo changes
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl || !resolvedStreamUrl) return;

    // Destroy existing HLS
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const isHls = isHlsUrl(resolvedStreamUrl);

    if (isHls) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90
        });
        hlsRef.current = hls;
        hls.loadSource(resolvedStreamUrl);
        hls.attachMedia(videoEl);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (activeCourse && activeVideo) {
            const pos = getPlaybackPosition(activeCourse.id, activeVideo.id);
            if (pos > 0) videoEl.currentTime = pos;
          }
          videoEl.play().catch(() => {});
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls.recoverMediaError();
                break;
              default:
                hls.destroy();
                break;
            }
          }
        });
      } else if (videoEl.canPlayType('application/vnd.apple.mpegurl')) {
        // Native Safari HLS
        videoEl.src = resolvedStreamUrl;
        videoEl.addEventListener('loadedmetadata', () => {
          if (activeCourse && activeVideo) {
            const pos = getPlaybackPosition(activeCourse.id, activeVideo.id);
            if (pos > 0) videoEl.currentTime = pos;
          }
          videoEl.play().catch(() => {});
        }, { once: true });
      }
    } else {
      videoEl.src = resolvedStreamUrl;
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [resolvedStreamUrl, activeVideo?.id, activeCourse?.id]);

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
          {!isUnlocked && (
            <button 
              className="btn-enroll-header-pill glow-hover"
              onClick={() => setIsEnrollModalOpen(true)}
            >
              <KeyRound size={14} />
              <span>Enroll Now</span>
            </button>
          )}

          {selectedNote && isUnlocked && (
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

                    {/* Section Contents - Direct clean list showing topics */}
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
                                  {isUnlocked ? (
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
                                  ) : (
                                    <div className="lecture-lock-pill" title="Locked • Enrollment required">
                                      <Lock size={12} className="text-cyan" />
                                    </div>
                                  )}

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
                                  onClick={() => {
                                    if (isUnlocked) {
                                      handleSelectNote(n);
                                    } else {
                                      setIsEnrollModalOpen(true);
                                    }
                                  }}
                                  title={isUnlocked ? "View document" : "Locked • Enroll to access document"}
                                >
                                  {isUnlocked ? (
                                    <FileText size={13} className="text-purple" />
                                  ) : (
                                    <Lock size={13} className="text-dim" />
                                  )}
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
              <div className={`video-player-screen ${!isUnlocked ? 'shimmer-stage' : ''}`}>
                {!isUnlocked ? (
                  /* SHIMMER PREVIEW UI - NO VIDEO PLAYBACK, ONLY TOPICS AND SHIMMER PLAYER FRAME */
                  <div className="shimmer-preview-wrapper animate-fade-in">
                    <div className="shimmer-sweep-ray"></div>
                    <div className="shimmer-mesh-pattern"></div>

                    {/* Shimmer Mock Wireframe Elements */}
                    <div className="shimmer-wireframe-bars">
                      <div className="wireframe-bar bar-1"></div>
                      <div className="wireframe-bar bar-2"></div>
                      <div className="wireframe-bar bar-3"></div>
                    </div>

                    {/* Frosted Glass Center Card */}
                    <div className="shimmer-center-card glass-panel animate-fade-in">
                      <div className="shimmer-lock-halo">
                        <div className="pulse-glow-ring"></div>
                        <Lock size={32} className="text-cyan" />
                      </div>

                      <span className="shimmer-mode-tag">
                        <Sparkles size={13} className="text-cyan" />
                        <span>Curriculum Preview Mode</span>
                      </span>

                      <h3 className="shimmer-course-name">{activeCourse.title}</h3>
                      <h4 className="shimmer-video-topic">
                        {activeVideo?.title || 'Course Lecture Topic'}
                      </h4>

                      <p className="shimmer-text">
                        Video playback is locked. Unlock full HD streaming and synchronized notes using your Unique ID.
                      </p>

                      <div className="shimmer-action-row">
                        <button 
                          className="btn-enroll-action glow-pulse"
                          onClick={() => setIsEnrollModalOpen(true)}
                        >
                          <KeyRound size={16} />
                          <span>Enroll & Unlock Course</span>
                          <ArrowRight size={16} />
                        </button>
                      </div>

                      <button 
                        type="button"
                        className="btn-enter-code-sublink"
                        onClick={() => setIsEnrollModalOpen(true)}
                      >
                        Already have an Access Code? Enter Unique ID
                      </button>
                    </div>

                    {/* Shimmer Mock Timeline Bar at bottom of screen */}
                    <div className="shimmer-timeline-bar">
                      <div className="shimmer-timeline-fill"></div>
                    </div>
                  </div>
                ) : activeVideo ? (
                  isEmbeddableVideo(activeVideo.videoUrl) ? (
                    <iframe 
                      src={formatDriveEmbedUrl(activeVideo.videoUrl)}
                      title={activeVideo.title}
                      className="responsive-video-iframe"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                      allowFullScreen
                    ></iframe>
                  ) : teraBoxLoading ? (
                    <div className="no-video-placeholder" style={{ padding: 40, textAlign: 'center' }}>
                      <div className="loading-spinner mb-3" style={{ width: 44, height: 44, margin: '0 auto 16px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#06b6d4', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
                      <h4 style={{ color: '#06b6d4', marginBottom: 6, fontWeight: 600 }}>Streaming from TeraBox Cloud...</h4>
                      <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Extracting secure media pipeline & resolving video chunks</p>
                    </div>
                  ) : teraBoxError ? (
                    <div className="no-video-placeholder" style={{ padding: 32, textAlign: 'center' }}>
                      <p style={{ color: '#f87171', fontWeight: 600, marginBottom: 12 }}>{teraBoxError}</p>
                      <a 
                        href={activeVideo.videoUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn-primary-sm" 
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                      >
                        <ExternalLink size={14} /> Open on TeraBox
                      </a>
                    </div>
                  ) : (
                    <video 
                      ref={videoRef}
                      key={activeVideo.id}
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

              {/* Automatic Resume Notification Banner (only when unlocked) */}
              {isUnlocked && showResumeBanner && resumedTime > 3 && (
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
                      {!isUnlocked ? (
                        <>
                          <span className="badge badge-cyan" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <Lock size={11} />
                            <span>Preview Mode</span>
                          </span>
                          <span className="badge badge-purple" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <KeyRound size={11} />
                            <span>Course Unique ID Required</span>
                          </span>
                        </>
                      ) : (
                        <>
                          {isTeraBoxUrl(activeVideo.videoUrl) && (
                            <span className="badge badge-outline" style={{ borderColor: 'rgba(6, 182, 212, 0.4)', background: 'rgba(6, 182, 212, 0.1)', color: '#06b6d4', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <Sparkles size={11} />
                              <span>TeraBox Fast Stream</span>
                            </span>
                          )}
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
                              <span>Original Link</span>
                            </a>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  <div className="video-action-controls">
                    {!isUnlocked ? (
                      <button 
                        className="btn-enroll-action-sm glow-pulse"
                        onClick={() => setIsEnrollModalOpen(true)}
                      >
                        <KeyRound size={15} />
                        <span>Enroll to Watch</span>
                      </button>
                    ) : (
                      <button 
                        className="btn-complete-next"
                        onClick={handleNextVideo}
                      >
                        <CheckCircle2 size={16} />
                        <span>Next Video</span>
                        <ChevronRight size={14} />
                      </button>
                    )}
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
                  {isUnlocked && selectedNote?.fileUrl && (
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
                {!isUnlocked ? (
                  <div className="no-video-placeholder" style={{ padding: 48, textAlign: 'center' }}>
                    <Lock size={44} className="text-cyan" style={{ margin: '0 auto 12px' }} />
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 8 }}>Document Locked</h3>
                    <p style={{ color: '#94a3b8', fontSize: '0.9rem', maxWidth: 420, margin: '0 auto 20px' }}>
                      Enroll in {activeCourse.title} with your Unique ID to unlock and read this document.
                    </p>
                    <button 
                      className="btn-submit-auth"
                      style={{ display: 'inline-flex', width: 'auto', padding: '10px 24px', margin: '0 auto' }}
                      onClick={() => setIsEnrollModalOpen(true)}
                    >
                      <KeyRound size={15} />
                      <span>Unlock Course</span>
                    </button>
                  </div>
                ) : noteEmbedUrl ? (
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

      {/* Enroll & Unlock Modal */}
      <EnrollModal 
        isOpen={isEnrollModalOpen}
        onClose={() => setIsEnrollModalOpen(false)}
        course={activeCourse}
        onOpenAuth={onOpenAuth}
      />
    </div>
  );
}
