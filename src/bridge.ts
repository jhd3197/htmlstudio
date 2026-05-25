import { ID_ATTR } from './types.js';

export interface BridgeOptions {
  /** Origin to scope postMessage to. Default '*' — set this in production. */
  targetOrigin?: string;
  /** Selector for elements the bridge will consider interactive. */
  discoverySelector?: string;
  /** Show hover/select outlines. Default true. */
  outlines?: boolean;
  /** Channel id, useful when multiple bridges share a window. Default 've'. */
  channel?: string;
}

const DEFAULT_DISCOVERY = 'main,nav,section,article,header,footer,aside,div,h1,h2,h3,h4,h5,h6,p,a,button,img,span,strong,em,li,figure,figcaption,input,textarea,label';

/**
 * Returns a `<script>` (with sibling `<style>`) to inject into the preview iframe's HTML.
 * The script wires up hover/select/double-click-to-edit and posts events to the parent window.
 *
 * Host listens with:
 *   window.addEventListener('message', (e) => {
 *     if (e.data?.channel === 've') handle(e.data);
 *   });
 *
 * Host sends commands the same shape: { channel: 've', type: 'highlight'|'clear', payload }
 */
export function buildBridgeScript(options: BridgeOptions = {}): string {
  const opts = {
    targetOrigin: options.targetOrigin ?? '*',
    discoverySelector: options.discoverySelector ?? DEFAULT_DISCOVERY,
    outlines: options.outlines ?? true,
    channel: options.channel ?? 've',
  };

  return `
<style data-ve-bridge-style>
  [data-ve-hover] { outline: 1px dashed rgba(59,130,246,0.7) !important; outline-offset: 2px; }
  [data-ve-selected] { outline: 2px solid rgba(59,130,246,1) !important; outline-offset: 2px; }
  [data-ve-editing] { outline: 2px solid rgba(16,185,129,1) !important; outline-offset: 2px; cursor: text; }
</style>
<script data-ve-bridge>(function(){
  var OPTS = ${JSON.stringify(opts)};
  var ID_ATTR = ${JSON.stringify(ID_ATTR)};
  var post = function(type, payload){
    parent.postMessage({ channel: OPTS.channel, type: type, payload: payload }, OPTS.targetOrigin);
  };

  function isEligible(el){
    return el && el.matches && el.matches(OPTS.discoverySelector) && el.getAttribute && el.getAttribute(ID_ATTR);
  }
  function infoFor(el){
    if (!el) return null;
    var rect = el.getBoundingClientRect();
    var attrs = {};
    for (var i = 0; i < el.attributes.length; i++) {
      var a = el.attributes[i];
      attrs[a.name] = a.value;
    }
    var tag = el.tagName.toLowerCase();
    var kind = tag === 'a' ? 'link' : tag === 'img' ? 'image' : hasChildren(el) ? 'container' : 'text';
    return {
      id: el.getAttribute(ID_ATTR),
      tag: tag,
      kind: kind,
      text: kind === 'text' ? (el.textContent || '').trim() : undefined,
      attributes: attrs,
      rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
    };
  }
  function hasChildren(el){
    for (var i = 0; i < el.children.length; i++) return true;
    return false;
  }
  function closestEligible(node){
    while (node && node.nodeType === 1) {
      if (isEligible(node)) return node;
      node = node.parentElement;
    }
    return null;
  }

  var hovered = null, selected = null, editing = null;

  document.addEventListener('mousemove', function(e){
    var el = closestEligible(e.target);
    if (el === hovered) return;
    if (hovered && OPTS.outlines) hovered.removeAttribute('data-ve-hover');
    hovered = el;
    if (hovered && OPTS.outlines && hovered !== selected) hovered.setAttribute('data-ve-hover', '');
    post('hover', infoFor(hovered));
  }, true);

  document.addEventListener('click', function(e){
    if (editing) return; // let inline editor consume
    var el = closestEligible(e.target);
    if (!el) return;
    e.preventDefault();
    e.stopPropagation();
    if (selected && OPTS.outlines) selected.removeAttribute('data-ve-selected');
    selected = el;
    if (OPTS.outlines) selected.setAttribute('data-ve-selected', '');
    post('select', infoFor(selected));
  }, true);

  document.addEventListener('dblclick', function(e){
    var el = closestEligible(e.target);
    if (!el) return;
    if (hasChildren(el)) return; // text-only inline editing for leaves
    e.preventDefault();
    e.stopPropagation();
    editing = el;
    el.setAttribute('data-ve-editing', '');
    el.setAttribute('contenteditable', 'plaintext-only');
    el.focus();
    var stop = function(){
      el.removeAttribute('contenteditable');
      el.removeAttribute('data-ve-editing');
      post('dblclick-text', { id: el.getAttribute(ID_ATTR), value: (el.textContent || '') });
      editing = null;
      el.removeEventListener('blur', stop);
    };
    el.addEventListener('blur', stop);
  }, true);

  // Host → iframe commands
  window.addEventListener('message', function(e){
    var msg = e.data;
    if (!msg || msg.channel !== OPTS.channel) return;
    if (msg.type === 'highlight') {
      var target = document.querySelector('[' + ID_ATTR + '="' + (msg.payload && msg.payload.id || '') + '"]');
      if (selected) selected.removeAttribute('data-ve-selected');
      selected = target;
      if (selected) selected.setAttribute('data-ve-selected', '');
    } else if (msg.type === 'clear') {
      if (selected) selected.removeAttribute('data-ve-selected');
      if (hovered) hovered.removeAttribute('data-ve-hover');
      selected = null; hovered = null;
    }
  });

  // Announce ready + element count
  var count = document.querySelectorAll('[' + ID_ATTR + ']').length;
  post('ready', { count: count });
})();</script>`;
}

/**
 * Inject the bridge into a full HTML document string (before </body>).
 * Safe to call on already-bridged HTML — replaces the existing bridge tag.
 */
export function injectBridge(html: string, options: BridgeOptions = {}): string {
  const script = buildBridgeScript(options);
  const stripped = html
    .replace(/<style data-ve-bridge-style>[\s\S]*?<\/style>/g, '')
    .replace(/<script data-ve-bridge>[\s\S]*?<\/script>/g, '');
  if (/<\/body>/i.test(stripped)) {
    return stripped.replace(/<\/body>/i, `${script}\n</body>`);
  }
  return stripped + script;
}
