(() => {
  'use strict';

  const SAVE_KEY = 'slime-tashitashi-v1';
  const $ = s => document.querySelector(s);
  const { NUM, STAGES, WEAPONS, PATHS, BOSS_AT, bossFor, PRAISE, SLIME_CRY, Sound, Slime } = window;
  const QUESTIONS = 10;    // 1の だんは 1+1 〜 1+10
  // リズム（びょう）。こどもが「いち、に、さん」と かぞえられる はやさ
  const HIT = 0.55;        // 「たったった」の 1つぶん
  const GAP = 0.75;        // 「1」「たす」「1」「は？」の あいだ
  const MERGE = 0.5;       // がったいの「た」1つぶん

  // ---------- セーブ ----------
  //   cleared: クリアした だん / plays: だんごとの クリア かいすう / weapon: もっている ぶき（0 は なし）
  function defaultSave() {
    return { cleared: [], plays: {}, weapon: 0, voice: true };
  }
  function loadSave() {
    try {
      const s = JSON.parse(localStorage.getItem(SAVE_KEY));
      if (s && typeof s === 'object') return Object.assign(defaultSave(), s);
    } catch (e) { /* つかえない ときは あたらしく */ }
    return defaultSave();
  }
  function writeSave() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* むし */ }
    if (window.Cloud) Cloud.saveChanged();
  }
  let save = loadSave();
  const maxCleared = () => Math.max(0, ...save.cleared);
  const isOpen = n => n <= maxCleared() + 1;
  const owned = id => save.cleared.includes(id);
  const weapon = () => (owned(save.weapon) ? save.weapon : 0);
  const stageOf = n => STAGES[n - 1];

  // ---------- キャンセルできる まち ----------
  // ホームに もどったら epoch を すすめて、うごいている えんしゅつを ぜんぶ とめる
  let epoch = 0;
  const CANCEL = Symbol('cancel');
  function wait(ms) {
    const my = epoch;
    return new Promise((res, rej) => setTimeout(() => (my === epoch ? res() : rej(CANCEL)), ms));
  }
  // sec びょう あとに fn（epoch が かわったら やめる）
  function later(sec, fn) {
    const my = epoch;
    setTimeout(() => { if (my === epoch) fn(); }, sec * 1000);
  }
  const guard = p => p.catch(e => { if (e !== CANCEL) throw e; });
  const shuffle = a => {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const voiceOn = () => save.voice !== false;
  const sayNum = (n, when = 0) => { if (voiceOn()) Sound.say(NUM[n], { now: true, when }); };

  // ---------- がめん ----------
  function show(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.id === id));
    keepAwake(id !== 'screen-title');
  }
  function overlay(id, on) {
    $(id).classList.toggle('show', on);
  }

  // ---------- タイトル ----------
  function renderTitle() {
    const map = $('#stage-map');
    map.innerHTML = STAGES.map(s => {
      const open = isOpen(s.n), done = save.cleared.includes(s.n);
      return `<button class="stage-btn${open ? '' : ' locked'}${done ? ' done' : ''}" data-n="${s.n}" style="--c:${s.color}"${open ? '' : ' disabled'}>` +
        `<b>${s.n}</b><small>の だん</small>${done ? '<i class="sb-star">⭐</i>' : ''}${open ? '' : '<i class="sb-lock">🔒</i>'}</button>`;
    }).join('');
    map.querySelectorAll('.stage-btn').forEach(b => {
      b.onclick = () => { Sound.unlock(); Sound.tap(); startStage(Number(b.dataset.n)); };
    });
    // タイトルの すらいむたち
    const next = Math.min(maxCleared() + 1, STAGES.length);
    $('#title-slimes').innerHTML = [1, 2, 3].map(i =>
      Slime.html(stageOf(((next - 2 + i) % 10 + 10) % 10 + 1).color, i === 2 ? weapon() : 0, `ts ts-${i}`)).join('');
    $('#weapon-count').textContent = `${save.cleared.length}/${WEAPONS.length}`;
    $('#btn-play').innerHTML = save.cleared.length >= STAGES.length ? 'あそぶ！' : `あそぶ！<small>${next}の だん</small>`;
  }
  $('#btn-play').onclick = () => {
    Sound.unlock();
    Sound.tap();
    startStage(Math.min(maxCleared() + 1, STAGES.length));
  };
  $('#title-slimes').addEventListener('click', e => {
    const s = e.target.closest('.slime');
    if (!s) return;
    Sound.unlock();
    Sound.snare();
    Sound.puni(0.02, 3);
    s.classList.remove('boing');
    void s.offsetWidth;
    s.classList.add('boing');
  });

  // ---------- たしざん ----------
  let stage = 0;      // いまの だん
  let qi = 0;         // なんもんめ（0〜9）
  let q = null;       // { a, b, ans, choices }
  let locked = true;

  function startStage(n) {
    epoch++;
    Sound.hush();
    stage = n;
    qi = 0;
    const st = stageOf(n);
    document.documentElement.style.setProperty('--stage', st.color);
    $('#stage-label').textContent = `${n}の だん`;
    renderProgress();
    resetField();
    $('#btn-start').hidden = false;
    $('#choices').innerHTML = '';
    $('#btn-again').hidden = true;
    show('screen-play');
    if (!(history.state && history.state.play)) history.pushState({ play: true }, '');
    if (voiceOn()) Sound.say(`${NUM[n]}の だん`);
  }
  $('#btn-start').onclick = () => {
    Sound.unlock();
    $('#btn-start').hidden = true;
    nextQuestion();
  };

  function renderProgress() {
    $('#progress').innerHTML = Array.from({ length: QUESTIONS }, (_, i) =>
      `<i class="pdot${i < qi ? ' done' : ''}${i === qi ? ' now' : ''}">${BOSS_AT.includes(i + 1) ? '<b>👑</b>' : ''}</i>`).join('');
  }

  function resetField() {
    $('.group-a').innerHTML = '';
    $('.group-b').innerHTML = '';
    $('#merged').innerHTML = '';
    $('#merged').className = 'merged';
    document.querySelectorAll('.eq-slot').forEach(s => s.classList.remove('on', 'hit'));
    $('.eq-ans b').textContent = '？';
  }

  function makeChoices(ans) {
    const opts = new Set([ans]);
    const near = shuffle([-2, -1, 1, 2, 3, -3]);
    for (const d of near) {
      if (opts.size >= 3) break;
      const v = ans + d;
      if (v >= 2 && v <= 20) opts.add(v);
    }
    return shuffle([...opts]);
  }

  function nextQuestion() {
    const a = stage, b = qi + 1;
    q = { a, b, ans: a + b, choices: makeChoices(a + b) };
    renderProgress();
    present();
  }

  // すらいむの おおきさ（かずが おおいと ちいさく）
  function slimeSize() {
    const f = $('#field');
    const w = f.clientWidth / 2, h = f.clientHeight;
    const n = Math.max(q.a, q.b);
    // いちばん おおきく ならべられる れつの かずを さがす
    let best = 0;
    for (let cols = 1; cols <= n; cols++) {
      const rows = Math.ceil(n / cols);
      best = Math.max(best, Math.min((w - 16) / cols - 4, (h - 24) / rows - 4));
    }
    return Math.max(26, Math.min(92, best));
  }

  // 「1」「たす」「1」「は？」を リズムよく
  function present() {
    epoch++;
    locked = true;
    resetField();
    $('#choices').innerHTML = '';
    $('#btn-again').hidden = true;
    const color = stageOf(stage).color;
    const size = slimeSize();
    $('#field').style.setProperty('--sz', size + 'px');
    const wp = weapon();
    const slot = (cls, sec, n) => later(sec, () => {
      const s = $(cls);
      if (n != null) s.querySelector('b').textContent = n;
      s.classList.add('on');
    });
    const spawn = (group, sec, i) => later(sec, () => {
      const s = Slime.el(color, wp, 'pop');
      s.dataset.i = i;
      $(group).appendChild(s);
    });
    let t = 0.3;
    // 1つめの かず: かずの ぶんだけ「た」
    slot('.eq-a', t, q.a);
    sayNum(q.a, t);
    for (let i = 0; i < q.a; i++) {
      Sound.snare(t + i * HIT);
      Sound.puni(t + i * HIT + 0.01, i);
      spawn('.group-a', t + i * HIT, i);
    }
    t += q.a * HIT + GAP;
    // たす:「たた」
    slot('.eq-plus', t);
    if (voiceOn()) Sound.say('たす', { now: true, when: t });
    Sound.snare(t, { vol: 0.75, pitch: 1.15 });
    Sound.snare(t + HIT * 0.5, { vol: 0.75, pitch: 1.15 });
    t += HIT + GAP;
    // 2つめの かず
    slot('.eq-b', t, q.b);
    sayNum(q.b, t);
    for (let i = 0; i < q.b; i++) {
      Sound.snare(t + i * HIT);
      Sound.puni(t + i * HIT + 0.01, q.a + i);
      spawn('.group-b', t + i * HIT, q.a + i);
    }
    t += q.b * HIT + GAP;
    // は？:「た」
    slot('.eq-ha', t);
    slot('.eq-ans', t);
    if (voiceOn()) Sound.say('は？', { now: true, when: t });
    Sound.snare(t, { vol: 1.1 });
    Sound.tomUp(t + 0.02);
    t += HIT + GAP * 0.6;
    later(t, renderChoices);
  }

  function renderChoices() {
    const box = $('#choices');
    box.innerHTML = q.choices.map((v, i) =>
      `<button class="choice" data-v="${v}" style="animation-delay:${i * 0.09}s">${v}</button>`).join('');
    q.choices.forEach((_, i) => Sound.blip(i, i * 0.09));
    box.querySelectorAll('.choice').forEach(b => { b.onclick = () => answer(Number(b.dataset.v), b); });
    $('#btn-again').hidden = false;
    locked = false;
  }
  $('#btn-again').onclick = () => { if (!locked) present(); };

  function answer(v, btn) {
    if (locked) return;
    if (v !== q.ans) {
      // しっぱいは じみに: ブブー と ならべかえ だけ
      locked = true;
      Sound.buzz();
      btn.classList.add('no');
      later(0.65, () => {
        const before = q.choices.join();
        do shuffle(q.choices); while (q.choices.join() === before);
        const box = $('#choices');
        box.innerHTML = q.choices.map(x => `<button class="choice plain" data-v="${x}">${x}</button>`).join('');
        box.querySelectorAll('.choice').forEach(b => { b.onclick = () => answer(Number(b.dataset.v), b); });
        locked = false;
      });
      return;
    }
    locked = true;
    btn.classList.add('yes');
    document.querySelectorAll('.choice').forEach(b => { if (b !== btn) b.classList.add('fade'); });
    $('#btn-again').hidden = true;
    Sound.ding();
    guard(merge());
  }

  // せいかい: こたえの かずだけ「た」と ならしながら、すらいむが 1ぴきずつ くっついて 1つに がったい
  async function merge() {
    await wait(350);
    const field = $('#field');
    const fr = field.getBoundingClientRect();
    const m = $('#merged');
    const all = [...document.querySelectorAll('.group-a .slime'), ...document.querySelectorAll('.group-b .slime')];
    const color = stageOf(stage).color;
    const base = Math.max(56, parseFloat(field.style.getPropertyValue('--sz')) || 60);
    const maxSz = Math.min(fr.width * 0.62, fr.height * 0.95);
    const sizeOf = k => Math.min(maxSz, base * (0.9 + Math.sqrt(k) * 0.62));
    m.innerHTML = Slime.html(color, weapon(), 'big') + '<b class="m-num"></b>';
    const big = m.querySelector('.slime');
    const cx = fr.width / 2, cy = fr.height * 0.55;
    all.forEach((s, k) => {
      const sec = k * MERGE;
      Sound.snare(sec, { vol: 0.9 + k * 0.012 });
      Sound.puni(sec + 0.02, k);
      later(sec, () => {
        const r = s.getBoundingClientRect();
        const dx = cx - (r.left - fr.left + r.width / 2), dy = cy - (r.top - fr.top + r.height / 2);
        s.classList.remove('pop');
        s.style.transition = 'transform .16s ease-in, opacity .16s';
        s.style.transform = `translate(${dx}px, ${dy}px) scale(.6)`;
        s.style.opacity = '0';
        later(0.15, () => {
          m.classList.add('on');
          big.style.width = big.style.height = sizeOf(k + 1) + 'px';
          big.classList.remove('squish');
          void big.offsetWidth;
          big.classList.add('squish');
          m.querySelector('.m-num').textContent = k + 1;
        });
      });
    });
    const end = all.length * MERGE + 0.25;
    Sound.kick(end);
    Sound.crash(end, 0.6);
    await wait(end * 1000);
    m.classList.add('done');
    const ans = $('.eq-ans');
    ans.querySelector('b').textContent = q.ans;
    ans.classList.add('hit');
    if (voiceOn()) {
      Sound.say(NUM[q.ans]);
      Sound.say(pick(PRAISE));
    }
    await wait(1700);
    qi++;
    renderProgress();
    if (BOSS_AT.includes(qi)) {
      await wait(400);
      startBoss();
    } else if (qi < QUESTIONS) {
      nextQuestion();
    } else {
      await wait(300);
      clearStage();
    }
  }

  // ---------- ボス ----------
  let boss = null;    // { def, hp, pi }
  const tr = {
    svg: $('#trace'), band: $('#trace .tr-band'), dash: $('#trace .tr-dash'), ink: $('#trace .tr-ink'),
    dot: $('#trace .tr-dot'), start: $('#trace .tr-start'), goal: $('#trace .tr-goal'),
    pts: [], len: 0, idx: 0, active: false, on: false, ticks: 0,
  };

  function renderHP() {
    $('#boss-hp').innerHTML = Array.from({ length: boss.def.hits }, (_, i) =>
      `<i class="hp${i < boss.hp ? '' : ' gone'}">❤️</i>`).join('');
  }

  async function startBoss() {
    epoch++;
    const def = bossFor(stage, qi);
    boss = { def, hp: def.hits, pi: 0 };
    $('#boss-label').textContent = def.name;
    renderHP();
    $('#boss').innerHTML = Slime.bossHTML(def);
    $('#boss').className = 'boss enter';
    $('#hero').innerHTML = Slime.html(stageOf(stage).color, weapon() || 1, 'hero-slime');
    $('#hero').className = 'hero';
    $('#arena-fx').innerHTML = '';
    hideTrace();
    $('#boss-msg').textContent = 'ボスが あらわれた！';
    show('screen-boss');
    Sound.rumble();
    Sound.roll(0.4, 0.6);
    await guard((async () => {
      Sound.say('ボスが あらわれた！');
      Sound.say(def.name);
      Sound.say(def.enter, { who: 'boss' });
      await wait(2600);
      $('#boss').className = 'boss';
      $('#boss-msg').textContent = 'せんを なぞって こうげきだ！';
      Sound.say('せんを なぞって こうげきだ！');
      showTrace();
    })());
  }

  function hideTrace() {
    tr.on = false;
    tr.active = false;
    tr.svg.classList.remove('show', 'miss');
  }
  function showTrace() {
    const d = PATHS[boss.def.paths[boss.pi % boss.def.paths.length]];
    [tr.band, tr.dash, tr.ink].forEach(p => p.setAttribute('d', d));
    tr.len = tr.band.getTotalLength();
    tr.pts = [];
    const n = Math.ceil(tr.len / 1.5);
    for (let i = 0; i <= n; i++) {
      const p = tr.band.getPointAtLength(tr.len * i / n);
      tr.pts.push({ x: p.x, y: p.y });
    }
    const s = tr.pts[0], g = tr.pts[tr.pts.length - 1];
    tr.start.setAttribute('transform', `translate(${s.x} ${s.y})`);
    tr.goal.setAttribute('x', g.x);
    tr.goal.setAttribute('y', g.y + 3.5);
    tr.ink.style.strokeDasharray = tr.len;
    setInk(0);
    // うごく ひかりで なぞりかたを みせる
    tr.dot.innerHTML = `<animateMotion dur="${Math.max(1.4, tr.len / 60)}s" repeatCount="indefinite" path="${d}"/>`;
    tr.svg.classList.add('show');
    tr.on = true;
  }
  function setInk(i) {
    tr.idx = i;
    tr.ink.style.strokeDashoffset = tr.len * (1 - i / (tr.pts.length - 1));
    tr.svg.classList.toggle('tracing', i > 0);
  }
  function svgPoint(e) {
    const m = tr.svg.getScreenCTM().inverse();
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m);
    return { x: p.x, y: p.y };
  }
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const TOL = 13, STRAY = 24;

  tr.svg.addEventListener('pointerdown', e => {
    if (!tr.on) return;
    const p = svgPoint(e);
    if (dist(p, tr.pts[0]) > TOL + 4) return;
    tr.svg.setPointerCapture(e.pointerId);
    tr.active = true;
    tr.ticks = 0;
    tr.svg.classList.remove('miss');
    Sound.rim();
    setInk(0);
  });
  tr.svg.addEventListener('pointermove', e => {
    if (!tr.active) return;
    const p = svgPoint(e);
    let best = -1, bd = Infinity;
    for (let j = tr.idx; j < Math.min(tr.pts.length, tr.idx + 14); j++) {
      const d = dist(p, tr.pts[j]);
      if (d < bd) { bd = d; best = j; }
    }
    if (bd > STRAY) return miss();
    if (bd <= TOL && best > tr.idx) {
      setInk(best);
      // なぞるたびに「た、た、た」と リズムよく
      const step = Math.floor(best / (tr.pts.length - 1) * 8);
      while (tr.ticks < step) { tr.ticks++; Sound.snare(0, { vol: 0.35 + tr.ticks * 0.06, pitch: 1 + tr.ticks * 0.04 }); }
      if (best >= tr.pts.length - 3) hit();
    }
  });
  const up = () => {
    if (!tr.active) return;
    if (tr.idx >= tr.pts.length * 0.9) hit(); else miss();
  };
  tr.svg.addEventListener('pointerup', up);
  tr.svg.addEventListener('pointercancel', up);

  // なぞりそこね: しずかに もどる だけ
  function miss() {
    tr.active = false;
    setInk(0);
    tr.svg.classList.remove('miss');
    void tr.svg.getBoundingClientRect();
    tr.svg.classList.add('miss');
  }

  function hit() {
    if (!tr.active) return;
    tr.active = false;
    tr.on = false;
    guard(attack());
  }

  async function attack() {
    setInk(tr.pts.length - 1);
    await wait(200);
    tr.svg.classList.remove('show');
    const hero = $('#hero'), bs = $('#boss');
    // ボスの まえまで とんでいく
    const hr = hero.getBoundingClientRect(), br = bs.getBoundingClientRect();
    hero.style.setProperty('--dx', `${br.left - hr.left - hr.width * 0.55}px`);
    hero.style.setProperty('--dy', `${br.top + br.height * 0.62 - (hr.top + hr.height / 2)}px`);
    hero.className = 'hero dash';
    Sound.say(pick(SLIME_CRY), { who: 'slime', now: true });
    Sound.swing(0.25);
    await wait(380);
    hero.className = 'hero dash swing';
    Sound.snare(0, { vol: 1.3 });
    Sound.boom(0.02);
    bs.className = 'boss ouch';
    const fx = $('#arena-fx');
    fx.innerHTML = '<span class="fx-pow">💥</span><span class="fx-star s1">⭐</span><span class="fx-star s2">✨</span><span class="fx-star s3">⭐</span>';
    boss.hp--;
    renderHP();
    await wait(500);
    if (boss.hp > 0) Sound.say(boss.def.ouch[(boss.def.hits - boss.hp - 1) % boss.def.ouch.length], { who: 'boss' });
    await wait(600);
    hero.className = 'hero back';
    bs.className = 'boss';
    fx.innerHTML = '';
    await wait(500);
    hero.className = 'hero';
    if (boss.hp > 0) {
      boss.pi++;
      $('#boss-msg').textContent = `あと ${boss.hp}かい！`;
      showTrace();
      return;
    }
    // やっつけた
    Sound.say(boss.def.lose, { who: 'boss' });
    bs.className = 'boss lose';
    Sound.roll(0.2, 1.0);
    Sound.poof(1.4);
    $('#boss-msg').textContent = 'やっつけた！';
    await wait(1800);
    Sound.say('やっつけた！');
    hero.className = 'hero jump';
    Sound.say('わーい！', { who: 'slime' });
    await wait(1800);
    if (qi < QUESTIONS) {
      // つぎの もんだいへ
      show('screen-play');
      nextQuestion();
    } else {
      clearStage();
    }
  }

  // ---------- クリア ----------
  function clearStage() {
    epoch++;
    const n = stage;
    const first = !save.cleared.includes(n);
    if (first) {
      save.cleared = [...save.cleared, n].sort((a, b) => a - b);
      save.weapon = n;   // あたらしい ぶきを もつ
    }
    save.plays = { ...save.plays, [n]: (save.plays[n] || 0) + 1 };
    writeSave();
    const w = WEAPONS[n - 1];
    const ov = $('#overlay-clear');
    const all = save.cleared.length >= STAGES.length && n === STAGES.length;
    ov.querySelector('.clear-title').textContent = all ? '🎉 ぜんぶ クリア！' : `🎉 ${n}の だん クリア！`;
    ov.querySelector('.reward-lead').textContent = first ? '🎁 あたらしい ぶきを てにいれた！' : 'もっている ぶき';
    ov.querySelector('.reward-slime').innerHTML = Slime.html(stageOf(n).color, first ? w.id : weapon(), 'reward-sl');
    ov.querySelector('.reward-name').textContent = first ? `『${w.name}』` : '';
    ov.querySelector('.reward').classList.toggle('new', first);
    ov.querySelector('.confetti').innerHTML = Array.from({ length: 24 }, (_, i) =>
      `<i style="left:${(i * 41) % 100}%;animation-delay:${(i % 8) * 0.12}s;background:${STAGES[i % 10].color}"></i>`).join('');
    $('#btn-next').hidden = n >= STAGES.length;
    overlay('#overlay-clear', true);
    Sound.fanfare();
    Sound.say(`${NUM[n]}の だん`);
    Sound.say('クリア！');
    if (first) {
      Sound.say('あたらしい ぶきを てにいれた！');
      Sound.say(w.name);
    }
    if (all) Sound.say('ぜんぶ クリア！ すらいむ マスターだ！');
  }
  $('#btn-next').onclick = () => {
    overlay('#overlay-clear', false);
    startStage(Math.min(stage + 1, STAGES.length));
  };
  $('#btn-stop').onclick = () => {
    overlay('#overlay-clear', false);
    Sound.say('きょうも がんばったね。また あしたね！');
    goHome(true);
  };

  function goHome(fromButton) {
    epoch++;
    if (!fromButton) Sound.hush();
    hideTrace();
    ['#overlay-clear', '#overlay-weapons', '#overlay-adult', '#overlay-cloud'].forEach(id => overlay(id, false));
    renderTitle();
    show('screen-title');
    if (history.state && history.state.play) history.back();
  }
  $('#btn-home').onclick = () => goHome(false);
  $('#btn-home2').onclick = () => goHome(false);
  // Android の「もどる」で タイトルへ
  window.addEventListener('popstate', () => {
    if (!$('#screen-title').classList.contains('active')) {
      epoch++;
      Sound.hush();
      hideTrace();
      overlay('#overlay-clear', false);
      renderTitle();
      show('screen-title');
    }
  });

  // ---------- 🗡 ぶき ----------
  function renderWeapons() {
    const color = stageOf(Math.min(maxCleared() || 1, 10)).color;
    $('#weapon-grid').innerHTML = [{ id: 0, name: 'なし' }, ...WEAPONS].map(w => {
      const has = w.id === 0 || owned(w.id);
      return `<button class="wcard${has ? '' : ' locked'}${weapon() === w.id ? ' on' : ''}" data-id="${w.id}"${has ? '' : ' disabled'}>` +
        (has ? Slime.html(color, w.id, 'wc-sl') : '<span class="wc-q">？</span>') +
        `<small>${has ? w.name : `${w.id}の だん`}</small></button>`;
    }).join('');
    $('#weapon-grid').querySelectorAll('.wcard').forEach(b => {
      b.onclick = () => {
        save.weapon = Number(b.dataset.id);
        writeSave();
        Sound.snare();
        Sound.puni(0.02, save.weapon);
        const w = WEAPONS.find(x => x.id === save.weapon);
        if (w) Sound.say(w.name, { now: true });
        renderWeapons();
      };
    });
  }
  $('#btn-weapons').onclick = () => { Sound.unlock(); renderWeapons(); overlay('#overlay-weapons', true); };
  $('#btn-weapons-close').onclick = () => { overlay('#overlay-weapons', false); renderTitle(); };

  // ---------- ⚙️ おとなよう ----------
  let adultAnswer = 0;
  function renderAdult() {
    $('#adult-now').textContent = `いま: クリア ${save.cleared.length}/${STAGES.length} だん`;
    $('#adult-map').innerHTML = STAGES.map(s =>
      `<button class="stage-btn mini${save.cleared.includes(s.n) ? ' done' : ''}" data-n="${s.n}" style="--c:${s.color}"><b>${s.n}</b></button>`).join('');
    $('#adult-map').querySelectorAll('.stage-btn').forEach(b => {
      b.onclick = () => {
        const n = Number(b.dataset.n);
        save.cleared = Array.from({ length: n - 1 }, (_, i) => i + 1);
        if (!owned(save.weapon)) save.weapon = n - 1;
        writeSave();
        renderAdult();
        $('#adult-msg').textContent = `${n}の だんから あそべるように したよ`;
      };
    });
    $('#adult-voice').checked = voiceOn();
  }
  $('#adult-voice').onchange = e => { save.voice = e.target.checked; writeSave(); };
  $('#btn-reset').onclick = () => {
    if (!confirm('すすみぐあいと ぶきを ぜんぶ けしますか？')) return;
    save = { ...defaultSave(), resetAt: Date.now() };
    writeSave();
    renderAdult();
    $('#adult-msg').textContent = 'さいしょから に したよ';
  };
  $('#btn-adult').onclick = () => {
    const a = 6 + Math.floor(Math.random() * 13), b = 7 + Math.floor(Math.random() * 13);
    adultAnswer = a + b;
    $('#adult-q').textContent = `${a} + ${b}`;
    $('#adult-a').value = '';
    $('#adult-msg').textContent = '';
    $('#adult-gate').hidden = false;
    $('#adult-body').hidden = true;
    overlay('#overlay-adult', true);
  };
  const adultOpen = () => {
    if (Number($('#adult-a').value) !== adultAnswer) { $('#adult-msg').textContent = 'ちがうよ'; return; }
    $('#adult-msg').textContent = '';
    $('#adult-gate').hidden = true;
    $('#adult-body').hidden = false;
    renderAdult();
  };
  $('#adult-ok').onclick = adultOpen;
  $('#adult-a').addEventListener('keydown', e => { if (e.key === 'Enter') adultOpen(); });
  $('#adult-close').onclick = () => { overlay('#overlay-adult', false); renderTitle(); };

  // ---------- がめんを くらく しない ----------
  let wakeLock = null;
  async function keepAwake(on) {
    try {
      if (on && !wakeLock && navigator.wakeLock) {
        wakeLock = await navigator.wakeLock.request('screen');
        wakeLock.addEventListener('release', () => { wakeLock = null; });
      } else if (!on && wakeLock) {
        await wakeLock.release();
        wakeLock = null;
      }
    } catch (e) { /* むし */ }
  }
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && !$('#screen-title').classList.contains('active')) keepAwake(true);
  });

  // ---------- インストール ----------
  let installPrompt = null;
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    installPrompt = e;
    $('#btn-install').hidden = false;
  });
  $('#btn-install').onclick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    installPrompt = null;
    $('#btn-install').hidden = true;
  };
  window.addEventListener('appinstalled', () => { $('#btn-install').hidden = true; });

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    // あたらしい ばんに かわったら、タイトルがめんの ときだけ いちど よみなおす
    const hadController = !!navigator.serviceWorker.controller;
    let reloaded = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!hadController || reloaded || !$('#screen-title').classList.contains('active')) return;
      reloaded = true;
      location.reload();
    });
    navigator.serviceWorker.register('sw.js').catch(() => { /* オフラインに ならないだけ */ });
  }

  // テストよう
  window.__game = {
    get save() { return save; },
    get q() { return q; },
    startStage, startBoss: (n, qn = 10) => { stage = n; qi = qn; startBoss(); }, clearStage: n => { stage = n; clearStage(); },
    trace: () => tr,
  };

  renderTitle();

  // ☁️ ウェブの データと まぜる
  if (window.Cloud) {
    Cloud.attach({
      get: () => save,
      set: s => {
        save = Object.assign(defaultSave(), s);
        try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* むし */ }
        if ($('#screen-title').classList.contains('active')) renderTitle();
        if ($('#overlay-adult').classList.contains('show') && !$('#adult-body').hidden) renderAdult();
      },
    });
  }
})();
