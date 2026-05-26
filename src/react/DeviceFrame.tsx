import type { ReactNode } from 'react';

export interface FrameDef {
  src: string;
  viewBox: { w: number; h: number };
  screen: { x: number; y: number; w: number; h: number };
}

// The library does not ship frame SVG assets — DEFAULT_FRAMES is empty.
// Callers that want device frames must pass their own `frames` prop with
// `src` pointing at assets they ship themselves. The viewBox/screen geometry
// for the common devices is documented in the README.
export const DEFAULT_FRAMES: Record<string, FrameDef> = {};

export interface DeviceFrameProps {
  frame: string | null | undefined;
  children: ReactNode;
  maxHeight?: number;
  frames?: Record<string, FrameDef>;
}

export function DeviceFrame({
  frame,
  children,
  maxHeight = 700,
  frames = DEFAULT_FRAMES,
}: DeviceFrameProps) {
  const f = frame ? frames[frame] : undefined;
  if (!f) return <>{children}</>;

  const aspectRatio = f.viewBox.w / f.viewBox.h;
  const screenLeftPct = (f.screen.x / f.viewBox.w) * 100;
  const screenTopPct = (f.screen.y / f.viewBox.h) * 100;
  const screenWPct = (f.screen.w / f.viewBox.w) * 100;
  const screenHPct = (f.screen.h / f.viewBox.h) * 100;

  return (
    <div className="hs-device-frame" style={{ maxHeight, aspectRatio }}>
      <img src={f.src} alt={`${frame} frame`} className="hs-device-frame__skin" />
      <div
        className="hs-device-frame__screen"
        style={{
          left: `${screenLeftPct}%`,
          top: `${screenTopPct}%`,
          width: `${screenWPct}%`,
          height: `${screenHPct}%`,
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default DeviceFrame;
