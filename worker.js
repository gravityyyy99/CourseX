import { INITIAL_COURSES } from './src/data/initialCourses.js';

const INITIAL_CUSTOMERS = [
  {
    id: "cust-1",
    name: "Rahul Sharma",
    email: "rahul.ai@gmail.com",
    phone: "+91 98765 43210",
    password: "password123",
    courseId: "course-1792185700958",
    courseTitle: "Namaste AI",
    uniqueId: "NAI892",
    createdAt: "2026-10-20T10:30:00.000Z",
    status: "active"
  },
  {
    id: "cust-2",
    name: "Priya Patel",
    email: "priya.dev@gmail.com",
    phone: "+91 98123 45678",
    password: "password123",
    courseId: "course-1792185700958",
    courseTitle: "Namaste AI",
    uniqueId: "AI74K9",
    createdAt: "2026-10-21T14:15:00.000Z",
    status: "active"
  },
  {
    id: "cust-1792680163352",
    name: "John Doe",
    email: "john.student@gmail.com",
    phone: "9876543210",
    password: "password123",
    courseId: "course-1792185700958",
    courseTitle: "Namaste AI",
    uniqueId: "4VB6N4",
    createdAt: "2026-10-22T14:42:43.352Z",
    status: "active",
    approvedAt: "2026-10-22T14:59:14.352Z"
  }
];

