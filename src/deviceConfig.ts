/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { DeviceModel, Platform, ScreenCategory } from './types';

export type DeviceOption = { value: DeviceModel; label: string };

const KEY = (platform: Platform, category: ScreenCategory) => `${platform}-${category}`;

export const DEVICE_OPTIONS: Record<string, DeviceOption[]> = {
  [KEY('ios', 'phone')]: [
    { value: 'iphone-17-pro', label: 'iPhone 17 Pro' },
    { value: 'iphone-15-pro', label: 'iPhone 15 Pro' },
    { value: 'iphone-14', label: 'iPhone 14' },
    { value: 'iphone-se', label: 'iPhone SE' },
  ],
  [KEY('ios', 'tablet')]: [
    { value: 'ipad-pro', label: 'iPad Pro' },
    { value: 'ipad-air', label: 'iPad Air' },
  ],
  [KEY('android', 'phone')]: [
    { value: 'pixel-9-pro', label: 'Pixel 9 Pro' },
    { value: 'pixel-8', label: 'Pixel 8' },
    { value: 'galaxy-s24', label: 'Galaxy S24' },
  ],
  [KEY('android', 'tablet')]: [
    { value: 'pixel-tablet', label: 'Pixel Tablet' },
    { value: 'galaxy-tab-s9', label: 'Galaxy Tab S9' },
  ],
};

export const getDeviceOptions = (platform: Platform, category: ScreenCategory): DeviceOption[] =>
    DEVICE_OPTIONS[KEY(platform, category)] ?? DEVICE_OPTIONS[KEY('ios', 'phone')];

export const getDefaultDeviceModel = (platform: Platform, category: ScreenCategory): DeviceModel =>
    getDeviceOptions(platform, category)[0].value;

// Export canvas size (points) per screen category. Both stores accept a range of
// resolutions at this aspect ratio, so a single canvas per category keeps the
// editor simple while still producing store-appropriate proportions.
export const CANVAS_SIZE: Record<ScreenCategory, { w: number; h: number }> = {
  phone: { w: 428, h: 926 },
  tablet: { w: 744, h: 992 },
};

// Device mockup frame size (points) rendered inside the canvas.
export const FRAME_SIZE: Record<ScreenCategory, { w: number; h: number }> = {
  phone: { w: 280, h: 605 },
  tablet: { w: 400, h: 534 },
};

export const PLATFORM_LABEL: Record<Platform, string> = {
  ios: 'iOS',
  android: 'Android',
};

export const SCREEN_CATEGORY_LABEL: Record<Platform, Record<ScreenCategory, string>> = {
  ios: { phone: 'iPhone', tablet: 'iPad' },
  android: { phone: 'Phone', tablet: 'Tablet' },
};

// Flagship models in each lineup get a thinner mockup bezel than the rest.
const THIN_BEZEL_MODELS: DeviceModel[] = ['iphone-17-pro', 'pixel-9-pro', 'ipad-pro', 'pixel-tablet'];

export const isThinBezelModel = (model: DeviceModel): boolean => THIN_BEZEL_MODELS.includes(model);
