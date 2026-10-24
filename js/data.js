// すらいむたしたし の データ
//   ・だん（1の だん 〜 10の だん）: 1の だんは 1+1 〜 1+10
//   ・ぶき: だんを クリアするたびに 1つ もらえる（だんだん ごうかに なる）
//   ・ボス: 3・6・10の だんの さいごに でてくる
//   ・セリフ: こえの スタジオで ろくおん できる ぜんぶの セリフ
(() => {
  'use strict';

  // かずの よみかた
  const NUM = ['', 'いち', 'に', 'さん', 'よん', 'ご', 'ろく', 'なな', 'はち', 'きゅう', 'じゅう',
    'じゅういち', 'じゅうに', 'じゅうさん', 'じゅうよん', 'じゅうご', 'じゅうろく', 'じゅうなな', 'じゅうはち', 'じゅうきゅう', 'にじゅう'];

  // だんごとの すらいむの いろ
  const STAGES = [
    { n: 1, color: '#5ec8ff' },
    { n: 2, color: '#6fdc8c' },
    { n: 3, color: '#ff8fc0' },
    { n: 4, color: '#ffb057' },
    { n: 5, color: '#b88cff' },
    { n: 6, color: '#ffd84d' },
    { n: 7, color: '#4fe0d2' },
    { n: 8, color: '#ff7a7a' },
    { n: 9, color: '#a6e05a' },
    { n: 10, color: '#7aa8ff' },
  ];

  // ぶき（viewBox 0 0 40 100。したの まんなか（20,92）を にぎる）
  const WEAPONS = [
    {
      id: 1, name: 'ぼう', svg: `
        <rect x="16" y="8" width="8" height="88" rx="4" fill="#b07a45" stroke="#6e4520" stroke-width="2"/>
        <ellipse cx="20" cy="36" rx="5" ry="2.4" fill="#8b5a2b"/><ellipse cx="20" cy="64" rx="5" ry="2.4" fill="#8b5a2b"/>`,
    },
    {
      id: 2, name: 'きの けん', svg: `
        <path d="M14 70 L14 14 L20 4 L26 14 L26 70 Z" fill="#e8c48a" stroke="#8b5a2b" stroke-width="2" stroke-linejoin="round"/>
        <line x1="20" y1="12" x2="20" y2="66" stroke="#c99a5c" stroke-width="1.5"/>
        <rect x="6" y="68" width="28" height="7" rx="3" fill="#8b5a2b"/>
        <rect x="16" y="75" width="8" height="20" rx="3" fill="#6e4520"/>`,
    },
    {
      id: 3, name: 'ハンマー', svg: `
        <rect x="17" y="30" width="6" height="66" rx="3" fill="#b07a45" stroke="#6e4520" stroke-width="2"/>
        <rect x="2" y="8" width="36" height="26" rx="6" fill="url(#wp-silver)" stroke="#5b6672" stroke-width="2.5"/>
        <rect x="2" y="14" width="36" height="5" fill="#ffffff" opacity=".45"/>`,
    },
    {
      id: 4, name: 'トゲトゲ こんぼう', svg: `
        <path d="M17 96 L15 46 Q9 30 13 14 Q20 2 27 14 Q31 30 25 46 L23 96 Z" fill="#9b6233" stroke="#5a3415" stroke-width="2.5" stroke-linejoin="round"/>
        <g fill="#fff" stroke="#8a94a0" stroke-width="1.5" stroke-linejoin="round">
          <path d="M12 18 L3 14 L11 24 Z"/><path d="M28 18 L37 14 L29 24 Z"/><path d="M11 32 L2 34 L12 38 Z"/>
          <path d="M29 32 L38 34 L28 38 Z"/><path d="M18 6 L20 -2 L23 6 Z"/><path d="M14 44 L7 49 L16 48 Z"/><path d="M26 44 L33 49 L24 48 Z"/>
        </g>`,
    },
    {
      id: 5, name: 'ぎんの けん', svg: `
        <path d="M14 68 L14 12 L20 0 L26 12 L26 68 Z" fill="url(#wp-silver)" stroke="#5b6672" stroke-width="2" stroke-linejoin="round"/>
        <line x1="20" y1="8" x2="20" y2="64" stroke="#ffffff" stroke-width="2" opacity=".8"/>
        <path d="M3 66 Q20 74 37 66 L37 73 Q20 80 3 73 Z" fill="#3d7bff" stroke="#1f3f9e" stroke-width="1.5"/>
        <circle cx="20" cy="72" r="3.5" fill="#ff4d6d" stroke="#fff" stroke-width="1"/>
        <rect x="16" y="77" width="8" height="18" rx="3" fill="#3a2a5a"/>`,
    },
    {
      id: 6, name: 'おおきな おの', svg: `
        <rect x="17" y="6" width="6" height="90" rx="3" fill="#b07a45" stroke="#6e4520" stroke-width="2"/>
        <path d="M22 10 Q44 6 40 30 Q38 44 22 40 Z" fill="url(#wp-silver)" stroke="#5b6672" stroke-width="2.5" stroke-linejoin="round"/>
        <path d="M18 10 Q-4 6 0 30 Q2 44 18 40 Z" fill="url(#wp-silver)" stroke="#5b6672" stroke-width="2.5" stroke-linejoin="round"/>
        <circle cx="20" cy="24" r="4" fill="#ffc928" stroke="#a87400" stroke-width="1.5"/>`,
    },
    {
      id: 7, name: 'こおりの やり', svg: `
        <rect x="17.5" y="26" width="5" height="70" rx="2.5" fill="#5b7fa8" stroke="#2c4566" stroke-width="1.5"/>
        <path d="M20 -2 L30 22 L20 30 L10 22 Z" fill="url(#wp-ice)" stroke="#3aa0d8" stroke-width="2" stroke-linejoin="round"/>
        <path d="M10 22 L4 14 L13 18 Z M30 22 L36 14 L27 18 Z" fill="#bff0ff" stroke="#3aa0d8" stroke-width="1.2"/>
        <circle cx="20" cy="14" r="2" fill="#fff"/>
        <path class="wp-twinkle" d="M33 4 l1.5 3.5 3.5 1.5 -3.5 1.5 -1.5 3.5 -1.5 -3.5 -3.5 -1.5 3.5 -1.5 Z" fill="#ffffff"/>`,
    },
    {
      id: 8, name: 'ほのおの けん', svg: `
        <path class="wp-flame" d="M20 -6 Q34 10 28 26 Q36 34 28 46 Q34 56 26 68 L14 68 Q6 56 12 46 Q4 34 12 26 Q6 10 20 -6 Z" fill="url(#wp-fire)" opacity=".85"/>
        <path d="M15 68 L15 16 L20 4 L25 16 L25 68 Z" fill="#fff1d6" stroke="#e8590c" stroke-width="2" stroke-linejoin="round"/>
        <path d="M4 66 L36 66 L33 74 L7 74 Z" fill="#c92a2a" stroke="#7a1414" stroke-width="1.5"/>
        <circle cx="20" cy="70" r="3" fill="#ffd43b"/>
        <rect x="16" y="76" width="8" height="19" rx="3" fill="#5a1a1a"/>`,
    },
    {
      id: 9, name: 'かみなりの ハンマー', svg: `
        <rect x="17" y="30" width="6" height="66" rx="3" fill="#3a2a5a" stroke="#1d1430" stroke-width="2"/>
        <rect x="0" y="6" width="40" height="28" rx="7" fill="url(#wp-gold)" stroke="#a87400" stroke-width="2.5"/>
        <path d="M23 9 L13 21 L20 21 L16 31 L28 17 L21 17 Z" fill="#fff" stroke="#3d7bff" stroke-width="1.5" stroke-linejoin="round"/>
        <path class="wp-spark" d="M-2 0 L4 6 M42 0 L36 6 M-3 38 L3 33 M43 38 L37 33" stroke="#ffe066" stroke-width="2.5" stroke-linecap="round"/>`,
    },
    {
      id: 10, name: 'にじいろの けん', svg: `
        <path class="wp-glow" d="M20 -8 L32 12 L32 70 L8 70 L8 12 Z" fill="#fff6b0" opacity=".5"/>
        <path d="M13 68 L13 12 L20 -2 L27 12 L27 68 Z" fill="url(#wp-rainbow)" stroke="#ffffff" stroke-width="2" stroke-linejoin="round"/>
        <line x1="20" y1="6" x2="20" y2="64" stroke="#ffffff" stroke-width="2" opacity=".9"/>
        <path d="M0 64 Q20 76 40 64 L38 74 Q20 84 2 74 Z" fill="url(#wp-gold)" stroke="#a87400" stroke-width="1.5"/>
        <circle cx="20" cy="73" r="4" fill="#ff4dd2" stroke="#fff" stroke-width="1.2"/>
        <rect x="16" y="78" width="8" height="17" rx="3" fill="#ffc928" stroke="#a87400" stroke-width="1"/>
        <path class="wp-twinkle" d="M34 2 l1.5 3.5 3.5 1.5 -3.5 1.5 -1.5 3.5 -1.5 -3.5 -3.5 -1.5 3.5 -1.5 Z" fill="#ffffff"/>
        <path class="wp-twinkle wp-t2" d="M4 30 l1.2 3 3 1.2 -3 1.2 -1.2 3 -1.2 -3 -3 -1.2 3 -1.2 Z" fill="#ffffff"/>`,
    },
  ];

  // なぞる せん（viewBox 0 0 100 100）
  const PATHS = {
    slash: 'M22 22 L78 78',
    arc: 'M14 72 Q50 0 86 72',
    v: 'M20 20 L50 80 L80 20',
    s: 'M74 16 C14 16 86 84 26 84',
    zig: 'M14 30 L40 72 L60 30 L86 72',
    bolt: 'M62 10 L34 50 L66 50 L38 90',
    wave: 'M10 50 Q25 18 40 50 T70 50 T96 50',
    mountain: 'M10 78 L30 28 L50 78 L70 28 L90 78',
    circle: 'M50 14 A36 36 0 1 1 49 14',
    tri: 'M50 14 L86 80 L14 80 Z',
  };

  // ボス（1もんめから でてきて、こたえを あてると こうげきされて にげる。5もんめ と 10もんめ の あとは しょうぶ）
  //   まちがえると ボスに こうげきされて、すらいむの HP が へる（10かいで まけ）
  //   5もんめ: ゴロゴロン（きすうの だん）/ オバケン（ぐうすうの だん）。3かい なぞる
  //   10もんめ: ドラゴラン（10の だんだけ まおうスライム）。5かい なぞる
  const BOSSES = {
    rock: {
      name: 'ゴロゴロン', color: '#a3acb8', deco: 'rock',
      enter: 'ゴロゴロ〜！ ここは とおさないぞ！', ouch: ['いてっ！', 'ゴロッ！？'], lose: 'まいった〜！ ゴロゴロ〜',
      atk: ['ゴロゴロ アタック！', 'えいっ ゴロン！'], flee: ['おぼえてろ〜！', 'ゴロゴロ〜 にげろ〜！'], win: 'ゴロゴロ〜 おれの かちだ！',
    },
    ghost: {
      name: 'オバケン', color: '#cfc6ff', deco: 'ghost',
      enter: 'ひゅ〜 どろどろ〜！ おどろいたか〜！', ouch: ['ひゃっ！', 'ひゅっ！？', 'うひゃ〜！'], lose: 'ひゅ〜… まいった〜！',
      atk: ['ばあっ！', 'おどかし アタック〜！'], flee: ['ひゅ〜 にげろ〜！', 'また くるぞ〜！'], win: 'ひゅ〜どろどろ〜 オバケンの かち〜！',
    },
    dragon: {
      name: 'ドラゴラン', color: '#5fcf7a', deco: 'dragon',
      enter: 'ガオー！ おれさまは つよいぞ！', ouch: ['いてて！', 'ガオッ！？', 'やるな！'], lose: 'ガオ〜ん… まいった〜！',
      atk: ['ガオー！ ひのいき！', 'しっぽ アタック！'], flee: ['いったん ひきあげだ！', 'つぎは まけないぞ！'], win: 'ガオー！ おれさまの かちだ！',
    },
    king: {
      name: 'まおうスライム', color: '#9a6be0', deco: 'king',
      enter: 'ふっふっふ… わがはいが まおうスライムだ！', ouch: ['ぐぬっ！', 'いたた！', 'なにっ！？', 'まだまだ！', 'ぐぬぬ…！'], lose: 'うわ〜！ まいった〜！ なかよく しよう〜！',
      atk: ['まおう パンチ！', 'まおう ビーム！'], flee: ['きょうは このくらいに してやる！', 'ぐぬぬ… おぼえておれ！'], win: 'ふっふっふ… わがはいの かちだ！',
    },
  };
  const BOSS_AT = [5, 10];   // なんもんめの あとに でるか
  const EASY = ['slash', 'arc', 'v', 's', 'zig'];
  const HARD = ['bolt', 'wave', 'mountain', 'circle', 'tri', 'zig', 's'];
  // n の だんの qn もんめの ボス → { ...ボス, hits: なぞる かいすう, paths }
  function bossFor(n, qn) {
    const end = qn >= 10;
    const def = end ? (n >= 10 ? BOSSES.king : BOSSES.dragon) : (n % 2 ? BOSSES.rock : BOSSES.ghost);
    const hits = end ? 5 : 3;
    const pool = [...(end ? HARD : EASY)];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return { ...def, hits, paths: pool.slice(0, hits) };
  }

  const PRAISE = ['すごい！', 'やったね！', 'ぴったり！', 'せいかい！'];
  const SLIME_CRY = ['えいっ！', 'やあっ！', 'とりゃー！', 'それっ！', 'いけー！'];

  // こえの スタジオで ろくおん できる セリフ（who: narr ナレーション / slime すらいむ / boss ボス）
  const LINES = [];
  const add = (who, text) => { if (!LINES.some(l => l.who === who && l.text === text)) LINES.push({ who, text }); };
  for (let i = 1; i <= 20; i++) add('narr', NUM[i]);
  ['たす', 'は？', 'すらいむ たしたし', 'もういちど きいてね', ...PRAISE,
    'クリア！', 'あたらしい ぶきを てにいれた！', 'ボスが あらわれた！', 'しょうぶだ！', 'やられちゃった… もういちど がんばろう！', 'せんを なぞって こうげきだ！', 'やっつけた！',
    'ぜんぶ クリア！ すらいむ マスターだ！', 'きょうも がんばったね。また あしたね！']
    .forEach(t => add('narr', t));
  STAGES.forEach(s => add('narr', `${NUM[s.n]}の だん`));
  WEAPONS.forEach(w => add('narr', w.name));
  Object.values(BOSSES).forEach(b => add('narr', b.name));
  ['ぷにっ', 'わーい！', ...SLIME_CRY].forEach(t => add('slime', t));
  Object.values(BOSSES).forEach(b => [b.enter, ...b.atk, ...b.flee, ...b.ouch, b.lose, b.win].forEach(t => add('boss', t)));

  Object.assign(window, { NUM, STAGES, WEAPONS, PATHS, BOSSES, BOSS_AT, bossFor, PRAISE, SLIME_CRY, LINES });
})();
