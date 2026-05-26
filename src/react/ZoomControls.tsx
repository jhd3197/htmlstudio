import { Minus, Plus, ArrowsOutSimple } from '@phosphor-icons/react';

export interface ZoomControlsProps {
  zoom: number;
  onZoomChange: (next: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

export function ZoomControls({
  zoom,
  onZoomChange,
  min = 25,
  max = 200,
  step = 25,
  className = '',
}: ZoomControlsProps) {
  return (
    <div className={`hs-zoom ${className}`.trim()}>
      <div className="hs-zoom__pill">
        <button
          type="button"
          onClick={() => onZoomChange(Math.max(min, zoom - step))}
          className="hs-zoom__step"
          aria-label="Zoom out"
        >
          <Minus size={12} />
        </button>
        <span>{zoom}%</span>
        <button
          type="button"
          onClick={() => onZoomChange(Math.min(max, zoom + step))}
          className="hs-zoom__step"
          aria-label="Zoom in"
        >
          <Plus size={12} />
        </button>
      </div>
      <button
        type="button"
        onClick={() => onZoomChange(100)}
        className="hs-zoom__fit"
        aria-label="Fit"
      >
        <ArrowsOutSimple size={16} />
      </button>
    </div>
  );
}

export default ZoomControls;
