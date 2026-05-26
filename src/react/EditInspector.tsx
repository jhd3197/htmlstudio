import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  X,
  Cursor,
  TextT,
  PaintBrush,
  ArrowsOut,
  Link as LinkIcon,
  Image as ImageIcon,
  CaretRight,
  CaretDown,
  Code,
  PuzzlePiece,
} from '@phosphor-icons/react';
import { getBlock as defaultGetBlock, decodeConfig, type BlockDefinition } from '../blocks.js';
import type { ElementInfo, Patch } from '../types.js';
import { BlockConfigForm } from './BlockConfigForm.js';
import type { SaveState } from './useVisualEdit.js';

export interface RerenderBlockArgs {
  blockId: string;
  instanceId: string;
  targetId: string;
  config: Record<string, string>;
}

export interface EditInspectorProps {
  selection: ElementInfo | null;
  selections?: ElementInfo[];
  onApply: (patch: Patch) => void;
  onApplyMany?: (patches: Patch[]) => void;
  onRerenderBlock?: (args: RerenderBlockArgs) => void;
  onSaveAsComponent?: () => void;
  onClose?: () => void;
  saveState?: SaveState;
  getBlock?: (id: string) => BlockDefinition | undefined;
}

const FONT_FAMILIES = [
  { label: 'System sans', value: 'system-ui, sans-serif' },
  { label: 'Inter', value: 'Inter, system-ui, sans-serif' },
  { label: 'Space Grotesk', value: "'Space Grotesk', system-ui, sans-serif" },
  { label: 'Serif', value: "Georgia, 'Times New Roman', serif" },
  { label: 'Mono', value: "'JetBrains Mono', ui-monospace, monospace" },
];
const FONT_WEIGHTS = ['300', '400', '500', '600', '700', '800', '900'];
const TEXT_ALIGNS = ['left', 'center', 'right', 'justify'];
const DISPLAYS = ['block', 'inline', 'inline-block', 'flex', 'grid', 'none'];

function parseStyle(str: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!str) return out;
  str.split(';').forEach((decl) => {
    const [k, ...rest] = decl.split(':');
    if (!k || rest.length === 0) return;
    out[k.trim()] = rest.join(':').trim();
  });
  return out;
}

function splitUnit(value: string | undefined | null): { n: string; u: string } {
  if (value == null || value === '') return { n: '', u: 'px' };
  const m = String(value).trim().match(/^(-?\d*\.?\d+)\s*(px|rem|em|%|vh|vw|pt)?$/i);
  if (!m) return { n: value, u: '' };
  return { n: m[1], u: (m[2] || 'px').toLowerCase() };
}

