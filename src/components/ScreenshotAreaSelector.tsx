/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { Crop } from 'lucide-react';
import { cropImageToDataUrl, type PercentRect } from '../imageUtils';

type ScreenshotAreaSelectorProps = {
  src: string;
  onCrop: (dataUrl: string, aspectRatio: number) => void;
};

const MIN_SIZE = 2; // percent, ignores accidental clicks/tiny drags

type HandleId = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

const HANDLES: { id: HandleId; left: number; top: number; cursor: string }[] = [
  { id: 'nw', left: 0, top: 0, cursor: 'nwse-resize' },
  { id: 'n', left: 50, top: 0, cursor: 'ns-resize' },
  { id: 'ne', left: 100, top: 0, cursor: 'nesw-resize' },
  { id: 'e', left: 100, top: 50, cursor: 'ew-resize' },
  { id: 'se', left: 100, top: 100, cursor: 'nwse-resize' },
  { id: 's', left: 50, top: 100, cursor: 'ns-resize' },
  { id: 'sw', left: 0, top: 100, cursor: 'nesw-resize' },
  { id: 'w', left: 0, top: 50, cursor: 'ew-resize' },
];

/** The point that stays fixed while dragging `handle` — the opposite edge/corner of the current selection. */
const getAnchor = (handle: HandleId, sel: PercentRect): { x: number; y: number } => {
  const left = sel.x, right = sel.x + sel.w, top = sel.y, bottom = sel.y + sel.h;
  switch (handle) {
    case 'nw': return { x: right, y: bottom };
    case 'n': return { x: left, y: bottom };
    case 'ne': return { x: left, y: bottom };
    case 'e': return { x: left, y: top };
    case 'se': return { x: left, y: top };
    case 's': return { x: left, y: top };
    case 'sw': return { x: right, y: top };
    case 'w': return { x: right, y: top };
  }
};

const computeResizedRect = (
    handle: HandleId,
    anchor: { x: number; y: number },
    point: { x: number; y: number },
    prev: PercentRect,
): PercentRect => {
  const lockX = handle === 'n' || handle === 's';
  const lockY = handle === 'e' || handle === 'w';
  return {
    x: lockX ? prev.x : Math.min(anchor.x, point.x),
    w: lockX ? prev.w : Math.abs(point.x - anchor.x),
    y: lockY ? prev.y : Math.min(anchor.y, point.y),
    h: lockY ? prev.h : Math.abs(point.y - anchor.y),
  };
};

