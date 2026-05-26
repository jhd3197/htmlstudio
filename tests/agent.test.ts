import { describe, it, expect } from 'vitest';
import {
  PATCH_JSON_SCHEMA,
  PROVIDER_TOOL_SPECS,
  PATCH_TOOL_NAME,
  formatSelectionContext,
  validatePatch,
  parsePatch,
  PatchValidationError,
  TWEAK_SYSTEM_PROMPT,
  REBUILD_SYSTEM_PROMPT,
} from '../src/agent/index.js';
import type { ElementInfo } from '../src/types.js';

describe('PATCH_JSON_SCHEMA', () => {
  it('covers all seven patch kinds in oneOf', () => {
    const kinds = PATCH_JSON_SCHEMA.oneOf.map(
      (s) => (s.properties.kind as { const: string }).const,
    );
    expect(kinds).toEqual([
      'set-text',
      'set-link',
      'set-image',
      'set-style',
      'set-attributes',
      'set-outer-html',
      'set-full-source',
    ]);
  });

  it('marks every variant additionalProperties: false', () => {
    for (const variant of PATCH_JSON_SCHEMA.oneOf) {
      expect(variant.additionalProperties).toBe(false);
    }
  });
});

describe('PROVIDER_TOOL_SPECS', () => {
  it('exports an Anthropic tool with input_schema', () => {
    expect(PROVIDER_TOOL_SPECS.anthropic.name).toBe(PATCH_TOOL_NAME);
    expect(PROVIDER_TOOL_SPECS.anthropic.input_schema).toBe(PATCH_JSON_SCHEMA);
  });

  it('exports an OpenAI function with parameters', () => {
    expect(PROVIDER_TOOL_SPECS.openai.type).toBe('function');
    expect(PROVIDER_TOOL_SPECS.openai.function.name).toBe(PATCH_TOOL_NAME);
    expect(PROVIDER_TOOL_SPECS.openai.function.parameters).toBe(PATCH_JSON_SCHEMA);
  });
});

describe('system prompts', () => {
  it('TWEAK prompt forbids set-full-source', () => {
    expect(TWEAK_SYSTEM_PROMPT).toMatch(/set-full-source/);
    expect(TWEAK_SYSTEM_PROMPT.toLowerCase()).toMatch(/never use set-full-source/i);
  });

  it('REBUILD prompt requires set-full-source', () => {
    expect(REBUILD_SYSTEM_PROMPT).toMatch(/set-full-source/);
  });
});

describe('formatSelectionContext', () => {
  it('returns a no-selection sentinel when null', () => {
    expect(formatSelectionContext(null)).toMatch(/no element/i);
  });

  it('formats a basic selection', () => {
    const sel: ElementInfo = {
      id: 'p-0-0',
      tag: 'h1',
      kind: 'text',
      text: 'Hello',
      attributes: { class: 'hero' },
    };
    const out = formatSelectionContext(sel);
    expect(out).toContain('p-0-0');
    expect(out).toContain('<h1>');
    expect(out).toContain('"Hello"');
    expect(out).toContain('class: "hero"');
  });

  it('clips long attribute values', () => {
    const long = 'x'.repeat(300);
    const sel: ElementInfo = {
      id: 'p',
      tag: 'div',
      kind: 'container',
      attributes: { style: long },
    };
    const out = formatSelectionContext(sel);
    expect(out).not.toContain(long);
    expect(out).toContain('…');
  });
});

describe('validatePatch', () => {
  it('passes through a valid set-text patch', () => {
    const patch = validatePatch({ kind: 'set-text', id: 'p', value: 'hi' });
    expect(patch).toEqual({ kind: 'set-text', id: 'p', value: 'hi' });
  });

  it('passes through a valid set-style patch', () => {
    const patch = validatePatch({
      kind: 'set-style',
      id: 'p',
      styles: { color: 'red', 'font-size': '14px' },
    });
    expect(patch.kind).toBe('set-style');
  });

  it('passes through set-attributes with null removals', () => {
    const patch = validatePatch({
      kind: 'set-attributes',
      id: 'p',
      attributes: { href: 'https://x', target: null },
    });
    if (patch.kind !== 'set-attributes') throw new Error('wrong kind');
    expect(patch.attributes.target).toBeNull();
  });

  it('throws on unknown kind', () => {
    expect(() => validatePatch({ kind: 'set-color', id: 'p' })).toThrow(PatchValidationError);
  });

  it('throws on missing required field', () => {
    expect(() => validatePatch({ kind: 'set-text', id: 'p' })).toThrow(/value/);
  });

  it('throws on wrong field type', () => {
    expect(() =>
      validatePatch({ kind: 'set-style', id: 'p', styles: { color: 5 } }),
    ).toThrow(/string/);
  });

  it('throws on non-object input', () => {
    expect(() => validatePatch('hi')).toThrow(PatchValidationError);
    expect(() => validatePatch(null)).toThrow(PatchValidationError);
  });
});

describe('parsePatch', () => {
  it('returns ok:true for valid input', () => {
    const r = parsePatch({ kind: 'set-text', id: 'p', value: 'hi' });
    expect(r.ok).toBe(true);
  });

  it('returns ok:false with error string for invalid input', () => {
    const r = parsePatch({ kind: 'set-text' });
    expect(r.ok).toBe(false);
    if (r.ok) throw new Error('expected ok=false');
    expect(r.error).toMatch(/id/);
  });
});
