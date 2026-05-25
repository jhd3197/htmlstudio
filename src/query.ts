import { parse, type HTMLElement as NHPElement } from 'node-html-parser';
import { BLOCK_ATTR, ID_ATTR, type ElementInfo } from './types.js';

/**
 * Structural query helpers operating on a tagged HTML source string.
 *
 * Every function takes the raw source (HTML with `data-ve-id` already
 * stamped) and returns lightweight ElementInfo objects — no live DOM,
 * no mutation. Use these for inspection / discovery; use `applyPatch`
 * for changes.
 */

const TAGGABLE_DEFAULT_KIND_MAP: Record<string, ElementInfo['kind']> = {
  a: 'link',
  img: 'image',
};

function inferKind(el: NHPElement): ElementInfo['kind'] {
  const tag = el.rawTagName?.toLowerCase();
  if (!tag) return 'unknown';
  if (TAGGABLE_DEFAULT_KIND_MAP[tag]) return TAGGABLE_DEFAULT_KIND_MAP[tag];
  return hasElementChildren(el) ? 'container' : 'text';
}

function hasElementChildren(el: NHPElement): boolean {
  return el.childNodes.some((c) => (c as NHPElement).rawTagName);
}

function toInfo(el: NHPElement): ElementInfo {
  const attributes: Record<string, string> = {};
  for (const [k, v] of Object.entries(el.attributes || {})) {
    if (typeof v === 'string') attributes[k] = v;
  }
  const kind = inferKind(el);
  const text = kind === 'text' ? el.text.trim() : undefined;
  const block = el.getAttribute(BLOCK_ATTR) || undefined;
  return {
    id: el.getAttribute(ID_ATTR) || '',
    tag: el.rawTagName?.toLowerCase() || '',
    kind,
    text,
    attributes,
    ...(block ? { block } : {}),
  };
}

function cssEscape(s: string): string {
  return s.replace(/(["\\])/g, '\\$1');
}

function parseRoot(source: string): NHPElement {
  return parse(source, { lowerCaseTagName: false, comment: true }) as NHPElement;
}

/** Find a single element by its `data-ve-id`. */
export function findById(source: string, id: string): ElementInfo | null {
  const el = parseRoot(source).querySelector(`[${ID_ATTR}="${cssEscape(id)}"]`) as NHPElement | null;
  return el ? toInfo(el) : null;
}

/**
 * Find all elements matching a CSS selector. Only elements that carry
 * a `data-ve-id` are returned (so the caller can patch them).
 */
export function findAll(source: string, selector: string): ElementInfo[] {
  const root = parseRoot(source);
  const matches = root.querySelectorAll(selector) as NHPElement[];
  return matches
    .filter((el) => !!el.getAttribute(ID_ATTR))
    .map(toInfo);
}

/**
 * Walk up the tree from `fromId` until an ancestor matches `selector`.
 * Returns `null` if no match.
 */
export function findClosest(source: string, fromId: string, selector: string): ElementInfo | null {
  const root = parseRoot(source);
  const start = root.querySelector(`[${ID_ATTR}="${cssEscape(fromId)}"]`) as NHPElement | null;
  if (!start) return null;
  // node-html-parser supports closest() on elements
  const match = (start as unknown as { closest: (s: string) => NHPElement | null }).closest(selector);
  if (!match) return null;
  if (!match.getAttribute(ID_ATTR)) {
    // Walk further up looking for the first ancestor that matches AND has an id
    let cursor: NHPElement | null = match.parentNode as NHPElement | null;
    while (cursor) {
      const c = cursor as unknown as { matches?: (s: string) => boolean; getAttribute: (k: string) => string | null };
      if (typeof c.matches === 'function' && c.matches(selector) && c.getAttribute(ID_ATTR)) {
        return toInfo(cursor);
      }
      cursor = cursor.parentNode as NHPElement | null;
    }
    return null;
  }
  return toInfo(match);
}

/** Direct element children of the element with the given id. */
export function getChildren(source: string, id: string): ElementInfo[] {
  const root = parseRoot(source);
  const el = root.querySelector(`[${ID_ATTR}="${cssEscape(id)}"]`) as NHPElement | null;
  if (!el) return [];
  return el.childNodes
    .filter((c) => (c as NHPElement).rawTagName)
    .map((c) => toInfo(c as NHPElement))
    .filter((info) => !!info.id);
}

/** Immediate element parent of the element with the given id. */
export function getParent(source: string, id: string): ElementInfo | null {
  const root = parseRoot(source);
  const el = root.querySelector(`[${ID_ATTR}="${cssEscape(id)}"]`) as NHPElement | null;
  if (!el) return null;
  const parent = el.parentNode as NHPElement | null;
  if (!parent || !parent.rawTagName) return null;
  if (!parent.getAttribute(ID_ATTR)) return null;
  return toInfo(parent);
}

/**
 * Tree view of an element and its descendants, up to `maxDepth` levels.
 * Useful for giving an LLM a structural overview before bulk patches.
 */
export interface ElementNode extends ElementInfo {
  children: ElementNode[];
}

export function getTree(source: string, id: string, maxDepth = 3): ElementNode | null {
  const root = parseRoot(source);
  const el = root.querySelector(`[${ID_ATTR}="${cssEscape(id)}"]`) as NHPElement | null;
  if (!el) return null;
  return walk(el, 0, maxDepth);
}

function walk(el: NHPElement, depth: number, maxDepth: number): ElementNode {
  const info = toInfo(el);
  const node: ElementNode = { ...info, children: [] };
  if (depth >= maxDepth) return node;
  for (const c of el.childNodes) {
    const child = c as NHPElement;
    if (!child.rawTagName || !child.getAttribute(ID_ATTR)) continue;
    node.children.push(walk(child, depth + 1, maxDepth));
  }
  return node;
}
