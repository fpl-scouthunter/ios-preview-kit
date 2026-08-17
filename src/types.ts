/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Platform = 'ios' | 'android';

export type ScreenCategory = 'phone' | 'tablet';

export type DeviceModel =
    | 'iphone-17-pro'
    | 'iphone-15-pro'
    | 'iphone-14'
    | 'iphone-se'
    | 'ipad-pro'
    | 'ipad-air'
    | 'pixel-9-pro'
    | 'pixel-8'
    | 'galaxy-s24'
    | 'pixel-tablet'
    | 'galaxy-tab-s9';

export type Layout = 'top-text' | 'bottom-text' | 'full-screenshot' | 'list-popout';

export type Gradient = {
  from: string;
  to: string;
  angle: number;
};

export type PreviewState = {
  id: string;
  title: string;
  subtitle: string;
  screenshot: string | null;
  popoutScreenshot: string | null;
  popoutAspectRatio: number | null;
  popoutItemIndex: number;
  popoutBorderRadius: number;
  popoutScale: number;
  popoutBorderWidth: number;
  popoutBorderColor: string;
  popoutBorderOpacity: number;
  popoutShadowBlur: number;
  popoutShadowColor: string;
  popoutShadowOpacity: number;
  bgColor: string;
  gradient: Gradient | null;
  textColor: string;
  deviceModel: DeviceModel;
  layout: Layout;
  showDeviceOverlay: boolean;
};

export type AppProject = {
  id: string;
  name: string;
  platform: Platform;
  screenCategory: ScreenCategory;
  screens: PreviewState[];
  activeScreenId: string;
};

export type PersistedState = {
  version: 1;
  apps: AppProject[];
  activeAppId: string;
};
