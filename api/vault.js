import { readFileSync } from 'fs';
import { join } from 'path';

export default function handler(req, res) {
  let html;
  try {
    html = readFileSync(join(process.cwd(), 'dist', 'index.html'), 'utf8');
  } catch {
    return res.status(500).send('Error reading index.html');
  }

  const title = 'POK Vault | Earn Passive Income From Prediction Market Arbitrage';
  const description = 'Deposit USDT to earn yield from prediction market arbitrage profits.';

  html = html
    .replace(/<meta property="og:title" content="[^"]*"/, `<meta property="og:title" content="${title}"`)
    .replace(/<meta property="og:description" content="[^"]*"/, `<meta property="og:description" content="${description}"`)
    .replace(/<meta name="twitter:title" content="[^"]*"/, `<meta name="twitter:title" content="${title}"`)
    .replace(/<meta name="twitter:description" content="[^"]*"/, `<meta name="twitter:description" content="${description}"`)
    .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`);

  res.setHeader('Content-Type', 'text/html');
  res.send(html);
}
