// おと と こえ（Web Audio + Web Speech）
//   ・スネアドラムの「た」を まんなかに した リズムの おと
//   ・こえ: じぶんたちで とった こえ（VoiceBox）→ VOICEVOX で つくった こえ（audio/voice）→ ブラウザの よみあげ
window.Sound = (() => {
  let ctx = null;
  let master = null;
  let comp = null;
  let noiseBuf = null;
  let jaVoice = null;
  const synth = window.speechSynthesis || null;

  function ac() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      // ドラムが パンッと きこえるように かるく コンプレッサーを かける
      comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -14;
      comp.ratio.value = 4;
      comp.attack.value = 0.002;
      comp.release.value = 0.12;
      comp.connect(ctx.destination);
      newBus();
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  // ドラムを ながす みち。hush() で つなぎかえると、よやくした おとも ぜんぶ とまる
  function newBus() {
    if (master) master.disconnect();
    master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(comp);
  }
  // いまから sec びょう あとの オーディオの じかん
  const at = sec => (ac() ? ctx.currentTime + 0.03 + (sec || 0) : 0);

  function pickVoice() {
    if (!synth) return;
    const ja = synth.getVoices().filter(v => /^ja/i.test(v.lang));
    jaVoice = ja.find(v => /Kyoko|O-ren|Nanami|Google/i.test(v.name)) || ja[0] || null;
  }
  if (synth) {
    pickVoice();
    synth.onvoiceschanged = pickVoice;
  }

  const midi = n => 440 * Math.pow(2, (n - 69) / 12);

  function tone(freq, start, dur, { type = 'triangle', vol = 0.15, slide = 0, t0 } = {}) {
    const c = ac();
    if (!c) return;
    const t = t0 != null ? t0 : at(start);
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(freq * slide, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(master);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  function noise(t, dur, { vol = 0.3, type = 'highpass', freq = 1000, q = 0.7, to } = {}) {
    const c = ac();
    if (!c) return;
    const src = c.createBufferSource();
    src.buffer = noiseBuf;
    const f = c.createBiquadFilter();
    f.type = type;
    f.frequency.setValueAtTime(freq, t);
    if (to) f.frequency.exponentialRampToValueAtTime(to, t + dur);
    f.Q.value = q;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(master);
    src.start(t, Math.random() * 0.5);
    src.stop(t + dur + 0.05);
  }

  // ---- ドラム ----
  // スネア「た」。vol: つよさ / pitch: どうの たかさ（1 が ふつう）
  function snare(sec = 0, { vol = 1, pitch = 1 } = {}) {
    const c = ac();
    if (!c) return;
    const t = at(sec);
    noise(t, 0.16, { vol: 0.55 * vol, type: 'highpass', freq: 1400 });
    noise(t, 0.09, { vol: 0.35 * vol, type: 'bandpass', freq: 3200, q: 0.9 });
    tone(230 * pitch, 0, 0.09, { type: 'triangle', vol: 0.45 * vol, slide: 0.62, t0: t });
    tone(330 * pitch, 0, 0.05, { type: 'sine', vol: 0.25 * vol, slide: 0.7, t0: t });
  }
  // こつん（リム）
  function rim(sec = 0, vol = 1) {
    const t = at(sec);
    tone(1700, 0, 0.035, { type: 'square', vol: 0.12 * vol, t0: t });
    noise(t, 0.03, { vol: 0.25 * vol, type: 'bandpass', freq: 2600, q: 3 });
  }
  function kick(sec = 0, vol = 1) {
    const t = at(sec);
    tone(150, 0, 0.28, { type: 'sine', vol: 0.8 * vol, slide: 0.33, t0: t });
  }
  // 「は？」: しりあがりの タム
  function tomUp(sec = 0) {
    const t = at(sec);
    tone(190, 0, 0.32, { type: 'sine', vol: 0.55, slide: 1.6, t0: t });
    noise(t, 0.08, { vol: 0.3, type: 'highpass', freq: 1800 });
  }
  function crash(sec = 0, vol = 1) {
    const t = at(sec);
    noise(t, 1.4, { vol: 0.32 * vol, type: 'highpass', freq: 5200 });
    noise(t, 0.5, { vol: 0.2 * vol, type: 'bandpass', freq: 8000, q: 0.5 });
  }
  // たたたたたっ（だんだん つよく）
  function roll(sec = 0, dur = 0.8) {
    const n = Math.round(dur / 0.055);
    for (let i = 0; i < n; i++) snare(sec + i * 0.055, { vol: 0.25 + 0.6 * i / n, pitch: 1.05 });
    snare(sec + dur, { vol: 1.2 });
    kick(sec + dur);
    crash(sec + dur);
  }
  // すらいむの「ぷにっ」
  function puni(sec = 0, k = 0) {
    const t = at(sec);
    const f = 380 * Math.pow(2, (k % 12) / 12);
    tone(f, 0, 0.12, { type: 'sine', vol: 0.22, slide: 1.9, t0: t });
  }

  // ---- こえ ----
  //   who: narr（ナレーション）/ slime（すらいむ）/ boss（ボス）
  const VOICE_DIR = 'audio/voice/';
  let voiceIndex = null;
  const clips = new Map();   // id → AudioBuffer の Promise
  let queue = Promise.resolve();
  let gen = 0;
  const playing = new Set();
  const VB = window.VoiceBox;

  fetch(VOICE_DIR + 'index.json')
    .then(r => (r.ok ? r.json() : null))
    .then(j => { voiceIndex = j; })
    .catch(() => { /* こえの ファイルが ない ときは よみあげで */ });

  function decode(buf) {
    const c = ac();
    return new Promise((res, rej) => {
      const p = c.decodeAudioData(buf, res, rej);
      if (p && p.then) p.then(res, rej);
    });
  }
  if (VB) VB.onChange(k => { if (k) clips.delete('c:' + k); else clips.clear(); });

  // id は 'c:セリフ'（じぶんの こえ）か 'v:ファイル'（VOICEVOX）
  function clip(id) {
    if (!clips.has(id)) {
      const src = id.startsWith('c:')
        ? VB.blob(id.slice(2)).then(b => b.arrayBuffer())
        : fetch(VOICE_DIR + id.slice(2)).then(r => r.arrayBuffer());
      const p = src.then(decode).then(buf => {
        if (id.startsWith('c:')) buf.level = VB.loudnessGain(buf.getChannelData(0), 0, buf.length, buf.sampleRate);
        return buf;
      });
      p.catch(() => clips.delete(id));
      clips.set(id, p);
      if (clips.size > 60) clips.delete(clips.keys().next().value);
    }
    return clips.get(id);
  }
  function clipId(who, text) {
    const k = `${who}|${text}`;
    if (VB && VB.has(k)) return 'c:' + k;
    const f = voiceIndex && voiceIndex[k];
    return f ? 'v:' + f : null;
  }
  function playBuffer(buf, when = 0) {
    return new Promise(res => {
      const c = ac();
      if (!c) return res();
      const src = c.createBufferSource();
      src.buffer = buf;
      const g = c.createGain();
      g.gain.value = (buf.level || 1) * 1.1;
      src.connect(g).connect(ctx.destination);
      let done = false;
      const end = () => { if (!done) { done = true; playing.delete(src); res(); } };
      src.onended = end;
      setTimeout(end, (when + buf.duration) * 1000 + 400);
      playing.add(src);
      src.start(at(when));
    });
  }

  // ブラウザの よみあげ（やくごとに こえの たかさを かえる）
  const TTS = {
    narr: { pitch: 1.3, rate: 1.0 },
    slime: { pitch: 1.8, rate: 1.1 },
    boss: { pitch: 0.6, rate: 0.9 },
  };
  const READ = { 'は？': 'わ？' };   // よみあげが まちがえる ことば
  function speak(text, who) {
    if (!synth) return;
    const u = new SpeechSynthesisUtterance(READ[text] || text);
    u.lang = 'ja-JP';
    if (jaVoice) u.voice = jaVoice;
    const o = TTS[who] || TTS.narr;
    u.pitch = o.pitch;
    u.rate = o.rate;
    synth.speak(u);
  }

  // now: じゅんばんを またずに すぐ（リズムに あわせて）ならす
  function say(text, { who = 'narr', now = false, when = 0 } = {}) {
    const id = clipId(who, text);
    if (!id) {
      if (when) setTimeout(() => speak(text, who), when * 1000); else speak(text, who);
      return;
    }
    const my = gen;
    const l = clip(id);
    if (now) {
      l.then(buf => { if (my === gen) playBuffer(buf, when); }).catch(() => {});
      return;
    }
    queue = queue.then(async () => {
      if (my !== gen) return;
      let buf;
      try { buf = await l; } catch (e) { return; }
      if (my === gen) await playBuffer(buf);
    });
  }

  function hush() {
    gen++;
    queue = Promise.resolve();
    playing.forEach(src => { try { src.stop(); } catch (e) { /* もう とまっている */ } });
    playing.clear();
    if (ctx) newBus();
    if (synth) synth.cancel();
  }

  // VOICEVOX の こえを まえもって ダウンロードして おく（オフラインでも ならせるように）
  function preloadVoices() {
    if (!voiceIndex) return;
    const files = Object.entries(voiceIndex).filter(([k]) => k !== '_v').map(([, f]) => f);
    let i = 0;
    const next = () => {
      if (i >= files.length) return;
      fetch(VOICE_DIR + files[i++]).catch(() => {}).finally(next);
    };
    for (let k = 0; k < 3; k++) next();
  }

  // さいしょの タップで おとを だせるように する（iPhone/iPad たいさく）
  let unlocked = false;
  function unlock() {
    ac();
    if (synth && !unlocked) {
      const u = new SpeechSynthesisUtterance(' ');
      u.volume = 0;
      synth.speak(u);
    }
    if (!unlocked) {
      unlocked = true;
      setTimeout(preloadVoices, 3000);
    }
  }

  return {
    unlock, say, hush,
    voiceIndex: () => voiceIndex,
    snare, rim, kick, tomUp, crash, roll, puni,
    // ブブー（しっぱいは じみに）
    buzz() {
      const t = at(0);
      tone(150, 0, 0.16, { type: 'square', vol: 0.09, t0: t });
      tone(151, 0, 0.16, { type: 'sawtooth', vol: 0.05, t0: t });
      tone(150, 0, 0.42, { type: 'square', vol: 0.09, t0: t + 0.22 });
      tone(151, 0, 0.42, { type: 'sawtooth', vol: 0.05, t0: t + 0.22 });
    },
    ding(sec = 0) {
      tone(midi(84), sec, 0.3, { type: 'sine', vol: 0.25 });
      tone(midi(91), sec + 0.08, 0.5, { type: 'sine', vol: 0.22 });
    },
    blip(i = 0, sec = 0) { tone(midi(72 + i * 4), sec, 0.08, { type: 'triangle', vol: 0.12 }); },
    tap() { tone(700, 0, 0.06, { type: 'sine', vol: 0.12, slide: 1.4 }); },
    swing(sec = 0) {
      const t = at(sec);
      noise(t, 0.25, { vol: 0.35, type: 'bandpass', freq: 600, to: 4000, q: 1.2 });
    },
    boom(sec = 0) {
      const t = at(sec);
      tone(120, 0, 0.6, { type: 'sine', vol: 0.8, slide: 0.3, t0: t });
      noise(t, 0.6, { vol: 0.4, type: 'lowpass', freq: 900 });
      crash(sec + 0.02, 0.8);
    },
    rumble(sec = 0) {
      const t = at(sec);
      noise(t, 1.2, { vol: 0.4, type: 'lowpass', freq: 220 });
      tone(55, 0, 1.2, { type: 'sawtooth', vol: 0.08, t0: t });
    },
    // ボスに こうげきされた
    hurt(sec = 0) {
      const t = at(sec);
      tone(320, 0, 0.35, { type: 'square', vol: 0.12, slide: 0.35, t0: t });
      noise(t, 0.2, { vol: 0.5, type: 'lowpass', freq: 700 });
      kick(sec, 0.9);
    },
    // まけちゃった
    lose(sec = 0) {
      [67, 66, 65, 64].forEach((m, i) => tone(midi(m), sec + i * 0.38, i === 3 ? 1.0 : 0.34, { type: 'triangle', vol: 0.14, slide: i === 3 ? 0.9 : 0 }));
    },
    poof(sec = 0) {
      const t = at(sec);
      noise(t, 0.5, { vol: 0.3, type: 'bandpass', freq: 3000, to: 300, q: 1 });
      [84, 88, 91, 96].forEach((m, i) => tone(midi(m), sec + 0.25 + i * 0.07, 0.3, { type: 'triangle', vol: 0.12 }));
    },
    // ぶきを もらった ときの ファンファーレ（ドラム いり）
    fanfare(sec = 0) {
      roll(sec, 0.7);
      const b = sec + 0.8;
      const seq = [[67, 0], [72, 0.16], [76, 0.32], [79, 0.48], [76, 0.72], [79, 0.88]];
      seq.forEach(([m, t]) => { tone(midi(m), b + t, 0.22, { type: 'square', vol: 0.06 }); snare(b + t, { vol: 0.5 }); });
      [72, 76, 79, 84].forEach(m => tone(midi(m), b + 1.1, 1.3, { type: 'triangle', vol: 0.12 }));
      kick(b + 1.1);
      crash(b + 1.1);
    },
  };
})();
