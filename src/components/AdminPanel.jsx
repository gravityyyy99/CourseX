import React, { useState } from 'react';
import { useCourse } from '../context/CourseContext';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  ArrowUp, 
  ArrowDown, 
  Video, 
  FileText, 
  Layers, 
  Play,
  Sparkles,
  User,
  ShieldCheck,
  Save,
  Globe,
  Loader2
} from 'lucide-react';
import { formatDriveEmbedUrl, parseLineForTitleAndUrl, extractFileNameFromUrl } from '../utils/driveHelper';

export function AdminPanel({ onNavigateToCourse }) {
  const { 
    courses, 
    createCourse, 
    updateCourse, 
    deleteCourse,
    addSection,
    renameSection,
    deleteSection,
    reorderSection,
    addParsedVideosToSection,
    editVideo,
    deleteVideo,
    reorderVideo,
    addNotesListToSection,
    deleteNote
  } = useCourse();

  const { adminProfile, updateAdminProfile } = useAuth();

  const [adminTab, setAdminTab] = useState('content'); // 'content' | 'profile'

  // Active course
  const [selectedCourseId, setSelectedCourseId] = useState(courses[0]?.id || '');
  const activeCourse = courses.find(c => c.id === selectedCourseId) || courses[0];

  // Course Creation Modal State
  const [showCreateCourseModal, setShowCreateCourseModal] = useState(false);
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCourseDesc, setNewCourseDesc] = useState('');
  const [newCourseThumb, setNewCourseThumb] = useState('https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80');
  const [newCourseCategory, setNewCourseCategory] = useState('Computer Science');

  // Edit Course Modal State
  const [showEditCourseModal, setShowEditCourseModal] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editThumb, setEditThumb] = useState('');

  // Add Section State
  const [showAddSection, setShowAddSection] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');

  // Rename Section State
  const [renamingSectionId, setRenamingSectionId] = useState(null);
  const [renamedTitle, setRenamedTitle] = useState('');

  // Add Videos Modal State
  const [activeAddVideoSectionId, setActiveAddVideoSectionId] = useState(null);
  const [pastedVideoUrls, setPastedVideoUrls] = useState('');
  const [isFetchingVideos, setIsFetchingVideos] = useState(false);
  const [videoFetchStatus, setVideoFetchStatus] = useState('');

  // Edit Video State
  const [editingVideoId, setEditingVideoId] = useState(null);
  const [editVideoTitle, setEditVideoTitle] = useState('');
  const [editVideoUrl, setEditVideoUrl] = useState('');

  // Add Note Modal State
  const [activeAddNoteSectionId, setActiveAddNoteSectionId] = useState(null);
  const [pastedNoteUrls, setPastedNoteUrls] = useState('');
  const [customNoteTitle, setCustomNoteTitle] = useState('');
  const [isFetchingNotes, setIsFetchingNotes] = useState(false);
  const [noteFetchStatus, setNoteFetchStatus] = useState('');

  // Admin Profile Form State
  const [profileName, setProfileName] = useState(adminProfile.name);
  const [profileTitle, setProfileTitle] = useState(adminProfile.title);
  const [profileEmail, setProfileEmail] = useState(adminProfile.email);
  const [profilePassword, setProfilePassword] = useState(adminProfile.password);
  const [profileAvatar, setProfileAvatar] = useState(adminProfile.avatar);
  const [profileBio, setProfileBio] = useState(adminProfile.bio);
  const [profileAboutPlatform, setProfileAboutPlatform] = useState(adminProfile.aboutPlatform);
  const [profileSavedFeedback, setProfileSavedFeedback] = useState(false);

  // Handle Create Course
  const handleCreateCourseSubmit = (e) => {
    e.preventDefault();
    if (!newCourseTitle.trim()) return;
    const created = createCourse({
      title: newCourseTitle,
      description: newCourseDesc,
      thumbnail: newCourseThumb,
      category: newCourseCategory
    });
    setSelectedCourseId(created.id);
    setNewCourseTitle('');
    setNewCourseDesc('');
    setShowCreateCourseModal(false);
  };

  // Open Edit Course
  const handleOpenEditCourse = () => {
    if (!activeCourse) return;
    setEditTitle(activeCourse.title);
    setEditDesc(activeCourse.description);
    setEditThumb(activeCourse.thumbnail);
    setShowEditCourseModal(true);
  };

  const handleSaveCourseEdit = (e) => {
    e.preventDefault();
    if (!activeCourse) return;
    updateCourse(activeCourse.id, {
      title: editTitle,
      description: editDesc,
      thumbnail: editThumb
    });
    setShowEditCourseModal(false);
  };

  // Handle Add Section
  const handleAddSectionSubmit = (e) => {
    e.preventDefault();
    if (!newSectionTitle.trim() || !activeCourse) return;
    addSection(activeCourse.id, newSectionTitle);
    setNewSectionTitle('');
    setShowAddSection(false);
  };

  // Handle Rename Section
  const handleRenameSubmit = (sectionId) => {
    if (!renamedTitle.trim() || !activeCourse) return;
    renameSection(activeCourse.id, sectionId, renamedTitle);
    setRenamingSectionId(null);
    setRenamedTitle('');
  };

  // Handle Paste & Auto-Fetch Video Titles from Google Drive
  const handleFetchVideosSubmit = async (e) => {
    e.preventDefault();
    if (!activeCourse || !activeAddVideoSectionId || !pastedVideoUrls.trim() || isFetchingVideos) return;

    setIsFetchingVideos(true);
    setVideoFetchStatus('Processing video link(s)...');

    const lines = pastedVideoUrls
      .split(/[\r\n]+/)
      .map(l => l.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      setIsFetchingVideos(false);
      return;
    }

    try {
      const fetchedVideos = await Promise.all(
        lines.map(async (line, i) => {
          const { title: titleFromLine, url } = parseLineForTitleAndUrl(line);
          let finalTitle = titleFromLine;
          let embedUrl = formatDriveEmbedUrl(url);

          // If title not explicitly in the line, try fast metadata fetch
          if (!finalTitle) {
            try {
              const controller = new AbortController();
              const timer = setTimeout(() => controller.abort(), 2000);
              const res = await fetch(`/api/fetch-drive-meta?url=${encodeURIComponent(url)}`, { signal: controller.signal });
              clearTimeout(timer);
              if (res.ok) {
                const data = await res.json();
                if (data.title && !data.title.toLowerCase().includes('page not found') && data.title.toLowerCase() !== 'google drive') {
                  finalTitle = data.title;
                }
                if (data.embedUrl) {
                  embedUrl = data.embedUrl;
                }
              }
            } catch (err) {}
          }

          if (!finalTitle) {
            finalTitle = extractFileNameFromUrl(url, i + 1);
          }

          return {
            id: `vid-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 6)}`,
            title: finalTitle,
            videoUrl: embedUrl,
            completed: false
          };
        })
      );

      addParsedVideosToSection(activeCourse.id, activeAddVideoSectionId, fetchedVideos);
      setVideoFetchStatus(`Successfully added exactly ${fetchedVideos.length} video(s)!`);

      setTimeout(() => {
        setPastedVideoUrls('');
        setVideoFetchStatus('');
        setActiveAddVideoSectionId(null);
        setIsFetchingVideos(false);
      }, 1000);
    } catch (err) {
      console.error(err);
      setIsFetchingVideos(false);
    }
  };

  // Handle Save Edited Video
  const handleSaveEditedVideo = (sectionId, videoId) => {
    if (!activeCourse) return;
    editVideo(activeCourse.id, sectionId, videoId, {
      title: editVideoTitle,
      videoUrl: editVideoUrl
    });
    setEditingVideoId(null);
  };

  // Handle Add Note (fetches real document name from Google Drive or Docs)
  const handleAddNoteSubmit = async (e) => {
    e.preventDefault();
    if (!activeCourse || !activeAddNoteSectionId || !pastedNoteUrls.trim() || isFetchingNotes) return;

    const targetSectionId = activeAddNoteSectionId;
    setIsFetchingNotes(true);
    setNoteFetchStatus('Processing document link(s)...');

    const lines = pastedNoteUrls
      .split(/[\r\n]+/)
      .map(l => l.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      setIsFetchingNotes(false);
      return;
    }

    try {
      const fetchedNotes = await Promise.all(
        lines.map(async (line, i) => {
          const { title: titleFromLine, url } = parseLineForTitleAndUrl(line);
          let title = customNoteTitle.trim() || titleFromLine;
          let embedUrl = formatDriveEmbedUrl(url);

          if (!title) {
            try {
              const controller = new AbortController();
              const timer = setTimeout(() => controller.abort(), 2000);
              const res = await fetch(`/api/fetch-drive-meta?url=${encodeURIComponent(url)}`, { signal: controller.signal });
              clearTimeout(timer);
              if (res.ok) {
                const data = await res.json();
                if (data.title && !data.title.toLowerCase().includes('page not found') && data.title.toLowerCase() !== 'google drive') {
                  title = data.title;
                }
                if (data.embedUrl) embedUrl = data.embedUrl;
              }
            } catch (err) {}
          }

          if (!title) {
            title = extractFileNameFromUrl(url, i + 1);
            if (!/\.[a-zA-Z0-9]{2,4}$/.test(title)) {
              title = `${title}.pdf`;
            }
          }

          return {
            id: `note-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 6)}`,
            title,
            fileUrl: embedUrl
          };
        })
      );

      addNotesListToSection(activeCourse.id, targetSectionId, fetchedNotes);
      setNoteFetchStatus(`Successfully added exactly ${fetchedNotes.length} note(s)!`);

      setTimeout(() => {
        setPastedNoteUrls('');
        setCustomNoteTitle('');
        setNoteFetchStatus('');
        setActiveAddNoteSectionId(null);
        setIsFetchingNotes(false);
      }, 1000);
    } catch (err) {
      console.error(err);
      setIsFetchingNotes(false);
    }
  };

  // Handle direct file upload from computer
  const handleFileUploadNote = (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeAddNoteSectionId || !activeCourse) return;

    const targetSectionId = activeAddNoteSectionId;
    setIsFetchingNotes(true);
    setNoteFetchStatus(`Uploading ${file.name}...`);

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      const cleanFileName = file.name;
      const newNote = {
        id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        title: cleanFileName,
        fileUrl: dataUrl
      };
      addNotesListToSection(activeCourse.id, targetSectionId, [newNote]);
      setIsFetchingNotes(false);
      setNoteFetchStatus(`Uploaded "${cleanFileName}" successfully!`);
      setTimeout(() => {
        setNoteFetchStatus('');
        setActiveAddNoteSectionId(null);
      }, 1200);
    };
    reader.readAsDataURL(file);
  };

  // Handle Admin Profile Save
  const handleSaveAdminProfile = (e) => {
    e.preventDefault();
    updateAdminProfile({
      name: profileName,
      title: profileTitle,
      email: profileEmail,
      password: profilePassword,
      avatar: profileAvatar,
      bio: profileBio,
      aboutPlatform: profileAboutPlatform
    });
    setProfileSavedFeedback(true);
    setTimeout(() => setProfileSavedFeedback(false), 2500);
  };

  return (
    <div className="admin-page-container">
      {/* Top Banner & Tabs */}
      <div className="admin-top-banner glass-panel">
        <div className="admin-header-actions-row">
          <div>
            <h1 className="admin-page-title">Admin Control Center</h1>
            <p className="admin-page-subtitle">
              Manage courses, sections, Google Drive videos, notes, and administrator identity.
            </p>
          </div>

          <div className="admin-view-tab-buttons">
            <button 
              className={`btn-subtab ${adminTab === 'content' ? 'active' : ''}`}
              onClick={() => setAdminTab('content')}
            >
              <Layers size={15} />
              <span>Course & Content CMS</span>
            </button>
            <button 
              className={`btn-subtab ${adminTab === 'profile' ? 'active' : ''}`}
              onClick={() => setAdminTab('profile')}
            >
              <User size={15} />
              <span>Admin Profile & Settings</span>
            </button>
          </div>
        </div>

        {/* Course Selector Bar */}
        {adminTab === 'content' && (
          <div className="course-selector-bar">
            <div className="selector-left">
              <label>Current Course:</label>
              <select 
                value={activeCourse?.id || ''} 
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="select-course-dropdown"
              >
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>

            <div className="selector-right-actions">
              <button 
                className="btn-create-course glow-hover"
                onClick={() => setShowCreateCourseModal(true)}
              >
                <Plus size={15} /> Create Course
              </button>

              {activeCourse && (
                <>
                  <button 
                    className="btn-secondary-sm"
                    onClick={handleOpenEditCourse}
                    title="Edit Course Heading & Thumbnail"
                  >
                    <Edit2 size={13} /> Edit Heading
                  </button>

                  <button 
                    className="btn-primary-sm"
                    onClick={() => onNavigateToCourse(activeCourse.id)}
                    title="View in Player"
                  >
                    <Play size={13} /> View Course
                  </button>

                  <button 
                    className="btn-danger-sm"
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to delete "${activeCourse.title}"?`)) {
                        deleteCourse(activeCourse.id);
                      }
                    }}
                    title="Delete course"
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* TAB 1: Content CMS */}
      {adminTab === 'content' && (
        activeCourse ? (
          <div className="admin-sections-editor animate-fade-in">
            {/* Sections Header */}
            <div className="sections-header-bar glass-panel">
              <div className="sec-header-title">
                <Layers size={18} className="text-cyan" />
                <h3>Sections in "{activeCourse.title}" ({activeCourse.sections?.length || 0})</h3>
              </div>

              <button 
                className="btn-add-section glow-hover"
                onClick={() => setShowAddSection(true)}
              >
                <Plus size={15} />
                <span>Add Section</span>
              </button>
            </div>

            {/* Inline Add Section Form */}
            {showAddSection && (
              <form onSubmit={handleAddSectionSubmit} className="add-section-inline glass-panel animate-fade-in">
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Section Heading / Title</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Section 1: Architecture & Foundations" 
                    value={newSectionTitle}
                    onChange={(e) => setNewSectionTitle(e.target.value)}
                    autoFocus
                    required
                  />
                </div>
                <div className="inline-buttons-row">
                  <button type="submit" className="btn-primary-sm">Save Section</button>
                  <button 
                    type="button" 
                    className="btn-secondary-sm"
                    onClick={() => setShowAddSection(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Sections Stack */}
            <div className="sections-container-list">
              {activeCourse.sections?.map((section, sIdx) => (
                <div key={section.id} className="admin-section-card glass-panel">
                  {/* Section Title Bar */}
                  <div className="admin-section-header">
                    <div className="sec-title-area">
                      {renamingSectionId === section.id ? (
                        <div className="rename-inline-box">
                          <input 
                            type="text" 
                            value={renamedTitle} 
                            onChange={(e) => setRenamedTitle(e.target.value)}
                            className="rename-input"
                            autoFocus
                          />
                          <button 
                            className="btn-icon-check" 
                            onClick={() => handleRenameSubmit(section.id)}
                            title="Save"
                          >
                            <Check size={14} />
                          </button>
                          <button 
                            className="btn-icon-cancel" 
                            onClick={() => setRenamingSectionId(null)}
                            title="Cancel"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="title-display-box">
                          <span className="sec-index-pill">#{sIdx + 1}</span>
                          <h4 className="sec-title-text">{section.title}</h4>
                          <button 
                            className="btn-icon-edit"
                            onClick={() => {
                              setRenamingSectionId(section.id);
                              setRenamedTitle(section.title);
                            }}
                            title="Rename Section"
                          >
                            <Edit2 size={13} />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Section Controls */}
                    <div className="sec-action-controls">
                      <div className="arrow-reorder-group">
                        <button 
                          className="btn-arrow" 
                          disabled={sIdx === 0}
                          onClick={() => reorderSection(activeCourse.id, sIdx, -1)}
                          title="Move Section Up"
                        >
                          <ArrowUp size={13} />
                        </button>
                        <button 
                          className="btn-arrow" 
                          disabled={sIdx === activeCourse.sections.length - 1}
                          onClick={() => reorderSection(activeCourse.id, sIdx, 1)}
                          title="Move Section Down"
                        >
                          <ArrowDown size={13} />
                        </button>
                      </div>

                      <button 
                        className="btn-add-video-link"
                        onClick={() => {
                          setActiveAddVideoSectionId(section.id);
                          setPastedVideoUrls('');
                          setVideoFetchStatus('');
                        }}
                      >
                        <Video size={13} />
                        <span>Paste Video Links</span>
                      </button>

                      <button 
                        className="btn-add-note-link"
                        onClick={() => {
                          setActiveAddNoteSectionId(section.id);
                          setPastedNoteUrls('');
                          setCustomNoteTitle('');
                        }}
                      >
                        <FileText size={13} />
                        <span>Add Notes</span>
                      </button>

                      <button 
                        className="btn-delete-section"
                        onClick={() => {
                          if (window.confirm(`Delete "${section.title}" and its videos/notes?`)) {
                            deleteSection(activeCourse.id, section.id);
                          }
                        }}
                        title="Delete Section"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Subsection 1: Videos */}
                  <div className="section-videos-block">
                    <div className="block-subheading">
                      <span>Videos ({section.videos?.length || 0})</span>
                    </div>

                    {section.videos?.length === 0 ? (
                      <div className="empty-videos-notice">
                        <span>No videos yet. Click "Paste Video Links" to paste Google Drive links and fetch real filenames.</span>
                      </div>
                    ) : (
                      <div className="admin-videos-table">
                        {section.videos.map((vid, vIdx) => (
                          <div key={vid.id} className="admin-video-row">
                            {editingVideoId === vid.id ? (
                              <div className="inline-edit-video-form">
                                <input 
                                  type="text"
                                  value={editVideoTitle}
                                  onChange={(e) => setEditVideoTitle(e.target.value)}
                                  placeholder="Video Title / Filename"
                                  className="edit-video-input"
                                />
                                <input 
                                  type="text"
                                  value={editVideoUrl}
                                  onChange={(e) => setEditVideoUrl(e.target.value)}
                                  placeholder="Video URL / Drive Link"
                                  className="edit-video-input"
                                />
                                <button 
                                  className="btn-icon-check"
                                  onClick={() => handleSaveEditedVideo(section.id, vid.id)}
                                >
                                  <Check size={14} />
                                </button>
                                <button 
                                  className="btn-icon-cancel"
                                  onClick={() => setEditingVideoId(null)}
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ) : (
                              <>
                                <div className="video-row-left">
                                  <div className="arrow-reorder-group vertical">
                                    <button 
                                      className="btn-arrow-sm"
                                      disabled={vIdx === 0}
                                      onClick={() => reorderVideo(activeCourse.id, section.id, vIdx, -1)}
                                      title="Move Up"
                                    >
                                      <ArrowUp size={11} />
                                    </button>
                                    <button 
                                      className="btn-arrow-sm"
                                      disabled={vIdx === section.videos.length - 1}
                                      onClick={() => reorderVideo(activeCourse.id, section.id, vIdx, 1)}
                                      title="Move Down"
                                    >
                                      <ArrowDown size={11} />
                                    </button>
                                  </div>
                                  <span className="vid-idx-badge">#{vIdx + 1}</span>
                                  <Video size={14} className="text-cyan" />
                                  <span className="admin-vid-title" title={vid.title}>
                                    {vid.title}
                                  </span>
                                </div>

                                <div className="video-row-actions">
                                  <button 
                                    className="btn-icon-action"
                                    onClick={() => {
                                      setEditingVideoId(vid.id);
                                      setEditVideoTitle(vid.title);
                                      setEditVideoUrl(vid.videoUrl);
                                    }}
                                    title="Rename / Edit Link"
                                  >
                                    <Edit2 size={13} />
                                  </button>
                                  <button 
                                    className="btn-icon-action text-rose"
                                    onClick={() => deleteVideo(activeCourse.id, section.id, vid.id)}
                                    title="Delete Video"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Subsection 2: Notes in this Section */}
                  <div className="section-notes-block">
                    <span className="block-subheading">Notes & In-App Documents ({section.notes?.length || 0})</span>
                    {section.notes && section.notes.length > 0 ? (
                      <div className="admin-notes-list">
                        {section.notes.map((note) => (
                          <div key={note.id} className="admin-note-pill">
                            <FileText size={13} className="text-purple" />
                            <span title={note.title}>{note.title}</span>
                            <button 
                              className="btn-delete-note"
                              onClick={() => deleteNote(activeCourse.id, section.id, note.id)}
                              title="Delete Note"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="no-items-hint">No notes in this subsection yet. Click "Add Notes" to paste Google Drive document links.</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="empty-catalog-state glass-panel">
            <h3>No courses created yet</h3>
            <p>Click "Create Course" to add your first course heading and sections.</p>
          </div>
        )
      )}

      {/* TAB 2: Admin Profile & Settings */}
      {adminTab === 'profile' && (
        <div className="admin-profile-editor glass-panel animate-fade-in">
          <div className="profile-editor-header">
            <div>
              <h2>Administrator Profile & Platform Settings</h2>
              <p className="text-muted">
                Update your credentials, photo, biographical information, and platform story.
              </p>
            </div>

            {profileSavedFeedback && (
              <span className="badge badge-green">
                <Check size={14} /> Profile Saved Permanently
              </span>
            )}
          </div>

          <form onSubmit={handleSaveAdminProfile} className="profile-settings-form">
            <div className="settings-grid-2">
              <div className="settings-column">
                <h4 className="column-title">
                  <User size={16} className="text-cyan" /> Admin Credentials & Identity
                </h4>

                <div className="form-group">
                  <label>Full Name</label>
                  <input 
                    type="text" 
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Role / Title</label>
                  <input 
                    type="text" 
                    value={profileTitle}
                    onChange={(e) => setProfileTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Admin Login ID (Email)</label>
                  <input 
                    type="email" 
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Admin Password</label>
                  <input 
                    type="text" 
                    value={profilePassword}
                    onChange={(e) => setProfilePassword(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Admin Avatar / Picture URL</label>
                  <input 
                    type="url" 
                    value={profileAvatar}
                    onChange={(e) => setProfileAvatar(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                  />
                  {profileAvatar && (
                    <div className="avatar-preview-box">
                      <img src={profileAvatar} alt="Preview" className="avatar-preview-img" />
                      <span className="text-muted">Picture Preview</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="settings-column">
                <h4 className="column-title">
                  <Globe size={16} className="text-purple" /> About Yourself & Website
                </h4>

                <div className="form-group">
                  <label>About Yourself (Bio for About Us Page)</label>
                  <textarea 
                    rows={4}
                    value={profileBio}
                    onChange={(e) => setProfileBio(e.target.value)}
                    placeholder="Write about yourself, background, teaching mission..."
                  />
                </div>

                <div className="form-group">
                  <label>About CourseX (Platform Story)</label>
                  <textarea 
                    rows={4}
                    value={profileAboutPlatform}
                    onChange={(e) => setProfileAboutPlatform(e.target.value)}
                    placeholder="Describe the platform purpose, Google Drive integration..."
                  />
                </div>

                <div className="security-status-box glass-panel">
                  <div className="sec-box-header">
                    <ShieldCheck size={18} className="text-green" />
                    <strong>Two-Factor Authentication (2FA)</strong>
                  </div>
                  <p className="text-muted" style={{ fontSize: 12 }}>
                    Admin accounts require 2FA OTP verification code upon sign-in.
                  </p>
                </div>
              </div>
            </div>

            <button type="submit" className="btn-save-profile">
              <Save size={16} />
              <span>Save Admin Profile & Credentials</span>
            </button>
          </form>
        </div>
      )}

      {/* MODAL 1: Create Course Modal */}
      {showCreateCourseModal && (
        <div className="modal-backdrop" onClick={() => setShowCreateCourseModal(false)}>
          <div className="modal-card glass-panel" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setShowCreateCourseModal(false)}>
              <X size={18} />
            </button>
            <h2 className="modal-title">Create New Course</h2>
            <p className="modal-subtitle">Add a course heading and thumbnail image.</p>

            <form onSubmit={handleCreateCourseSubmit} className="auth-form">
              <div className="form-group">
                <label>Course Title / Heading</label>
                <input 
                  type="text" 
                  placeholder="e.g. Distributed Systems Architecture"
                  value={newCourseTitle}
                  onChange={(e) => setNewCourseTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Category</label>
                <input 
                  type="text" 
                  placeholder="e.g. Computer Science, AI, Web Dev..."
                  value={newCourseCategory}
                  onChange={(e) => setNewCourseCategory(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Course Description</label>
                <textarea 
                  placeholder="Brief overview..."
                  value={newCourseDesc}
                  onChange={(e) => setNewCourseDesc(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="form-group">
                <label>Thumbnail Image URL</label>
                <input 
                  type="url" 
                  value={newCourseThumb}
                  onChange={(e) => setNewCourseThumb(e.target.value)}
                />
              </div>

              <button type="submit" className="btn-submit-auth">
                Create Course
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Edit Course Modal */}
      {showEditCourseModal && (
        <div className="modal-backdrop" onClick={() => setShowEditCourseModal(false)}>
          <div className="modal-card glass-panel" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setShowEditCourseModal(false)}>
              <X size={18} />
            </button>
            <h2 className="modal-title">Edit Course Details</h2>
            <p className="modal-subtitle">Update course heading and thumbnail.</p>

            <form onSubmit={handleSaveCourseEdit} className="auth-form">
              <div className="form-group">
                <label>Course Heading</label>
                <input 
                  type="text" 
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Thumbnail Image URL</label>
                <input 
                  type="url" 
                  value={editThumb}
                  onChange={(e) => setEditThumb(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea 
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  rows={2}
                />
              </div>

              <button type="submit" className="btn-submit-auth">
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Paste Video Links Modal (Auto-Fetches REAL file titles from Google Drive!) */}
      {activeAddVideoSectionId && (
        <div className="modal-backdrop" onClick={() => !isFetchingVideos && setActiveAddVideoSectionId(null)}>
          <div className="modal-card glass-panel" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => !isFetchingVideos && setActiveAddVideoSectionId(null)}>
              <X size={18} />
            </button>
            <h2 className="modal-title">Paste Video Links</h2>
            <p className="modal-subtitle">
              Paste your Google Drive video link(s) or direct video URLs below (one per line). The system automatically fetches the exact filename from Google Drive.
            </p>

            {videoFetchStatus && (
              <div className="sync-feedback-box success">
                <Sparkles size={16} />
                <span>{videoFetchStatus}</span>
              </div>
            )}

            <form onSubmit={handleFetchVideosSubmit} className="auth-form">
              <div className="form-group">
                <label>Google Drive Video Links (One per line)</label>
                <textarea 
                  placeholder={`https://drive.google.com/file/d/1.../view\nhttps://drive.google.com/file/d/2.../view\n(Or direct video URLs)`}
                  value={pastedVideoUrls}
                  onChange={(e) => setPastedVideoUrls(e.target.value)}
                  rows={6}
                  required
                  disabled={isFetchingVideos}
                  autoFocus
                />
                <small className="form-hint">
                  The actual filename stored in Google Drive will become the video title.
                </small>
              </div>

              <button type="submit" className="btn-submit-auth" disabled={isFetchingVideos}>
                {isFetchingVideos ? (
                  <>
                    <Loader2 size={16} className="spin-anim" />
                    <span>Fetching Real Filenames...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={15} />
                    <span>Fetch & Add Videos</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Add Note Modal */}
      {activeAddNoteSectionId && (
        <div className="modal-backdrop" onClick={() => !isFetchingNotes && setActiveAddNoteSectionId(null)}>
          <div className="modal-card glass-panel" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => !isFetchingNotes && setActiveAddNoteSectionId(null)}>
              <X size={18} />
            </button>
            <h2 className="modal-title">Add Note to Section</h2>
            <p className="modal-subtitle">Paste Google Drive document or PDF links, or upload directly. Exact titles are fetched automatically.</p>

            {noteFetchStatus && (
              <div className="sync-feedback-box success animate-fade-in">
                <Sparkles size={16} />
                <span>{noteFetchStatus}</span>
              </div>
            )}

            <form onSubmit={handleAddNoteSubmit} className="auth-form">
              <div className="form-group">
                <label>Document / Notes Link(s) (One per line)</label>
                <textarea 
                  placeholder={`https://drive.google.com/file/d/1.../view\nhttps://docs.google.com/document/d/1.../edit\n(Exact filename will be fetched automatically)`}
                  value={pastedNoteUrls}
                  onChange={(e) => setPastedNoteUrls(e.target.value)}
                  rows={4}
                  required={!isFetchingNotes}
                  disabled={isFetchingNotes}
                  autoFocus
                />
                <small className="form-hint">
                  The actual filename or document title stored in Google Drive will become the note title.
                </small>
              </div>

              <div className="form-group">
                <label>Optional Custom Note Title (Leave blank to use filename from Drive)</label>
                <input 
                  type="text" 
                  placeholder="e.g. Architecture Guide & Diagrams.pdf"
                  value={customNoteTitle}
                  onChange={(e) => setCustomNoteTitle(e.target.value)}
                  disabled={isFetchingNotes}
                />
              </div>

              <div className="form-group" style={{ marginTop: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>Or Upload Document / PDF from Computer</span>
                </label>
                <input 
                  type="file" 
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={handleFileUploadNote}
                  disabled={isFetchingNotes}
                  style={{ fontSize: 13 }}
                />
              </div>

              <button type="submit" className="btn-submit-auth" disabled={isFetchingNotes}>
                {isFetchingNotes ? (
                  <>
                    <Loader2 size={16} className="spin-anim" />
                    <span>Fetching Real Document Titles...</span>
                  </>
                ) : (
                  <>
                    <FileText size={15} />
                    <span>Attach Note(s) to Section</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
