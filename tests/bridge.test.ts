import { describe, expect, it } from 'vitest';
import { buildBridgeScript, injectBridge } from '../src/bridge.js';

describe('buildBridgeScript', () => {
  it('includes the style + script tags', () => {
    const out = buildBridgeScript();
    expect(out).toContain('<style data-ve-bridge-style>');
    expect(out).toContain('<script data-ve-bridge>');
  });

  it('embeds options as JSON', () => {
    const out = buildBridgeScript({ targetOrigin: 'https://example.com', channel: 'custom' });
    expect(out).toContain('"targetOrigin":"https://example.com"');
    expect(out).toContain('"channel":"custom"');
  });

  it('defaults targetOrigin to *', () => {
    const out = buildBridgeScript();
    expect(out).toContain('"targetOrigin":"*"');
  });
});

describe('injectBridge', () => {
  it('inserts before </body>', () => {
    const out = injectBridge('<!doctype html><html><body><p>hi</p></body></html>');
    expect(out).toMatch(/<script data-ve-bridge>[\s\S]*<\/script>\s*<\/body>/);
  });

  it('replaces existing bridge on re-inject (idempotent)', () => {
    const once = injectBridge('<html><body><p>hi</p></body></html>');
    const twice = injectBridge(once);
    const matches = twice.match(/<script data-ve-bridge>/g);
    expect(matches?.length).toBe(1);
  });

  it('appends when no </body> present', () => {
    const out = injectBridge('<p>hi</p>');
    expect(out).toMatch(/<p>hi<\/p>[\s\S]*<script data-ve-bridge>/);
  });
});
