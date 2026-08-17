/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type PercentRect = { x: number; y: number; w: number; h: number };

export type CroppedImage = { dataUrl: string; aspectRatio: number };

/** Crops `src` to the given rectangle (percentages of the image's natural size) and returns a PNG data URL plus its exact width/height ratio. */
export const cropImageToDataUrl = (src: string, rect: PercentRect): Promise<CroppedImage> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const sx = (rect.x / 100) * img.naturalWidth;
        const sy = (rect.y / 100) * img.naturalHeight;
        const sw = (rect.w / 100) * img.naturalWidth;
        const sh = (rect.h / 100) * img.naturalHeight;

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(sw));
        canvas.height = Math.max(1, Math.round(sh));
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas 2D context is not available.'));
          return;
        }
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
        resolve({ dataUrl: canvas.toDataURL('image/png'), aspectRatio: sw / sh });
      };
      img.onerror = () => reject(new Error('Failed to load the source image.'));
      img.src = src;
    });

/** Converts a `#rrggbb` hex color plus an opacity (0-1) into an `rgba()` string. */
export const hexToRgba = (hex: string, opacity: number): string => {
  const normalized = hex.replace('#', '');
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

/** Reads the natural width/height ratio of an image data URL. */
export const getImageAspectRatio = (src: string): Promise<number> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img.naturalWidth / img.naturalHeight);
      img.onerror = () => reject(new Error('Failed to load the source image.'));
      img.src = src;
    });
