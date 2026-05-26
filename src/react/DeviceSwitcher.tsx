import type { ComponentType } from 'react';
import {
  Desktop,
  DeviceTablet,
  DeviceMobile,
  DeviceMobileCamera,
  AppleLogo,
  AndroidLogo,
  Laptop,
} from '@phosphor-icons/react';

export interface DeviceOption {
  key: string;
  label: string;
  width: string | null;
  frame: string | null;
}

export interface DeviceSwitcherProps {
  active: string | null;
  onChange: (width: string | null, frame: string | null) => void;
  devices?: DeviceOption[];
  frames?: DeviceOption[];
}

const DEFAULT_DEVICES: DeviceOption[] = [
  { key: 'desktop', label: 'Desktop', width: null, frame: null },
  { key: 'tablet', label: 'Tablet', width: '768px', frame: null },
  { key: 'mobile', label: 'Mobile', width: '375px', frame: null },
];

const DEFAULT_FRAMES: DeviceOption[] = [
  { key: 'iphone', label: 'iPhone 15 Pro', width: '390px', frame: 'iphone' },
  { key: 'android', label: 'Pixel', width: '412px', frame: 'android' },
  { key: 'ipad', label: 'iPad Pro', width: '834px', frame: 'ipad' },
  { key: 'macbook', label: 'MacBook', width: '1440px', frame: 'macbook' },
];

const DEVICE_ICONS: Record<string, ComponentType<{ size: number }>> = {
  desktop: Desktop,
  tablet: DeviceTablet,
  mobile: DeviceMobile,
};

const FRAME_ICONS: Record<string, ComponentType<{ size: number; weight?: 'fill' }>> = {
  iphone: AppleLogo,
  android: AndroidLogo,
  ipad: DeviceMobileCamera,
  macbook: Laptop,
};

export function DeviceSwitcher({
  active,
  onChange,
  devices = DEFAULT_DEVICES,
  frames = DEFAULT_FRAMES,
}: DeviceSwitcherProps) {
  return (
    <div className="hs-device-switcher">
      {devices.map(({ key, label, width, frame }) => {
        const Icon = DEVICE_ICONS[key] ?? Desktop;
        const isActive = active === width;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(width, frame)}
            title={label}
            aria-label={label}
            className={`hs-device-btn ${isActive ? 'hs-device-btn--active' : ''}`}
          >
            <Icon size={16} />
          </button>
        );
      })}
      <div className="hs-device-switcher__sep" />
      {frames.map(({ key, label, width, frame }) => {
        const Icon = FRAME_ICONS[key] ?? Desktop;
        const isActive = active === width;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(width, frame)}
            title={`${label} (frame)`}
            aria-label={`${label} (frame)`}
            className={`hs-device-btn ${isActive ? 'hs-device-btn--active' : ''}`}
          >
            <Icon size={16} weight="fill" />
          </button>
        );
      })}
    </div>
  );
}

export default DeviceSwitcher;
