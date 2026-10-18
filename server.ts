import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '15mb' }));

  const COVERS_FILE = path.join(__dirname, 'public', 'custom-covers.json');

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
