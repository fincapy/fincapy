import { createServer } from 'http';
import { createGzip } from 'zlib';
import { parse } from 'url';
import next from 'next';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);

    // Apply gzip compression if the client supports it
    const acceptEncoding = req.headers['accept-encoding'] || '';
    if (acceptEncoding.includes('gzip')) {
      res.setHeader('Content-Encoding', 'gzip');
      res.setHeader('Vary', 'Accept-Encoding');

      const gzip = createGzip();
      res.writeHead(200);
      handle(req, res).pipe(gzip).pipe(res);
    } else {
      handle(req, res);
    }
  }).listen(3000, () => {
    console.log('Server running at http://localhost:3000');
  });
});
