'use strict';

/**
 * Yerel ses aktarıcı. Renderer'daki <audio> öğesi 127.0.0.1 üzerindeki bu
 * sunucuya bağlanır. Sunucu yayını TEK bir bağlantıda alır, ICY metadatasını
 * ayırır (şarkı adı → onTitle) ve ses verisini değişmeden <audio>'ya iletir.
 * Böylece yayın verisi iki kez indirilmez ve şarkı bilgisi aynı akıştan gelir.
 */

const http = require('http');
const https = require('https');
const crypto = require('crypto');
const { URL } = require('url');
const { IcyParser } = require('./icy');

const UA = 'Radyn/1.0';
const MAX_REDIRECTS = 5;
const SESSION_TTL_MS = 60 * 1000; // açılıp kullanılmayan oturum bu süre sonunda silinir

function createStreamProxy() {
  const sessions = new Map(); // id -> { url, onTitle, timer }
  let server = null;
  let port = 0;

  function handle(req, res) {
    const match = /^\/s\/([0-9a-f]{32})$/.exec(req.url || '');
    const session = match ? sessions.get(match[1]) : null;
    if (!session) {
      res.writeHead(404);
      res.end();
      return;
    }
    sessions.delete(match[1]); // her oturum tek kullanımlık
    clearTimeout(session.timer);

    const state = { req: null };
    res.on('close', () => {
      // <audio> bağlantıyı kapattı (istasyon değişti, durdu): yayın bağlantısını da kapat
      if (state.req) state.req.destroy();
    });
    relay(session.url, session.onTitle, res, 0, state);
  }

  function relay(target, onTitle, res, redirects, state) {
    const lib = /^https:/i.test(target) ? https : http;
    state.req = lib.get(
      target,
      { headers: { 'Icy-MetaData': '1', 'User-Agent': UA, Accept: '*/*' }, timeout: 20000 },
      (up) => {
        const { statusCode, headers } = up;
        if (statusCode >= 300 && statusCode < 400 && headers.location && redirects < MAX_REDIRECTS) {
          up.resume();
          relay(new URL(headers.location, target).href, onTitle, res, redirects + 1, state);
          return;
        }
        if (statusCode !== 200) {
          up.resume();
          if (!res.headersSent) res.writeHead(502);
          res.end();
          return;
        }

        res.writeHead(200, {
          'Content-Type': headers['content-type'] || 'audio/mpeg',
          'Cache-Control': 'no-store',
        });

        // Geri basınç: istemci yavaşsa yayın okumayı durdur
        const write = (data) => {
          if (!res.write(data)) {
            up.pause();
            res.once('drain', () => up.resume());
          }
        };

        const metaint = parseInt(headers['icy-metaint'], 10);
        if (Number.isFinite(metaint) && metaint > 0) {
          const parser = new IcyParser(metaint);
          up.on('data', (chunk) => parser.push(chunk, (title) => onTitle && onTitle(title), write));
        } else {
          up.on('data', write); // metadata yok: veriyi olduğu gibi ilet
        }
        up.on('end', () => res.end());
        up.on('error', () => res.destroy());
      },
    );
    state.req.on('timeout', () => state.req.destroy(new Error('zaman aşımı')));
    state.req.on('error', () => {
      if (!res.headersSent) res.writeHead(502);
      res.end();
    });
  }

  async function ensureServer() {
    if (server) return port;
    server = http.createServer(handle);
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', resolve);
    });
    port = server.address().port;
    return port;
  }

  /**
   * Yayın adresi için tek kullanımlık yerel bir URL döndürür.
   * @param {string} url  http(s) yayın adresi
   * @param {{ onTitle?: (title: string) => void }} [options]
   */
  async function open(url, { onTitle } = {}) {
    if (!/^https?:\/\/\S+$/i.test(url)) throw new Error('Geçersiz yayın adresi');
    await ensureServer();
    const id = crypto.randomBytes(16).toString('hex');
    const timer = setTimeout(() => sessions.delete(id), SESSION_TTL_MS);
    sessions.set(id, { url, onTitle, timer });
    return `http://127.0.0.1:${port}/s/${id}`;
  }

  function close() {
    for (const session of sessions.values()) clearTimeout(session.timer);
    sessions.clear();
    if (server) {
      server.close();
      server.closeAllConnections?.();
      server = null;
    }
  }

  return { open, close };
}

module.exports = { createStreamProxy };
