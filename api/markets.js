import { readFileSync } from 'fs';
import { join } from 'path';

export default function handler(req, res) {
  let html;
  try {
    html = readFileSync(join(process.cwd(), 'dist', 'index.html'), 'utf8');
  } catch {
    return res.status(500).send('Error reading index.html');
  }

  const title = 'POKVault - Cross Prediction Platform Merge & Split outcomes';
  const description = 'merge, and split prediction outcome tokens across Polymarket and Opinion.';

  html = html
    .replace(/<meta property="og:title" content="[^"]*"/, `<meta property="og:title" content="${title}"`)
    .replace(/<meta property="og:description" content="[^"]*"/, `<meta property="og:description" content="${description}"`)
    .replace(/<meta name="twitter:title" content="[^"]*"/, `<meta name="twitter:title" content="${title}"`)
    .replace(/<meta name="twitter:description" content="[^"]*"/, `<meta name="twitter:description" content="${description}"`)
    .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`);

  res.setHeader('Content-Type', 'text/html');
  res.send(html);
}
