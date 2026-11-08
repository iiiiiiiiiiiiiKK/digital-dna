// Prints the step-by-step result of the most recent Pages workflow run, so the
// CI evidence (type check, unit tests, build) is verifiable rather than assumed.
import http from 'node:http';
import https from 'node:https';
import tls from 'node:tls';

const TOKEN = process.env.GH_TOKEN;
const OWNER = 'iiiiiiiiiiiiiKK';
const REPO = 'digital-dna';
const PROXY = { host: '127.0.0.1', port: Number(process.env.GH_PROXY_PORT ?? 7897) };

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
          r.on('end', () => resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))));
        }
      );
      req.on('error', reject);
      req.end();
    });
    conn.on('error', reject);
    conn.end();
  });
}

const runs = await get(`https://api.github.com/repos/${OWNER}/${REPO}/actions/runs?per_page=1`);
const run = runs.workflow_runs[0];
console.log(`run #${run.run_number} ${run.head_sha.slice(0, 7)} — ${run.conclusion} (${run.created_at})`);

const jobs = await get(`https://api.github.com/repos/${OWNER}/${REPO}/actions/runs/${run.id}/jobs`);
for (const job of jobs.jobs) {
  console.log(`\nJOB ${job.name}: ${job.conclusion}`);
  for (const step of job.steps ?? []) {
    const mark = step.conclusion === 'success' ? 'OK  ' : step.conclusion === 'skipped' ? 'skip' : 'FAIL';
    console.log(`  ${mark} ${step.name}`);
  }
}
