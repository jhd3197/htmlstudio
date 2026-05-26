import { useCallback, useEffect, useRef, useState } from 'react';
import { tagHtml, untagHtml } from '../tagger.js';
import { applyPatch, applyPatches } from '../patches.js';
import { injectBridge } from '../bridge.js';
import type { Patch, ElementInfo } from '../types.js';

export interface UseVisualEditOptions {
  /** Returns the raw HTML to edit. Called once per `key` change. */
  loadSource: () => Promise<string> | string;
  /**
   * Persist the edited HTML. Called after a 600ms debounce on every patch.
   * Receives the *untagged* HTML so storage stays clean.
   */
  saveSource?: (html: string) => Promise<void> | void;
  /** When false, the hook is a no-op. */
  enabled?: boolean;
  /** Change this to force a reload (e.g. version id). */
  key?: string | number | null;
  /** <base href> injected into the iframe so relative assets resolve. */
  baseHref?: string;
  /** Forwarded to `injectBridge`. Default `'*'`. */
  targetOrigin?: string;
  /** Debounce ms before saveSource fires. Default 600. */
  saveDebounceMs?: number;
}

export type SaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error';

export interface SaveState {
  status: SaveStatus;
  error: string | null;
  savedAt?: number;
}

export interface VisualEdit {
  srcDoc: string | null;
  selection: ElementInfo | null;
  selections: ElementInfo[];
  setSelection: (s: ElementInfo | null) => void;
  setSelections: (s: ElementInfo[]) => void;
  clearSelection: () => void;
  applyPatch: (patch: Patch) => void;
  applyPatches: (patches: Patch[]) => void;
  getOuterHtml: (id: string) => string | null;
  getTaggedSource: () => string | null;
  ready: boolean;
  saveState: SaveState;
  previewFrameRef: React.MutableRefObject<HTMLIFrameElement | null>;
}

/**
 * Orchestrates the htmlstudio round-trip for a single HTML source.
 *
 *   1. Calls `loadSource` to fetch the raw HTML.
 *   2. Tags it, injects the bridge, exposes `srcDoc` for an <iframe>.
 *   3. Listens for postMessage events from the bridge → `selection`/`selections`.
 *   4. `applyPatch` mutates the tagged source, rebuilds `srcDoc`, debounces `saveSource`.
 *
 * All IO is caller-controlled — no fetch, no opinion about where the HTML lives.
 */
