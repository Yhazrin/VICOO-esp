#!/usr/bin/env node
/**
 * 本地模拟「单域名 + /admin/ 静态挂载」：http://localhost:9111/ 与 http://localhost:9111/admin/
 * 不依赖 Docker / 系统 nginx。行为对齐 deploy/easy/nginx.conf 的 try_files。
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const SITE = path.join(REPO_ROOT, '.local-preview-site');
const PORT = Number(process.env.PREVIEW_PORT || 9111);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.map': 'application/json',
};

function buildAll() {
  console.log('→ 构建 frontend/web-react …');
  const r1 = spawnSync('npm', ['run', 'build'], {
    cwd: path.join(REPO_ROOT, 'frontend/web-react'),
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (r1.status !== 0) process.exit(r1.status ?? 1);

  console.log('→ 构建 admin …');
  const r2 = spawnSync('npm', ['run', 'build'], {
    cwd: path.join(REPO_ROOT, 'admin'),
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (r2.status !== 0) process.exit(r2.status ?? 1);
}

function mergeDist() {
  fs.rmSync(SITE, { recursive: true, force: true });
  fs.mkdirSync(SITE, { recursive: true });
  const webDist = path.join(REPO_ROOT, 'frontend/web-react/dist');
  const adminDist = path.join(REPO_ROOT, 'admin/dist');
  if (!fs.existsSync(webDist)) {
    console.error('缺少 frontend/web-react/dist，请先构建主站');
    process.exit(1);
  }
  if (!fs.existsSync(adminDist)) {
    console.error('缺少 admin/dist，请先构建 admin');
    process.exit(1);
  }
  fs.cpSync(webDist, SITE, { recursive: true });
  fs.mkdirSync(path.join(SITE, 'admin'), { recursive: true });
  fs.cpSync(adminDist, path.join(SITE, 'admin'), { recursive: true });
  console.log(`→ 已合并到 ${SITE}`);
}

function sendFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const type = MIME[ext] || 'application/octet-stream';
  const stream = fs.createReadStream(filePath);
  stream.on('error', () => {
    res.writeHead(404);
    res.end('Not found');
  });
  res.writeHead(200, { 'Content-Type': type });
  stream.pipe(res);
}

/** 对齐 nginx try_files：先试文件/目录 index，再回退 SPA index */
function tryFiles(root, relativePath, fallbacks) {
  const clean = decodeURIComponent(relativePath || '').replace(/^\/+/, '');
  const full = path.normalize(path.join(root, clean));
  if (!full.startsWith(root)) return null;
  try {
    if (fs.existsSync(full)) {
      const st = fs.statSync(full);
      if (st.isFile()) return full;
      if (st.isDirectory()) {
        const idx = path.join(full, 'index.html');
        if (fs.existsSync(idx)) return idx;
      }
    }
  } catch {
    return null;
  }
  for (const fb of fallbacks) {
    const p = path.join(root, fb);
    if (fs.existsSync(p) && fs.statSync(p).isFile()) return p;
  }
  return null;
}

const server = http.createServer((req, res) => {
  let u = req.url.split('?')[0];
  if (u === '/admin') {
    res.writeHead(301, { Location: '/admin/' });
    res.end();
    return;
  }

  // 对齐 nginx：^~ /admin/ 前缀 → SPA 回退 admin/index.html
  if (u.startsWith('/admin/')) {
    const rel = u.slice(1); // admin/...
    const file = tryFiles(SITE, rel, ['admin/index.html']);
    if (file) {
      sendFile(res, file);
      return;
    }
  }

  const rel = u.slice(1) || '';
  const file = tryFiles(SITE, rel, ['index.html']);
  if (file) {
    sendFile(res, file);
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

const main = () => {
  const skipBuild = process.argv.includes('--no-build');
  if (!skipBuild) {
    buildAll();
  }
  mergeDist();

  server.listen(PORT, '127.0.0.1', () => {
    console.log(`\n✓ 预览: http://127.0.0.1:${PORT}/`);
    console.log(`✓ 管理端: http://127.0.0.1:${PORT}/admin/`);
    console.log('  Ctrl+C 结束\n');
  });
};

main();
