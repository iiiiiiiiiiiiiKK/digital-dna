// Commits local file changes through the GitHub Git Data API.
//
// `git push` through the local proxy is unreliable from this machine while the
// REST API works, so this mirrors a normal commit: blob -> tree -> commit -> ref.
// The token is read from GH_TOKEN and is never written anywhere.
import http from 'node:http';
import https from 'node:https';
import tls from 'node:tls';
import fs from 'node:fs';
import path from 'node:path';

const TOKEN = process.env.GH_TOKEN;
if (!TOKEN) {
  console.error('GH_TOKEN is required');
  process.exit(1);
}
const OWNER = process.env.GH_OWNER ?? 'iiiiiiiiiiiiiKK';
const REPO = process.env.GH_REPO ?? 'digital-dna';
const PROXY = { host: '127.0.0.1', port: Number(process.env.GH_PROXY_PORT ?? 7897) };
const ROOT = process.cwd();

function request(urlStr, method = 'GET', payload = null) {
  const url = new URL(urlStr);
  const body = payload ? JSON.stringify(payload) : null;
  return new Promise((resolve, reject) => {
    const conn = http.request({ host: PROXY.host, port: PROXY.port, method: 'CONNECT', path: `${url.hostname}:443` });
    conn.on('connect', (res, socket) => {
      if (res.statusCode !== 200) return reject(new Error('proxy CONNECT ' + res.statusCode));
      const req = https.request(
        {
          host: url.hostname,
          path: url.pathname + url.search,
          method,
          createConnection: () => tls.connect({ socket, servername: url.hostname, rejectUnauthorized: false }),
          headers: {
            Host: url.hostname,
            'User-Agent': 'digital-dna-maintenance',
            Accept: 'application/vnd.github+json',
            Authorization: `token ${TOKEN}`,
            ...(body ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } : {}),
          },
        },
        (r) => {
          const chunks = [];
          r.on('data', (c) => chunks.push(c));
          r.on('end', () => resolve({ status: r.statusCode, text: Buffer.concat(chunks).toString('utf8') }));
        }
      );
      req.on('error', reject);
      if (body) req.write(body);
      req.end();
    });
    conn.on('error', reject);
    conn.end();
  });
}

async function api(pathname, method = 'GET', payload = null) {
  const r = await request(`https://api.github.com/repos/${OWNER}/${REPO}${pathname}`, method, payload);
  if (r.status >= 300) throw new Error(`${method} ${pathname} → ${r.status}: ${r.text.slice(0, 300)}`);
  return r.text ? JSON.parse(r.text) : {};
}

const FILES = process.argv.slice(2);
if (FILES.length === 0) {
  console.error('usage: node scripts/commit-via-api.mjs [--delete] <file> [file...]');
  process.exit(1);
}

const deleting = FILES[0] === '--delete';
const paths = deleting ? FILES.slice(1) : FILES;
const MESSAGE = process.env.COMMIT_MESSAGE ?? 'docs: describe the verification scripts';

const head = await api('/git/ref/heads/main');
const parentSha = head.object.sha;
const parentCommit = await api(`/git/commits/${parentSha}`);
console.log('parent:', parentSha.slice(0, 7));

const treeEntries = [];
for (const relative of paths) {
  const repoPath = relative.split(path.sep).join('/');
  if (deleting) {
    treeEntries.push({ path: repoPath, mode: '100644', type: 'blob', sha: null });
    console.log('delete', repoPath);
    continue;
  }
  const content = fs.readFileSync(path.join(ROOT, relative));
  const blob = await api('/git/blobs', 'POST', { content: content.toString('base64'), encoding: 'base64' });
  treeEntries.push({ path: repoPath, mode: '100644', type: 'blob', sha: blob.sha });
  console.log('blob', blob.sha.slice(0, 7), repoPath);
}

const tree = await api('/git/trees', 'POST', { base_tree: parentCommit.tree.sha, tree: treeEntries });
const commit = await api('/git/commits', 'POST', { message: MESSAGE, tree: tree.sha, parents: [parentSha] });
await api('/git/refs/heads/main', 'PATCH', { sha: commit.sha, force: false });

console.log('commit:', commit.sha.slice(0, 7));
console.log('html:', `https://github.com/${OWNER}/${REPO}/commit/${commit.sha}`);