export function useVisualEdit({
  loadSource,
  saveSource,
  enabled = true,
  key = null,
  baseHref,
  targetOrigin = '*',
  saveDebounceMs = 600,
}: UseVisualEditOptions): VisualEdit {
  const [taggedSource, setTaggedSource] = useState<string | null>(null);
  const [srcDoc, setSrcDoc] = useState<string | null>(null);
  const [selection, setSelection] = useState<ElementInfo | null>(null);
  const [selections, setSelections] = useState<ElementInfo[]>([]);
  const [ready, setReady] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>({ status: 'idle', error: null });
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previewFrameRef = useRef<HTMLIFrameElement | null>(null);

  const buildSrcDoc = useCallback(
    (tagged: string): string => {
      const wrapped =
        baseHref && /<head[^>]*>/i.test(tagged)
          ? tagged.replace(/<head([^>]*)>/i, `<head$1><base href="${baseHref}">`)
          : baseHref
            ? `<!doctype html><html><head><base href="${baseHref}"></head><body>${tagged}</body></html>`
            : /<html/i.test(tagged)
              ? tagged
              : `<!doctype html><html><body>${tagged}</body></html>`;
      return injectBridge(wrapped, { targetOrigin });
    },
    [baseHref, targetOrigin],
  );

  useEffect(() => {
    if (!enabled) {
      setTaggedSource(null);
      setSrcDoc(null);
      setSelection(null);
      setSelections([]);
      setReady(false);
      return;
    }
    let cancelled = false;
    setReady(false);
    Promise.resolve(loadSource())
      .then((html) => {
        if (cancelled) return;
        const tagged = tagHtml(html);
        setTaggedSource(tagged);
        setSrcDoc(buildSrcDoc(tagged));
        setReady(true);
      })
      .catch((err) => {
        if (cancelled) return;
        // eslint-disable-next-line no-console
        console.error('useVisualEdit: loadSource failed', err);
        setReady(false);
      });
    return () => {
      cancelled = true;
    };
    // loadSource is intentionally not in deps — callers should change `key`
    // to force a reload. Listing it would re-fetch on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, key, buildSrcDoc]);

  const scheduleSave = useCallback(
    (html: string) => {
      if (!saveSource) return;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      setSaveState({ status: 'pending', error: null });
      saveTimer.current = setTimeout(async () => {
        setSaveState({ status: 'saving', error: null });
        try {
          await saveSource(untagHtml(html));
          setSaveState({ status: 'saved', error: null, savedAt: Date.now() });
        } catch (err) {
          setSaveState({ status: 'error', error: (err as Error).message });
        }
      }, saveDebounceMs);
    },
    [saveSource, saveDebounceMs],
  );

  const applyAndPersist = useCallback(
    (patch: Patch) => {
      setTaggedSource((current) => {
        if (!current) return current;
        const r = applyPatch(current, patch);
        if (!r.ok) {
          // eslint-disable-next-line no-console
          console.warn('htmlstudio patch failed:', r.error);
          return current;
        }
        setSrcDoc(buildSrcDoc(r.source));
        scheduleSave(r.source);
        return r.source;
      });
    },
    [buildSrcDoc, scheduleSave],
  );

  const applyManyAndPersist = useCallback(
    (patches: Patch[]) => {
      if (!Array.isArray(patches) || patches.length === 0) return;
      setTaggedSource((current) => {
        if (!current) return current;
        const r = applyPatches(current, patches);
        if (!r.ok) {
          // eslint-disable-next-line no-console
          console.warn('htmlstudio applyPatches failed:', r.error);
          return current;
        }
        setSrcDoc(buildSrcDoc(r.source));
        scheduleSave(r.source);
        return r.source;
      });
    },
    [buildSrcDoc, scheduleSave],
  );

  useEffect(() => {
    if (!enabled) return undefined;
    const onMessage = (e: MessageEvent) => {
      const msg = e.data as { channel?: string; type?: string; payload?: unknown } | undefined;
      if (!msg || msg.channel !== 've') return;
      if (msg.type === 'select') {
        setSelection((msg.payload as ElementInfo) ?? null);
        setSelections([]);
      } else if (msg.type === 'select-multi') {
        const arr = Array.isArray(msg.payload) ? (msg.payload as ElementInfo[]) : [];
        setSelections(arr);
        setSelection(null);
      } else if (msg.type === 'dblclick-text') {
        const p = msg.payload as { id: string; value: string };
        applyAndPersist({ kind: 'set-text', id: p.id, value: p.value });
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [enabled, applyAndPersist]);

  const getOuterHtml = useCallback(
    (id: string): string | null => {
      if (!taggedSource || !id) return null;
      try {
        const doc = new DOMParser().parseFromString(taggedSource, 'text/html');
        const el = doc.querySelector(`[data-ve-id="${CSS.escape(id)}"]`);
        return el ? el.outerHTML : null;
      } catch {
        return null;
      }
    },
    [taggedSource],
  );

  const getTaggedSource = useCallback(() => taggedSource, [taggedSource]);

  const clearSelection = useCallback(() => {
    setSelection(null);
    setSelections([]);
    if (previewFrameRef.current?.contentWindow) {
      previewFrameRef.current.contentWindow.postMessage(
        { channel: 've', type: 'clear' },
        '*',
      );
    }
  }, []);

  return {
    srcDoc,
    selection,
    selections,
    setSelection,
    setSelections,
    clearSelection,
    applyPatch: applyAndPersist,
    applyPatches: applyManyAndPersist,
    getOuterHtml,
    getTaggedSource,
    ready,
    saveState,
    previewFrameRef,
  };
}
