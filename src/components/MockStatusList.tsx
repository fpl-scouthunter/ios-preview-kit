/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { STATUS_LIST_ITEMS } from '../mockData';

type MockStatusListProps = {
  popoutIndex: number;
  onSelectPopout: (index: number) => void;
};

export const MockStatusList = ({ popoutIndex, onSelectPopout }: MockStatusListProps) => (
    <div className="w-full bg-neutral-900 flex flex-col p-6 pt-16 relative h-full">
      <div className="absolute left-8 top-16 bottom-0 w-[2.5px] bg-neutral-800" />
      <div className="flex flex-col gap-6 relative">
        {STATUS_LIST_ITEMS.map((item, i) => (
            <div
                key={i}
                onClick={() => onSelectPopout(i)}
                className={`flex items-start gap-4 relative cursor-pointer rounded-lg -m-1 p-1 transition-all hover:bg-white/5 ${
                    i === popoutIndex ? 'opacity-10 py-6' : ''
                }`}
            >
              <div className={`w-4 h-4 rounded-full mt-1.5 z-10 border-[3px] shadow-sm transition-all ${
                  item.status === 'completed' ? 'bg-emerald-500 border-emerald-500' : 'bg-neutral-900 border-neutral-700'
              } ${i === popoutIndex ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-neutral-900' : ''}`} />
              <div className="flex-1">
                <div className="text-[12px] font-bold text-neutral-100 leading-tight">{item.label}</div>
                <div className="text-[10px] text-neutral-500 font-semibold mt-0.5">{item.sub}</div>
              </div>
              <div className="text-[10px] text-neutral-500 font-bold pt-1">{item.time}</div>
            </div>
        ))}
      </div>
    </div>
);
