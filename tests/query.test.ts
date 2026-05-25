import { describe, expect, it } from 'vitest';
import { tagHtml } from '../src/tagger.js';
import { findAll, findById, findClosest, getChildren, getParent, getTree } from '../src/query.js';

const source = tagHtml(
  '<main><section><h1>Hi</h1><p>x</p><a href="/a" class="cta">go</a></section><section data-ve-block="hero"><h2>second</h2><a href="/b" class="cta">also</a></section></main>',
);

describe('findById', () => {
  it('returns ElementInfo for an existing id', () => {
    const out = findById(source, 'p-0-0-0');
    expect(out).not.toBeNull();
    expect(out!.tag).toBe('h1');
    expect(out!.kind).toBe('text');
    expect(out!.text).toBe('Hi');
  });

  it('returns null for missing id', () => {
    expect(findById(source, 'p-nope')).toBeNull();
  });

  it('surfaces data-ve-block on the info', () => {
    const out = findById(source, 'p-0-1');
    expect(out?.block).toBe('hero');
  });
});

describe('findAll', () => {
  it('returns all anchors with data-ve-id', () => {
    const out = findAll(source, 'a.cta');
    expect(out.length).toBe(2);
    expect(out.every((e) => e.tag === 'a')).toBe(true);
    expect(out.map((e) => e.attributes.href)).toEqual(['/a', '/b']);
  });

  it('returns [] for non-matching selector', () => {
    expect(findAll(source, 'video')).toEqual([]);
  });
});

describe('findClosest', () => {
  it('walks up to the nearest matching ancestor with an id', () => {
    const out = findClosest(source, 'p-0-0-0', 'section');
    expect(out).not.toBeNull();
    expect(out!.tag).toBe('section');
    expect(out!.id).toBe('p-0-0');
  });

  it('finds the block ancestor', () => {
    const out = findClosest(source, 'p-0-1-1', '[data-ve-block]');
    expect(out?.block).toBe('hero');
  });

  it('returns null when nothing matches up the tree', () => {
    expect(findClosest(source, 'p-0-0-0', 'video')).toBeNull();
  });
});

describe('getChildren', () => {
  it('returns direct element children with ids', () => {
    const children = getChildren(source, 'p-0-0');
    expect(children.map((c) => c.tag)).toEqual(['h1', 'p', 'a']);
  });

  it('returns [] for unknown id', () => {
    expect(getChildren(source, 'p-nope')).toEqual([]);
  });
});

describe('getParent', () => {
  it('returns the immediate parent element info', () => {
    const out = getParent(source, 'p-0-0-0');
    expect(out?.tag).toBe('section');
  });

  it('returns null at the root', () => {
    expect(getParent(source, 'p-0')).toBeNull();
  });
});

describe('getTree', () => {
  it('builds a nested tree up to maxDepth', () => {
    const out = getTree(source, 'p-0', 2);
    expect(out).not.toBeNull();
    expect(out!.tag).toBe('main');
    expect(out!.children.map((c) => c.tag)).toEqual(['section', 'section']);
    // depth 2 — section's children included
    expect(out!.children[0].children.length).toBe(3);
  });

  it('respects depth limit', () => {
    const out = getTree(source, 'p-0', 1);
    expect(out!.children[0].children).toEqual([]);
  });
});
