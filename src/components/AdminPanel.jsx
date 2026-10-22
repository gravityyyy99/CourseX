import React, { useState } from 'react';
import { useCourse } from '../context/CourseContext';
import { useAuth } from '../context/AuthContext';
import { useEnrollment } from '../context/EnrollmentContext';
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
  Loader2,
  Users,
  KeyRound,
  Phone,
  Mail,
  Copy,
  Search,
  RefreshCw,
  Filter,
  Clock,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  UserX,
  Eye,
  EyeOff
} from 'lucide-react';
import { formatDriveEmbedUrl, parseLineForTitleAndUrl, extractFileNameFromUrl, isTeraBoxUrl } from '../utils/driveHelper';

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

  const { adminProfile, updateAdminProfile, getUserPassword, allUsers } = useAuth();
  const { 
    customers, 
    approveAccessRequest, 
    rejectAccessRequest, 
    addCustomer, 
    updateCustomer, 
    deleteCustomer, 
    generateUniqueCode 
  } = useEnrollment();

  const [adminTab, setAdminTab] = useState('content'); // 'content' | 'customers' | 'profile'

  // Customer Management States
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerCourseFilter, setCustomerCourseFilter] = useState('all');
  const [copiedCustomerId, setCopiedCustomerId] = useState(null);
  const [revealedPasswords, setRevealedPasswords] = useState({});
  const [showAllPasswords, setShowAllPasswords] = useState(false);

  const getPasswordForStudent = (student) => {
    if (student.password) return student.password;
    if (getUserPassword) {
      const pwd = getUserPassword(student.email) || getUserPassword(student.phone);
      if (pwd) return pwd;
    }
    const fromUsers = (allUsers || []).find(u => 
      (u.email && student.email && u.email.toLowerCase() === student.email.toLowerCase()) ||
      (u.phone && student.phone && u.phone.replace(/\D/g, '') === student.phone.replace(/\D/g, ''))
    );
    return fromUsers?.password || 'password123';
  };

  // Add Customer Modal State
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustCourseId, setNewCustCourseId] = useState(courses[0]?.id || '');
  const [newCustUniqueId, setNewCustUniqueId] = useState(() => generateUniqueCode(6));

  // Edit Customer Modal State
  const [showEditCustomerModal, setShowEditCustomerModal] = useState(false);
  const [editingCustomerId, setEditingCustomerId] = useState(null);
  const [editCustName, setEditCustName] = useState('');
  const [editCustEmail, setEditCustEmail] = useState('');
  const [editCustPhone, setEditCustPhone] = useState('');
  const [editCustCourseId, setEditCustCourseId] = useState('');
  const [editCustUniqueId, setEditCustUniqueId] = useState('');

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
          let embedUrl = isTeraBoxUrl(url) ? url : formatDriveEmbedUrl(url);

          // If title not explicitly in the line, try fast metadata fetch
          if (!finalTitle) {
            try {
              const isTera = isTeraBoxUrl(url);
              const controller = new AbortController();
              const timer = setTimeout(() => controller.abort(), isTera ? 15000 : 3000);
              const res = await fetch(`/api/fetch-drive-meta?url=${encodeURIComponent(url)}`, { signal: controller.signal });
              clearTimeout(timer);
              if (res.ok) {
                const data = await res.json();
                if (data.title && !data.title.toLowerCase().includes('page not found') && data.title.toLowerCase() !== 'google drive') {
                  finalTitle = data.title;
                }
                if (data.embedUrl && !isTera) {
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

  // ================= CUSTOMERS & UNIQUE IDs HANDLERS ================= //
  const pendingRequests = customers.filter(c => c.status === 'pending');

  const filteredCustomers = customers.filter(c => {
    const matchesCourse = customerCourseFilter === 'all' || c.courseId === customerCourseFilter;
    const query = customerSearch.trim().toLowerCase();
    if (!query) return matchesCourse;
    const matchesSearch = 
      (c.name && c.name.toLowerCase().includes(query)) ||
      (c.email && c.email.toLowerCase().includes(query)) ||
      (c.phone && c.phone.includes(query)) ||
      (c.uniqueId && c.uniqueId.toLowerCase().includes(query)) ||
      (c.courseTitle && c.courseTitle.toLowerCase().includes(query));
    return matchesCourse && matchesSearch;
  });

  const activeCustomers = filteredCustomers.filter(c => c.status !== 'pending');

  const handleOpenEditCustomer = (cust) => {
    setEditingCustomerId(cust.id);
    setEditCustName(cust.name || '');
    setEditCustEmail(cust.email || '');
    setEditCustPhone(cust.phone || '');
    setEditCustCourseId(cust.courseId || courses[0]?.id || '');
    setEditCustUniqueId(cust.uniqueId || '');
    setShowEditCustomerModal(true);
  };

  const handleSaveEditCustomer = (e) => {
    e.preventDefault();
    if (!editingCustomerId) return;
    const targetCourse = courses.find(c => c.id === editCustCourseId);
    updateCustomer(editingCustomerId, {
      name: editCustName.trim(),
      email: editCustEmail.trim().toLowerCase(),
      phone: editCustPhone.trim(),
      courseId: editCustCourseId,
      courseTitle: targetCourse?.title || 'Course',
      uniqueId: editCustUniqueId.trim().toUpperCase()
    });
    setShowEditCustomerModal(false);
    setEditingCustomerId(null);
  };

  const handleAddCustomerSubmit = (e) => {
    e.preventDefault();
    if (!newCustEmail.trim() && !newCustPhone.trim()) {
      alert('Please provide at least a Gmail address or Phone number.');
      return;
    }
    const targetCourse = courses.find(c => c.id === newCustCourseId) || courses[0];
    addCustomer({
      name: newCustName.trim() || 'Student',
      email: newCustEmail.trim().toLowerCase(),
      phone: newCustPhone.trim(),
      courseId: targetCourse?.id,
      courseTitle: targetCourse?.title,
      uniqueId: newCustUniqueId.trim().toUpperCase()
    });
    setNewCustName('');
    setNewCustEmail('');
    setNewCustPhone('');
    setNewCustUniqueId(generateUniqueCode(6));
    setShowAddCustomerModal(false);
  };

  const handleCopyCode = (id, code) => {
    navigator.clipboard.writeText(code);
    setCopiedCustomerId(id);
    setTimeout(() => setCopiedCustomerId(null), 2000);
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
              className={`btn-subtab ${adminTab === 'customers' ? 'active' : ''}`}
              onClick={() => setAdminTab('customers')}
            >
              <Users size={15} />
              <span>Customers & Unique IDs</span>
              {pendingRequests.length > 0 && (
                <span className="badge-pending-indicator" style={{
                  marginLeft: 6,
                  padding: '2px 7px',
                  borderRadius: 12,
                  background: '#f59e0b',
                  color: '#000',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  boxShadow: '0 0 10px rgba(245, 158, 11, 0.6)'
                }}>
                  {pendingRequests.length}
                </span>
              )}
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

      {/* TAB 2: Customers & Unique Access IDs */}
      {adminTab === 'customers' && (
        <div className="admin-customers-manager animate-fade-in">
          {/* Top Quick Stats */}
          <div className="customers-stats-row">
            <div className="stat-card glass-panel">
              <div className="stat-card-icon bg-cyan-glow">
                <Users size={22} className="text-cyan" />
              </div>
              <div className="stat-card-data">
                <span className="stat-card-label">Total Enrolled</span>
                <span className="stat-card-value">{customers.filter(c => c.status !== 'pending').length}</span>
              </div>
            </div>

            <div className={`stat-card glass-panel ${pendingRequests.length > 0 ? 'stat-card-alert-glow' : ''}`}>
              <div className="stat-card-icon bg-amber-glow" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b' }}>
                <Clock size={22} />
              </div>
              <div className="stat-card-data">
                <span className="stat-card-label">Pending Requests</span>
                <span className="stat-card-value" style={{ color: pendingRequests.length > 0 ? '#f59e0b' : '#fff' }}>
                  {pendingRequests.length}
                </span>
              </div>
            </div>

            <div className="stat-card glass-panel">
              <div className="stat-card-icon bg-purple-glow">
                <KeyRound size={22} className="text-purple" />
              </div>
              <div className="stat-card-data">
                <span className="stat-card-label">Active Unique IDs</span>
                <span className="stat-card-value">{customers.filter(c => c.status !== 'pending' && c.uniqueId).length}</span>
              </div>
            </div>

            <div className="stat-card glass-panel">
              <div className="stat-card-icon bg-green-glow">
                <Layers size={22} className="text-green" />
              </div>
              <div className="stat-card-data">
                <span className="stat-card-label">Covered Courses</span>
                <span className="stat-card-value">
                  {new Set(customers.filter(c => c.status !== 'pending').map(c => c.courseId)).size}
                </span>
              </div>
            </div>
          </div>

          {/* PENDING ACCESS REQUESTS SECTION */}
          {pendingRequests.length > 0 && (
            <div className="pending-requests-card glass-panel animate-fade-in" style={{
              marginBottom: 24,
              border: '1px solid rgba(245, 158, 11, 0.4)',
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(15, 23, 42, 0.85) 100%)',
              borderRadius: 16,
              padding: '20px 22px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: 'rgba(245, 158, 11, 0.22)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#f59e0b',
                    boxShadow: '0 0 16px rgba(245, 158, 11, 0.3)'
                  }}>
                    <Clock size={22} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#fef08a', display: 'flex', alignItems: 'center', gap: 10 }}>
                      Pending Course Access Requests
                      <span style={{ 
                        padding: '2px 9px', 
                        fontSize: '0.74rem', 
                        borderRadius: 20, 
                        background: '#f59e0b', 
                        color: '#000', 
                        fontWeight: 800,
                        letterSpacing: '0.5px' 
                      }}>
                        {pendingRequests.length} ACTION REQUIRED
                      </span>
                    </h3>
                    <p style={{ margin: '3px 0 0', fontSize: '0.84rem', color: '#cbd5e1' }}>
                      Click <strong>Approve (✓)</strong> to assign a course-specific Unique ID and send a persistent notification to the student. Click <strong>Decline (✗)</strong> to reject.
                    </p>
                  </div>
                </div>
              </div>

              <div className="table-responsive">
                <table className="customers-table" style={{ margin: 0 }}>
                  <thead>
                    <tr>
                      <th>Student / Gmail</th>
                      <th>Phone Number</th>
                      <th>Password</th>
                      <th>Requested Course</th>
                      <th>Requested At</th>
                      <th style={{ textAlign: 'right' }}>Decision Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingRequests.map((req) => (
                      <tr key={req.id} className="customer-row pending-row" style={{ background: 'rgba(245, 158, 11, 0.05)' }}>
                        <td>
                          <div className="customer-identity-cell">
                            <div className="customer-avatar-circle" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                              {(req.name || 'S').charAt(0).toUpperCase()}
                            </div>
                            <div className="customer-text-col">
                              <span className="customer-name-text" style={{ fontWeight: 600 }}>{req.name || 'Student'}</span>
                              <span className="customer-gmail-text">
                                <Mail size={12} className="text-amber" />
                                <span>{req.email || 'No email provided'}</span>
                              </span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <div className="customer-phone-cell">
                            <Phone size={13} className="text-dim" />
                            <span>{req.phone || '—'}</span>
                          </div>
                        </td>

                        <td>
                          <div className="customer-pwd-cell" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <code className="pwd-pill" style={{
                              fontFamily: 'monospace',
                              fontSize: '0.85rem',
                              background: 'rgba(255, 255, 255, 0.06)',
                              padding: '3px 8px',
                              borderRadius: 6,
                              color: (showAllPasswords || revealedPasswords[req.id]) ? '#38bdf8' : '#94a3b8',
                              letterSpacing: (showAllPasswords || revealedPasswords[req.id]) ? '0.5px' : '2px'
                            }}>
                              {(showAllPasswords || revealedPasswords[req.id]) ? getPasswordForStudent(req) : '••••••••'}
                            </code>
                            <button 
                              type="button"
                              onClick={() => setRevealedPasswords(prev => ({ ...prev, [req.id]: !prev[req.id] }))}
                              title={revealedPasswords[req.id] ? "Hide Password" : "View Password"}
                              style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 2 }}
                            >
                              {(showAllPasswords || revealedPasswords[req.id]) ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                          </div>
                        </td>

                        <td>
                          <div className="customer-course-cell">
                            <span className="badge badge-outline customer-course-badge" style={{ borderColor: 'rgba(245, 158, 11, 0.4)', color: '#fde68a' }}>
                              <Layers size={11} />
                              <span>{req.courseTitle || 'Course'}</span>
                            </span>
                          </div>
                        </td>

                        <td>
                          <span className="customer-date-text">
                            {req.createdAt ? new Date(req.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                          </span>
                        </td>

                        <td style={{ textAlign: 'right' }}>
                          <div className="customer-actions-cell" style={{ justifyContent: 'flex-end', gap: 10 }}>
                            <button
                              className="btn-action-approve glow-hover"
                              onClick={() => {
                                const res = approveAccessRequest(req.id);
                                alert(`✓ Approved! Unique ID ${res.uniqueId} assigned and delivered to ${req.name || req.email}'s notifications.`);
                              }}
                              title="Approve & Generate Unique ID for Student"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '7px 14px',
                                borderRadius: 8,
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                color: '#fff',
                                border: 'none',
                                fontWeight: 700,
                                fontSize: '0.82rem',
                                cursor: 'pointer',
                                boxShadow: '0 2px 10px rgba(16, 185, 129, 0.35)'
                              }}
                            >
                              <Check size={15} />
                              <span>Approve (✓)</span>
                            </button>

                            <button
                              className="btn-action-reject glow-hover"
                              onClick={() => {
                                if (window.confirm(`Decline access request from ${req.name || req.email}?`)) {
                                  rejectAccessRequest(req.id);
                                }
                              }}
                              title="Decline / Reject Request"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '7px 12px',
                                borderRadius: 8,
                                background: 'rgba(244, 63, 94, 0.15)',
                                color: '#fda4af',
                                border: '1px solid rgba(244, 63, 94, 0.35)',
                                fontWeight: 600,
                                fontSize: '0.82rem',
                                cursor: 'pointer'
                              }}
                            >
                              <X size={15} />
                              <span>Decline (✗)</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Search, Filter & Action Bar */}
          <div className="customers-toolbar glass-panel">
            <div className="toolbar-search-box">
              <Search size={16} className="search-icon" />
              <input 
                type="text" 
                placeholder="Search by Name, Gmail, Phone, or Unique ID..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
              />
            </div>

            <div className="toolbar-filter-group">
              <div className="filter-select-wrapper">
                <Filter size={14} className="filter-icon" />
                <select 
                  value={customerCourseFilter}
                  onChange={(e) => setCustomerCourseFilter(e.target.value)}
                  className="filter-dropdown"
                >
                  <option value="all">All Courses</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>

                <button 
                  type="button"
                  className="btn-secondary-sm"
                  onClick={() => setShowAllPasswords(!showAllPasswords)}
                  title="Toggle visibility of all student passwords"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 12px' }}
                >
                  {showAllPasswords ? <EyeOff size={14} className="text-cyan" /> : <Eye size={14} />}
                  <span>{showAllPasswords ? 'Mask Passwords' : 'Show Passwords'}</span>
                </button>

                <button 
                  className="btn-create-course glow-hover"
                  onClick={() => {
                    setNewCustUniqueId(generateUniqueCode(6));
                    setShowAddCustomerModal(true);
                  }}
                >
                  <Plus size={15} />
                  <span>Issue New Access ID</span>
                </button>
              </div>
            </div>

            {/* Customer Records Table */}
            <div className="customers-table-container glass-panel">
              {activeCustomers.length > 0 ? (
                <div className="table-responsive">
                  <table className="customers-table">
                    <thead>
                      <tr>
                        <th>Student / Gmail</th>
                        <th>Phone Number</th>
                        <th>Password</th>
                        <th>Enrolled Course</th>
                        <th>Unique ID (Access Code)</th>
                        <th>Created / Approved</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeCustomers.map((cust) => {
                        const isCopied = copiedCustomerId === cust.id;
                        return (
                          <tr key={cust.id} className="customer-row">
                            <td>
                              <div className="customer-identity-cell">
                                <div className="customer-avatar-circle">
                                  {(cust.name || 'S').charAt(0).toUpperCase()}
                                </div>
                                <div className="customer-text-col">
                                  <span className="customer-name-text">{cust.name || 'Student'}</span>
                                  <span className="customer-gmail-text">
                                    <Mail size={12} className="text-cyan" />
                                    <span>{cust.email || 'No email provided'}</span>
                                  </span>
                                </div>
                              </div>
                            </td>

                            <td>
                              <div className="customer-phone-cell">
                                <Phone size={13} className="text-dim" />
                                <span>{cust.phone || '—'}</span>
                              </div>
                            </td>

                            <td>
                              <div className="customer-pwd-cell" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <code className="pwd-pill" style={{
                                  fontFamily: 'monospace',
                                  fontSize: '0.85rem',
                                  background: 'rgba(255, 255, 255, 0.06)',
                                  padding: '3px 8px',
                                  borderRadius: 6,
                                  color: (showAllPasswords || revealedPasswords[cust.id]) ? '#38bdf8' : '#94a3b8',
                                  letterSpacing: (showAllPasswords || revealedPasswords[cust.id]) ? '0.5px' : '2px'
                                }}>
                                  {(showAllPasswords || revealedPasswords[cust.id]) ? getPasswordForStudent(cust) : '••••••••'}
                                </code>
                                <button 
                                  type="button"
                                  onClick={() => setRevealedPasswords(prev => ({ ...prev, [cust.id]: !prev[cust.id] }))}
                                  title={revealedPasswords[cust.id] ? "Hide Password" : "View Password"}
                                  style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 2 }}
                                >
                                  {(showAllPasswords || revealedPasswords[cust.id]) ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                              </div>
                            </td>

                            <td>
                              <div className="customer-course-cell">
                                <span className="badge badge-outline customer-course-badge" title={cust.courseTitle}>
                                  <Layers size={11} className="text-cyan" />
                                  <span>{cust.courseTitle || 'Course'}</span>
                                </span>
                            </div>
                          </td>

                          <td>
                            <div className="customer-code-cell">
                              <code className="unique-id-pill">{cust.uniqueId}</code>
                              <button 
                                className="btn-copy-icon-sm"
                                onClick={() => handleCopyCode(cust.id, cust.uniqueId)}
                                title="Copy Unique ID"
                              >
                                {isCopied ? <Check size={13} className="text-green" /> : <Copy size={13} />}
                              </button>
                            </div>
                          </td>

                          <td>
                            <span className="customer-date-text">
                              {cust.createdAt ? new Date(cust.createdAt).toLocaleDateString() : 'Active'}
                            </span>
                          </td>

                          <td style={{ textAlign: 'right' }}>
                            <div className="customer-actions-cell">
                              <button 
                                className="btn-action-icon edit glow-hover"
                                onClick={() => handleOpenEditCustomer(cust)}
                                title="Edit Gmail, Phone & Unique ID"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button 
                                className="btn-action-icon delete glow-hover"
                                onClick={() => {
                                  if (window.confirm(`Revoke access for ${cust.name} (${cust.email})?`)) {
                                    deleteCustomer(cust.id);
                                  }
                                }}
                                title="Revoke Customer Access"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-catalog-state" style={{ padding: '48px 20px' }}>
                <Users size={40} className="text-dim" />
                <h3>No Customers Found</h3>
                <p>
                  {customerSearch ? 'No customers match your search query.' : 'Click "Issue New Access ID" to register a customer.'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Admin Profile & Settings */}
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

      {/* MODAL 5: Add Customer / Issue Access ID Modal */}
      {showAddCustomerModal && (
        <div className="modal-backdrop" onClick={() => setShowAddCustomerModal(false)}>
          <div className="modal-card glass-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <button className="modal-close-btn" onClick={() => setShowAddCustomerModal(false)}>
              <X size={18} />
            </button>
            <div className="modal-header">
              <h2 className="modal-title">Issue New Unique Access ID</h2>
              <p className="modal-subtitle">
                Assign a course-specific access code to a customer using their Gmail and phone number.
              </p>
            </div>

            <form onSubmit={handleAddCustomerSubmit} className="auth-form" style={{ marginTop: 16 }}>
              <div className="form-group">
                <label>Student Full Name</label>
                <div className="input-with-icon">
                  <User size={16} className="input-icon" />
                  <input 
                    type="text" 
                    placeholder="e.g. Rahul Sharma"
                    value={newCustName}
                    onChange={(e) => setNewCustName(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Customer Gmail / Email</label>
                <div className="input-with-icon">
                  <Mail size={16} className="input-icon text-cyan" />
                  <input 
                    type="email" 
                    placeholder="customer@gmail.com"
                    value={newCustEmail}
                    onChange={(e) => setNewCustEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <div className="input-with-icon">
                  <Phone size={16} className="input-icon" />
                  <input 
                    type="tel" 
                    placeholder="+91 98765 43210"
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Course to Assign</label>
                <div className="input-with-icon">
                  <Layers size={16} className="input-icon" />
                  <select 
                    value={newCustCourseId}
                    onChange={(e) => setNewCustCourseId(e.target.value)}
                    className="select-course-dropdown"
                    style={{ width: '100%', paddingLeft: 38 }}
                  >
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>
                <small className="form-hint">
                  This unique ID will strictly unlock only this course.
                </small>
              </div>

              <div className="form-group">
                <label>5–6 Character Unique ID</label>
                <div className="code-generate-input-row">
                  <div className="input-with-icon" style={{ flex: 1 }}>
                    <KeyRound size={16} className="input-icon text-cyan" />
                    <input 
                      type="text" 
                      placeholder="e.g. NAI892"
                      value={newCustUniqueId}
                      onChange={(e) => setNewCustUniqueId(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                      className="unique-code-input"
                      required
                    />
                  </div>
                  <button 
                    type="button" 
                    className="btn-secondary-sm"
                    onClick={() => setNewCustUniqueId(generateUniqueCode(6))}
                    title="Generate New Random Unique ID"
                  >
                    <RefreshCw size={14} />
                    <span>Regenerate</span>
                  </button>
                </div>
              </div>

              <div className="form-actions-row" style={{ marginTop: 20 }}>
                <button 
                  type="button" 
                  className="btn-secondary-sm"
                  onClick={() => setShowAddCustomerModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-submit-auth" style={{ flex: 1 }}>
                  <Plus size={16} />
                  <span>Issue Access ID</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: Edit Customer Modal (Admin can edit Gmail, Phone, and Unique ID!) */}
      {showEditCustomerModal && (
        <div className="modal-backdrop" onClick={() => setShowEditCustomerModal(false)}>
          <div className="modal-card glass-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <button className="modal-close-btn" onClick={() => setShowEditCustomerModal(false)}>
              <X size={18} />
            </button>
            <div className="modal-header">
              <h2 className="modal-title">Edit Customer & Access ID</h2>
              <p className="modal-subtitle">
                Update customer Gmail, phone number, enrolled course, or Unique ID code.
              </p>
            </div>

            <form onSubmit={handleSaveEditCustomer} className="auth-form" style={{ marginTop: 16 }}>
              <div className="form-group">
                <label>Student Full Name</label>
                <div className="input-with-icon">
                  <User size={16} className="input-icon" />
                  <input 
                    type="text" 
                    value={editCustName}
                    onChange={(e) => setEditCustName(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Customer Gmail / Email</label>
                <div className="input-with-icon">
                  <Mail size={16} className="input-icon text-cyan" />
                  <input 
                    type="email" 
                    value={editCustEmail}
                    onChange={(e) => setEditCustEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <div className="input-with-icon">
                  <Phone size={16} className="input-icon" />
                  <input 
                    type="tel" 
                    value={editCustPhone}
                    onChange={(e) => setEditCustPhone(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Assigned Course</label>
                <div className="input-with-icon">
                  <Layers size={16} className="input-icon" />
                  <select 
                    value={editCustCourseId}
                    onChange={(e) => setEditCustCourseId(e.target.value)}
                    className="select-course-dropdown"
                    style={{ width: '100%', paddingLeft: 38 }}
                  >
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>5–6 Character Unique ID</label>
                <div className="code-generate-input-row">
                  <div className="input-with-icon" style={{ flex: 1 }}>
                    <KeyRound size={16} className="input-icon text-cyan" />
                    <input 
                      type="text" 
                      value={editCustUniqueId}
                      onChange={(e) => setEditCustUniqueId(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                      className="unique-code-input"
                      required
                    />
                  </div>
                  <button 
                    type="button" 
                    className="btn-secondary-sm"
                    onClick={() => setEditCustUniqueId(generateUniqueCode(6))}
                    title="Generate New Random Unique ID"
                  >
                    <RefreshCw size={14} />
                    <span>Regenerate</span>
                  </button>
                </div>
              </div>

              <div className="form-actions-row" style={{ marginTop: 20 }}>
                <button 
                  type="button" 
                  className="btn-secondary-sm"
                  onClick={() => setShowEditCustomerModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-submit-auth" style={{ flex: 1 }}>
                  <Save size={16} />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
