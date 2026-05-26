import { describe, expect, it } from 'vitest';
import {
  BUILTIN_BLOCKS,
  BUILTIN_REGISTRY,
  BLOCK_CONFIG_ATTR,
  BLOCK_INSTANCE_ATTR,
  createRegistry,
  generateWireframe,
  readBlockConfig,
  renderBlock,
  renderBlockUpdate,
  wireframeFor,
  type BlockDefinition,
} from '../src/blocks.js';
import { BLOCK_ATTR } from '../src/types.js';
import { tagHtml } from '../src/tagger.js';
import { findAll, findById } from '../src/query.js';

const sample: BlockDefinition = {
  id: 'sample',
  name: 'Sample',
  category: 'cta',
  description: 'tiny test block',
  thumbnail: 'x',
  template: '<section><h2 data-ve-field="heading">{{heading}}</h2><p>{{body}}</p></section>',
  fields: [
    { key: 'heading', type: 'text', label: 'Heading', default: 'Hello' },
    { key: 'body', type: 'textarea', label: 'Body', default: 'world' },
  ],
};

describe('renderBlock', () => {
  it('substitutes {{placeholders}} with config values', () => {
    const out = renderBlock(sample, { heading: 'Howdy', body: 'partner' });
    expect(out).toContain('>Howdy<');
    expect(out).toContain('>partner<');
  });

  it('falls back to declared defaults for missing keys', () => {
    const out = renderBlock(sample, { heading: 'Custom' });
    expect(out).toContain('>Custom<');
    expect(out).toContain('>world<'); // body default
  });

  it('stamps block markers on the outer element', () => {
    const out = renderBlock(sample, {}, { instanceId: 'b-test1' });
    expect(out).toMatch(new RegExp(`<section[^>]*${BLOCK_ATTR}="sample"`));
    expect(out).toContain(`${BLOCK_INSTANCE_ATTR}="b-test1"`);
    expect(out).toContain(`${BLOCK_CONFIG_ATTR}=`);
  });

  it('escapes HTML in user-supplied values (no XSS via config)', () => {
    const out = renderBlock(sample, { heading: '<script>alert(1)</script>' });
    expect(out).not.toContain('<script>alert(1)</script>');
    expect(out).toContain('&lt;script&gt;');
  });

  it('generates a random instanceId when none given', () => {
    const a = renderBlock(sample, {});
    const b = renderBlock(sample, {});
    const aId = a.match(/data-ve-block-instance="([^"]+)"/)?.[1];
    const bId = b.match(/data-ve-block-instance="([^"]+)"/)?.[1];
    expect(aId).toBeTruthy();
    expect(bId).toBeTruthy();
    expect(aId).not.toBe(bId);
  });
});

describe('readBlockConfig / renderBlockUpdate', () => {
  it('round-trips a config through the source', () => {
    const html = renderBlock(sample, { heading: 'Howdy' }, { instanceId: 'b-rt' });
    const cfg = readBlockConfig(html, 'b-rt');
    expect(cfg).toEqual({ heading: 'Howdy' });
  });

  it('updates an instance to the new config (caller patches via set-outer-html)', () => {
    const html = renderBlockUpdate(sample, { heading: 'New' }, 'b-rt');
    expect(html).toContain('>New<');
    expect(html).toContain(`${BLOCK_INSTANCE_ATTR}="b-rt"`);
  });

  it('returns {} for an unknown instance id', () => {
    expect(readBlockConfig('<div/>', 'b-nope')).toEqual({});
  });
});

describe('integration with tagger + query', () => {
  it('tagHtml preserves block attribute, query surfaces it', () => {
    const html = renderBlock(BUILTIN_BLOCKS[0], {}, { instanceId: 'b-hero' });
    const wrapped = `<body>${html}</body>`;
    const tagged = tagHtml(wrapped);
    // every meaningful element now has data-ve-id; the block attribute survived
    const cards = findAll(tagged, '[data-ve-block]');
    expect(cards.length).toBe(1);
    expect(cards[0].block).toBe('hero-split');
    // child fields are now tag-id'd and queryable
    expect(findAll(tagged, '[data-ve-field=heading]').length).toBe(1);
  });
});

describe('BUILTIN_BLOCKS', () => {
  it('ships at least 4 blocks', () => {
    expect(BUILTIN_BLOCKS.length).toBeGreaterThanOrEqual(4);
  });

  it('every block renders without throwing using just defaults', () => {
    for (const def of BUILTIN_BLOCKS) {
      const out = renderBlock(def, {});
      expect(out.length).toBeGreaterThan(50);
      expect(out).toContain(`${BLOCK_ATTR}="${def.id}"`);
    }
  });

  it('every block has a unique id', () => {
    const ids = BUILTIN_BLOCKS.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('BUILTIN_REGISTRY is consistent with BUILTIN_BLOCKS', () => {
    expect(BUILTIN_REGISTRY.list().length).toBe(BUILTIN_BLOCKS.length);
    expect(BUILTIN_REGISTRY.get('hero-split')?.name).toBe('Hero — Split');
    expect(BUILTIN_REGISTRY.get('nope')).toBeUndefined();
  });
});

describe('wireframes (v0.4)', () => {
  it('every builtin ships an authored wireframe SVG', () => {
    for (const b of BUILTIN_BLOCKS) {
      expect(b.wireframe, `${b.id} should have a wireframe`).toBeTruthy();
      expect(b.wireframe).toContain('<svg');
      expect(b.wireframe).toContain('viewBox');
    }
  });

  it('wireframeFor returns the authored wireframe when present', () => {
    const def = { template: '<div/>', wireframe: '<svg id="wf-test"/>' };
    expect(wireframeFor(def)).toContain('wf-test');
  });

  it('wireframeFor auto-generates from template when wireframe missing', () => {
    const def = { template: '<section><h1>x</h1><p>y</p><a href="#">z</a></section>' };
    const svg = wireframeFor(def);
    expect(svg).toContain('<svg');
    expect(svg).toContain('viewBox="0 0 160 90"');
  });

  it('generateWireframe scales with content (image present)', () => {
    const withImage = generateWireframe('<section><img src="/"/><h1>x</h1></section>');
    const withoutImage = generateWireframe('<section><h1>x</h1></section>');
    // image present → an image rect appears
    expect(withImage).toContain('width="50"');
    expect(withoutImage).not.toContain('width="50"');
  });
});

describe('createRegistry', () => {
  it('builds a registry from arbitrary definitions', () => {
    const reg = createRegistry([sample]);
    expect(reg.list()).toEqual([sample]);
    expect(reg.get('sample')).toBe(sample);
  });
});
