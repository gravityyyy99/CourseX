import React, { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_COURSES } from '../data/initialCourses';
import { formatDriveEmbedUrl } from '../utils/driveHelper';

const CourseContext = createContext();

const LOCAL_STORAGE_KEY = 'coursex_courses_local_cache';
const LAST_WATCHED_KEY = 'coursex_last_watched_lecture';

export function CourseProvider({ children }) {
  const [courses, setCourses] = useState(() => {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      return cached ? JSON.parse(cached) : INITIAL_COURSES;
    } catch {
      return INITIAL_COURSES;
    }
  });

  const [activeCourseId, setActiveCourseId] = useState(() => courses[0]?.id || "course-web-dev");
  const [activeSectionId, setActiveSectionId] = useState(() => courses[0]?.sections?.[0]?.id || "");
  const [activeVideoId, setActiveVideoId] = useState(() => courses[0]?.sections?.[0]?.videos?.[0]?.id || "");

  const [lastWatched, setLastWatched] = useState(() => {
    try {
      const saved = localStorage.getItem(LAST_WATCHED_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // 1. Continuous server synchronization across all browsers and devices
  const syncCoursesFromServer = async () => {
    try {
      const res = await fetch('/api/courses');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setCourses(prevCourses => {
            if (JSON.stringify(prevCourses) !== JSON.stringify(data)) {
              try {
                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
              } catch {}
              return data;
            }
            return prevCourses;
          });
        }
      }
    } catch {}
  };

  useEffect(() => {
    syncCoursesFromServer();

    const handleFocus = () => syncCoursesFromServer();
    const handleVisibility = () => {
      if (!document.hidden) syncCoursesFromServer();
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    // Poll every 4 seconds to sync without thrashing
    const interval = setInterval(syncCoursesFromServer, 4000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(interval);
    };
  }, []);

  // 2. Persist courses to server and localStorage whenever modified
  const persistCourses = (updatedCourses) => {
    setCourses(updatedCourses);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedCourses));
    } catch {}

    // Broadcast to server database so all other browsers/sessions see it immediately
    fetch('/api/courses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedCourses)
    }).catch(err => console.log('Server sync status:', err));
  };

  const activeCourse = courses.find(c => c.id === activeCourseId) || courses[0];
  const activeSection = activeCourse?.sections?.find(s => s.id === activeSectionId) || activeCourse?.sections?.[0];
  const activeVideo = activeSection?.videos?.find(v => v.id === activeVideoId) || activeSection?.videos?.[0];

  const selectVideo = (courseId, sectionId, videoId) => {
    setActiveCourseId(courseId);
    setActiveSectionId(sectionId);
    setActiveVideoId(videoId);

    // Save as last watched
    const targetCourse = courses.find(c => c.id === courseId);
    const targetSec = targetCourse?.sections?.find(s => s.id === sectionId);
    const targetVid = targetSec?.videos?.find(v => v.id === videoId);

    if (targetVid) {
      const savedTime = getPlaybackPosition(courseId, videoId);
      const info = {
        courseId,
        courseTitle: targetCourse?.title || '',
        sectionId,
        sectionTitle: targetSec?.title || '',
        videoId,
        videoTitle: targetVid.title,
        currentTime: savedTime,
        timestamp: Date.now()
      };
      setLastWatched(info);
      try {
        localStorage.setItem(LAST_WATCHED_KEY, JSON.stringify(info));
      } catch {}
    }
  };

  // Video playback position memory
  const savePlaybackPosition = (courseId, videoId, currentTime) => {
    if (!videoId || currentTime === undefined) return;
    const timeSec = Math.floor(currentTime);
    try {
      localStorage.setItem(`coursex_pos_${courseId}_${videoId}`, timeSec.toString());
      setLastWatched(prev => {
        if (!prev || prev.videoId !== videoId) return prev;
        const updated = { ...prev, currentTime: timeSec, updatedAt: Date.now() };
        try {
          localStorage.setItem(LAST_WATCHED_KEY, JSON.stringify(updated));
        } catch {}
        return updated;
      });
    } catch {}
  };

  const getPlaybackPosition = (courseId, videoId) => {
    if (!videoId) return 0;
    try {
      const saved = localStorage.getItem(`coursex_pos_${courseId}_${videoId}`);
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  };

  const toggleVideoCompletion = (courseId, sectionId, videoId) => {
    const updated = courses.map(c => {
      if (c.id !== courseId) return c;
      return {
        ...c,
        sections: c.sections.map(s => {
          if (s.id !== sectionId) return s;
          return {
            ...s,
            videos: s.videos.map(v => {
              if (v.id !== videoId) return v;
              return { ...v, completed: !v.completed };
            })
          };
        })
      };
    });
    persistCourses(updated);
  };

  // ================= ADMIN OPERATIONS ================= //

  const createCourse = ({ title, description, thumbnail, category }) => {
    const newCourse = {
      id: `course-${Date.now()}`,
      title: title.trim(),
      description: description?.trim() || "Course curriculum overview.",
      thumbnail: thumbnail?.trim() || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
      category: category?.trim() || "Curriculum",
      sections: [] // Start clean with NO automatic fake dummy sections or videos
    };
    const updated = [newCourse, ...courses];
    persistCourses(updated);
    setActiveCourseId(newCourse.id);
    setActiveSectionId("");
    setActiveVideoId("");
    return newCourse;
  };

  const updateCourse = (courseId, updatedFields) => {
    const updated = courses.map(c => (c.id === courseId ? { ...c, ...updatedFields } : c));
    persistCourses(updated);
  };

  const deleteCourse = (courseId) => {
    const updated = courses.filter(c => c.id !== courseId);
    persistCourses(updated);
    if (activeCourseId === courseId && updated.length > 0) {
      setActiveCourseId(updated[0].id);
      setActiveSectionId(updated[0]?.sections?.[0]?.id || "");
      setActiveVideoId(updated[0]?.sections?.[0]?.videos?.[0]?.id || "");
    }
  };

  const addSection = (courseId, sectionTitle) => {
    const updated = courses.map(c => {
      if (c.id !== courseId) return c;
      const newSec = {
        id: `sec-${Date.now()}`,
        title: sectionTitle.trim() || `Section ${c.sections.length + 1}`,
        videos: [],
        notes: []
      };
      return { ...c, sections: [...c.sections, newSec] };
    });
    persistCourses(updated);
  };

  const renameSection = (courseId, sectionId, newTitle) => {
    const updated = courses.map(c => {
      if (c.id !== courseId) return c;
      return {
        ...c,
        sections: c.sections.map(s => (s.id === sectionId ? { ...s, title: newTitle.trim() } : s))
      };
    });
    persistCourses(updated);
  };

  const deleteSection = (courseId, sectionId) => {
    const updated = courses.map(c => {
      if (c.id !== courseId) return c;
      return {
        ...c,
        sections: c.sections.filter(s => s.id !== sectionId)
      };
    });
    persistCourses(updated);
  };

  const reorderSection = (courseId, sectionIndex, direction) => {
    const updated = courses.map(c => {
      if (c.id !== courseId) return c;
      const targetIndex = sectionIndex + direction;
      if (targetIndex < 0 || targetIndex >= c.sections.length) return c;
      const sectionsClone = [...c.sections];
      const [moved] = sectionsClone.splice(sectionIndex, 1);
      sectionsClone.splice(targetIndex, 0, moved);
      return { ...c, sections: sectionsClone };
    });
    persistCourses(updated);
  };

  // Video insertion with exact count - strictly only adds the provided videos (no duplicates, no extra random videos)
  const addParsedVideosToSection = (courseId, sectionId, videosList) => {
    if (!Array.isArray(videosList) || videosList.length === 0) return;

    const updated = courses.map(c => {
      if (c.id !== courseId) return c;
      return {
        ...c,
        sections: c.sections.map(s => {
          if (s.id !== sectionId) return s;
          const existingIds = new Set((s.videos || []).map(v => v.id));
          const uniqueNewVideos = videosList.filter(v => !existingIds.has(v.id));
          return {
            ...s,
            videos: [...(s.videos || []), ...uniqueNewVideos]
          };
        })
      };
    });
    persistCourses(updated);
  };

  const editVideo = (courseId, sectionId, videoId, updatedFields) => {
    const updated = courses.map(c => {
      if (c.id !== courseId) return c;
      return {
        ...c,
        sections: c.sections.map(s => {
          if (s.id !== sectionId) return s;
          return {
            ...s,
            videos: s.videos.map(v => {
              if (v.id !== videoId) return v;
              return {
                ...v,
                ...updatedFields,
                videoUrl: updatedFields.videoUrl ? formatDriveEmbedUrl(updatedFields.videoUrl) : v.videoUrl
              };
            })
          };
        })
      };
    });
    persistCourses(updated);
  };

  const deleteVideo = (courseId, sectionId, videoId) => {
    const updated = courses.map(c => {
      if (c.id !== courseId) return c;
      return {
        ...c,
        sections: c.sections.map(s => {
          if (s.id !== sectionId) return s;
          return {
            ...s,
            videos: s.videos.filter(v => v.id !== videoId)
          };
        })
      };
    });
    persistCourses(updated);
  };

  const reorderVideo = (courseId, sectionId, videoIndex, direction) => {
    const updated = courses.map(c => {
      if (c.id !== courseId) return c;
      return {
        ...c,
        sections: c.sections.map(s => {
          if (s.id !== sectionId) return s;
          const targetIndex = videoIndex + direction;
          if (targetIndex < 0 || targetIndex >= s.videos.length) return s;
          const videosClone = [...s.videos];
          const [moved] = videosClone.splice(videoIndex, 1);
          videosClone.splice(targetIndex, 0, moved);
          return { ...s, videos: videosClone };
        })
      };
    });
    persistCourses(updated);
  };

  // Notes operations - strictly only adds the provided notes (no duplicates, no extra random notes)
  const addNotesListToSection = (courseId, sectionId, notesList) => {
    if (!Array.isArray(notesList) || notesList.length === 0) return;

    const updated = courses.map(c => {
      if (c.id !== courseId) return c;
      return {
        ...c,
        sections: c.sections.map(s => {
          if (s.id !== sectionId) return s;
          const existingIds = new Set((s.notes || []).map(n => n.id));
          const uniqueNewNotes = notesList.filter(n => !existingIds.has(n.id));
          return {
            ...s,
            notes: [...(s.notes || []), ...uniqueNewNotes]
          };
        })
      };
    });
    persistCourses(updated);
  };

  const deleteNote = (courseId, sectionId, noteId) => {
    const updated = courses.map(c => {
      if (c.id !== courseId) return c;
      return {
        ...c,
        sections: c.sections.map(s => {
          if (s.id !== sectionId) return s;
          return { ...s, notes: (s.notes || []).filter(n => n.id !== noteId) };
        })
      };
    });
    persistCourses(updated);
  };

  return (
    <CourseContext.Provider
      value={{
        courses,
        activeCourse,
        activeSection,
        activeVideo,
        lastWatched,
        selectVideo,
        savePlaybackPosition,
        getPlaybackPosition,
        toggleVideoCompletion,
        setActiveCourseId,
        setActiveSectionId,
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
      }}
    >
      {children}
    </CourseContext.Provider>
  );
}

export function useCourse() {
  return useContext(CourseContext);
}
