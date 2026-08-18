/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Gradient } from './types';

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

/** Converts a CSS `linear-gradient(angleDeg, ...)` angle into canvas gradient line endpoints for a box of the given size. */
const cssGradientLineCoords = (width: number, height: number, angleDeg: number) => {
  const angleRad = ((angleDeg % 360) * Math.PI) / 180;
  const length = Math.abs(width * Math.sin(angleRad)) + Math.abs(height * Math.cos(angleRad));
  const halfX = (Math.sin(angleRad) * length) / 2;
  const halfY = (Math.cos(angleRad) * length) / 2;
  const cx = width / 2;
  const cy = height / 2;
  return { x0: cx - halfX, y0: cy + halfY, x1: cx + halfX, y1: cy - halfY };
};

const traceRoundedRect = (ctx: CanvasRenderingContext2D, width: number, height: number, radiusPx: number) => {
  const r = Math.min(radiusPx, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(width - r, 0);
  ctx.quadraticCurveTo(width, 0, width, r);
  ctx.lineTo(width, height - r);
  ctx.quadraticCurveTo(width, height, width - r, height);
  ctx.lineTo(r, height);
  ctx.quadraticCurveTo(0, height, 0, height - r);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();
};

/**
 * Composites a flat (non-rounded) PNG capture onto its real background — a CSS-equivalent gradient or a
 * solid color — then clips it to a rounded rect drawn with canvas 2D, and returns an opaque JPEG data URL.
 *
 * We deliberately round the corners ourselves rather than relying on the source DOM's own border-radius:
 * html-to-image rasterizes browser-clipped rounded corners with antialiased edge pixels whose RGB is blended
 * against an implicit black backdrop, producing a visible dark fringe once composited onto a real background.
 * Filling with the exact gradient (rather than a single flat color) also keeps corners seamless with the rest.
 */
export const flattenPngToRoundedJpeg = (
    pngDataUrl: string,
    fill: { gradient: Gradient | null; bgColor: string },
    cornerRadiusPx: number
): Promise<string> =>
    new Promise((resolve, reject) => {
      console.log('[DEBUG] flattenPngToRoundedJpeg start, dataUrl length', pngDataUrl.length);
      const img = new Image();
      img.onload = () => {
        console.log('[DEBUG] img.onload fired', img.naturalWidth, img.naturalHeight);
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas 2D context is not available.'));
          return;
        }
        if (fill.gradient) {
          const { x0, y0, x1, y1 } = cssGradientLineCoords(canvas.width, canvas.height, fill.gradient.angle);
          const canvasGradient = ctx.createLinearGradient(x0, y0, x1, y1);
          canvasGradient.addColorStop(0, fill.gradient.from);
          canvasGradient.addColorStop(1, fill.gradient.to);
          ctx.fillStyle = canvasGradient;
        } else {
          ctx.fillStyle = fill.bgColor;
        }
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        traceRoundedRect(ctx, canvas.width, canvas.height, cornerRadiusPx);
        ctx.clip();
        ctx.drawImage(img, 0, 0);
        ctx.restore();

        resolve(canvas.toDataURL('image/jpeg', 1));
      };
      img.onerror = () => reject(new Error('Failed to load the rendered image.'));
      img.src = pngDataUrl;
    });
