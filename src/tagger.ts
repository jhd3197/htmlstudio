import { parse, type HTMLElement as NHPElement } from 'node-html-parser';
import { ID_ATTR } from './types.js';

const DEFAULT_TAGGABLE = new Set([
  'main', 'nav', 'section', 'article', 'header', 'footer', 'aside',
  'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'p', 'a', 'button', 'img', 'span', 'strong', 'em',
  'ul', 'ol', 'li', 'figure', 'figcaption',
  'input', 'textarea', 'label',
]);

export interface TagOptions {
  taggable?: Set<string>;
  preserveExisting?: boolean;
}

export function tagHtml(html: string, options: TagOptions = {}): string {
  const taggable = options.taggable ?? DEFAULT_TAGGABLE;
  const preserveExisting = options.preserveExisting ?? true;

  const root = parse(html, {
    lowerCaseTagName: false,
    comment: true,
    voidTag: { closingSlash: true } as never,
  });

  walk(root as NHPElement, [], (el, path) => {
    const tag = el.rawTagName?.toLowerCase();
    if (!tag || !taggable.has(tag)) return;
    if (preserveExisting && el.getAttribute(ID_ATTR)) return;
    el.setAttribute(ID_ATTR, `p-${path.join('-')}`);
  });

  return root.toString();
}

function walk(
  node: NHPElement,
  path: number[],
  visit: (el: NHPElement, path: number[]) => void,
): void {
  visit(node, path);
  const children = node.childNodes.filter((c) => (c as NHPElement).rawTagName);
  children.forEach((child, i) => {
    walk(child as NHPElement, [...path, i], visit);
  });
}

/** Strip injected ids — useful for "export clean HTML". */
export function untagHtml(html: string): string {
  const root = parse(html, { lowerCaseTagName: false });
  walk(root as NHPElement, [], (el) => {
    if (el.getAttribute(ID_ATTR)) el.removeAttribute(ID_ATTR);
  });
  return root.toString();
}