const INITIAL_USERS = [
  {
    id: "usr-admin-primary",
    name: "CourseX Administrator",
    email: "admin@coursex.com",
    password: "admin",
    role: "admin",
    phone: "+91 99999 88888"
  },
  {
    id: "usr-john-student",
    name: "John Doe",
    email: "john.student@gmail.com",
    password: "password123",
    role: "student",
    phone: "9876543210"
  },
  {
    id: "usr-rahul-sharma",
    name: "Rahul Sharma",
    email: "rahul.ai@gmail.com",
    password: "password123",
    role: "student",
    phone: "+91 98765 43210"
  },
  {
    id: "usr-priya-patel",
    name: "Priya Patel",
    email: "priya.dev@gmail.com",
    password: "password123",
    role: "student",
    phone: "+91 98123 45678"
  }
];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 0. GET/POST /api/courses
    if (url.pathname === '/api/courses') {
      if (request.method === 'GET') {
        let stored = null;
        if (env?.COURSEX_KV) {
          try {
            stored = await env.COURSEX_KV.get('courses');
          } catch {}
        }
        return new Response(stored || JSON.stringify(INITIAL_COURSES), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
      if (request.method === 'POST') {
        try {
          const body = await request.text();
          if (env?.COURSEX_KV && body) {
            await env.COURSEX_KV.put('courses', body);
          }
          return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        } catch (err) {
          return new Response(JSON.stringify({ error: err.message }), { status: 500 });
        }
      }
    }

    // 0.1 GET/POST /api/customers
    if (url.pathname === '/api/customers') {
      if (request.method === 'GET') {
        let stored = null;
        if (env?.COURSEX_KV) {
          try {
            stored = await env.COURSEX_KV.get('customers');
          } catch {}
        }
        return new Response(stored || JSON.stringify(INITIAL_CUSTOMERS), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
      if (request.method === 'POST') {
        try {
          const body = await request.text();
          if (env?.COURSEX_KV && body) {
            await env.COURSEX_KV.put('customers', body);
          }
          return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        } catch (err) {
          return new Response(JSON.stringify({ error: err.message }), { status: 500 });
        }
      }
    }

    // 0.2 GET/POST /api/users
    if (url.pathname === '/api/users') {
      if (request.method === 'GET') {
        let stored = null;
        if (env?.COURSEX_KV) {
          try {
            stored = await env.COURSEX_KV.get('users');
          } catch {}
        }
        return new Response(stored || JSON.stringify(INITIAL_USERS), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
      if (request.method === 'POST') {
        try {
          const body = await request.text();
          if (env?.COURSEX_KV && body) {
            await env.COURSEX_KV.put('users', body);
          }
          return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        } catch (err) {
          return new Response(JSON.stringify({ error: err.message }), { status: 500 });
        }
      }
    }

    // 1. GET /api/resolve-terabox?url=...
    if (url.pathname === '/api/resolve-terabox') {
      const targetUrl = url.searchParams.get('url');
      const pwd = url.searchParams.get('pwd') || '';
      if (!targetUrl) {
        return new Response(JSON.stringify({ ok: false, error: 'URL required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }

      try {
        const previewRes = await fetch('https://teraplayer-backend-temp.onrender.com/api/preview', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Origin': 'https://teraplayer.in',
            'Referer': 'https://teraplayer.in/'
          },
          body: JSON.stringify({ url: targetUrl, password: pwd })
        });
        const data = await previewRes.json();
        if (data && data.ok && data.stream_url) {
          return new Response(JSON.stringify({
            ok: true,
            title: data.title || 'TeraBox Video',
            duration: data.duration,
            sizeStr: data.size_str,
            thumbnail: data.thumbnail,
            streamUrl: `/api/terabox-m3u8?url=${encodeURIComponent(data.stream_url)}`,
            rawStreamUrl: data.stream_url,
            rawUrl: targetUrl,
            files: data.files
          }), {
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }
        return new Response(JSON.stringify({ ok: false, error: data?.error || 'Could not resolve stream' }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (err) {
        return new Response(JSON.stringify({ ok: false, error: err.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    // 2. GET /api/terabox-m3u8?url=...
    if (url.pathname === '/api/terabox-m3u8') {
      const rawStreamUrl = url.searchParams.get('url');
      if (!rawStreamUrl) {
        return new Response('URL required', { status: 400 });
      }

      try {
        const proxyUrl = `https://teraplayer-backend-temp.onrender.com/api/stream?url=${encodeURIComponent(rawStreamUrl)}`;
        const m3u8Res = await fetch(proxyUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Origin': 'https://teraplayer.in',
            'Referer': 'https://teraplayer.in/'
          }
        });
        const m3u8Text = await m3u8Res.text();
        return new Response(m3u8Text, {
          headers: {
            'Content-Type': 'application/vnd.apple.mpegurl',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-cache'
          }
        });
      } catch (mErr) {
        return new Response('Failed to fetch stream playlist', { status: 500 });
      }
    }

    // 3. GET /api/fetch-drive-meta?url=...
    if (url.pathname === '/api/fetch-drive-meta') {
      const targetUrl = url.searchParams.get('url');
      if (!targetUrl) {
        return new Response(JSON.stringify({ error: 'URL required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }

      try {
        // TeraBox link
        if (/(?:terabox|1024tera|terafileshare|terasharelink|terasharefile|nephobox|mirrobox|4funbox)/i.test(targetUrl)) {
          const previewRes = await fetch('https://teraplayer-backend-temp.onrender.com/api/preview', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'Origin': 'https://teraplayer.in',
              'Referer': 'https://teraplayer.in/'
            },
            body: JSON.stringify({ url: targetUrl, password: '' })
          });
          const teraData = await previewRes.json();
          if (teraData && teraData.ok) {
            return new Response(JSON.stringify({
              title: teraData.title || 'TeraBox Video',
              embedUrl: targetUrl,
              streamUrl: `/api/terabox-m3u8?url=${encodeURIComponent(teraData.stream_url)}`,
              isTeraBox: true,
              duration: teraData.duration,
              sizeStr: teraData.size_str,
              thumbnail: teraData.thumbnail,
              files: teraData.files
            }), {
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
          }
        }

        // YouTube link
        const ytMatch = targetUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
        if (ytMatch && ytMatch[1]) {
          return new Response(JSON.stringify({
            title: 'YouTube Video',
            embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}`
          }), {
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }

        // Generic fallback
        let extractedTitle = 'Lecture.mp4';
        try {
          const u = new URL(targetUrl);
          const segs = u.pathname.split('/').filter(Boolean);
          if (segs.length > 0) extractedTitle = decodeURIComponent(segs[segs.length - 1]).replace(/_/g, ' ');
        } catch {}

        return new Response(JSON.stringify({
          title: extractedTitle,
          embedUrl: targetUrl
        }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    return env.ASSETS.fetch(request);
  },
};
