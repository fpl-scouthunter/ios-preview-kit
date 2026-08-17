/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useRef, useState } from 'react';
import { Apple, Bot, Download, Plus, Trash2, Upload } from 'lucide-react';
import { SCREEN_CATEGORY_LABEL } from '../deviceConfig';
import type { AppProject } from '../types';

type AppSelectBarProps = {
  apps: AppProject[];
  activeAppId: string;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onExport: () => void;
  onImportFile: (file: File) => void;
};

export const AppSelectBar = ({ apps, activeAppId, onSelect, onAdd, onRemove, onRename, onExport, onImportFile }: AppSelectBarProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');
  const importInputRef = useRef<HTMLInputElement>(null);

  const startRename = (app: AppProject) => {
    setEditingId(app.id);
    setDraftName(app.name);
  };

  const commitRename = () => {
    if (editingId) onRename(editingId, draftName.trim() || 'Untitled App');
    setEditingId(null);
  };

  return (
      <div className="h-14 bg-black/40 backdrop-blur-xl border-b border-neutral-800 flex items-center justify-between pl-4 pr-4 gap-3 z-20">
        <div className="flex items-center gap-2 overflow-x-auto flex-1 py-2.5">
          {apps.map((app) => (
              <div
                  key={app.id}
                  onClick={() => onSelect(app.id)}
                  onDoubleClick={() => startRename(app)}
                  className={`group flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-full border cursor-pointer transition-all whitespace-nowrap shrink-0 ${
                      activeAppId === app.id
                          ? 'border-indigo-500 bg-indigo-500/10 text-white'
                          : 'border-neutral-800 bg-neutral-900/50 text-neutral-400 hover:border-neutral-700'
                  }`}
              >
                {app.platform === 'ios' ? <Apple size={13} /> : <Bot size={13} />}
                {editingId === app.id ? (
                    <input
                        autoFocus
                        value={draftName}
                        onChange={(e) => setDraftName(e.target.value)}
                        onBlur={commitRename}
                        onKeyDown={(e) => e.key === 'Enter' && commitRename()}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-transparent text-sm font-semibold outline-none border-b border-indigo-500 w-28"
                    />
                ) : (
                    <span className="text-sm font-semibold">{app.name}</span>
                )}
                <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-600">
                {SCREEN_CATEGORY_LABEL[app.platform][app.screenCategory]}
              </span>
                {apps.length > 1 && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onRemove(app.id); }}
                        className="opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-red-500 transition-opacity ml-1"
                    >
                      <Trash2 size={12} />
                    </button>
                )}
              </div>
          ))}
          <button
              onClick={onAdd}
              className="w-8 h-8 shrink-0 rounded-full border-2 border-dashed border-neutral-800 flex items-center justify-center text-neutral-600 hover:text-neutral-400 hover:border-neutral-600 transition-all"
              title="New app"
          >
            <Plus size={14} />
          </button>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <input
              ref={importInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onImportFile(file);
                e.target.value = '';
              }}
          />
          <button
              onClick={() => importInputRef.current?.click()}
              className="flex items-center gap-1.5 text-neutral-400 hover:text-white text-xs font-semibold px-3 py-1.5 rounded-full border border-neutral-800 hover:border-neutral-700 transition-all"
              title="Import app project (.json)"
          >
            <Upload size={13} />
            Import
          </button>
          <button
              onClick={onExport}
              className="flex items-center gap-1.5 text-neutral-400 hover:text-white text-xs font-semibold px-3 py-1.5 rounded-full border border-neutral-800 hover:border-neutral-700 transition-all"
              title="Export current app project (.json)"
          >
            <Download size={13} />
            Export
          </button>
        </div>
      </div>
  );
};
