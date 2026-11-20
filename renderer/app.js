'use strict';

(() => {
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const HLS_RE = /\.m3u8?(\?|$)/i;
  const ACTIVE = new Set(['loading', 'buffering', 'playing']);
  const RETRY_LIMIT = 3;
  const audio = document.getElementById('audio');

  const state = {
    view: 'top',
    list: [],            // ekranda görünen istasyonlar
    queue: [],           // çalan listenin kopyası (önceki/sonraki için)
    queueIndex: -1,
    current: null,       // çalan istasyon
    status: 'stopped',   // stopped | loading | buffering | playing | error
    np: { artist: '', title: '', artUrl: '' }, // ICY'den gelen şu an çalan parça
    favorites: [],
    favIds: new Set(),
    recent: [],
    browseMode: 'countries',
    browseItems: [],
    browseKey: null,
    countries: null,
    tags: null,
    hls: null,
    volume: 0.8,
    muted: false,
    startedAt: 0,
    requestId: 0,
    retries: 0,
    retryTimer: null,
    tick: null,
    artKey: '',
  };

  // ------------------------------------------------------------ yardımcılar

  function el(tag, props = {}, ...children) {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(props)) {
      if (value === null || value === undefined || value === false) continue;
      if (key === 'class') node.className = value;
      else if (key === 'text') node.textContent = value;
      else if (key.startsWith('on') && typeof value === 'function') node.addEventListener(key.slice(2), value);
      else node.setAttribute(key, value === true ? '' : String(value));
    }
    for (const child of children.flat()) {
      if (child === null || child === undefined || child === false) continue;
      node.append(child instanceof Node ? child : document.createTextNode(String(child)));
    }
    return node;
  }

  function icon(name, cls = '') {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('class', `ic ${cls}`.trim());
    svg.setAttribute('aria-hidden', 'true');
    const use = document.createElementNS(SVG_NS, 'use');
    use.setAttribute('href', `#i-${name}`);
    svg.append(use);
    return svg;
  }

  const $ = (id) => document.getElementById(id);
  const clamp01 = (n) => Math.min(1, Math.max(0, Number(n) || 0));
  const capitalize = (s) => s.charAt(0).toLocaleUpperCase('tr') + s.slice(1);

  function errorText(err) {
    return String(err && err.message ? err.message : err)
      .replace(/^Error invoking remote method '[^']+': (Error: )?/, '');
  }

  function initials(name) {
    const words = String(name || '?').trim().split(/\s+/).filter(Boolean);
    const first = words[0] ? words[0][0] : '?';
    const second = words.length > 1 ? words[1][0] : '';
    return (first + second).toUpperCase();
  }

  function fmtElapsed(ms) {
    const total = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    const pad = (n) => String(n).padStart(2, '0');
    return h ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  }

  const regionNames = (() => {
    try {
      return new Intl.DisplayNames(['tr'], { type: 'region' });
    } catch {
      return null;
    }
  })();

  /** Ülke kodunun Türkçe adı; bilinmiyorsa null. */
  function regionName(code) {
    const upper = String(code || '').toUpperCase();
    if (!regionNames || !/^[A-Z]{2}$/.test(upper)) return null;
    try {
      const name = regionNames.of(upper);
      return name && name !== upper ? name : null;
    } catch {
      return null;
    }
  }

  /** Ülke adını Türkçe göster (kodu varsa), yoksa kaynaktaki adı. */
  function countryLabel(s) {
    return regionName(s.countryCode) || s.country || '';
  }

  function metaLine(s) {
    const quality = [s.codec, s.bitrate ? `${s.bitrate} kbps` : ''].filter(Boolean).join(' ');
    return [countryLabel(s), quality].filter(Boolean).join(' · ');
  }

  function logo(station, cls) {
    const wrap = el('div', { class: `logo ${cls}` });
    const fallback = () => wrap.replaceChildren(el('span', { text: initials(station.name) }));
    if (station.favicon) {
      wrap.append(el('img', {
        src: station.favicon,
        alt: '',
        loading: 'lazy',
        referrerpolicy: 'no-referrer',
        onerror: fallback,
      }));
    } else {
      fallback();
    }
    return wrap;
  }

  // ------------------------------------------------------------ başlık ve durum

  function setHeader(title, sub = '') {
    $('viewTitle').textContent = title;
    $('viewSub').textContent = sub;
  }

  function setGridMessage(text) {
    $('stationGrid').replaceChildren();
    const box = $('emptyState');
    box.textContent = text;
    box.classList.remove('hidden');
  }

  function clearGridMessage() {
    $('emptyState').classList.add('hidden');
  }

  function setActiveNav(view) {
    document.querySelectorAll('.nav-item').forEach((b) => {
      b.classList.toggle('active', b.dataset.view === view);
    });
  }

  function clearBrowseActive() {
    state.browseKey = null;
    document.querySelectorAll('.browse-btn.active').forEach((b) => b.classList.remove('active'));
  }

  // ------------------------------------------------------------ görünümler

  async function showView(view) {
    state.view = view;
    setActiveNav(view);
    clearBrowseActive();
    const reqId = ++state.requestId;

    if (view === 'favorites') {
      state.list = state.favorites;
      setHeader('Favoriler', `${state.favorites.length} istasyon`);
      renderGrid();
      return;
    }

    if (view === 'recent') {
      const data = await window.radio.getStore();
      if (reqId !== state.requestId) return;
      state.recent = data.recent;
      state.list = state.recent;
      setHeader('Son dinlenenler', `${state.recent.length} istasyon`);
      renderGrid();
      return;
    }

    if (view === 'home') return showHome();

    await loadStations({ type: 'top' }, 'Popüler', 'Dünya genelinde en çok oy alanlar', reqId);
    return undefined;
  }

  /** Uygulamanın açıldığı ülkenin istasyonları; ülkede istasyon yoksa Popüler'e düşer. */
  async function showHome() {
    const reqId = ++state.requestId;
    state.view = 'home';
    setActiveNav('home');
    clearBrowseActive();
    setHeader('Bulunduğum ülke', 'Konum tespit ediliyor…');
    setGridMessage('Yükleniyor…');

    let code = null;
    try {
      code = await window.radio.homeCountry();
    } catch {
      code = null;
    }
    if (reqId !== state.requestId) return;

    if (!code) {
      state.view = 'top';
      setActiveNav('top');
      await loadStations({ type: 'top' }, 'Popüler', 'konumunuz tespit edilemedi', reqId);
      return;
    }

    const name = regionName(code) || code;
    const count = await loadStations({ type: 'country', value: code }, `Konumunuz: ${name}`, '', reqId);
    if (reqId !== state.requestId || count > 0) return;
    await loadStations({ type: 'top' }, 'Popüler', `${name} için istasyon bulunamadı`, reqId);
  }

  /** Liste yükler ve istasyon sayısını döndürür (hata veya eski istekte -1). */
  async function loadStations(query, title, sub, reqId = ++state.requestId) {
    setHeader(title, 'Yükleniyor…');
    setGridMessage('Yükleniyor…');
    try {
      const list = await window.radio.stations(query);
      if (reqId !== state.requestId) return -1;
      state.list = list;
      setHeader(title, `${list.length} istasyon${sub ? ` · ${sub}` : ''}`);
      renderGrid();
      return list.length;
    } catch (err) {
      if (reqId !== state.requestId) return -1;
      state.list = [];
      setHeader(title, '');
      setGridMessage(`Liste alınamadı: ${errorText(err)}`);
      return -1;
    }
  }

  function renderGrid() {
    const grid = $('stationGrid');
    if (!state.list.length) {
      grid.replaceChildren();
      const text = state.view === 'favorites'
        ? 'Henüz favori yok. Bir istasyonun yıldız işaretine tıklayın.'
        : state.view === 'recent'
          ? 'Henüz dinlenen istasyon yok.'
          : 'Bu listede istasyon bulunamadı.';
      setGridMessage(text);
      return;
    }
    clearGridMessage();
    grid.replaceChildren(...state.list.map(stationCard));
    refreshMarks();
  }

  function stationCard(station) {
    const fav = el(
      'button',
      {
        class: 'fav',
        type: 'button',
        onclick: (event) => {
          event.stopPropagation();
          toggleFavorite(station);
        },
      },
      icon('star'),
    );
    return el(
      'article',
      {
        class: 'card',
        role: 'button',
        tabindex: '0',
        'data-uuid': station.uuid,
        'aria-label': `${station.name} istasyonunu çal`,
        onclick: () => playFromList(station),
        onkeydown: (event) => {
          // Yalnızca kartın kendisi odaktayken; ★ düğmesindeki Enter kart oynatmasın.
          if (event.key === 'Enter' && event.target === event.currentTarget) playFromList(station);
        },
      },
      el(
        'div',
        { class: 'card-top' },
        logo(station, 'card-logo'),
        el('span', { class: 'eq', 'aria-hidden': 'true' }, el('i'), el('i'), el('i')),
        fav,
      ),
      el('div', { class: 'card-name', text: station.name, title: station.name }),
      el('div', { class: 'card-meta', text: metaLine(station) }),
    );
  }

  /** Kartların çalan / favori durumunu günceller (yeniden oluşturmadan). */
  function refreshMarks() {
    const currentId = state.current ? state.current.uuid : null;
    const playing = state.status === 'playing';
    document.querySelectorAll('.card').forEach((card) => {
      const uuid = card.dataset.uuid;
      const isCurrent = uuid === currentId;
      card.classList.toggle('current', isCurrent);
      card.classList.toggle('playing', isCurrent && playing);
      const fav = card.querySelector('.fav');
      const isFav = state.favIds.has(uuid);
      fav.classList.toggle('on', isFav);
      fav.title = isFav ? 'Favorilerden çıkar' : 'Favorilere ekle';
      fav.setAttribute('aria-pressed', String(isFav));
      fav.replaceChildren(icon(isFav ? 'star-fill' : 'star'));
    });
  }

  // ------------------------------------------------------------ ülke / tür gezgini

  async function renderBrowse() {
    const list = $('browseList');
    list.replaceChildren(el('li', { class: 'muted pad', text: 'Yükleniyor…' }));
    try {
      if (state.browseMode === 'countries') {
        state.countries ??= await window.radio.countries();
        state.browseItems = state.countries.map((c) => ({
          key: `country:${c.code}`,
          label: c.name,
          badge: c.code,
          count: c.count,
          onPick: () => loadStations({ type: 'country', value: c.code }, c.name, ''),
        }));
      } else {
        state.tags ??= await window.radio.tags();
        state.browseItems = state.tags.map((t) => ({
          key: `tag:${t.name}`,
          label: capitalize(t.name),
          count: t.count,
          onPick: () => loadStations({ type: 'tag', value: t.name }, capitalize(t.name), ''),
        }));
      }
      filterBrowse();
    } catch (err) {
      list.replaceChildren(el('li', { class: 'muted pad', text: `Liste alınamadı: ${errorText(err)}` }));
    }
  }

  function filterBrowse() {
    const query = $('browseFilter').value.trim().toLocaleLowerCase('tr');
    const items = state.browseItems.filter((it) => !query || it.label.toLocaleLowerCase('tr').includes(query));
    const list = $('browseList');
    if (!items.length) {
      list.replaceChildren(el('li', { class: 'muted pad', text: 'Eşleşen yok' }));
      return;
    }
    list.replaceChildren(...items.map((item) => el(
      'li',
      {},
      el(
        'button',
        {
          class: `browse-btn ${item.key === state.browseKey ? 'active' : ''}`.trim(),
          type: 'button',
          'data-key': item.key,
          onclick: () => pickBrowse(item),
        },
        item.badge ? el('span', { class: 'code-badge', text: item.badge }) : null,
        el('span', { class: 'browse-label', text: item.label }),
        el('span', { class: 'count', text: String(item.count) }),
      ),
    )));
  }

  function pickBrowse(item) {
    state.view = 'browse';
    setActiveNav(null);
    state.browseKey = item.key;
    document.querySelectorAll('.browse-btn').forEach((b) => {
      b.classList.toggle('active', b.dataset.key === item.key);
    });
    item.onPick();
  }

  // ------------------------------------------------------------ oynatma

  function playFromList(station) {
    state.queue = state.list.slice();
    state.queueIndex = state.queue.findIndex((s) => s.uuid === station.uuid);
    play(station);
  }

  function play(station) {
    clearRetry();
    state.current = station;
    state.retries = 0;
    state.np = { artist: '', title: '', artUrl: '' };
    state.startedAt = 0;
    startAudio(station);
    window.radio.playStarted(station);
    setStatus('loading');
  }

  function playAt(index) {
    const n = state.queue.length;
    if (!n) return;
    state.queueIndex = ((index % n) + n) % n;
    play(state.queue[state.queueIndex]);
  }

  function startAudio(station) {
    destroyHls();
    audio.volume = state.volume;

    if (HLS_RE.test(station.url) && window.Hls && window.Hls.isSupported()) {
      const hls = new window.Hls({ enableWorker: true });
      hls.on(window.Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) handleFailure();
      });
      hls.loadSource(station.url);
      hls.attachMedia(audio);
      state.hls = hls;
    } else {
      audio.src = station.url;
    }

    const playing = audio.play();
    if (playing && playing.catch) {
      playing.catch((err) => {
        if (err.name !== 'AbortError') handleFailure();
      });
    }
  }

  function destroyHls() {
    if (state.hls) {
      state.hls.destroy();
      state.hls = null;
    }
  }

  function clearRetry() {
    clearTimeout(state.retryTimer);
    state.retryTimer = null;
  }

  /** Canlı yayın koptuğunda kademeli olarak yeniden bağlanır. */
  function handleFailure() {
    if (state.status === 'stopped' || !state.current) return;
    if (state.retries >= RETRY_LIMIT) {
      setStatus('error');
      return;
    }
    state.retries += 1;
    setStatus('buffering');
    const station = state.current;
    clearRetry();
    state.retryTimer = setTimeout(() => {
      state.retryTimer = null;
      if (state.current === station && state.status !== 'stopped') startAudio(station);
    }, 2000 * state.retries);
  }

  function stop() {
    setStatus('stopped');
    clearRetry();
    destroyHls();
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
    window.radio.playStopped();
  }

  function toggle() {
    if (ACTIVE.has(state.status)) return stop();
    if (state.current) return play(state.current);
    if (state.list.length) playFromList(state.list[0]);
    return undefined;
  }

  /** Ana süreçten (görev çubuğu, tepsi, medya tuşları, MPRIS) gelen komutlar. */
  function handleControl(action) {
    switch (action) {
      case 'toggle':
        return toggle();
      case 'play':
        return ACTIVE.has(state.status) ? undefined : toggle();
      case 'pause':
      case 'stop':
        return ACTIVE.has(state.status) ? stop() : undefined;
      case 'next':
        return playAt(state.queueIndex + 1);
      case 'prev':
        return playAt(state.queueIndex - 1);
      default:
        return undefined;
    }
  }

  // ------------------------------------------------------------ durum ve arayüz

  function setStatus(status) {
    state.status = status;
    if (status === 'playing' && !state.startedAt) state.startedAt = Date.now();
    if (status === 'stopped') state.startedAt = 0;
    if (status === 'playing') startTick();
    else stopTick();
    renderPlayer();
    refreshMarks();
    reportState();
  }

  function startTick() {
    if (!state.tick) state.tick = setInterval(renderStatusLine, 1000);
  }

  function stopTick() {
    clearInterval(state.tick);
    state.tick = null;
  }

  function statusText() {
    switch (state.status) {
      case 'playing':
        return `CANLI · ${fmtElapsed(Date.now() - state.startedAt)}`;
      case 'loading':
        return 'Bağlanıyor…';
      case 'buffering':
        return 'Tamponlanıyor…';
      case 'error':
        return 'Bağlantı kurulamadı';
      default:
        return state.current ? 'Durduruldu' : '';
    }
  }

  function renderStatusLine() {
    const node = $('status');
    node.textContent = statusText();
    node.classList.toggle('live', state.status === 'playing');
  }

  function npSubtitle() {
    const s = state.current;
    if (state.np.title) return [state.np.artist, s.name].filter(Boolean).join(' · ');
    return metaLine(s);
  }

  function renderArt() {
    const box = $('art');
    const s = state.current;
    if (!s) {
      state.artKey = '';
      box.replaceChildren(icon('music'));
      return;
    }
    const src = state.np.artUrl || s.favicon || '';
    const key = `${s.uuid}|${src}`;
    if (key === state.artKey) return;
    state.artKey = key;
    if (src) {
      box.replaceChildren(el('img', {
        src,
        alt: '',
        referrerpolicy: 'no-referrer',
        onerror: () => box.replaceChildren(el('span', { text: initials(s.name) })),
      }));
    } else {
      box.replaceChildren(el('span', { text: initials(s.name) }));
    }
  }

  function renderPlayer() {
    const s = state.current;
    $('npTitle').textContent = s ? (state.np.title || s.name) : 'Bir istasyon seçin';
    $('npSub').textContent = s ? npSubtitle() : 'Soldan bir ülke veya listeden bir istasyon seçin';
    renderArt();
    renderStatusLine();

    const active = ACTIVE.has(state.status);
    const playBtn = $('playBtn');
    playBtn.replaceChildren(icon(active ? 'pause' : 'play'));
    playBtn.setAttribute('aria-label', active ? 'Durdur' : 'Oynat');
    playBtn.title = active ? 'Durdur (Boşluk)' : 'Oynat (Boşluk)';

    const multi = state.queue.length > 1;
    $('prevBtn').disabled = !multi;
    $('nextBtn').disabled = !multi;

    const fav = $('favCurrent');
    const isFav = Boolean(s) && state.favIds.has(s.uuid);
    fav.disabled = !s;
    fav.classList.toggle('on', isFav);
    fav.replaceChildren(icon(isFav ? 'star-fill' : 'star'));
    fav.title = isFav ? 'Favorilerden çıkar' : 'Favorilere ekle';
    fav.setAttribute('aria-label', fav.title);

    updateMediaSession();
  }

  function reportState() {
    window.radio.reportState({
      active: ACTIVE.has(state.status),
      status: state.status,
      stationName: state.current ? state.current.name : '',
    });
  }

  function handleNowPlaying(np) {
    state.np = {
      artist: np && np.artist ? String(np.artist) : '',
      title: np && np.title ? String(np.title) : '',
      artUrl: np && np.artUrl ? String(np.artUrl) : '',
    };
    renderPlayer();
  }

  // ------------------------------------------------------------ favoriler

  function applyFavorites(favorites) {
    state.favorites = favorites;
    state.favIds = new Set(favorites.map((f) => f.uuid));
    $('favCount').textContent = String(favorites.length);
  }

  async function toggleFavorite(station) {
    const favorites = await window.radio.toggleFavorite(station);
    applyFavorites(favorites);
    if (state.view === 'favorites') {
      state.list = state.favorites;
      renderGrid();
    }
    refreshMarks();
    renderPlayer();
  }

  // ------------------------------------------------------------ sistem medya oturumu

  function setupMediaSession() {
    if (!('mediaSession' in navigator)) return;
    const handlers = {
      play: () => handleControl('play'),
      pause: () => handleControl('pause'),
      stop: () => handleControl('stop'),
      previoustrack: () => handleControl('prev'),
      nexttrack: () => handleControl('next'),
    };
    for (const [action, handler] of Object.entries(handlers)) {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch {
        /* desteklenmeyen eylem */
      }
    }
  }

  function updateMediaSession() {
    if (!('mediaSession' in navigator)) return;
    const s = state.current;
    navigator.mediaSession.playbackState = ACTIVE.has(state.status) ? 'playing' : (s ? 'paused' : 'none');
    if (!s || typeof MediaMetadata === 'undefined') return;
    const artSrc = state.np.artUrl || s.favicon;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: state.np.title || s.name,
      artist: state.np.artist || s.name,
      album: 'Radyn',
      artwork: artSrc ? [{ src: artSrc }] : [],
    });
  }

  // ------------------------------------------------------------ sessize alma

  /** Sesi kapatır/açar. Kaydırıcı değeri korunur; açınca aynı seviyeden devam eder. */
  function applyMute(muted) {
    state.muted = Boolean(muted);
    audio.muted = state.muted;
    const btn = $('muteBtn');
    btn.classList.toggle('muted', state.muted);
    btn.setAttribute('aria-pressed', String(state.muted));
    btn.setAttribute('aria-label', state.muted ? 'Sesi aç' : 'Sessize al');
    btn.title = state.muted ? 'Sesi aç (M)' : 'Sessize al (M)';
    btn.replaceChildren(icon(state.muted ? 'volume-off' : 'volume'));
  }

  // ------------------------------------------------------------ tema

  function applyAccent(color) {
    const root = document.documentElement;
    if (color && /^#[0-9a-f]{6}$/i.test(color)) root.style.setProperty('--accent', color);
    else root.style.removeProperty('--accent');
  }

  // ------------------------------------------------------------ olay bağlama

  function bindUi() {
    document.querySelectorAll('.nav-item').forEach((btn) => {
      btn.addEventListener('click', () => showView(btn.dataset.view));
    });

    document.querySelectorAll('[data-browse]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.browseMode = btn.dataset.browse;
        document.querySelectorAll('[data-browse]').forEach((b) => b.classList.toggle('active', b === btn));
        $('browseFilter').value = '';
        renderBrowse();
      });
    });

    $('browseFilter').addEventListener('input', filterBrowse);

    $('searchForm').addEventListener('submit', (event) => {
      event.preventDefault();
      const query = $('searchInput').value.trim();
      if (!query) return;
      state.view = 'search';
      setActiveNav(null);
      clearBrowseActive();
      loadStations({ type: 'search', value: query }, `“${query}” araması`, 'dünya genelinde');
    });

    $('playBtn').addEventListener('click', toggle);
    $('prevBtn').addEventListener('click', () => handleControl('prev'));
    $('nextBtn').addEventListener('click', () => handleControl('next'));
    $('favCurrent').addEventListener('click', () => {
      if (state.current) toggleFavorite(state.current);
    });

    $('volume').addEventListener('input', (event) => {
      state.volume = clamp01(event.target.value);
      audio.volume = state.volume;
      window.radio.setSetting('volume', state.volume);
      if (state.muted && state.volume > 0) applyMute(false); // kaydırıcıyı oynatınca sesi aç
    });

    $('muteBtn').addEventListener('click', () => applyMute(!state.muted));

    document.addEventListener('keydown', (event) => {
      if (event.ctrlKey && event.key.toLowerCase() === 'f') {
        event.preventDefault();
        $('searchInput').focus();
        return;
      }
      const tag = event.target && event.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (event.code === 'Space') {
        event.preventDefault();
        toggle();
      } else if (event.key === 'ArrowRight') {
        handleControl('next');
      } else if (event.key === 'ArrowLeft') {
        handleControl('prev');
      } else if (event.key.toLowerCase() === 'm' && !event.ctrlKey && !event.altKey) {
        applyMute(!state.muted);
      }
    });

    audio.addEventListener('playing', () => {
      state.retries = 0;
      setStatus('playing');
    });
    audio.addEventListener('waiting', () => {
      if (ACTIVE.has(state.status) && state.status !== 'buffering') setStatus('buffering');
    });
    audio.addEventListener('error', () => {
      if (audio.getAttribute('src')) handleFailure();
    });
    audio.addEventListener('ended', handleFailure);
  }

  // ------------------------------------------------------------ başlatma

  async function init() {
    if (!window.radio) {
      setGridMessage('Uygulama köprüsü (preload) yüklenemedi.');
      return;
    }

    bindUi();
    window.radio.onControl(handleControl);
    window.radio.onNowPlaying(handleNowPlaying);
    window.radio.onAccent(applyAccent);
    window.radio.getAccent().then(applyAccent).catch(() => {});
    setupMediaSession();

    const data = await window.radio.getStore();
    state.recent = data.recent;
    applyFavorites(data.favorites);
    state.volume = clamp01(data.settings.volume ?? 0.8);
    $('volume').value = String(state.volume);
    audio.volume = state.volume;

    applyMute(false);
    renderPlayer();
    renderBrowse();
    showView('home');
  }

  init().catch((err) => setGridMessage(`Başlatma hatası: ${errorText(err)}`));
})();