export const ScreenshotAreaSelector = ({ src, onCrop }: ScreenshotAreaSelectorProps) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const drawStart = useRef<{ x: number; y: number } | null>(null);
  const resizeState = useRef<{ handle: HandleId; anchor: { x: number; y: number } } | null>(null);
  const [selection, setSelection] = useState<PercentRect | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isCropping, setIsCropping] = useState(false);

  // Discard any in-progress selection when the underlying screenshot changes.
  useEffect(() => {
    setSelection(null);
  }, [src]);

  const pointFromClient = (clientX: number, clientY: number) => {
    const rect = imgRef.current!.getBoundingClientRect();
    return {
      x: Math.min(Math.max(((clientX - rect.left) / rect.width) * 100, 0), 100),
      y: Math.min(Math.max(((clientY - rect.top) / rect.height) * 100, 0), 100),
    };
  };

  const handleContainerMouseDown = (e: MouseEvent) => {
    e.preventDefault();
    const p = pointFromClient(e.clientX, e.clientY);
    drawStart.current = p;
    resizeState.current = null;
    setIsDragging(true);
    setSelection({ x: p.x, y: p.y, w: 0, h: 0 });
  };

  const handleResizeStart = (e: MouseEvent, handle: HandleId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selection) return;
    drawStart.current = null;
    resizeState.current = { handle, anchor: getAnchor(handle, selection) };
    setIsDragging(true);
  };

  // Track the drag on the window, not just the small preview box, so resizing/drawing
  // near an edge keeps working even after the cursor leaves the container bounds.
  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (e: globalThis.MouseEvent) => {
      const p = pointFromClient(e.clientX, e.clientY);
      if (resizeState.current) {
        const { handle, anchor } = resizeState.current;
        setSelection((prev) => (prev ? computeResizedRect(handle, anchor, p, prev) : prev));
        return;
      }
      if (!drawStart.current) return;
      const start = drawStart.current;
      setSelection({
        x: Math.min(start.x, p.x),
        y: Math.min(start.y, p.y),
        w: Math.abs(p.x - start.x),
        h: Math.abs(p.y - start.y),
      });
    };

    const handleUp = () => {
      drawStart.current = null;
      resizeState.current = null;
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [isDragging]);

  const hasValidSelection = !!selection && selection.w > MIN_SIZE && selection.h > MIN_SIZE;

  const handleUseSelection = async () => {
    if (!selection || !hasValidSelection) return;
    setIsCropping(true);
    try {
      const cropped = await cropImageToDataUrl(src, selection);
      onCrop(cropped.dataUrl, cropped.aspectRatio);
    } catch (err) {
      console.error('Failed to crop selection', err);
    } finally {
      setIsCropping(false);
    }
  };

  return (
      <div className="flex flex-col gap-2">
        <div
            className="relative w-full rounded-xl overflow-hidden border border-neutral-800 bg-[#0a0a0a] cursor-crosshair select-none"
            onMouseDown={handleContainerMouseDown}
        >
          <img
              ref={imgRef}
              src={src}
              draggable={false}
              onDragStart={(e) => e.preventDefault()}
              className="w-full h-auto block pointer-events-none"
              alt="Screenshot to select an area from"
          />
          {selection && (selection.w > 0 || selection.h > 0) && (
              <>
                {/* Dim everything outside the selection using four bands */}
                <div className="absolute left-0 right-0 top-0 bg-black/50" style={{ height: `${selection.y}%` }} />
                <div className="absolute left-0 right-0 bottom-0 bg-black/50" style={{ height: `${100 - selection.y - selection.h}%` }} />
                <div className="absolute left-0 bg-black/50" style={{ top: `${selection.y}%`, height: `${selection.h}%`, width: `${selection.x}%` }} />
                <div className="absolute right-0 bg-black/50" style={{ top: `${selection.y}%`, height: `${selection.h}%`, width: `${100 - selection.x - selection.w}%` }} />
                <div
                    className="absolute border-2 border-indigo-500"
                    style={{
                      left: `${selection.x}%`,
                      top: `${selection.y}%`,
                      width: `${selection.w}%`,
                      height: `${selection.h}%`,
                    }}
                >
                  {hasValidSelection && HANDLES.map((handle) => (
                      <div
                          key={handle.id}
                          onMouseDown={(e) => handleResizeStart(e, handle.id)}
                          className="absolute w-2.5 h-2.5 -translate-x-1/2 -translate-y-1/2 bg-white border-2 border-indigo-500 rounded-[2px] shadow-sm"
                          style={{ left: `${handle.left}%`, top: `${handle.top}%`, cursor: handle.cursor }}
                      />
                  ))}
                </div>
              </>
          )}
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[9px] font-semibold text-neutral-500 uppercase tracking-wider">
            {!hasValidSelection ? 'Drag to select an area' : isDragging ? 'Adjusting area…' : 'Drag handles to resize'}
          </span>
          <button
              onClick={handleUseSelection}
              disabled={!hasValidSelection || isCropping}
              className="flex items-center gap-1.5 text-[10px] font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 px-2.5 py-1.5 rounded-full transition-all shrink-0"
          >
            <Crop size={11} />
            {isCropping ? 'Cropping…' : 'Use Selected Area'}
          </button>
        </div>
      </div>
  );
};
