'use strict';

(() => {
  const I18N = window.RadynI18n;
  const ID3 = window.RadynId3;
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const HLS_RE = /\.m3u8?(\?|$)/i;
  const ACTIVE = new Set(['loading', 'buffering', 'playing']);
  const RETRY_LIMIT = 3;
  const audio = document.getElementById('audio');

  const state = {
    lang: 'en',
    regionNames: null,
    view: 'home',
    header: { title: null, sub: null },  // işlevler: dil değişince yeniden çevrilir
    gridMessage: null,                   // { key, vars }
    list: [],
    queue: [],
    queueIndex: -1,
    current: null,
    status: 'stopped',                   // stopped | loading | buffering | playing | error
    np: { artist: '', title: '', artUrl: '' },
    favorites: [],
    favIds: new Set(),
    recent: [],
    browseMode: 'countries',
    browseData: { countries: null, tags: null },
    browseItems: [],
    browseKey: null,
    hls: null,
    volume: 0.8,
    muted: false,
    startedAt: 0,
    requestId: 0,
    session: 0,                          // her yeni yayın denemesi artar
    retries: 0,
    retryTimer: null,
    tick: null,
    artKey: '',
  };

  const t = (key, vars) => I18N.translate(state.lang, key, vars);
  const $ = (id) => document.getElementById(id);
  const clamp01 = (n) => Math.min(1, Math.max(0, Number(n) || 0));

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

  const capitalize = (s) => s.charAt(0).toLocaleUpperCase(state.lang) + s.slice(1);

  function makeRegionNames(lang) {
    try {
      return new Intl.DisplayNames([lang], { type: 'region' });
    } catch {
      return null;
    }
  }

  /** Ülke kodunun seçili dildeki adı; bilinmiyorsa null. */
  function regionName(code) {
    const upper = String(code || '').toUpperCase();
    if (!state.regionNames || !/^[A-Z]{2}$/.test(upper)) return null;
    try {
      const name = state.regionNames.of(upper);
      return name && name !== upper ? name : null;
    } catch {
      return null;
    }
  }

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

  // ------------------------------------------------------------ dil ve metinler

  /** data-i18n öznitelikli tüm sabit metinleri seçili dile çevirir. */
  function applyStatic() {
    document.documentElement.lang = state.lang;
    document.querySelectorAll('[data-i18n]').forEach((node) => {
      node.textContent = t(node.dataset.i18n);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach((node) => {
      node.placeholder = t(node.dataset.i18nPlaceholder);
    });
    document.querySelectorAll('[data-i18n-aria-label]').forEach((node) => {
      node.setAttribute('aria-label', t(node.dataset.i18nAriaLabel));
    });
    $('langSelect').value = state.lang;
    applyMute(state.muted);
  }

  function setLang(lang) {
    if (!I18N.SUPPORTED_LANGS.includes(lang) || lang === state.lang) return;
    state.lang = lang;
    state.regionNames = makeRegionNames(lang);
    window.radio.setLang(lang);
    applyStatic();
    renderHeader();
    buildBrowseItems();
    filterBrowse();
    renderGrid();
    renderPlayer();
    renderStatusLine();
    reportState();
  }

  // ------------------------------------------------------------ başlık ve liste

  function setHeader(titleFn, subFn) {
    state.header = { title: titleFn, sub: subFn };
    renderHeader();
  }

  function renderHeader() {
    const { title, sub } = state.header;
    $('viewTitle').textContent = title ? title() : '';
    $('viewSub').textContent = sub ? (sub() || '') : '';
  }

  function setGridMessage(key, vars) {
    state.gridMessage = key ? { key, vars } : null;
    renderGridMessage();
  }

  function renderGridMessage() {
    const box = $('emptyState');
    if (!state.gridMessage) {
      box.classList.add('hidden');
      return;
    }
    box.textContent = t(state.gridMessage.key, state.gridMessage.vars);
    box.classList.remove('hidden');
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

    if (view === 'home') return showHome();

    if (view === 'favorites') {
      state.list = state.favorites;
      setHeader(() => t('favorites_title'), () => t('count_stations', { n: state.favorites.length }));
      renderGrid();
      return undefined;
    }

    if (view === 'recent') {
      const data = await window.radio.getStore();
      if (reqId !== state.requestId) return undefined;
      state.recent = data.recent;
      state.list = state.recent;
      setHeader(() => t('recent_title'), () => t('count_stations', { n: state.recent.length }));
      renderGrid();
      return undefined;
    }

    return loadStations({ type: 'top' }, () => t('top_title'), () => t('top_sub'), reqId);
  }

  /** Uygulamanın açıldığı ülkenin istasyonları; ülkede istasyon yoksa Popüler'e düşer. */
  async function showHome() {
    const reqId = ++state.requestId;
    state.view = 'home';
    setActiveNav('home');
    clearBrowseActive();
    setHeader(() => t('home_title'), () => t('home_detecting'));
    setGridMessage('loading');

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
      await loadStations({ type: 'top' }, () => t('top_title'), () => t('home_fallback_sub'), reqId);
      return;
    }

    const count = await loadStations(
      { type: 'country', value: code },
      () => t('home_label', { name: regionName(code) || code }),
      null,
      reqId,
    );
    if (reqId !== state.requestId || count > 0) return;
    await loadStations(
      { type: 'top' },
      () => t('top_title'),
      () => t('home_empty_sub', { name: regionName(code) || code }),
      reqId,
    );
  }

  /** İstasyon listesi yükler; istasyon sayısını döndürür (hata veya eski istekte -1). */
  async function loadStations(query, titleFn, subFn, reqId = ++state.requestId) {
    setHeader(titleFn, () => t('loading'));
    setGridMessage('loading');
    try {
      const list = await window.radio.stations(query);
      if (reqId !== state.requestId) return -1;
      state.list = list;
      const n = list.length;
      setHeader(titleFn, () => {
        const count = t('count_stations', { n });
        const extra = subFn ? subFn() : '';
        return extra ? `${count} · ${extra}` : count;
      });
      renderGrid();
      return n;
    } catch (err) {
      if (reqId !== state.requestId) return -1;
      state.list = [];
      setHeader(titleFn, () => '');
      setGridMessage('list_error', { msg: errorText(err) });
      return -1;
    }
  }

  function renderGrid() {
    const grid = $('stationGrid');
    if (!state.list.length) {
      grid.replaceChildren();
      const key = state.view === 'favorites'
        ? 'no_favorites'
        : state.view === 'recent'
          ? 'no_recent'
          : 'no_stations';
      setGridMessage(key);
      return;
    }
    setGridMessage(null);
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
        'aria-label': t('play_station', { name: station.name }),
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
      fav.title = isFav ? t('fav_remove') : t('fav_add');
      fav.setAttribute('aria-pressed', String(isFav));
      fav.replaceChildren(icon(isFav ? 'star-fill' : 'star'));
    });
  }

  // ------------------------------------------------------------ ülke / tür gezgini

  async function renderBrowse() {
    const list = $('browseList');
    list.replaceChildren(el('li', { class: 'muted pad', text: t('loading') }));
    try {
      if (state.browseMode === 'countries') {
        state.browseData.countries ??= await window.radio.countries();
      } else {
        state.browseData.tags ??= await window.radio.tags();
      }
      buildBrowseItems();
      filterBrowse();
    } catch (err) {
      list.replaceChildren(el('li', { class: 'muted pad', text: t('list_error', { msg: errorText(err) }) }));
    }
  }

  /** Veriden gezgin öğelerini (seçili dilde adlarla) üretir. */
  function buildBrowseItems() {
    if (state.browseMode === 'countries') {
      state.browseItems = (state.browseData.countries || [])
        .map((c) => {
          const name = regionName(c.code) || c.name;
          return {
            key: `country:${c.code}`,
            label: name,
            badge: c.code,
            count: c.count,
            onPick: () => loadStations({ type: 'country', value: c.code }, () => regionName(c.code) || c.name, null),
          };
        })
        .sort((a, b) => a.label.localeCompare(b.label, state.lang));
    } else {
      state.browseItems = (state.browseData.tags || []).map((tag) => ({
        key: `tag:${tag.name}`,
        label: capitalize(tag.name),
        count: tag.count,
        onPick: () => loadStations({ type: 'tag', value: tag.name }, () => capitalize(tag.name), null),
      }));
    }
  }

  function filterBrowse() {
    const query = $('browseFilter').value.trim().toLocaleLowerCase(state.lang);
    const items = state.browseItems.filter((it) => !query || it.label.toLocaleLowerCase(state.lang).includes(query));
    const list = $('browseList');
    if (!items.length) {
      list.replaceChildren(el('li', { class: 'muted pad', text: t('no_match') }));
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

  /** Yayını başlatır. Düz akışlar yerel aktarıcıdan, HLS yayınlar hls.js ile çalar. */
  async function startAudio(station) {
    destroyHls();
    const session = ++state.session;
    audio.volume = state.volume;
    audio.muted = state.muted;

    if (HLS_RE.test(station.url) && window.Hls && window.Hls.isSupported()) {
      attachHls(station);
      return;
    }

    let src = station.url;
    try {
      src = await window.radio.openStream(station.url);
    } catch {
      src = station.url; // aktarıcı kullanılamazsa doğrudan dene (şarkı bilgisi olmaz)
    }
    if (session !== state.session || state.status === 'stopped') return;

    audio.src = src;
    playAudio();
  }

  function playAudio() {
    const playing = audio.play();
    if (playing && playing.catch) {
      playing.catch((err) => {
        if (err.name !== 'AbortError') handleFailure();
      });
    }
  }

  function attachHls(station) {
    const hls = new window.Hls({ enableWorker: true });
    hls.on(window.Hls.Events.ERROR, (_event, data) => {
      if (data.fatal) handleFailure();
    });
    // HLS yayınlarında şarkı bilgisi ID3 etiketleriyle gelir
    hls.on(window.Hls.Events.FRAG_PARSING_METADATA, (_event, data) => {
      for (const sample of data.samples || []) {
        const info = ID3.parseId3(sample.data);
        if (!info) continue;
        const raw = info.artist && info.title ? `${info.artist} - ${info.title}` : (info.title || info.artist);
        if (raw) window.radio.reportTitle(raw);
      }
    });
    hls.loadSource(station.url);
    hls.attachMedia(audio);
    state.hls = hls;
    playAudio();
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
    state.session++; // bekleyen başlatmaları iptal et
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

  /** Ana süreçten (görev çubuğu, tepsi, medya tuşları, jump list, MPRIS) gelen komutlar. */
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
        return t('st_playing', { t: fmtElapsed(Date.now() - state.startedAt) });
      case 'loading':
        return t('st_loading');
      case 'buffering':
        return t('st_buffering');
      case 'error':
        return t('st_error');
      default:
        return state.current ? t('st_stopped') : '';
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
    $('npTitle').textContent = s ? (state.np.title || s.name) : t('player_empty_title');
    $('npSub').textContent = s ? npSubtitle() : t('player_empty_sub');
    renderArt();
    renderStatusLine();

    const active = ACTIVE.has(state.status);
    const playBtn = $('playBtn');
    playBtn.replaceChildren(icon(active ? 'pause' : 'play'));
    playBtn.setAttribute('aria-label', active ? t('stop') : t('play'));
    playBtn.title = active ? t('stop_hint') : t('play_hint');

    const multi = state.queue.length > 1;
    const prev = $('prevBtn');
    const next = $('nextBtn');
    prev.disabled = !multi;
    next.disabled = !multi;
    prev.setAttribute('aria-label', t('prev'));
    prev.title = t('prev_hint');
    next.setAttribute('aria-label', t('next'));
    next.title = t('next_hint');

    const fav = $('favCurrent');
    const isFav = Boolean(s) && state.favIds.has(s.uuid);
    fav.disabled = !s;
    fav.classList.toggle('on', isFav);
    fav.replaceChildren(icon(isFav ? 'star-fill' : 'star'));
    fav.title = isFav ? t('fav_remove') : t('fav_add');
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
    renderHeader();
    refreshMarks();
    renderPlayer();
  }

  // ------------------------------------------------------------ sessize alma

  /** Sesi kapatır/açar. Kaydırıcı değeri korunur; açınca aynı seviyeden devam eder. */
  function applyMute(muted) {
    state.muted = Boolean(muted);
    audio.muted = state.muted;
    const btn = $('muteBtn');
    btn.classList.toggle('muted', state.muted);
    btn.setAttribute('aria-pressed', String(state.muted));
    btn.setAttribute('aria-label', state.muted ? t('unmute') : t('mute'));
    btn.title = state.muted ? t('unmute_hint') : t('mute_hint');
    btn.replaceChildren(icon(state.muted ? 'volume-off' : 'volume'));
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
      album: t('album'),
      artwork: artSrc ? [{ src: artSrc }] : [],
    });
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

    $('langSelect').addEventListener('change', (event) => setLang(event.target.value));

    $('searchForm').addEventListener('submit', (event) => {
      event.preventDefault();
      const query = $('searchInput').value.trim();
      if (!query) return;
      state.view = 'search';
      setActiveNav(null);
      clearBrowseActive();
      loadStations({ type: 'search', value: query }, () => t('search_title', { q: query }), () => t('search_sub'));
    });

    $('playBtn').addEventListener('click', toggle);
    $('prevBtn').addEventListener('click', () => handleControl('prev'));
    $('nextBtn').addEventListener('click', () => handleControl('next'));
    $('favCurrent').addEventListener('click', () => {
      if (state.current) toggleFavorite(state.current);
    });

    $('muteBtn').addEventListener('click', () => applyMute(!state.muted));

    $('volume').addEventListener('input', (event) => {
      state.volume = clamp01(event.target.value);
      audio.volume = state.volume;
      window.radio.setSetting('volume', state.volume);
      if (state.muted && state.volume > 0) applyMute(false); // kaydırıcıyı oynatınca sesi aç
    });

    document.addEventListener('keydown', (event) => {
      if (event.ctrlKey && event.key.toLowerCase() === 'f') {
        event.preventDefault();
        $('searchInput').focus();
        return;
      }
      const tag = event.target && event.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
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
    state.regionNames = makeRegionNames(state.lang);
    applyStatic();

    if (!window.radio) {
      setGridMessage('bridge_error');
      return;
    }

    bindUi();
    window.radio.onControl(handleControl);
    window.radio.onNowPlaying(handleNowPlaying);
    window.radio.onAccent(applyAccent);
    window.radio.getAccent().then(applyAccent).catch(() => {});
    setupMediaSession();

    state.lang = I18N.resolveLang(await window.radio.getLang());
    state.regionNames = makeRegionNames(state.lang);
    applyStatic();

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
    window.radio.ready(); // jump list komutu varsa şimdi çalıştırılır
  }

  init().catch((err) => setGridMessage('init_error', { msg: errorText(err) }));
})();