function toHex(value: string | undefined | null): string {
  if (!value) return '#000000';
  const v = value.trim();
  if (/^#[0-9a-f]{6}$/i.test(v)) return v;
  if (/^#[0-9a-f]{3}$/i.test(v)) {
    return '#' + v.slice(1).split('').map((c) => c + c).join('');
  }
  const rgb = v.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (rgb) {
    const [r, g, b] = [rgb[1], rgb[2], rgb[3]].map((x) => Number(x).toString(16).padStart(2, '0'));
    return `#${r}${g}${b}`;
  }
  return '#000000';
}

export function EditInspector({
  selection,
  selections = [],
  onApply,
  onApplyMany,
  onRerenderBlock,
  onSaveAsComponent,
  onClose,
  saveState,
  getBlock = defaultGetBlock,
}: EditInspectorProps) {
  const multi = selections.length > 1;
  const blockId = !multi ? selection?.attributes?.['data-ve-block'] || null : null;
  const blockDef = blockId ? getBlock(blockId) : null;
  const blockInstance = !multi ? selection?.attributes?.['data-ve-block-instance'] : null;

  const blockConfig = useMemo(() => {
    if (!blockId) return null;
    const raw = selection?.attributes?.['data-ve-config'];
    if (!raw) return {};
    return decodeConfig(raw);
  }, [blockId, selection]);

  const [content, setContent] = useState({ text: '', href: '', linkLabel: '', src: '', alt: '' });
  const [open, setOpen] = useState({
    block: true,
    content: true,
    type: true,
    layout: true,
    fx: true,
    advanced: false,
  });
  const [rawStyle, setRawStyle] = useState('');

  const styleSource = multi ? selections[0] : selection;
  const styles = useMemo(
    () => parseStyle(styleSource?.attributes?.style || ''),
    [styleSource],
  );

  useEffect(() => {
    if (!selection) return;
    setContent({
      text: selection.text || '',
      href: selection.attributes?.href || '',
      linkLabel: selection.text || '',
      src: selection.attributes?.src || '',
      alt: selection.attributes?.alt || '',
    });
    setRawStyle(selection.attributes?.style || '');
  }, [selection]);

  if (!selection && !multi) {
    return (
      <div className="hs-inspector">
        <div className="hs-inspector__empty">
          <div className="hs-inspector__empty-title">
            <Cursor size={16} /> Edit mode
          </div>
          <p>
            Click an element in the preview to inspect it. Double-click any text to edit it inline.
          </p>
          <SaveBadge saveState={saveState} />
        </div>
      </div>
    );
  }

  const setStyle = (prop: string, value: string) => {
    if (multi) {
      const patches: Patch[] = selections.map((s) => ({
        kind: 'set-style',
        id: s.id,
        styles: { [prop]: value },
      }));
      onApplyMany?.(patches);
    } else if (selection) {
      onApply({ kind: 'set-style', id: selection.id, styles: { [prop]: value } });
    }
  };
  const clearStyle = (prop: string) => setStyle(prop, '');
  const toggle = (k: keyof typeof open) => setOpen((o) => ({ ...o, [k]: !o[k] }));

  return (
    <div className="hs-inspector">
      <header className="hs-inspector__header">
        {multi ? (
          <div>
            <div className="hs-inspector__multi-label">multi-select</div>
            <div className="hs-inspector__title">
              <span className="hs-inspector__multi-count">{selections.length} elements</span>
              <span className="hs-inspector__kind">{sharedTagOrMixed(selections)}</span>
            </div>
          </div>
        ) : selection ? (
          <div>
            <div className="hs-inspector__id">{selection.id}</div>
            <div className="hs-inspector__title">
              <span className="hs-inspector__tag">&lt;{selection.tag}&gt;</span>
              <span className="hs-inspector__kind">{selection.kind}</span>
            </div>
          </div>
        ) : null}
        <div className="hs-inspector__actions">
          {!multi && selection && !blockId && onSaveAsComponent && (
            <button
              type="button"
              onClick={onSaveAsComponent}
              className="hs-inspector__action"
              title="Save this element as a reusable component"
            >
              <PuzzlePiece size={11} weight="fill" />
              Save as
            </button>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="hs-inspector__close"
              aria-label="Close inspector"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </header>

      <div className="hs-inspector__body">
        {multi && (
          <div className="hs-inspector__multi-note">
            Bulk edit — Typography / Layout / Appearance apply to all {selections.length} elements.
            Content / link / image edits are disabled.
          </div>
        )}

        {blockDef && blockInstance && selection && (
          <Section
            icon={<PuzzlePiece size={14} />}
            label={`Block — ${blockDef.name}`}
            open={open.block}
            onToggle={() => toggle('block')}
          >
            <p className="hs-section__intro">{blockDef.description}</p>
            <BlockConfigForm
              definition={blockDef}
              config={blockConfig || {}}
              onCommit={(newConfig) =>
                onRerenderBlock?.({
                  blockId: blockDef.id,
                  instanceId: blockInstance,
                  targetId: selection.id,
                  config: newConfig,
                })
              }
            />
            <p className="hs-section__hint">
              Block fields rewrite the entire instance. Use the sections below to override
              generic CSS on child elements.
            </p>
          </Section>
        )}

        {!multi && selection && (
          <Section
            icon={<TextT size={14} />}
            label="Content"
            open={open.content}
            onToggle={() => toggle('content')}
          >
            {selection.kind === 'text' && (
              <ApplyField
                label="Text"
                textarea
                value={content.text}
                onChange={(v) => setContent((c) => ({ ...c, text: v }))}
                onApply={() => onApply({ kind: 'set-text', id: selection.id, value: content.text })}
              />
            )}
            {selection.kind === 'link' && (
              <>
                <ApplyField
                  label="href"
                  icon={<LinkIcon size={12} />}
                  value={content.href}
                  onChange={(v) => setContent((c) => ({ ...c, href: v }))}
                  onApply={() =>
                    onApply({ kind: 'set-link', id: selection.id, href: content.href, text: content.linkLabel })
                  }
                />
                <ApplyField
                  label="Label"
                  value={content.linkLabel}
                  onChange={(v) => setContent((c) => ({ ...c, linkLabel: v }))}
                  onApply={() =>
                    onApply({ kind: 'set-link', id: selection.id, href: content.href, text: content.linkLabel })
                  }
                />
              </>
            )}
            {selection.kind === 'image' && (
              <>
                <ApplyField
                  label="Source URL"
                  icon={<ImageIcon size={12} />}
                  value={content.src}
                  onChange={(v) => setContent((c) => ({ ...c, src: v }))}
                  onApply={() =>
                    onApply({ kind: 'set-image', id: selection.id, src: content.src, alt: content.alt })
                  }
                />
                <ApplyField
                  label="Alt text"
                  value={content.alt}
                  onChange={(v) => setContent((c) => ({ ...c, alt: v }))}
                  onApply={() =>
                    onApply({ kind: 'set-image', id: selection.id, src: content.src, alt: content.alt })
                  }
                />
              </>
            )}
            {selection.kind === 'container' && (
              <p className="hs-section__intro" style={{ fontStyle: 'italic' }}>
                Container element — edit its children, or use Advanced HTML below.
              </p>
            )}
          </Section>
        )}

        <Section icon={<TextT size={14} />} label="Typography" open={open.type} onToggle={() => toggle('type')}>
          <Row label="Font family">
            <select
              value={styles['font-family'] || ''}
              onChange={(e) => setStyle('font-family', e.target.value)}
              className="hs-select"
            >
              <option value="">— inherit —</option>
              {FONT_FAMILIES.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </Row>

          <Row label="Size">
            <UnitInput
              value={styles['font-size']}
              onChange={(v) => (v ? setStyle('font-size', v) : clearStyle('font-size'))}
            />
          </Row>

          <Row label="Weight">
            <select
              value={styles['font-weight'] || ''}
              onChange={(e) => setStyle('font-weight', e.target.value)}
              className="hs-select"
            >
              <option value="">— inherit —</option>
              {FONT_WEIGHTS.map((w) => <option key={w} value={w}>{w}</option>)}
            </select>
          </Row>

          <Row label="Color">
            <ColorInput
              value={styles.color}
              onChange={(v) => setStyle('color', v)}
              onClear={() => clearStyle('color')}
            />
          </Row>

          <Row label="Align">
            <SegmentedControl
              value={styles['text-align'] || ''}
              options={TEXT_ALIGNS}
              onChange={(v) => (v ? setStyle('text-align', v) : clearStyle('text-align'))}
            />
          </Row>

          <Row label="Line height">
            <input
              type="number"
              step="0.1"
              min="0"
              value={styles['line-height'] ?? ''}
              onChange={(e) => {
                const v = e.target.value;
                v ? setStyle('line-height', v) : clearStyle('line-height');
              }}
              className="hs-input"
              placeholder="1.5"
            />
          </Row>

          <Row label="Letter spacing">
            <UnitInput
              value={styles['letter-spacing']}
              onChange={(v) => (v ? setStyle('letter-spacing', v) : clearStyle('letter-spacing'))}
              defaultUnit="em"
            />
          </Row>
        </Section>

        <Section icon={<ArrowsOut size={14} />} label="Layout & spacing" open={open.layout} onToggle={() => toggle('layout')}>
          <Row label="Display">
            <select
              value={styles.display || ''}
              onChange={(e) => setStyle('display', e.target.value)}
              className="hs-select"
            >
              <option value="">— default —</option>
              {DISPLAYS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </Row>

          <Row label="Width">
            <UnitInput
              value={styles.width}
              onChange={(v) => (v ? setStyle('width', v) : clearStyle('width'))}
            />
          </Row>
          <Row label="Height">
            <UnitInput
              value={styles.height}
              onChange={(v) => (v ? setStyle('height', v) : clearStyle('height'))}
            />
          </Row>

          <BoxField label="Padding" prefix="padding" styles={styles} setStyle={setStyle} clearStyle={clearStyle} />
          <BoxField label="Margin" prefix="margin" styles={styles} setStyle={setStyle} clearStyle={clearStyle} />
        </Section>

        <Section icon={<PaintBrush size={14} />} label="Appearance" open={open.fx} onToggle={() => toggle('fx')}>
          <Row label="Background">
            <ColorInput
              value={styles['background-color']}
              onChange={(v) => setStyle('background-color', v)}
              onClear={() => clearStyle('background-color')}
            />
          </Row>

          <Row label="Opacity">
            <SliderInput
              min={0}
              max={1}
              step={0.01}
              value={Number(styles.opacity ?? 1)}
              onChange={(v) => (v === '1' ? clearStyle('opacity') : setStyle('opacity', v))}
            />
          </Row>

          <Row label="Border radius">
            <UnitInput
              value={styles['border-radius']}
              onChange={(v) => (v ? setStyle('border-radius', v) : clearStyle('border-radius'))}
            />
          </Row>

          <Row label="Border">
            <input
              type="text"
              value={styles.border ?? ''}
              onChange={(e) => {
                const v = e.target.value;
                v ? setStyle('border', v) : clearStyle('border');
              }}
              className="hs-input"
              placeholder="1px solid #e2e8f0"
            />
          </Row>

          <Row label="Shadow">
            <input
              type="text"
              value={styles['box-shadow'] ?? ''}
              onChange={(e) => {
                const v = e.target.value;
                v ? setStyle('box-shadow', v) : clearStyle('box-shadow');
              }}
              className="hs-input"
              placeholder="0 4px 14px rgba(0,0,0,0.1)"
            />
          </Row>
        </Section>

        {!multi && selection && (
          <Section icon={<Code size={14} />} label="Advanced" open={open.advanced} onToggle={() => toggle('advanced')}>
            <Row label="Raw style">
              <textarea
                value={rawStyle}
                onChange={(e) => setRawStyle(e.target.value)}
                rows={3}
                className="hs-textarea"
                style={{ fontFamily: 'var(--hs-font-mono)', fontSize: 11 }}
                placeholder="key: value; key: value;"
              />
            </Row>
            <button
              type="button"
              onClick={() => {
                const parsed = parseStyle(rawStyle);
                const next: Record<string, string> = {
                  ...Object.fromEntries(Object.keys(styles).map((k) => [k, ''])),
                  ...parsed,
                };
                onApply({ kind: 'set-style', id: selection.id, styles: next });
              }}
              className="hs-advanced-apply"
            >
              Apply raw style
            </button>
          </Section>
        )}
      </div>

      <SaveBadge saveState={saveState} />
    </div>
  );
}

function sharedTagOrMixed(items: ElementInfo[]): string {
  if (!items || items.length === 0) return '';
  const first = items[0].tag;
  return items.every((i) => i.tag === first) ? `all <${first}>` : 'mixed tags';
}

function Section({
  icon,
  label,
  open,
  onToggle,
  children,
}: {
  icon: ReactNode;
  label: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <section className="hs-section">
      <button type="button" onClick={onToggle} className="hs-section__head">
        {open ? <CaretDown size={12} /> : <CaretRight size={12} />}
        <span className="hs-section__head-icon">{icon}</span>
        {label}
      </button>
      {open && <div className="hs-section__body">{children}</div>}
    </section>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="hs-row">
      <span className="hs-row__label">{label}</span>
      <div>{children}</div>
    </div>
  );
}

function ApplyField({
  label,
  value,
  onChange,
  onApply,
  textarea,
  icon,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onApply: () => void;
  textarea?: boolean;
  icon?: ReactNode;
}) {
  return (
    <div className="hs-apply">
      <div className="hs-apply__label">
        {icon}
        <span>{label}</span>
      </div>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="hs-textarea"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="hs-input"
        />
      )}
      <button type="button" onClick={onApply} className="hs-btn hs-btn--primary hs-btn--full">
        Apply
      </button>
    </div>
  );
}

function UnitInput({
  value,
  onChange,
  defaultUnit = 'px',
  compact = false,
}: {
  value: string | undefined | null;
  onChange: (v: string) => void;
  defaultUnit?: string;
  /** Hide the unit dropdown — assumes the defaultUnit. Used in tight grids. */
  compact?: boolean;
}) {
  const { n, u } = splitUnit(value);
  const unit = u || defaultUnit;
  const setNum = (newN: string) => {
    if (newN === '' || newN == null) return onChange('');
    onChange(`${newN}${unit}`);
  };
  const setUnit = (newU: string) => {
    if (n === '' || n == null) return onChange('');
    onChange(`${n}${newU}`);
  };
  if (compact) {
    return (
      <input
        type="number"
        value={n}
        onChange={(e) => setNum(e.target.value)}
        className="hs-input"
        placeholder="0"
        title={`${unit}`}
      />
    );
  }
  return (
    <div className="hs-unit">
      <input
        type="number"
        value={n}
        onChange={(e) => setNum(e.target.value)}
        className="hs-input"
        placeholder="auto"
      />
      <select value={unit} onChange={(e) => setUnit(e.target.value)} className="hs-select">
        {['px', 'rem', 'em', '%', 'vh', 'vw'].map((unitOpt) => (
          <option key={unitOpt} value={unitOpt}>{unitOpt}</option>
        ))}
      </select>
    </div>
  );
}

function ColorInput({
  value,
  onChange,
  onClear,
}: {
  value: string | undefined | null;
  onChange: (v: string) => void;
  onClear: () => void;
}) {
  const hex = toHex(value);
  return (
    <div className="hs-color">
      <input type="color" value={hex} onChange={(e) => onChange(e.target.value)} />
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="hs-input"
        placeholder="#000 / rgb()"
      />
      {value && (
        <button type="button" onClick={onClear} className="hs-color__clear" title="Clear">
          <X size={12} />
        </button>
      )}
    </div>
  );
}

function SliderInput({
  value,
  onChange,
  min,
  max,
  step,
}: {
  value: number;
  onChange: (v: string) => void;
  min: number;
  max: number;
  step: number;
}) {
  return (
    <div className="hs-slider">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <span className="hs-slider__value">{Number(value).toFixed(2)}</span>
    </div>
  );
}

function SegmentedControl({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="hs-segmented">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(value === opt ? '' : opt)}
          className={`hs-segmented__opt ${value === opt ? 'hs-segmented__opt--active' : ''}`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function BoxField({
  label,
  prefix,
  styles,
  setStyle,
  clearStyle,
}: {
  label: string;
  prefix: string;
  styles: Record<string, string>;
  setStyle: (k: string, v: string) => void;
  clearStyle: (k: string) => void;
}) {
  const sides = ['top', 'right', 'bottom', 'left'] as const;
  const shorthand = styles[prefix];
  const useShorthand = !!shorthand && !sides.some((s) => styles[`${prefix}-${s}`]);
  if (useShorthand) {
    return (
      <Row label={label}>
        <UnitInput
          value={shorthand}
          onChange={(v) => (v ? setStyle(prefix, v) : clearStyle(prefix))}
        />
      </Row>
    );
  }
  return (
    <div className="hs-box">
      <div className="hs-box__head">
        <span className="hs-row__label">{label}</span>
        <button
          type="button"
          onClick={() => {
            sides.forEach((s) => clearStyle(`${prefix}-${s}`));
            clearStyle(prefix);
          }}
          className="hs-box__reset"
        >
          reset
        </button>
      </div>
      <div className="hs-box__grid">
        {sides.map((s) => (
          <div key={s}>
            <UnitInput
              compact
              value={styles[`${prefix}-${s}`] || ''}
              onChange={(v) =>
                v ? setStyle(`${prefix}-${s}`, v) : clearStyle(`${prefix}-${s}`)
              }
            />
            <div className="hs-box__side">{s[0]}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SaveBadge({ saveState }: { saveState?: SaveState }) {
  if (!saveState) return null;
  return (
    <div className={`hs-inspector__save hs-inspector__save--${saveState.status}`}>
      {saveState.status === 'idle' && '—'}
      {saveState.status === 'pending' && 'edits queued…'}
      {saveState.status === 'saving' && 'saving…'}
      {saveState.status === 'saved' && 'saved ✓'}
      {saveState.status === 'error' && `error: ${saveState.error || 'unknown'}`}
    </div>
  );
}

export default EditInspector;
