import { parse, type HTMLElement as NHPElement } from 'node-html-parser';
import { ID_ATTR, type Patch, type PatchResult } from './types.js';

export function applyPatch(source: string, patch: Patch): PatchResult {
  if (patch.kind === 'set-full-source') return { ok: true, source: patch.source };

  const root = parse(source, { lowerCaseTagName: false, comment: true });
  const el = findById(root as NHPElement, patch.id);
  if (!el) return { ok: false, source, error: `Target not found: ${patch.id}` };

  switch (patch.kind) {
    case 'set-text': {
      if (hasElementChildren(el)) {
        return { ok: false, source, error: 'Element has nested markup — use set-outer-html.' };
      }
      el.set_content(escapeText(patch.value));
      break;
    }
    case 'set-link': {
      if (hasElementChildren(el)) {
        const current = el.text.trim();
        if (patch.text.trim() !== current) {
          return { ok: false, source, error: 'Link contains nested markup — edit label via HTML tab.' };
        }
      } else {
        el.set_content(escapeText(patch.text));
      }
      el.setAttribute('href', patch.href);
      break;
    }
    case 'set-image': {
      el.setAttribute('src', patch.src);
      el.setAttribute('alt', patch.alt);
      break;
    }
    case 'set-style': {
      mergeInlineStyle(el, patch.styles);
      break;
    }
    case 'set-attributes': {
      for (const [k, v] of Object.entries(patch.attributes)) {
        if (v === null) el.removeAttribute(k);
        else el.setAttribute(k, v);
      }
      break;
    }
    case 'set-outer-html': {
      const wrapper = parse(`<div>${patch.html}</div>`);
      const replacement = wrapper.firstChild as NHPElement | null;
      if (!replacement) return { ok: false, source, error: 'Replacement HTML empty.' };
      // preserve id so subsequent edits still target this element
      if (!replacement.getAttribute(ID_ATTR)) replacement.setAttribute(ID_ATTR, patch.id);
      el.replaceWith(replacement);
      break;
    }
  }

  return { ok: true, source: root.toString() };
}

export function applyPatches(source: string, patches: Patch[]): PatchResult {
  let current = source;
  for (const p of patches) {
    const r = applyPatch(current, p);
    if (!r.ok) return r;
    current = r.source;
  }
  return { ok: true, source: current };
}

function findById(root: NHPElement, id: string): NHPElement | null {
  return root.querySelector(`[${ID_ATTR}="${cssEscape(id)}"]`) as NHPElement | null;
}

function hasElementChildren(el: NHPElement): boolean {
  return el.childNodes.some((c) => (c as NHPElement).rawTagName);
}

function mergeInlineStyle(el: NHPElement, styles: Record<string, string>): void {
  const existing = parseStyle(el.getAttribute('style') ?? '');
  for (const [k, v] of Object.entries(styles)) {
    if (v === '' || v == null) delete existing[k];
    else existing[k] = v;
  }
  const serialized = Object.entries(existing).map(([k, v]) => `${k}: ${v}`).join('; ');
  if (serialized) el.setAttribute('style', serialized);
  else el.removeAttribute('style');
}

function parseStyle(s: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const decl of s.split(';')) {
    const [k, ...rest] = decl.split(':');
    if (!k || rest.length === 0) continue;
    out[k.trim()] = rest.join(':').trim();
  }
  return out;
}

function escapeText(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function cssEscape(s: string): string {
  return s.replace(/(["\\])/g, '\\$1');
}
