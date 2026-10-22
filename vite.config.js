import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.resolve(__dirname, 'data')
const COURSES_FILE = path.join(DATA_DIR, 'courses.json')
const PROFILE_FILE = path.join(DATA_DIR, 'admin-profile.json')
const CUSTOMERS_FILE = path.join(DATA_DIR, 'customers.json')
const USERS_FILE = path.join(DATA_DIR, 'users.json')

// Custom Vite plugin to handle shared server API
function coursexApiPlugin() {
  return {
    name: 'coursex-api-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        // Parse URL
        const parsedUrl = new URL(req.url, 'http://127.0.0.1:5173')

        // 1. GET /api/courses
        if (parsedUrl.pathname === '/api/courses' && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json')
          try {
            if (fs.existsSync(COURSES_FILE)) {
              const data = fs.readFileSync(COURSES_FILE, 'utf-8')
              return res.end(data)
            }
          } catch (e) {
            console.error(e)
          }
          return res.end('[]')
        }

        // 2. POST /api/courses
        if (parsedUrl.pathname === '/api/courses' && req.method === 'POST') {
          let body = ''
          req.on('data', chunk => { body += chunk })
          req.on('end', () => {
            try {
              if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
              fs.writeFileSync(COURSES_FILE, body, 'utf-8')
              res.setHeader('Content-Type', 'application/json')
              return res.end(JSON.stringify({ success: true }))
            } catch (err) {
              res.statusCode = 500
              return res.end(JSON.stringify({ error: err.message }))
            }
          })
          return
        }

        // 3. GET /api/customers
        if (parsedUrl.pathname === '/api/customers' && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json')
          try {
            if (fs.existsSync(CUSTOMERS_FILE)) {
              const data = fs.readFileSync(CUSTOMERS_FILE, 'utf-8')
              return res.end(data)
            }
          } catch (e) {
            console.error(e)
          }
          return res.end('[]')
        }

        // 4. POST /api/customers
        if (parsedUrl.pathname === '/api/customers' && req.method === 'POST') {
          let body = ''
          req.on('data', chunk => { body += chunk })
          req.on('end', () => {
            try {
              if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
              fs.writeFileSync(CUSTOMERS_FILE, body, 'utf-8')
              res.setHeader('Content-Type', 'application/json')
              return res.end(JSON.stringify({ success: true }))
            } catch (err) {
              res.statusCode = 500
              return res.end(JSON.stringify({ error: err.message }))
            }
          })
          return
        }

        // 5. GET /api/admin-profile
        if (parsedUrl.pathname === '/api/admin-profile' && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json')
          try {
            if (fs.existsSync(PROFILE_FILE)) {
              const data = fs.readFileSync(PROFILE_FILE, 'utf-8')
              return res.end(data)
            }
          } catch (e) {
            console.error(e)
          }
          return res.end('{}')
        }

        // 6. POST /api/admin-profile
        if (parsedUrl.pathname === '/api/admin-profile' && req.method === 'POST') {
          let body = ''
          req.on('data', chunk => { body += chunk })
          req.on('end', () => {
            try {
              if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
              fs.writeFileSync(PROFILE_FILE, body, 'utf-8')
              res.setHeader('Content-Type', 'application/json')
              return res.end(JSON.stringify({ success: true }))
            } catch (err) {
              res.statusCode = 500
              return res.end(JSON.stringify({ error: err.message }))
            }
          })
          return
        }

        // 7. GET /api/users
        if (parsedUrl.pathname === '/api/users' && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json')
          try {
            if (fs.existsSync(USERS_FILE)) {
              const data = fs.readFileSync(USERS_FILE, 'utf-8')
              return res.end(data)
            }
          } catch (e) {
            console.error(e)
          }
          return res.end('[]')
        }

        // 8. POST /api/users
        if (parsedUrl.pathname === '/api/users' && req.method === 'POST') {
          let body = ''
          req.on('data', chunk => { body += chunk })
          req.on('end', () => {
            try {
              if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
              fs.writeFileSync(USERS_FILE, body, 'utf-8')
              res.setHeader('Content-Type', 'application/json')
              return res.end(JSON.stringify({ success: true }))
            } catch (err) {
              res.statusCode = 500
              return res.end(JSON.stringify({ error: err.message }))
            }
          })
          return
        }

        // Helper function to resolve TeraBox streams
        async function resolveTeraBoxStream(url, password = '') {
          try {
            const controller = new AbortController()
            const timer = setTimeout(() => controller.abort(), 15000)
            const response = await fetch('https://teraplayer-backend-temp.onrender.com/api/preview', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Origin': 'https://teraplayer.in',
                'Referer': 'https://teraplayer.in/'
              },
              body: JSON.stringify({ url, password: password || '' }),
              signal: controller.signal
            })
            clearTimeout(timer)
            const data = await response.json()
            return data
          } catch (err) {
            console.error('TeraBox preview error:', err)
            return { ok: false, error: err.message }
          }
        }

        // 5. GET /api/resolve-terabox?url=...
        if (parsedUrl.pathname === '/api/resolve-terabox' && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json')
          res.setHeader('Access-Control-Allow-Origin', '*')
          const targetUrl = parsedUrl.searchParams.get('url')
          const pwd = parsedUrl.searchParams.get('pwd') || ''
          if (!targetUrl) {
            return res.end(JSON.stringify({ ok: false, error: 'URL required' }))
          }

          const data = await resolveTeraBoxStream(targetUrl, pwd)
          if (data && data.ok && data.stream_url) {
            const proxiedStreamUrl = `/api/terabox-m3u8?url=${encodeURIComponent(data.stream_url)}`
            return res.end(JSON.stringify({
              ok: true,
              title: data.title || 'TeraBox Video',
              duration: data.duration,
              sizeStr: data.size_str,
              thumbnail: data.thumbnail,
              streamUrl: proxiedStreamUrl,
              rawStreamUrl: data.stream_url,
              rawUrl: targetUrl,
              files: data.files
            }))
          }

          return res.end(JSON.stringify({
            ok: false,
            error: data?.error || 'Could not resolve TeraBox stream'
          }))
        }

        // 6. GET /api/terabox-m3u8?url=...
        if (parsedUrl.pathname === '/api/terabox-m3u8' && req.method === 'GET') {
          const rawStreamUrl = parsedUrl.searchParams.get('url')
          if (!rawStreamUrl) {
            res.statusCode = 400
            return res.end('URL required')
          }

          try {
            const proxyUrl = `https://teraplayer-backend-temp.onrender.com/api/stream?url=${encodeURIComponent(rawStreamUrl)}`
            const m3u8Res = await fetch(proxyUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Origin': 'https://teraplayer.in',
                'Referer': 'https://teraplayer.in/'
              }
            })

            res.setHeader('Content-Type', 'application/vnd.apple.mpegurl')
            res.setHeader('Access-Control-Allow-Origin', '*')
            res.setHeader('Cache-Control', 'no-cache')
            const m3u8Text = await m3u8Res.text()
            return res.end(m3u8Text)
          } catch (mErr) {
            console.error('m3u8 proxy error:', mErr)
            res.statusCode = 500
            return res.end('Failed to fetch stream playlist')
          }
        }

        // 7. GET /api/fetch-drive-meta?url=...
        if (parsedUrl.pathname === '/api/fetch-drive-meta' && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json')
          const targetUrl = parsedUrl.searchParams.get('url')
          if (!targetUrl) {
            return res.end(JSON.stringify({ error: 'URL required' }))
          }

          try {
            // Check TeraBox link first
            if (/(?:terabox|1024tera|terafileshare|terasharelink|terasharefile|nephobox|mirrobox|4funbox)/i.test(targetUrl)) {
              const teraData = await resolveTeraBoxStream(targetUrl)
              if (teraData && teraData.ok) {
                return res.end(JSON.stringify({
                  title: teraData.title || 'TeraBox Video',
                  embedUrl: targetUrl,
                  streamUrl: `/api/terabox-m3u8?url=${encodeURIComponent(teraData.stream_url)}`,
                  isTeraBox: true,
                  duration: teraData.duration,
                  sizeStr: teraData.size_str,
                  thumbnail: teraData.thumbnail,
                  files: teraData.files
                }))
              }
            }

            // Check YouTube link
            const ytMatch = targetUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
            if (ytMatch && ytMatch[1]) {
              return res.end(JSON.stringify({
                title: 'YouTube Video',
                embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}`
              }));
            }

            // Check if it's a Google Drive or Google Docs / Slides / Sheets link
            const fileMatch = targetUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)
            const idMatch = targetUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/)
            const docMatch = targetUrl.match(/\/(document|presentation|spreadsheets)\/d\/([a-zA-Z0-9_-]+)/)
            const fileId = fileMatch ? fileMatch[1] : (idMatch ? idMatch[1] : (docMatch ? docMatch[2] : null))
            const docType = docMatch ? docMatch[1] : null

            let extractedTitle = ''
            let embedUrl = targetUrl

            if (fileId) {
              if (docType === 'document') {
                embedUrl = `https://docs.google.com/document/d/${fileId}/preview`
              } else if (docType === 'spreadsheets') {
                embedUrl = `https://docs.google.com/spreadsheets/d/${fileId}/preview`
              } else if (docType === 'presentation') {
                embedUrl = `https://docs.google.com/presentation/d/${fileId}/preview`
              } else {
                embedUrl = `https://drive.google.com/file/d/${fileId}/preview`
              }

              // Fetch Google Drive / Docs page with 2s timeout to scrape exact real filename
              const drivePageUrl = docType 
                ? `https://docs.google.com/${docType}/d/${fileId}/preview`
                : `https://drive.google.com/file/d/${fileId}/view`

              try {
                const controller = new AbortController()
                const timeoutId = setTimeout(() => controller.abort(), 2000)
                const response = await fetch(drivePageUrl, {
                  headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
                  signal: controller.signal
                })
                clearTimeout(timeoutId)
                const html = await response.text()

                // Check og:title
                const ogTitleMatch = html.match(/<meta property="og:title" content="([^"]+)"/)
                if (ogTitleMatch && ogTitleMatch[1]) {
                  extractedTitle = ogTitleMatch[1]
                } else {
                  // Check <title>
                  const titleTagMatch = html.match(/<title>([^<]+)<\/title>/)
                  if (titleTagMatch && titleTagMatch[1]) {
                    extractedTitle = titleTagMatch[1]
                  }
                }

                // Clean Google suffixes
                if (extractedTitle) {
                  extractedTitle = extractedTitle
                    .replace(/\s*-\s*Google\s*(Drive|Docs|Sheets|Slides)\s*$/i, '')
                    .replace(/&amp;/g, '&')
                    .replace(/&#39;/g, "'")
                    .replace(/&quot;/g, '"')
                    .trim()
                }

                // Also check for embedded JSON filename
                const jsonNameMatch = html.match(/["']item_name["']\s*:\s*["']([^"']+)["']/) || 
                                      html.match(/["']title["']\s*:\s*["']([^"']+\.[a-zA-Z0-9]{2,4})["']/)
                if ((!extractedTitle || extractedTitle.toLowerCase() === 'google drive') && jsonNameMatch && jsonNameMatch[1]) {
                  extractedTitle = jsonNameMatch[1].trim()
                }
              } catch (scrapeErr) {
                // Timeout or network error - fallback to clean URL parsing
              }

              // Clean up if it's generic error or empty
              const lower = (extractedTitle || '').toLowerCase()
              if (!extractedTitle || 
                  lower === 'google drive' || 
                  lower === 'google docs' ||
                  lower.includes('page not found') || 
                  lower.includes('access denied') ||
                  lower.includes('error')) {
                const queryTitle = parsedUrl.searchParams.get('name') || parsedUrl.searchParams.get('title')
                extractedTitle = queryTitle ? decodeURIComponent(queryTitle) : `Document_${fileId.slice(-6)}.pdf`
              }
            } else {
              // Direct URL: parse filename from path
              try {
                const u = new URL(targetUrl)
                const segments = u.pathname.split('/').filter(Boolean)
                const last = segments[segments.length - 1]
                if (last) {
                  extractedTitle = decodeURIComponent(last).replace(/_/g, ' ')
                }
              } catch {
                extractedTitle = targetUrl
              }
            }

            return res.end(JSON.stringify({
              title: extractedTitle || 'Document.pdf',
              embedUrl
            }))
          } catch (fetchErr) {
            console.error('Fetch Drive meta error:', fetchErr)
            return res.end(JSON.stringify({
              title: 'Document.pdf',
              embedUrl: targetUrl
            }))
          }
        }

        next()
      })
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), coursexApiPlugin()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: false
  }
})
