/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type StatusListItem = {
  label: string;
  sub: string;
  time: string;
  status: 'pending' | 'completed';
};

export const STATUS_LIST_ITEMS: StatusListItem[] = [
  { label: 'Will arrive at the branch 34', sub: 'Berdyoliv', time: 'May 15 | 14:34', status: 'pending' },
  { label: 'Will leave the depo', sub: 'Zhytomyr', time: 'May 15 | 07:35', status: 'pending' },
  { label: 'Will arrive at the depo', sub: 'Zhytomyr', time: 'May 14 | 15:42', status: 'pending' },
  { label: 'Will leave the terminal', sub: 'Zhytomyr', time: 'May 14 | 10:12', status: 'pending' },
  { label: 'Arrived at the terminal', sub: 'Zhytomyr', time: 'May 13 | 07:01', status: 'pending' },
  { label: 'Left the terminal', sub: 'Khmelnytskyi', time: 'May 13 | 02:51', status: 'completed' },
  { label: 'Arrived at the terminal', sub: 'Khmelnytskyi', time: 'May 12 | 21:59', status: 'completed' },
  { label: 'Left the branch 34', sub: 'Khmelnytskyi', time: 'May 12 | 19:43', status: 'completed' },
];

export const DEFAULT_POPOUT_INDEX = 4;
export const DEFAULT_POPOUT_BORDER_RADIUS = 24;
export const MAX_POPOUT_BORDER_RADIUS = 48;
export const DEFAULT_POPOUT_SCALE = 1;
export const MIN_POPOUT_SCALE = 0.7;
export const MAX_POPOUT_SCALE = 1.5;
export const DEFAULT_POPOUT_BORDER_WIDTH = 1;
export const MAX_POPOUT_BORDER_WIDTH = 8;
export const DEFAULT_POPOUT_BORDER_COLOR = '#404040';
export const DEFAULT_POPOUT_BORDER_OPACITY = 100;
export const DEFAULT_POPOUT_SHADOW_BLUR = 50;
export const MAX_POPOUT_SHADOW_BLUR = 120;
export const DEFAULT_POPOUT_SHADOW_COLOR = '#000000';
export const DEFAULT_POPOUT_SHADOW_OPACITY = 45;

export const DEFAULT_FRAME_COLOR = '#171717';
export const FRAME_COLOR_PRESETS = [
  { label: 'Black', value: '#171717' },
  { label: 'White', value: '#f5f5f5' },
];

export const FONT_OPTIONS = [
  { label: 'Inter', value: '"Inter", ui-sans-serif, system-ui, sans-serif' },
  { label: 'Poppins', value: '"Poppins", ui-sans-serif, system-ui, sans-serif' },
  { label: 'Montserrat', value: '"Montserrat", ui-sans-serif, system-ui, sans-serif' },
  { label: 'Space Grotesk', value: '"Space Grotesk", ui-sans-serif, system-ui, sans-serif' },
  { label: 'DM Sans', value: '"DM Sans", ui-sans-serif, system-ui, sans-serif' },
  { label: 'Sora', value: '"Sora", ui-sans-serif, system-ui, sans-serif' },
  { label: 'Playfair Display', value: '"Playfair Display", ui-serif, Georgia, serif' },
  { label: 'Roboto Slab', value: '"Roboto Slab", ui-serif, Georgia, serif' },
];
export const DEFAULT_FONT_FAMILY = FONT_OPTIONS[0].value;

export const DEFAULT_TITLE_FONT_SIZE = 36;
export const MIN_TITLE_FONT_SIZE = 16;
export const MAX_TITLE_FONT_SIZE = 64;

export const DEFAULT_SUBTITLE_FONT_SIZE = 18;
export const MIN_SUBTITLE_FONT_SIZE = 10;
export const MAX_SUBTITLE_FONT_SIZE = 32;
