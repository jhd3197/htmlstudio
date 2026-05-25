# visual-edit-core

> HTML-source-of-truth visual editor primitives. A small, framework-agnostic alternative to GrapesJS — built for AI-generated sites where the HTML the model emits **is** the source.

[![CI](https://github.com/jhd3197/visual-edit-core/actions/workflows/ci.yml/badge.svg)](https://github.com/jhd3197/visual-edit-core/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## Why

GrapesJS asks you to translate your HTML into its proprietary component-JSON tree. Importing AI-generated markup is lossy; round-tripping back to clean HTML is worse. Here, the HTML string stays canonical. Every visual edit is a tiny, typed patch on that string — the same shape an LLM tool-call would emit.

Three primitives, ~400 LOC of source:

| Primitive | What it does |
|---|---|
| **`tagHtml(html)`** | Walks the tree, stamps stable `data-ve-id="p-0-1-2"` ids on every meaningful element. Idempotent. |
| **`buildBridgeScript(opts)` / `injectBridge(html, opts)`** | A `<script>` you inject into a preview iframe. Handles hover outlines, click-to-select, `contenteditable` double-click-to-edit, and `postMessage`s typed events to the host. |
| **`applyPatch(source, patch)`** | Six patch kinds: `set-text`, `set-link`, `set-image`, `set-style`, `set-attributes`, `set-outer-html`, `set-full-source`. Mutates by id, returns new source. |

## Pipeline

```
 AI emits HTML
      │
      ▼
  tagHtml ─────► HTML + data-ve-id="p-0-1-2" on each element
      │
      ▼
 injectBridge ─► same HTML + bridge <script> before </body>
      │
      ▼
 preview iframe renders it; user hovers / clicks / dblclicks
      │
      ▼  (postMessage, channel: 've')
 host receives BridgeEvent { type: 'select' | 'dblclick-text' | ... }
      │
      ▼
 host builds a Patch; applyPatch(source, patch)
      │
      ▼
 new source string ─► save to DB / re-render iframe
```

## Install

```bash
npm install visual-edit-core
```

## Quick start

```ts
import { tagHtml, injectBridge, applyPatch } from 'visual-edit-core';

const raw = '<section><h1>Hello</h1><p>world</p></section>';
const tagged = tagHtml(raw);
// <section data-ve-id="p-0"><h1 data-ve-id="p-0-0">Hello</h1><p data-ve-id="p-0-1">world</p></section>

const previewHtml = injectBridge(`<!doctype html><body>${tagged}</body>`, {
  targetOrigin: 'https://your-host.app',
});
// → serve this in the iframe

// when the user edits a text node:
const r = applyPatch(tagged, { kind: 'set-text', id: 'p-0-0', value: 'Hi there' });
console.log(r.source); // updated HTML, ready to persist
```

## Host-side wiring

```js
window.addEventListener('message', (e) => {
  if (e.data?.channel !== 've') return;
  switch (e.data.type) {
    case 'ready':         console.log(`${e.data.payload.count} elements tagged`); break;
    case 'hover':         /* show breadcrumb */ break;
    case 'select':        /* render inspector panel */ break;
    case 'dblclick-text': /* user finished inline editing; build a set-text patch */ break;
  }
});

// host → iframe commands
iframe.contentWindow.postMessage(
  { channel: 've', type: 'highlight', payload: { id: 'p-0-1' } },
  'https://preview.app',
);
```

## Patch types

```ts
type Patch =
  | { kind: 'set-text';        id: string; value: string }
  | { kind: 'set-link';        id: string; href: string; text: string }
  | { kind: 'set-image';       id: string; src: string; alt: string }
  | { kind: 'set-style';       id: string; styles: Record<string, string> }   // '' removes
  | { kind: 'set-attributes';  id: string; attributes: Record<string, string | null> } // null removes
  | { kind: 'set-outer-html';  id: string; html: string }                     // id slot preserved
  | { kind: 'set-full-source'; source: string };
```

## Demo

```bash
npm install
npm run build
npm run demo
# → http://127.0.0.1:5180
```

Two-pane host: live iframe preview on the left, inspector + event log on the right. Click any element, double-click text to edit inline, or tweak fields in the inspector.

## Develop

```bash
npm install
npm run build         # tsc → dist/
npm test              # vitest, 25 tests
npm run test:watch
npm run dev           # tsc --watch
```

## Why not GrapesJS / Webflow / Builder.io

All of them define a proprietary scene graph. That's fine when humans author from scratch — terrible when the source of truth is AI output that needs to round-trip cleanly. Here:

- **Source = HTML.** No schema migrations, no lossy import/export.
- **AI-native.** Every patch maps 1:1 to an LLM tool-call. The model can edit through the same surface a human does.
- **Tiny.** One runtime dep (`node-html-parser`). Bridge script is ~3 KB unminified.
- **Framework-agnostic.** The core is pure TS. Adapters (`visual-edit-react`, `visual-edit-vue`) live in separate packages.

## Roadmap

- `visual-edit-react` — `<VisualEditor source onChange />` + inspector components.
- Block/component registry via `data-ve-block="hero"`.
- Undo/redo stack helper.
- Style-token patches (`set-token`) for design-system-aware editing.
- AI tool-call adapter (`patchToToolCall` / `toolCallToPatch`).

## License

MIT © Juan Denis
