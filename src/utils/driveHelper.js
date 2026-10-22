// Google Drive, YouTube & Cloud Media Helper Utilities

export function extractDriveFileId(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();

  // Pattern 1: /file/d/{FILE_ID}
  const fileMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch && fileMatch[1]) return fileMatch[1];

  // Pattern 2: id={FILE_ID}
  const idMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch && idMatch[1]) return idMatch[1];

  // Pattern 3: /document/d/{FILE_ID} or /presentation/d/{FILE_ID} or /spreadsheets/d/{FILE_ID}
  const docMatch = trimmed.match(/\/(?:document|presentation|spreadsheets)\/d\/([a-zA-Z0-9_-]+)/);
  if (docMatch && docMatch[1]) return docMatch[1];

  return null;
}

export function extractYouTubeId(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  const ytMatch = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  return ytMatch ? ytMatch[1] : null;
}

export function extractVimeoId(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  const vimeoMatch = trimmed.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)/);
  return vimeoMatch ? vimeoMatch[3] : null;
}

// Convert any Google Drive, YouTube, or Vimeo URL to an in-app embed preview URL
export function formatDriveEmbedUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();

  // 1. Google Drive
  const driveId = extractDriveFileId(trimmed);
  if (driveId) {
    // Check if it's a doc, sheet, or presentation
    if (trimmed.includes('/document/d/')) {
      return `https://docs.google.com/document/d/${driveId}/preview`;
    }
    if (trimmed.includes('/spreadsheets/d/')) {
      return `https://docs.google.com/spreadsheets/d/${driveId}/preview`;
    }
    if (trimmed.includes('/presentation/d/')) {
      return `https://docs.google.com/presentation/d/${driveId}/preview`;
    }
    return `https://drive.google.com/file/d/${driveId}/preview`;
  }

  // 2. YouTube
  const ytId = extractYouTubeId(trimmed);
  if (ytId) {
    return `https://www.youtube.com/embed/${ytId}`;
  }

  // 3. Vimeo
  const vimeoId = extractVimeoId(trimmed);
  if (vimeoId) {
    return `https://player.vimeo.com/video/${vimeoId}`;
  }

  return trimmed;
}

// Aliased for video clarity
export const formatDriveVideoUrl = formatDriveEmbedUrl;
export const formatVideoEmbedUrl = formatDriveEmbedUrl;

export function isTeraBoxUrl(url) {
  if (!url || typeof url !== 'string') return false;
  return /(?:terabox|1024tera|terafileshare|terasharelink|terasharefile|teraboxshare|teraboxlink|nephobox|mirrobox|4funbox)/i.test(url);
}

export function isHlsUrl(url) {
  if (!url || typeof url !== 'string') return false;
  return url.includes('.m3u8') || url.includes('/api/terabox-m3u8') || url.includes('/stream?url=');
}

export function isEmbeddableVideo(url) {
  if (!url || typeof url !== 'string') return false;
  if (isTeraBoxUrl(url) || isHlsUrl(url)) return false;
  return url.includes('drive.google.com') ||
         url.includes('docs.google.com') ||
         url.includes('youtube.com') ||
         url.includes('youtu.be') ||
         url.includes('vimeo.com');
}

// Helper to extract title and url safely without breaking URLs that contain hyphens or query params
export function parseLineForTitleAndUrl(line) {
  if (!line || typeof line !== 'string') return { title: '', url: '' };
  const trimmed = line.trim();

  // If the entire line is a single URL (no whitespace):
  if (/^https?:\/\/[^\s]+$/i.test(trimmed)) {
    return { title: '', url: trimmed };
  }

  // Pattern 1: Title before URL with separator or whitespace (e.g. "01_System_Design.mp4 - https://...")
  const httpIdx = trimmed.search(/\s+https?:\/\//i);
  if (httpIdx > 0) {
    const textPart = trimmed.substring(0, httpIdx).trim().replace(/[:\-–—|\t]+$/, '').trim();
    const urlPart = trimmed.substring(httpIdx).trim();
    return { title: textPart, url: urlPart };
  }

  // Pattern 2: URL followed by parenthesized title (e.g. "https://... (01_Setup.mp4)")
  const parenMatch = trimmed.match(/^(https?:\/\/[^\s\(\)\[\]]+)\s+[\(\[]([^\)\]]+)[\)\]]/i);
  if (parenMatch) {
    return { title: parenMatch[2].trim(), url: parenMatch[1].trim() };
  }

  // Pattern 3: URL followed by separator and title (e.g. "https://... - 01_Setup.mp4")
  // IMPORTANT: \s+ is required around the separator to NEVER cut a URL that has a hyphen in its ID!
  const sepMatch = trimmed.match(/^(https?:\/\/[^\s]+)\s+[\-–—|:]\s+(.+)$/i);
  if (sepMatch) {
    return { title: sepMatch[2].trim(), url: sepMatch[1].trim() };
  }

  // Pattern 4: URL followed by space and filename (e.g. "https://... 01_Setup.mp4")
  const spaceMatch = trimmed.match(/^(https?:\/\/[^\s]+)\s+([^\s].*)$/i);
  if (spaceMatch) {
    return { title: spaceMatch[2].trim(), url: spaceMatch[1].trim() };
  }

  return { title: '', url: trimmed };
}

