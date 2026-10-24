// すらいむ・ぶき・ボスの みため（SVG）
window.Slime = (() => {
  'use strict';
  const { WEAPONS } = window;

  // いろを くらく / あかるく する
  function shade(hex, f) {
    const n = parseInt(hex.slice(1), 16);
    const ch = s => {
      const v = (n >> s) & 255;
      return Math.round(f < 0 ? v * (1 + f) : v + (255 - v) * f);
    };
    return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
  }

  // ぷにょぷにょの からだ（viewBox 0 0 100 100）
  const BODY = 'M50 16 C73 16 92 46 94 72 C96 90 80 95 50 95 C20 95 4 90 6 72 C8 46 27 16 50 16 Z';

  function weaponSVG(id) {
    const w = WEAPONS.find(x => x.id === id);
    return w ? `<svg class="wp wp-${id}" viewBox="-4 -10 48 110" aria-hidden="true">${w.svg}</svg>` : '';
  }

  // すらいむ ひとつ。目が あるだけ
  function html(color, weapon = 0, cls = '') {
    return `<div class="slime ${cls}" style="--c:${color};--c2:${shade(color, -0.32)};--c3:${shade(color, 0.45)}">` +
      `<div class="sl-in"><svg class="sl-body" viewBox="0 0 100 100" aria-hidden="true">` +
      `<ellipse class="sl-shadow" cx="50" cy="96" rx="40" ry="5"/>` +
      `<path class="sl-skin" d="${BODY}"/>` +
      `<ellipse class="sl-shine" cx="33" cy="38" rx="9" ry="5.5" transform="rotate(-30 33 38)"/>` +
      `<circle class="sl-shine2" cx="44" cy="30" r="2.6"/>` +
      `<g class="sl-eyes"><ellipse cx="38" cy="62" rx="5.2" ry="8"/><ellipse cx="62" cy="62" rx="5.2" ry="8"/>` +
      `<circle class="sl-hi" cx="39.8" cy="58.5" r="2.1"/><circle class="sl-hi" cx="63.8" cy="58.5" r="2.1"/></g>` +
      `</svg>${weapon ? `<div class="sl-wp">${weaponSVG(weapon)}</div>` : ''}</div></div>`;
  }
  function el(color, weapon = 0, cls = '') {
    const d = document.createElement('div');
    d.innerHTML = html(color, weapon, cls);
    return d.firstChild;
  }

  // ボス（すらいむの なかまだけど おこった かお と かざり）
  function bossHTML(b) {
    const c = b.color, c2 = shade(c, -0.35), c3 = shade(c, 0.45);
    let back = '', front = '';
    if (b.deco === 'rock') {
      back = `<path d="M30 22 L38 8 L48 18 L58 6 L68 20 Z" fill="#7d8692" stroke="#555d68" stroke-width="2" stroke-linejoin="round"/>`;
      front = `<path d="M70 40 L76 50 L72 58 M24 50 L30 56" stroke="${c2}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
    } else if (b.deco === 'dragon') {
      back = `<path d="M8 50 Q-8 30 4 18 Q8 34 20 40 Z M92 50 Q108 30 96 18 Q92 34 80 40 Z" fill="#ffb3c7" stroke="#d6336c" stroke-width="2" stroke-linejoin="round"/>` +
        `<path d="M32 24 L26 4 L42 18 Z M68 24 L74 4 L58 18 Z" fill="#fff3bf" stroke="#c9a227" stroke-width="2" stroke-linejoin="round"/>`;
      front = `<path d="M42 18 L46 10 L50 17 L54 10 L58 18" fill="${c2}"/>`;
    } else if (b.deco === 'ghost') {
      back = `<path d="M10 62 Q-6 56 -2 44 M90 62 Q106 56 102 44" stroke="${c2}" stroke-width="5" fill="none" stroke-linecap="round"/>` +
        `<path d="M96 18 q4 -6 8 0 q4 6 8 0 M-12 26 q4 -6 8 0 q4 6 8 0" stroke="#b5a8f0" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
      front = `<path d="M46 77 Q50 88 54 77 Z" fill="#ff8fab" stroke="#c9496e" stroke-width="1.5"/>`;
    } else if (b.deco === 'king') {
      back = `<path d="M6 60 Q0 96 30 96 L70 96 Q100 96 94 60 Q90 80 50 82 Q10 80 6 60 Z" fill="#c92a2a" stroke="#7a1414" stroke-width="2"/>`;
      front = `<path d="M32 22 L30 2 L42 12 L50 -2 L58 12 L70 2 L68 22 Z" fill="url(#wp-gold)" stroke="#a87400" stroke-width="2" stroke-linejoin="round"/>` +
        `<circle cx="50" cy="14" r="3.5" fill="#ff4d6d"/><circle cx="38" cy="17" r="2.2" fill="#4dabf7"/><circle cx="62" cy="17" r="2.2" fill="#69db7c"/>`;
    }
    return `<div class="slime boss-slime" style="--c:${c};--c2:${c2};--c3:${c3}"><div class="sl-in">` +
      `<svg class="sl-body" viewBox="-10 -10 120 112" aria-hidden="true">${back}` +
      `<ellipse class="sl-shadow" cx="50" cy="96" rx="44" ry="5"/>` +
      `<path class="sl-skin" d="${BODY}"/>` +
      `<ellipse class="sl-shine" cx="33" cy="38" rx="9" ry="5.5" transform="rotate(-30 33 38)"/>` +
      `<g class="sl-eyes boss-eyes"><ellipse cx="37" cy="60" rx="6" ry="7.5"/><ellipse cx="63" cy="60" rx="6" ry="7.5"/>` +
      `<circle class="sl-hi" cx="39" cy="57" r="2.2"/><circle class="sl-hi" cx="65" cy="57" r="2.2"/></g>` +
      `<path class="boss-brow" d="M27 46 L45 52 M73 46 L55 52" stroke="#3b2a20" stroke-width="4" stroke-linecap="round"/>` +
      `<path class="boss-mouth" d="M38 76 Q50 70 62 76" stroke="#3b2a20" stroke-width="3.5" fill="none" stroke-linecap="round"/>` +
      `<path d="M42 74.5 L44 79 L46 73.4 Z M54 73.4 L56 79 L58 74.5 Z" fill="#fff"/>` +
      `${front}</svg></div></div>`;
  }

  return { html, el, bossHTML, weaponSVG, shade };
})();
