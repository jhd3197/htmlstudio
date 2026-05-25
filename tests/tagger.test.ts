import { describe, expect, it } from 'vitest';
import { tagHtml, untagHtml } from '../src/tagger.js';
import { ID_ATTR } from '../src/types.js';

describe('tagHtml', () => {
  it('stamps positional ids on meaningful elements', () => {
    const out = tagHtml('<section><h1>Hi</h1><p>x</p></section>');
    expect(out).toContain(`<section ${ID_ATTR}="p-0">`);
    expect(out).toContain(`<h1 ${ID_ATTR}="p-0-0">`);
    expect(out).toContain(`<p ${ID_ATTR}="p-0-1">`);
  });

  it('is idempotent — preserves existing ids by default', () => {
    const once = tagHtml('<div><p>x</p></div>');
    const twice = tagHtml(once);
    expect(twice).toBe(once);
  });

  it('skips non-taggable tags (script, style, head guts)', () => {
    const out = tagHtml('<div><script>var x=1</script><p>hi</p></div>');
    expect(out).not.toMatch(/<script[^>]*data-ve-id/);
    expect(out).toMatch(/<p data-ve-id/);
  });

  it('respects custom taggable set', () => {
    const out = tagHtml('<div><span>x</span><p>y</p></div>', { taggable: new Set(['p']) });
    expect(out).not.toMatch(/<div[^>]*data-ve-id/);
    expect(out).not.toMatch(/<span[^>]*data-ve-id/);
    expect(out).toMatch(/<p data-ve-id/);
  });

  it('handles nested elements with unique paths', () => {
    const out = tagHtml('<main><section><article><h2>t</h2></article></section></main>');
    expect(out).toContain(`${ID_ATTR}="p-0"`);
    expect(out).toContain(`${ID_ATTR}="p-0-0"`);
    expect(out).toContain(`${ID_ATTR}="p-0-0-0"`);
    expect(out).toContain(`${ID_ATTR}="p-0-0-0-0"`);
  });

  it('preserveExisting=false re-tags everything', () => {
    const once = tagHtml('<div><p>x</p></div>');
    const forced = tagHtml(once, { preserveExisting: false });
    expect(forced).toContain(`${ID_ATTR}="p-0"`);
  });
});

describe('untagHtml', () => {
  it('removes all ve ids', () => {
    const tagged = tagHtml('<section><h1>Hi</h1></section>');
    const clean = untagHtml(tagged);
    expect(clean).not.toContain('data-ve-id');
    expect(clean).toContain('<h1>Hi</h1>');
  });
});
