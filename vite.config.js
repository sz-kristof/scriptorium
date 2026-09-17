import { defineConfig } from 'vite';
import fs from 'node:fs';
import path from 'node:path';

// Dev-only screenshot sink: the page POSTs a canvas data URL to /__shot and it
// lands in .shots/<name>.png.
function shotSink() {
  return {
    name: 'shot-sink',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__shot', (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; return res.end(); }
        let body = '';
        req.on('data', (c) => { body += c; });
        req.on('end', () => {
          const dir = path.resolve('.shots');
          fs.mkdirSync(dir, { recursive: true });
          const name = (new URL(req.url, 'http://x').searchParams.get('name') || 'shot').replace(/[^\w.-]/g, '_') + '.png';
          fs.writeFileSync(path.join(dir, name), Buffer.from(body.replace(/^data:image\/png;base64,/, ''), 'base64'));
          res.end('ok');
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [shotSink()],
  base: './',
  server: { host: true, port: 5481, strictPort: true },
  preview: { host: true, port: 5481, strictPort: true },
});
