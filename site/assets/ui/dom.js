// Tiny DOM helper used by the UI factories. No framework.
//
//   el('button', { class: 'btn', type: 'button', on: { click: fn }, aria: { label: 'Play' } }, 'Text', childNode)
//
// Attribute keys: class, text, style (object of properties, including custom properties),
// on (event map), aria (map → aria-*), data (map → data-*), and any other attribute.
// Boolean true sets an empty attribute; false/null/undefined skips it.

let uid = 0;
export function nextId(prefix = 'hsc') {
  uid += 1;
  return `${prefix}-${uid}`;
}

export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs || {})) {
    if (value === false || value === null || value === undefined) continue;
    if (key === 'class') node.className = Array.isArray(value) ? value.filter(Boolean).join(' ') : value;
    else if (key === 'text') node.textContent = value;
    else if (key === 'style') {
      for (const [prop, v] of Object.entries(value)) {
        if (prop.startsWith('--')) node.style.setProperty(prop, v);
        else node.style[prop] = v;
      }
    } else if (key === 'on') {
      for (const [type, fn] of Object.entries(value)) node.addEventListener(type, fn);
    } else if (key === 'aria') {
      for (const [k, v] of Object.entries(value)) if (v !== null && v !== undefined && v !== false) node.setAttribute(`aria-${k}`, String(v));
    } else if (key === 'data') {
      for (const [k, v] of Object.entries(value)) if (v !== null && v !== undefined) node.dataset[k] = String(v);
    } else if (value === true) node.setAttribute(key, '');
    else node.setAttribute(key, String(value));
  }
  append(node, children);
  return node;
}

export function append(node, children) {
  for (const child of children.flat(Infinity)) {
    if (child === null || child === undefined || child === false) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return node;
}

/** Parse a trusted, static SVG string (icons only) into a node. */
export function svg(markup) {
  const tpl = document.createElement('template');
  tpl.innerHTML = markup.trim();
  return tpl.content.firstElementChild;
}

export function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
  return node;
}
