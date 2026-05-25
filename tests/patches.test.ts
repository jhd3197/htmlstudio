import { describe, expect, it } from 'vitest';
import { tagHtml } from '../src/tagger.js';
import { applyPatch, applyPatches } from '../src/patches.js';

const source = tagHtml(
  '<section><h1>Hello</h1><a href="/old">link</a><img src="/a.png" alt="a"/><p style="color: red">x</p></section>',
);

describe('applyPatch — set-text', () => {
  it('replaces leaf text', () => {
    const r = applyPatch(source, { kind: 'set-text', id: 'p-0-0', value: 'Hi there' });
    expect(r.ok).toBe(true);
    expect(r.source).toContain('>Hi there<');
    expect(r.source).not.toContain('>Hello<');
  });

  it('escapes HTML in text values', () => {
    const r = applyPatch(source, { kind: 'set-text', id: 'p-0-0', value: '<script>x</script>' });
    expect(r.source).toContain('&lt;script&gt;');
  });

  it('refuses when element has nested markup', () => {
    const nested = tagHtml('<div><p>hi <strong>x</strong></p></div>');
    const r = applyPatch(nested, { kind: 'set-text', id: 'p-0-0', value: 'nope' });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/nested/);
  });

  it('returns error when id missing', () => {
    const r = applyPatch(source, { kind: 'set-text', id: 'p-nope', value: 'x' });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/not found/);
  });
});

describe('applyPatch — set-link', () => {
  it('updates href and label on a plain anchor', () => {
    const r = applyPatch(source, { kind: 'set-link', id: 'p-0-1', href: '/new', text: 'go' });
    expect(r.ok).toBe(true);
    expect(r.source).toContain('href="/new"');
    expect(r.source).toContain('>go<');
  });
});

describe('applyPatch — set-image', () => {
  it('updates src and alt', () => {
    const r = applyPatch(source, { kind: 'set-image', id: 'p-0-2', src: '/b.png', alt: 'B' });
    expect(r.ok).toBe(true);
    expect(r.source).toContain('src="/b.png"');
    expect(r.source).toContain('alt="B"');
  });
});

describe('applyPatch — set-style', () => {
  it('merges into existing inline style', () => {
    const r = applyPatch(source, {
      kind: 'set-style',
      id: 'p-0-3',
      styles: { 'font-size': '20px', color: 'blue' },
    });
    expect(r.ok).toBe(true);
    expect(r.source).toMatch(/style="[^"]*color: blue[^"]*"/);
    expect(r.source).toMatch(/font-size: 20px/);
  });

  it('removes a style when value is empty string', () => {
    const r = applyPatch(source, { kind: 'set-style', id: 'p-0-3', styles: { color: '' } });
    expect(r.source).not.toMatch(/color: red/);
  });
});

describe('applyPatch — set-attributes', () => {
  it('adds and removes attributes', () => {
    const r = applyPatch(source, {
      kind: 'set-attributes',
      id: 'p-0-1',
      attributes: { target: '_blank', href: null },
    });
    expect(r.ok).toBe(true);
    expect(r.source).toContain('target="_blank"');
    expect(r.source).not.toContain('href=');
  });
});

describe('applyPatch — set-outer-html', () => {
  it('replaces the element and preserves id slot', () => {
    const r = applyPatch(source, {
      kind: 'set-outer-html',
      id: 'p-0-0',
      html: '<h1>Brand new</h1>',
    });
    expect(r.ok).toBe(true);
    expect(r.source).toContain('data-ve-id="p-0-0"');
    expect(r.source).toContain('>Brand new<');
  });
});

describe('applyPatch — set-full-source', () => {
  it('returns the new source verbatim', () => {
    const r = applyPatch(source, { kind: 'set-full-source', source: '<p>fresh</p>' });
    expect(r.source).toBe('<p>fresh</p>');
  });
});

describe('applyPatches', () => {
  it('chains patches and bails on first error', () => {
    const r = applyPatches(source, [
      { kind: 'set-text', id: 'p-0-0', value: 'One' },
      { kind: 'set-text', id: 'p-0-0', value: 'Two' },
    ]);
    expect(r.ok).toBe(true);
    expect(r.source).toContain('>Two<');

    const bad = applyPatches(source, [
      { kind: 'set-text', id: 'p-0-0', value: 'One' },
      { kind: 'set-text', id: 'p-missing', value: 'x' },
    ]);
    expect(bad.ok).toBe(false);
  });
});
