import { useMemo, useState, type ReactNode } from 'react';
import { MagnifyingGlass } from '@phosphor-icons/react';
import { BUILTIN_BLOCKS, wireframeFor, type BlockDefinition } from '../blocks.js';

export interface ProjectBlockMeta extends BlockDefinition {
  __project?: boolean;
}

export interface BlocksPanelProps {
  blocks?: BlockDefinition[];
  projectComponents?: BlockDefinition[];
  selectionLabel?: string | null;
  onInsert: (def: BlockDefinition) => void;
}

export function BlocksPanel({
  blocks = BUILTIN_BLOCKS,
  projectComponents = [],
  selectionLabel,
  onInsert,
}: BlocksPanelProps) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [tab, setTab] = useState<'builtin' | 'project'>('builtin');

  const list = tab === 'project' ? projectComponents : blocks;

  const categories = useMemo(
    () => ['all', ...Array.from(new Set(list.map((b) => b.category)))],
    [list],
  );
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return list.filter((b) => {
      if (category !== 'all' && b.category !== category) return false;
      if (!q) return true;
      return (
        b.name.toLowerCase().includes(q) ||
        (b.description || '').toLowerCase().includes(q) ||
        b.id.toLowerCase().includes(q)
      );
    });
  }, [list, query, category]);

  return (
    <div className="hs-blocks">
      <div className="hs-blocks__subtabs">
        <SubTab
          active={tab === 'builtin'}
          onClick={() => {
            setTab('builtin');
            setCategory('all');
          }}
        >
          Built-in <span className="hs-blocks__subtab-count">({blocks.length})</span>
        </SubTab>
        <SubTab
          active={tab === 'project'}
          onClick={() => {
            setTab('project');
            setCategory('all');
          }}
          badge={projectComponents.length > 0 && tab !== 'project'}
        >
          Project <span className="hs-blocks__subtab-count">({projectComponents.length})</span>
        </SubTab>
      </div>

      <div className="hs-blocks__filter">
        <div className="hs-blocks__search">
          <MagnifyingGlass size={12} className="hs-blocks__search-icon" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search…"
            className="hs-input"
          />
        </div>
        {categories.length > 1 && (
          <div className="hs-blocks__categories">
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={`hs-blocks__category ${category === c ? 'hs-blocks__category--active' : ''}`}
              >
                {c}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="hs-blocks__list">
        {tab === 'project' && projectComponents.length === 0 ? (
          <div className="hs-blocks__empty">
            <div className="hs-blocks__empty-icon">🧱</div>
            No saved components yet.
            <div className="hs-blocks__empty-hint">
              Select a section → <strong>Save as</strong> in the inspector.
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="hs-blocks__empty">No matches.</div>
        ) : (
          filtered.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => onInsert(b)}
              className="hs-block-card"
            >
              <div
                className="hs-block-card__wire"
                aria-hidden="true"
                dangerouslySetInnerHTML={{ __html: wireframeFor(b) }}
              />
              <div className="hs-block-card__row">
                <h3 className="hs-block-card__name">{b.name}</h3>
                <span className="hs-block-card__category">{b.category}</span>
              </div>
              <div className="hs-block-card__count">
                {(b.fields || []).length} field{(b.fields || []).length === 1 ? '' : 's'}
              </div>
            </button>
          ))
        )}
      </div>

      <div className="hs-blocks__footer">
        {selectionLabel ? (
          <>
            Click inserts → replaces <code>{selectionLabel}</code>
          </>
        ) : (
          <span>Select an element first — clicks replace it.</span>
        )}
      </div>
    </div>
  );
}

function SubTab({
  active,
  onClick,
  children,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  badge?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`hs-blocks__subtab ${active ? 'hs-blocks__subtab--active' : ''}`}
    >
      {children}
      {badge && <span className="hs-blocks__subtab-badge" />}
    </button>
  );
}

export default BlocksPanel;
