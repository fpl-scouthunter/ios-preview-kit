/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getDefaultDeviceModel } from './deviceConfig';
import {
  DEFAULT_POPOUT_BORDER_COLOR,
  DEFAULT_POPOUT_BORDER_OPACITY,
  DEFAULT_POPOUT_BORDER_RADIUS,
  DEFAULT_POPOUT_BORDER_WIDTH,
  DEFAULT_POPOUT_INDEX,
  DEFAULT_POPOUT_SCALE,
  DEFAULT_POPOUT_SHADOW_BLUR,
  DEFAULT_POPOUT_SHADOW_COLOR,
  DEFAULT_POPOUT_SHADOW_OPACITY,
} from './mockData';
import type { AppProject, Platform, PreviewState, ScreenCategory } from './types';

export const GRADIENT_PRESETS = [
  { from: '#f97316', to: '#ed213a', angle: 45 },
  { from: '#6366f1', to: '#a855f7', angle: 45 },
  { from: '#7928CA', to: '#FF0080', angle: 45 },
  { from: '#0a0a0a', to: '#262626', angle: 45 },
  { from: '#11998e', to: '#38ef7d', angle: 45 },
  { from: '#232526', to: '#414345', angle: 45 },
  { from: '#8e2de2', to: '#4a00e0', angle: 45 },
  { from: '#ff9966', to: '#ff5e62', angle: 45 },
  { from: '#02aab0', to: '#00cdac', angle: 45 },
];

const newId = () =>
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const createDefaultScreen = (platform: Platform, screenCategory: ScreenCategory): PreviewState => {
  const gradient = GRADIENT_PRESETS[0];
  return {
    id: newId(),
    title: 'Discover Amazing Places',
    subtitle: 'The best companion for your next journey',
    screenshot: null,
    popoutScreenshot: null,
    popoutAspectRatio: null,
    popoutItemIndex: DEFAULT_POPOUT_INDEX,
    popoutBorderRadius: DEFAULT_POPOUT_BORDER_RADIUS,
    popoutScale: DEFAULT_POPOUT_SCALE,
    popoutBorderWidth: DEFAULT_POPOUT_BORDER_WIDTH,
    popoutBorderColor: DEFAULT_POPOUT_BORDER_COLOR,
    popoutBorderOpacity: DEFAULT_POPOUT_BORDER_OPACITY,
    popoutShadowBlur: DEFAULT_POPOUT_SHADOW_BLUR,
    popoutShadowColor: DEFAULT_POPOUT_SHADOW_COLOR,
    popoutShadowOpacity: DEFAULT_POPOUT_SHADOW_OPACITY,
    bgColor: gradient.from,
    gradient,
    textColor: '#ffffff',
    deviceModel: getDefaultDeviceModel(platform, screenCategory),
    layout: 'top-text',
    showDeviceOverlay: true,
  };
};

export const createDefaultApp = (name: string, platform: Platform, screenCategory: ScreenCategory): AppProject => {
  const screen = createDefaultScreen(platform, screenCategory);
  return {
    id: newId(),
    name,
    platform,
    screenCategory,
    screens: [screen],
    activeScreenId: screen.id,
  };
};

export const cloneScreenAsNew = (screen: PreviewState): PreviewState => ({
  ...screen,
  id: newId(),
});
