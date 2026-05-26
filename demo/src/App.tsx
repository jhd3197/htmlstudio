import { useCallback, useMemo, useState, type CSSProperties } from 'react';
import { PencilSimple, ArrowCounterClockwise } from '@phosphor-icons/react';
import {
  useVisualEdit,
  PreviewFrame,
  DeviceSwitcher,
  ZoomControls,
  RightRail,
  ChatSidebar,
  type ChatMessage,
} from 'htmlstudio/react';
import {
  BUILTIN_BLOCKS,
  renderBlock,
  renderBlockUpdate,
  type BlockDefinition,
  type Patch,
} from 'htmlstudio';
import { SAMPLE_HTML } from './sample.js';

const STORAGE_KEY = 'htmlstudio:demo:source';
const CHAT_KEY = 'htmlstudio:demo:chat';

function nowTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function loadChat(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(CHAT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function App() {
  const [editMode, setEditMode] = useState(true);
  const [device, setDevice] = useState<string | null>(null);
  const [deviceFrame, setDeviceFrame] = useState<string | null>(null);
  const [zoom, setZoom] = useState(85);
  const [resetCounter, setResetCounter] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadChat());

  const persistChat = useCallback((next: ChatMessage[]) => {
    setMessages(next);
    localStorage.setItem(CHAT_KEY, JSON.stringify(next));
  }, []);

  const handleSendChat = useCallback(
    (text: string) => {
      const user: ChatMessage = {
        id: `u-${Date.now()}`,
        role: 'user',
        content: text,
        time: nowTime(),
      };
      const reply: ChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content:
          "I'm a stub in this demo — no LLM is wired up. In your own app, swap this onSend handler for an Anthropic / OpenAI streaming call. The selection from the inspector (visual.selection) is available to send along as context.",
        time: nowTime(),
      };
      persistChat([...messages, user, reply]);
    },
    [messages, persistChat],
  );

  const loadSource = useCallback(() => {
    return localStorage.getItem(STORAGE_KEY) ?? SAMPLE_HTML;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetCounter]);

  const saveSource = useCallback((html: string) => {
    localStorage.setItem(STORAGE_KEY, html);
  }, []);

  const visual = useVisualEdit({
    loadSource,
    saveSource,
    enabled: editMode,
    key: `reset:${resetCounter}:edit:${editMode}`,
    saveDebounceMs: 400,
  });

  const handleInsert = useCallback(
    (def: BlockDefinition) => {
      if (!visual.selection) {
        window.alert('Select an element in the preview first — clicks replace it.');
        return;
      }
      const html = renderBlock(def, {});
      visual.applyPatch({
        kind: 'set-outer-html',
        id: visual.selection.id,
        html,
      });
    },
    [visual],
  );

  const handleRerenderBlock = useCallback(
    ({
      blockId,
      instanceId,
      targetId,
      config,
    }: {
      blockId: string;
      instanceId: string;
      targetId: string;
      config: Record<string, string>;
    }) => {
      const def = BUILTIN_BLOCKS.find((b) => b.id === blockId);
      if (!def) return;
      const html = renderBlockUpdate(def, config, instanceId);
      visual.applyPatch({
        kind: 'set-outer-html',
        id: targetId,
        html,
      } as Patch);
    },
    [visual],
  );

  const handleReset = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(CHAT_KEY);
    setMessages([]);
    visual.clearSelection();
    setResetCounter((n) => n + 1);
  };

  const chatHeader = (
    <div className="demo-chat-banner">
      <div className="demo-chat-banner__title">
        <PencilSimple size={12} weight="fill" /> Tweak mode
        <span className="demo-chat-banner__tag">stub</span>
      </div>
      <p className="demo-chat-banner__hint">
        {visual.selection
          ? `Selected <${visual.selection.tag}> — wire onSend to your LLM to act on it.`
          : 'Click an element in the preview, then describe a change.'}
      </p>
    </div>
  );

  const chatEmpty = (
    <p>
      No messages yet. Send something — the demo will reply with a stub. In your own app, pass your
      own <code>onSend</code> to <code>ChatSidebar</code> to wire an LLM.
    </p>
  );

  const livePreviewHtml = useMemo(() => {
    if (editMode) return undefined;
    return localStorage.getItem(STORAGE_KEY) ?? SAMPLE_HTML;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editMode, resetCounter]);

  return (
    <div className="demo-app">
      <header className="demo-header">
        <div className="demo-header__brand">
          <div className="demo-header__logo">h</div>
          <span className="demo-header__title">htmlstudio</span>
          <span className="demo-header__tag">demo</span>
          <span className="demo-header__tagline">HTML-source-of-truth visual editor</span>
        </div>

        <div className="demo-header__actions">
          <DeviceSwitcher
            active={device}
            onChange={(w, f) => {
              setDevice(w);
              setDeviceFrame(f);
            }}
          />
          <button
            type="button"
            onClick={() => setEditMode((v) => !v)}
            className={`hs-btn ${editMode ? 'hs-btn--primary' : 'hs-btn--ghost'}`}
          >
            <PencilSimple size={12} weight={editMode ? 'fill' : 'regular'} />
            {editMode ? 'Editing' : 'Edit'}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="hs-btn hs-btn--ghost"
            title="Reset to sample HTML"
          >
            <ArrowCounterClockwise size={12} />
            Reset
          </button>
          <a
            href="https://github.com/jhd3197/htmlstudio"
            target="_blank"
            rel="noreferrer"
            className="demo-header__link"
          >
            GitHub →
          </a>
        </div>
      </header>

      <div className="demo-body">
        <ChatSidebar
          messages={messages}
          onSend={handleSendChat}
          header={chatHeader}
          emptyState={chatEmpty}
          placeholder="Describe a change (stub — no LLM wired up)…"
        />

        <main className="demo-stage">
          <div className="demo-stage__grid" />

          <div
            className="demo-stage__viewport"
            style={{ zoom: `${zoom}%` } as CSSProperties}
          >
            <PreviewFrame
              html={livePreviewHtml}
              editSrcDoc={editMode ? visual.srcDoc : null}
              width={device}
              frame={deviceFrame}
              iframeRef={visual.previewFrameRef}
            />
          </div>

          <div className="demo-stage__zoom">
            <ZoomControls zoom={zoom} onZoomChange={setZoom} />
          </div>
        </main>

        {editMode && (
          <RightRail
            selection={visual.selection}
            selections={visual.selections}
            onApply={visual.applyPatch}
            onApplyMany={visual.applyPatches}
            onRerenderBlock={handleRerenderBlock}
            onClearSelection={visual.clearSelection}
            saveState={visual.saveState}
            blocks={BUILTIN_BLOCKS}
            onInsert={handleInsert}
          />
        )}
      </div>
    </div>
  );
}
