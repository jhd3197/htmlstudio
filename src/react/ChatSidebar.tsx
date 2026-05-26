import { useEffect, useRef, useState, type ReactNode, type KeyboardEvent } from 'react';
import { PaperPlaneTilt } from '@phosphor-icons/react';

export interface ChatMessage {
  /** Author of the message — used for styling, not validation. */
  role: 'user' | 'assistant' | 'system';
  /** Message body. Plain text — the renderer escapes it. */
  content: string;
  /** Optional display time (any string — caller formats). */
  time?: string;
  /** Stable key — fall back to index if omitted. */
  id?: string;
}

export interface ChatSidebarProps {
  messages: ChatMessage[];
  onSend: (text: string) => void;
  /** Disable input (e.g. while a response is streaming). */
  disabled?: boolean;
  /** Optional banner above the messages — e.g. "edit mode" status. */
  header?: ReactNode;
  /** Optional element pinned below the messages — e.g. a form/skeleton. */
  belowMessages?: ReactNode;
  /** Optional empty-state node when messages.length === 0. */
  emptyState?: ReactNode;
  /** Textarea placeholder. */
  placeholder?: string;
  /** Sidebar width — passed through to inline style. Default uses CSS. */
  width?: string | number;
}

/**
 * Framework-agnostic chat sidebar.
 *
 * The host owns message state and the send transport — this component is
 * pure UI. Pair it with an LLM SDK, a websocket, or anything else.
 */
export function ChatSidebar({
  messages,
  onSend,
  disabled = false,
  header,
  belowMessages,
  emptyState,
  placeholder = 'Describe a change…',
  width,
}: ChatSidebarProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom on new messages.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  return (
    <aside className="hs-chat" style={width ? { width } : undefined}>
      {header && <div className="hs-chat__header">{header}</div>}
      <div className="hs-chat__messages" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="hs-chat__empty">
            {emptyState ?? <p>Start a conversation.</p>}
          </div>
        ) : (
          messages.map((m, i) => (
            <ChatMessageBubble key={m.id ?? i} message={m} />
          ))
        )}
        {belowMessages}
      </div>
      <ChatInput onSend={onSend} disabled={disabled} placeholder={placeholder} />
    </aside>
  );
}

function ChatMessageBubble({ message }: { message: ChatMessage }) {
  const cls = `hs-chat__msg hs-chat__msg--${message.role}`;
  return (
    <div className={cls}>
      <div className="hs-chat__msg-role">{labelFor(message.role)}</div>
      <div className="hs-chat__msg-body">{message.content}</div>
      {message.time && <div className="hs-chat__msg-time">{message.time}</div>}
    </div>
  );
}

function labelFor(role: ChatMessage['role']): string {
  switch (role) {
    case 'user': return 'You';
    case 'assistant': return 'Assistant';
    case 'system': return 'System';
    default: return role;
  }
}

export interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({ onSend, disabled = false, placeholder }: ChatInputProps) {
  const [text, setText] = useState('');

  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="hs-chat__input">
      <div className="hs-chat__input-shell">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          className="hs-chat__textarea"
          rows={3}
        />
        <div className="hs-chat__input-foot">
          <span className="hs-chat__hint">Enter to send · Shift+Enter for newline</span>
          <button
            type="button"
            onClick={submit}
            disabled={disabled || !text.trim()}
            className="hs-chat__send"
            aria-label="Send"
          >
            Send <PaperPlaneTilt size={12} weight="fill" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatSidebar;
