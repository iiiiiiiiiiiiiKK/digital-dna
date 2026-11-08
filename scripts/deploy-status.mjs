// Small helper: reports recent workflow runs / Pages state. Read-only.
import http from 'node:http';
import https from 'node:https';
import tls from 'node:tls';

const TOKEN = process.env.GH_TOKEN;
const OWNER = 'iiiiiiiiiiiiiKK';
const REPO = 'digital-dna';
const PROXY = { host: '127.0.0.1', port: 7897 };

function get(urlStr) {
  const url = new URL(urlStr);
  return new Promise((resolve, reject) => {
    const conn = http.request({ host: PROXY.host, port: PROXY.port, method: 'CONNECT', path: `${url.hostname}:443` });
    conn.on('connect', (res, socket) => {
      if (res.statusCode !== 200) return reject(new Error('proxy CONNECT ' + res.statusCode));
      const req = https.request(
        {
          host: url.hostname,
          path: url.pathname + url.search,
          method: 'GET',
          createConnection: () => tls.connect({ socket, servername: url.hostname, rejectUnauthorized: false }),
          headers: {
            Host: url.hostname,
            'User-Agent': 'digital-dna-maintenance',
            Accept: 'application/vnd.github+json',
            ...(TOKEN ? { Authorization: `token ${TOKEN}` } : {}),
          },
        },
        (r) => {
          const chunks = [];
          r.on('data', (c) => chunks.push(c));
          r.on('end', () => resolve({ status: r.statusCode, text: Buffer.concat(chunks).toString('utf8') }));
        }
      );
      req.on('error', reject);
      req.end();
    });
    conn.on('error', reject);
    conn.end();
  });
}

const runs = await get(`https://api.github.com/repos/${OWNER}/${REPO}/actions/runs?per_page=5`);
const j = JSON.parse(runs.text);
console.log('workflow runs:', j.total_count);
for (const run of j.workflow_runs) {
  console.log(
    `  #${run.run_number} ${run.status.padEnd(11)} ${String(run.conclusion ?? '-').padEnd(8)} ${run.head_sha.slice(0, 7)}  ${run.created_at}`
  );
}

const pages = await get(`https://api.github.com/repos/${OWNER}/${REPO}/pages/builds/latest`);
const p = JSON.parse(pages.text);
if (p.status) {
  console.log('latest pages build:', p.status, p.error?.message ?? '', p.updated_at ?? '');
}
