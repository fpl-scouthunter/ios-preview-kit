/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Smartphone, Tablet, Apple, Bot } from 'lucide-react';
import { SCREEN_CATEGORY_LABEL } from '../deviceConfig';
import type { Platform, ScreenCategory } from '../types';

type NewAppModalProps = {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string, platform: Platform, screenCategory: ScreenCategory) => void;
};

export const NewAppModal = ({ open, onClose, onCreate }: NewAppModalProps) => {
  const [name, setName] = useState('');
  const [platform, setPlatform] = useState<Platform>('ios');
  const [screenCategory, setScreenCategory] = useState<ScreenCategory>('phone');

  const handleCreate = () => {
    onCreate(name.trim() || 'New App', platform, screenCategory);
    setName('');
    setPlatform('ios');
    setScreenCategory('phone');
  };

  return (
      <AnimatePresence>
        {open && (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            >
              <motion.div
                  initial={{ opacity: 0, scale: 0.96, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: 8 }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-[420px] bg-[#0d0d0d] border border-neutral-800 rounded-3xl shadow-2xl p-6 flex flex-col gap-6"
              >
                <div>
                  <h2 className="text-lg font-bold">New App</h2>
                  <p className="text-xs text-neutral-500 mt-1">Set up a project for your app store screenshots.</p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-neutral-400 px-1">App name</label>
                  <input
                      autoFocus
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                      placeholder="My Awesome App"
                      className="w-full bg-[#141414] border border-neutral-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-neutral-400 px-1">Platform</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={() => setPlatform('ios')}
                        className={`p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${
                            platform === 'ios' ? 'border-indigo-500 bg-indigo-500/10 text-white' : 'border-neutral-800 text-neutral-500 hover:border-neutral-700'
                        }`}
                    >
                      <Apple size={16} />
                      <span className="text-sm font-semibold">iOS</span>
                    </button>
                    <button
                        onClick={() => setPlatform('android')}
                        className={`p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${
                            platform === 'android' ? 'border-indigo-500 bg-indigo-500/10 text-white' : 'border-neutral-800 text-neutral-500 hover:border-neutral-700'
                        }`}
                    >
                      <Bot size={16} />
                      <span className="text-sm font-semibold">Android</span>
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-neutral-400 px-1">Screen type</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={() => setScreenCategory('phone')}
                        className={`p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${
                            screenCategory === 'phone' ? 'border-indigo-500 bg-indigo-500/10 text-white' : 'border-neutral-800 text-neutral-500 hover:border-neutral-700'
                        }`}
                    >
                      <Smartphone size={16} />
                      <span className="text-sm font-semibold">{SCREEN_CATEGORY_LABEL[platform].phone}</span>
                    </button>
                    <button
                        onClick={() => setScreenCategory('tablet')}
                        className={`p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${
                            screenCategory === 'tablet' ? 'border-indigo-500 bg-indigo-500/10 text-white' : 'border-neutral-800 text-neutral-500 hover:border-neutral-700'
                        }`}
                    >
                      <Tablet size={16} />
                      <span className="text-sm font-semibold">{SCREEN_CATEGORY_LABEL[platform].tablet}</span>
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 mt-2">
                  <button
                      onClick={onClose}
                      className="flex-1 py-2.5 rounded-xl border border-neutral-800 text-sm font-semibold text-neutral-400 hover:text-white hover:border-neutral-700 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                      onClick={handleCreate}
                      className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-bold text-white transition-all shadow-lg shadow-indigo-900/40"
                  >
                    Create App
                  </button>
                </div>
              </motion.div>
            </motion.div>
        )}
      </AnimatePresence>
  );
};
