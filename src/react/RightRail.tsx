import { useEffect, useState, type ReactNode } from 'react';
import { Cursor, Stack } from '@phosphor-icons/react';
import { EditInspector, type EditInspectorProps } from './EditInspector.js';
import { BlocksPanel, type BlocksPanelProps } from './BlocksPanel.js';
import type { ElementInfo } from '../types.js';

export interface RightRailProps
  extends Omit<EditInspectorProps, 'onClose'>,
    Pick<BlocksPanelProps, 'blocks' | 'projectComponents' | 'onInsert'> {
  onClearSelection?: () => void;
}

export function RightRail({
  selection,
  selections = [],
  onApply,
  onApplyMany,
  onRerenderBlock,
  onSaveAsComponent,
  onClearSelection,
  saveState,
  getBlock,
  blocks,
  projectComponents,
  onInsert,
}: RightRailProps) {
  const hasSelection = !!selection || selections.length > 0;
  const [tab, setTab] = useState<'inspector' | 'blocks'>(hasSelection ? 'inspector' : 'blocks');

  useEffect(() => {
    if (hasSelection) setTab('inspector');
    else setTab((t) => (t === 'inspector' ? 'blocks' : t));
  }, [selection?.id, selections.length, hasSelection]);

  const selectionLabel = selection
    ? `<${selection.tag}> ${selection.id}`
    : selections.length > 1
      ? `${selections.length} elements`
      : null;

  return (
    <aside className="hs-rail">
      <div className="hs-rail__tabs">
        <Tab
          active={tab === 'inspector'}
          disabled={!hasSelection}
          onClick={() => setTab('inspector')}
          icon={<Cursor size={12} />}
          label="Inspector"
          badge={hasSelection ? (selections.length > 1 ? selections.length : null) : null}
        />
        <Tab
          active={tab === 'blocks'}
          onClick={() => setTab('blocks')}
          icon={<Stack size={12} />}
          label="Blocks"
        />
      </div>

      <div className="hs-rail__body">
        {tab === 'inspector' ? (
          <EditInspector
            selection={selection}
            selections={selections as ElementInfo[]}
            onApply={onApply}
            onApplyMany={onApplyMany}
            onRerenderBlock={onRerenderBlock}
            onSaveAsComponent={onSaveAsComponent}
            onClose={onClearSelection}
            saveState={saveState}
            getBlock={getBlock}
          />
        ) : (
          <BlocksPanel
            blocks={blocks}
            projectComponents={projectComponents}
            selectionLabel={selectionLabel}
            onInsert={onInsert}
          />
        )}
      </div>
    </aside>
  );
}

function Tab({
  active,
  disabled,
  onClick,
  icon,
  label,
  badge,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
  badge?: number | null;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`hs-tab ${active ? 'hs-tab--active' : ''}`}
    >
      {icon}
      {label}
      {badge != null && <span className="hs-tab__badge">{badge}</span>}
    </button>
  );
}

export default RightRail;
