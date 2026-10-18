import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function fetchGoogleDriveImage(fileId: string): Promise<Buffer | null> {
  const candidateUrls = [
    `https://lh3.googleusercontent.com/d/${fileId}`,
    `https://drive.google.com/uc?export=download&id=${fileId}`,
    `https://drive.usercontent.google.com/download?id=${fileId}&export=download&authuser=0`,
  ];

  for (const url of candidateUrls) {
    try {
      const resp = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        },
      });

      if (resp.ok) {
        const contentType = resp.headers.get('content-type') || '';
        if (contentType.startsWith('image/')) {
          const ab = await resp.arrayBuffer();
          return Buffer.from(ab);
        }
      }
    } catch (e) {
      console.warn(`Failed fetching from ${url}:`, e);
    }
  }
  return null;
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '20mb' }));

  const COVERS_FILE = path.join(__dirname, 'public', 'custom-covers.json');
  const CACHE_DIR = path.join(__dirname, 'public', 'images', 'cache');

  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }

  const getCovers = (): Record<string, string> => {
    try {
      if (fs.existsSync(COVERS_FILE)) {
        return JSON.parse(fs.readFileSync(COVERS_FILE, 'utf-8'));
      }
    } catch (e) {
      console.error('Error reading covers file:', e);
    }
    return {};
  };

  const saveCovers = (covers: Record<string, string>) => {
    fs.mkdirSync(path.dirname(COVERS_FILE), { recursive: true });
    fs.writeFileSync(COVERS_FILE, JSON.stringify(covers, null, 2), 'utf-8');
    const distDir = path.join(__dirname, 'dist');
    if (fs.existsSync(distDir)) {
      fs.writeFileSync(path.join(distDir, 'custom-covers.json'), JSON.stringify(covers, null, 2), 'utf-8');
    }
  };

  // Google Drive Image Proxy Route
  // Eliminates 403 Forbidden, CORS issues, and Google login requirements on all phones
  app.get('/api/drive-image', async (req, res) => {
    const rawId = (req.query.id as string) || '';
    if (!rawId) {
      return res.status(400).send('Missing Google Drive file id');
    }

    const fileId = rawId.replace(/[^a-zA-Z0-9_-]/g, '');
    const cacheFile = path.join(CACHE_DIR, `${fileId}.jpg`);

    // 1. Serve immediately from disk cache if already downloaded
    if (fs.existsSync(cacheFile)) {
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      return fs.createReadStream(cacheFile).pipe(res);
    }

    // 2. Fetch server-side directly from Google Drive
    const imageBuffer = await fetchGoogleDriveImage(fileId);
    if (imageBuffer) {
      try {
        fs.writeFileSync(cacheFile, imageBuffer);
        const distCacheDir = path.join(__dirname, 'dist', 'images', 'cache');
        if (fs.existsSync(path.join(__dirname, 'dist'))) {
          fs.mkdirSync(distCacheDir, { recursive: true });
          fs.writeFileSync(path.join(distCacheDir, `${fileId}.jpg`), imageBuffer);
        }
      } catch (err) {
        console.error('Error saving cached image:', err);
      }

      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      return res.send(imageBuffer);
    }

    // 3. Fallback: Krishu default cute visual if Drive link is restricted/offline
    const fallbackPath = path.join(__dirname, 'public', 'images', 'krishu-id.jpg');
    if (fs.existsSync(fallbackPath)) {
      res.setHeader('Content-Type', 'image/jpeg');
      return fs.createReadStream(fallbackPath).pipe(res);
    }

    return res.status(404).send('Image could not be retrieved');
  });

  // API endpoints
  app.get('/api/covers', (_req, res) => {
    res.json(getCovers());
  });

  app.post('/api/save-cover', (req, res) => {
    try {
      const { songId, coverUrl } = req.body;
      if (!songId || !coverUrl) {
        return res.status(400).json({ error: 'Missing songId or coverUrl' });
      }
      const covers = getCovers();
      covers[songId] = coverUrl;
      saveCovers(covers);

      // Permanently update src/config.ts as well
      const configPath = path.join(__dirname, 'src', 'config.ts');
      if (fs.existsSync(configPath)) {
        let content = fs.readFileSync(configPath, 'utf-8');
        const songBlockRegex = new RegExp(`(id:\\s*["']${songId}["'][\\s\\S]*?cover:\\s*["'])[^"']+(["'])`);
        if (songBlockRegex.test(content)) {
          content = content.replace(songBlockRegex, `$1${coverUrl}$2`);
          fs.writeFileSync(configPath, content, 'utf-8');
        }
      }

      res.json({ success: true, covers });
    } catch (err: unknown) {
      console.error('Error in save-cover:', err);
      res.status(500).json({ error: String(err) });
    }
  });

  app.post('/api/reset-cover', (req, res) => {
    try {
      const { songId } = req.body;
      const covers = getCovers();
      if (songId && covers[songId]) {
        delete covers[songId];
        saveCovers(covers);
      }
      res.json({ success: true, covers });
    } catch (err: unknown) {
      console.error('Error in reset-cover:', err);
      res.status(500).json({ error: String(err) });
    }
  });

  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
