// Generated placeholder thumbnails for coming-soon cards: short orange streamlines on graphite,
// deterministic for each id (the same card always gets the same picture). Flat lines, no gradients.
const NS = 'http://www.w3.org/2000/svg';

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function placeholderSvg(id) {
  const rand = mulberry32(hash(id));
  const W = 320;
  const H = 180;
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
  const bg = document.createElementNS(NS, 'rect');
  bg.setAttribute('width', String(W));
  bg.setAttribute('height', String(H));
  bg.setAttribute('fill', '#0F1012');
  svg.append(bg);

  // A smooth direction field from a few random modes; draw short segments along it.
  const a = 1 + rand() * 2;
  const b = 1 + rand() * 2;
  const p = rand() * Math.PI * 2;
  const field = (x, y) => Math.sin((x / W) * Math.PI * a + p) + Math.cos((y / H) * Math.PI * b - p) * 0.8;
  const step = 20;
  let d = '';
  let dAccent = '';
  for (let y = step / 2; y < H; y += step) {
    for (let x = step / 2; x < W; x += step) {
      const ang = field(x, y);
      const len = 6 + rand() * 4;
      const dx = Math.cos(ang) * len;
      const dy = Math.sin(ang) * len;
      const seg = `M${(x - dx).toFixed(1)} ${(y - dy).toFixed(1)}L${(x + dx).toFixed(1)} ${(y + dy).toFixed(1)}`;
      if (rand() < 0.16) dAccent += seg;
      else d += seg;
    }
  }
  for (const [path, colour, width] of [
    [d, '#2C2E33', 1.5],
    [dAccent, '#FF4F00', 2],
  ]) {
    const node = document.createElementNS(NS, 'path');
    node.setAttribute('d', path);
    node.setAttribute('stroke', colour);
    node.setAttribute('stroke-width', String(width));
    node.setAttribute('stroke-linecap', 'square');
    node.setAttribute('fill', 'none');
    svg.append(node);
  }
  svg.setAttribute('aria-hidden', 'true');
  return svg;
}
