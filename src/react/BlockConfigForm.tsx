import { useEffect, useId, useState } from 'react';
import type { BlockDefinition, BlockField } from '../blocks.js';

export interface BlockConfigFormProps {
  definition: BlockDefinition;
  config: Record<string, unknown>;
  onCommit: (next: Record<string, string>) => void;
}

export function BlockConfigForm({ definition, config, onCommit }: BlockConfigFormProps) {
  const [draft, setDraft] = useState<Record<string, string>>({});

  useEffect(() => {
    const defaults: Record<string, string> = {};
    for (const f of definition.fields) {
      if (f.default != null) defaults[f.key] = String(f.default);
    }
    const merged: Record<string, string> = { ...defaults };
    for (const [k, v] of Object.entries(config || {})) {
      if (v != null) merged[k] = String(v);
    }
    setDraft(merged);
  }, [definition, config]);

  const set = (k: string, v: string) => setDraft((d) => ({ ...d, [k]: v }));

  return (
    <div className="hs-block-config">
      {definition.fields.map((f) => (
        <FieldRow key={f.key} field={f} value={draft[f.key] ?? ''} onChange={(v) => set(f.key, v)} />
      ))}
      <button
        type="button"
        onClick={() => onCommit(draft)}
        className="hs-btn hs-btn--primary hs-btn--full"
      >
        Apply changes
      </button>
    </div>
  );
}

function FieldRow({
  field,
  value,
  onChange,
}: {
  field: BlockField;
  value: string;
  onChange: (v: string) => void;
}) {
  const inputId = useId();
  const label = (
    <label className="hs-label" htmlFor={inputId}>
      {field.label}
      {field.optional && <span className="hs-label__optional">(optional)</span>}
    </label>
  );

  switch (field.type) {
    case 'textarea':
      return (
        <div className="hs-block-config__field">
          {label}
          <textarea
            id={inputId}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={3}
            className="hs-textarea"
            placeholder={field.help || ''}
          />
        </div>
      );
    case 'color':
      return (
        <div className="hs-block-config__field">
          {label}
          <div className="hs-block-config__color">
            <input
              id={inputId}
              type="color"
              value={normalizeHex(value)}
              onChange={(e) => onChange(e.target.value)}
            />
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="hs-input"
              placeholder="#000000"
              aria-label={`${field.label} hex value`}
            />
          </div>
        </div>
      );
    case 'url':
    case 'image':
      return (
        <div className="hs-block-config__field">
          {label}
          <input
            id={inputId}
            type="url"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="hs-input"
            placeholder={field.type === 'image' ? 'https://… (image)' : 'https://…'}
          />
        </div>
      );
    case 'number':
      return (
        <div className="hs-block-config__field">
          {label}
          <input
            id={inputId}
            type="number"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="hs-input"
          />
        </div>
      );
    case 'boolean':
      return (
        <label className="hs-block-config__boolean" htmlFor={inputId}>
          <span className="hs-label" style={{ margin: 0 }}>{field.label}</span>
          <input
            id={inputId}
            type="checkbox"
            checked={value === 'true'}
            onChange={(e) => onChange(e.target.checked ? 'true' : 'false')}
          />
        </label>
      );
    case 'select':
      return (
        <div className="hs-block-config__field">
          {label}
          <select
            id={inputId}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="hs-select"
          >
            {(field.options || []).map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      );
    case 'text':
    default:
      return (
        <div className="hs-block-config__field">
          {label}
          <input
            id={inputId}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="hs-input"
            placeholder={field.help || ''}
          />
        </div>
      );
  }
}

function normalizeHex(v: string): string {
  if (!v) return '#000000';
  const s = String(v).trim();
  if (/^#[0-9a-f]{6}$/i.test(s)) return s;
  if (/^#[0-9a-f]{3}$/i.test(s)) {
    return '#' + s.slice(1).split('').map((c) => c + c).join('');
  }
  return '#000000';
}

export default BlockConfigForm;
