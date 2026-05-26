import type { ReactNode } from 'react';

export interface FrameDef {
  src: string;
  viewBox: { w: number; h: number };
  screen: { x: number; y: number; w: number; h: number };
}

export const DEFAULT_FRAMES: Record<string, FrameDef> = {
  iphone: {
    src: '/frames/iphone-15-pro.svg',
    viewBox: { w: 390, h: 844 },
    screen: { x: 14, y: 14, w: 362, h: 816 },
  },
  android: {
    src: '/frames/android-pixel.svg',
    viewBox: { w: 412, h: 900 },
    screen: { x: 14, y: 14, w: 384, h: 872 },
  },
  ipad: {
    src: '/frames/ipad-pro.svg',
    viewBox: { w: 834, h: 1194 },
    screen: { x: 28, y: 28, w: 778, h: 1138 },
  },
  macbook: {
    src: '/frames/macbook.svg',
    viewBox: { w: 1440, h: 940 },
    screen: { x: 60, y: 40, w: 1320, h: 800 },
  },
};

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