// Extract human-friendly filename from URL or text
export function extractFileNameFromUrl(url, index = 1) {
  if (!url) return `Video_${String(index).padStart(2, '0')}.mp4`;

  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    
    // Check if filename is in query params
    const nameParam = urlObj.searchParams.get('name') || 
                      urlObj.searchParams.get('title') || 
                      urlObj.searchParams.get('filename') ||
                      urlObj.searchParams.get('file');
    if (nameParam) {
      return decodeURIComponent(nameParam).replace(/_/g, ' ');
    }

    // Check pathname for file with extension
    const pathSegments = urlObj.pathname.split('/').filter(Boolean);
    const lastSegment = pathSegments[pathSegments.length - 1] || '';
    
    if (/\.[a-zA-Z0-9]{2,4}$/.test(lastSegment)) {
      return decodeURIComponent(lastSegment).replace(/_/g, ' ');
    }

    // If Google Drive link with file ID
    const fileId = extractDriveFileId(url);
    if (fileId) {
      return `Lecture_${String(index).padStart(2, '0')}.mp4`;
    }
  } catch (e) {
    const match = url.match(/\/([^\/?#]+\.[a-zA-Z0-9]{2,4})/);
    if (match && match[1]) {
      return decodeURIComponent(match[1]).replace(/_/g, ' ');
    }
  }

  return `Video_${String(index).padStart(2, '0')}.mp4`;
}

// Parses raw pasted text containing one or multiple video URLs with automatic title extraction
export function parsePastedVideoUrls(rawText, defaultPrefix = "") {
  if (!rawText || typeof rawText !== 'string') return [];

  const lines = rawText
    .split(/[\r\n]+/)
    .map(line => line.trim())
    .filter(line => line.length > 0);

  const results = [];

  lines.forEach((line, index) => {
    const { title: parsedTitle, url } = parseLineForTitleAndUrl(line);
    let title = parsedTitle;

    if (!title) {
      if (defaultPrefix) {
        title = `${defaultPrefix} ${String(index + 1).padStart(2, '0')}`;
      } else {
        title = extractFileNameFromUrl(url, index + 1);
      }
    }

    const embedUrl = formatDriveEmbedUrl(url);

    results.push({
      id: `vid-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 5)}`,
      title,
      videoUrl: embedUrl,
      rawUrl: url,
      completed: false
    });
  });

  return results;
}

// Parses raw pasted notes URLs
export function parsePastedNoteUrls(rawText) {
  if (!rawText || typeof rawText !== 'string') return [];

  const lines = rawText
    .split(/[\r\n]+/)
    .map(line => line.trim())
    .filter(line => line.length > 0);

  const results = [];

  lines.forEach((line, index) => {
    const { title: parsedTitle, url } = parseLineForTitleAndUrl(line);
    let title = parsedTitle;

    if (!title) {
      try {
        const u = new URL(url.startsWith('http') ? url : `https://${url}`);
        const nameParam = u.searchParams.get('name') || u.searchParams.get('title') || u.searchParams.get('filename');
        if (nameParam) {
          title = decodeURIComponent(nameParam).replace(/_/g, ' ');
        } else {
          const segs = u.pathname.split('/').filter(Boolean);
          const last = segs[segs.length - 1];
          if (last && /\.[a-zA-Z0-9]{2,4}$/.test(last)) {
            title = decodeURIComponent(last).replace(/_/g, ' ');
          }
        }
      } catch {}
    }

    if (!title) {
      const fileId = extractDriveFileId(url);
      title = fileId ? `Document_${String(index + 1).padStart(2, '0')}.pdf` : `Document_${String(index + 1).padStart(2, '0')}.pdf`;
    }

    const embedUrl = formatDriveEmbedUrl(url);

    results.push({
      id: `note-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 5)}`,
      title,
      fileUrl: embedUrl,
      rawUrl: url
    });
  });

  return results;
}
