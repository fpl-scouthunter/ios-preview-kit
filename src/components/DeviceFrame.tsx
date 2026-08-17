/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Smartphone } from 'lucide-react';
import { FRAME_SIZE, isThinBezelModel } from '../deviceConfig';
import type { DeviceModel, Platform, ScreenCategory } from '../types';

type DeviceFrameProps = {
  platform: Platform;
  screenCategory: ScreenCategory;
  model: DeviceModel;
  screenshot: string | null;
  showOverlay: boolean;
};

export const DeviceFrame = ({ platform, screenCategory, model, screenshot, showOverlay }: DeviceFrameProps) => {
  const { w, h } = FRAME_SIZE[screenCategory];
  const isAndroid = platform === 'android';
  const isTablet = screenCategory === 'tablet';

  // Thinner bezel for the newest/flagship models in each lineup, matching the old iPhone-17-Pro treatment.
  const thinBezel = isThinBezelModel(model);

  return (
      <div
          className={`relative mx-auto bg-neutral-900 shadow-2xl overflow-hidden border-neutral-800 transition-all duration-700 ${
              isTablet ? 'rounded-[1.6rem]' : isAndroid ? 'rounded-[2.6rem]' : 'rounded-[3.2rem]'
          } ${thinBezel ? 'border-[3px]' : 'border-8'}`}
          style={{ width: w, height: h }}
      >
        {/* Camera cutout */}
        {showOverlay && (
            isAndroid ? (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-black rounded-full z-10 ring-2 ring-neutral-900/80" />
            ) : (
                <div className={`absolute top-4 left-1/2 -translate-x-1/2 bg-black rounded-full z-10 transition-all duration-700 ${
                    isTablet ? 'w-3 h-3' : thinBezel ? 'w-12 h-3.5 opacity-60 blur-[0.5px]' : 'w-24 h-6'
                }`} />
            )
        )}

        {/* Screen Content */}
        <div className="w-full h-full bg-neutral-800 flex items-center justify-center relative">
          {screenshot ? (
              <img src={screenshot} alt="App Screenshot" className="w-full h-full object-cover object-top" />
          ) : (
              <div className="text-neutral-500 flex flex-col items-center gap-2">
                <Smartphone size={32} />
                <span className="text-[10px] uppercase tracking-widest font-medium">Screenshot Placeholder</span>
              </div>
          )}
        </div>

        {/* Home Indicator (both platforms use a gesture pill by default today) */}
        {showOverlay && !isTablet && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/30 rounded-full z-10" />
        )}
      </div>
  );
};
