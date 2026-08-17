/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toPng } from 'html-to-image';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import {
  Type,
  Image as ImageIcon,
  Palette,
  Download,
  Plus,
  Trash2,
  Layout,
  ChevronRight,
  Monitor,
  Sparkles,
  Loader2
} from 'lucide-react';
import type { AppProject, DeviceModel, Gradient, Platform, PreviewState, ScreenCategory } from './types';
import { CANVAS_SIZE, FRAME_SIZE, getDeviceOptions, isThinBezelModel } from './deviceConfig';
import { GRADIENT_PRESETS, cloneScreenAsNew, createDefaultApp } from './templates';
import {
  DEFAULT_FONT_FAMILY,
  DEFAULT_FRAME_COLOR,
  DEFAULT_POPOUT_BORDER_COLOR,
  DEFAULT_POPOUT_BORDER_OPACITY,
  DEFAULT_POPOUT_BORDER_RADIUS,
  DEFAULT_POPOUT_BORDER_WIDTH,
  DEFAULT_POPOUT_INDEX,
  DEFAULT_POPOUT_SCALE,
  DEFAULT_POPOUT_SHADOW_BLUR,
  DEFAULT_POPOUT_SHADOW_COLOR,
  DEFAULT_POPOUT_SHADOW_OPACITY,
  DEFAULT_SUBTITLE_FONT_SIZE,
  DEFAULT_TITLE_FONT_SIZE,
  FONT_OPTIONS,
  FRAME_COLOR_PRESETS,
  MAX_POPOUT_BORDER_RADIUS,
  MAX_POPOUT_BORDER_WIDTH,
  MAX_POPOUT_SCALE,
  MAX_POPOUT_SHADOW_BLUR,
  MAX_SUBTITLE_FONT_SIZE,
  MAX_TITLE_FONT_SIZE,
  MIN_POPOUT_SCALE,
  MIN_SUBTITLE_FONT_SIZE,
  MIN_TITLE_FONT_SIZE,
  STATUS_LIST_ITEMS,
} from './mockData';
import { ImportError, exportAppToFile, loadPersistedState, parseImportedApp, savePersistedState } from './storage';
import { DeviceFrame } from './components/DeviceFrame';
import { MockStatusList } from './components/MockStatusList';
import { AppSelectBar } from './components/AppSelectBar';
import { NewAppModal } from './components/NewAppModal';
import { ScreenshotAreaSelector } from './components/ScreenshotAreaSelector';
import { flattenPngToRoundedJpeg, getImageAspectRatio, hexToRgba } from './imageUtils';

const appSlug = (name: string) =>
    name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'app';

const CARD_CORNER_RADIUS = 32;
const EXPORT_PIXEL_RATIO = 3;

/**
 * Captures `node` as a flattened JPEG with clean rounded corners.
 * We capture a squared-off clone (no border-radius/box-shadow) rather than the live node directly,
 * because html-to-image's rasterized rounded-corner clip leaves antialiased edge pixels blended
 * against an implicit black backdrop — visible as a dark fringe once composited onto a real
 * background. Rounding is instead applied ourselves in flattenPngToRoundedJpeg via canvas 2D clip.
 */
const captureScreenJpeg = async (
    node: HTMLElement,
    fill: { gradient: Gradient | null; bgColor: string }
): Promise<string> => {
  console.log('[DEBUG] captureScreenJpeg start');
  const clone = node.cloneNode(true) as HTMLElement;
  clone.style.borderRadius = '0';
  clone.style.boxShadow = 'none';
  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;top:-100000px;left:-100000px;pointer-events:none;';
  container.appendChild(clone);
  document.body.appendChild(container);
  console.log('[DEBUG] clone appended', clone.getBoundingClientRect());
  try {
    const pngDataUrl = await toPng(clone, {
      cacheBust: true,
      pixelRatio: EXPORT_PIXEL_RATIO,
      quality: 1,
    });
    console.log('[DEBUG] toPng resolved', pngDataUrl.length);
    return await flattenPngToRoundedJpeg(pngDataUrl, fill, CARD_CORNER_RADIUS * EXPORT_PIXEL_RATIO);
  } finally {
    document.body.removeChild(container);
  }
};

const initApps = (): { apps: AppProject[]; activeAppId: string } => {
  const persisted = loadPersistedState();
  if (persisted && persisted.apps.length > 0) {
    return { apps: persisted.apps, activeAppId: persisted.activeAppId || persisted.apps[0].id };
  }
  const app = createDefaultApp('My App', 'ios', 'phone');
  return { apps: [app], activeAppId: app.id };
};

export default function App() {
  const [{ apps: initialApps, activeAppId: initialActiveAppId }] = useState(initApps);
  const [apps, setApps] = useState<AppProject[]>(initialApps);
  const [activeAppId, setActiveAppId] = useState<string>(initialActiveAppId);
  const [isNewAppModalOpen, setIsNewAppModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [settingsTab, setSettingsTab] = useState<'general' | 'text' | 'screenshots'>('general');
  const previewRef = useRef<HTMLDivElement>(null);

  const activeApp = apps.find(a => a.id === activeAppId) || apps[0];
  const activeScreen = activeApp.screens.find(s => s.id === activeApp.activeScreenId) || activeApp.screens[0];

  // Every project change (apps, screens, images, active selection) is saved to localStorage automatically.
  useEffect(() => {
    savePersistedState({ version: 1, apps, activeAppId });
  }, [apps, activeAppId]);

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const updateApp = (appId: string, updater: (app: AppProject) => AppProject) => {
    setApps(prev => prev.map(a => (a.id === appId ? updater(a) : a)));
  };

  const updateActiveScreen = (updates: Partial<PreviewState>) => {
    updateApp(activeAppId, app => ({
      ...app,
      screens: app.screens.map(s => (s.id === app.activeScreenId ? { ...s, ...updates } : s)),
    }));
  };

  const setActiveScreenId = (id: string) => {
    updateApp(activeAppId, app => ({ ...app, activeScreenId: id }));
  };

  const addScreen = () => {
    const newScreen = cloneScreenAsNew(activeScreen);
    updateApp(activeAppId, app => ({
      ...app,
      screens: [...app.screens, newScreen],
      activeScreenId: newScreen.id,
    }));
  };

  const removeScreen = (id: string) => {
    if (activeApp.screens.length <= 1) return;
    updateApp(activeAppId, app => {
      const screens = app.screens.filter(s => s.id !== id);
      const activeScreenId = app.activeScreenId === id ? screens[0].id : app.activeScreenId;
      return { ...app, screens, activeScreenId };
    });
  };

  const addApp = (name: string, platform: Platform, screenCategory: ScreenCategory) => {
    const app = createDefaultApp(name, platform, screenCategory);
    setApps(prev => [...prev, app]);
    setActiveAppId(app.id);
    setIsNewAppModalOpen(false);
  };

  const removeApp = (id: string) => {
    if (apps.length <= 1) return;
    const newApps = apps.filter(a => a.id !== id);
    setApps(newApps);
    if (activeAppId === id) setActiveAppId(newApps[0].id);
  };

  const renameApp = (id: string, name: string) => {
    updateApp(id, app => ({ ...app, name }));
  };

  const handleExportProject = () => exportAppToFile(activeApp);

  const handleImportProject = async (file: File) => {
    try {
      const text = await file.text();
      const imported = parseImportedApp(text);
      setApps(prev => [...prev, imported]);
      setActiveAppId(imported.id);
    } catch (err) {
      const message = err instanceof ImportError ? err.message : 'Failed to import app project.';
      alert(message);
    }
  };

  const handleDownload = async () => {
    if (previewRef.current === null) return;
    try {
      const dataUrl = await captureScreenJpeg(previewRef.current, {
        gradient: activeScreen.gradient,
        bgColor: activeScreen.bgColor,
      });
      const link = document.createElement('a');
      link.download = `${appSlug(activeApp.name)}-preview-${activeScreen.id}.jpg`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Download failed', err);
    }
  };

  const handleExportAll = async () => {
    if (previewRef.current === null || activeApp.screens.length === 0) return;

    setIsExporting(true);
    setExportProgress(0);
    const zip = new JSZip();
    const originalId = activeApp.activeScreenId;
    const screens = activeApp.screens;

    try {
      for (let i = 0; i < screens.length; i++) {
        const screen = screens[i];
        setActiveScreenId(screen.id);
        setExportProgress(Math.round(((i) / screens.length) * 100));

        // Wait for React to switch state and render
        await sleep(500);

        const dataUrl = await captureScreenJpeg(previewRef.current, {
          gradient: screen.gradient,
          bgColor: screen.bgColor,
        });
        const base64Data = dataUrl.split(',')[1];
        zip.file(`preview-${i + 1}-${screen.title.slice(0, 10)}.jpg`, base64Data, { base64: true });
      }

      setExportProgress(100);
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `${appSlug(activeApp.name)}-previews.zip`);
    } catch (err) {
      console.error('Export all failed', err);
    } finally {
      setActiveScreenId(originalId);
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const handlePopoutScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (prev) => {
        const dataUrl = prev.target?.result as string;
        const aspectRatio = await getImageAspectRatio(dataUrl).catch(() => null);
        updateActiveScreen({ popoutScreenshot: dataUrl, popoutAspectRatio: aspectRatio });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (prev) => {
        updateActiveScreen({ screenshot: prev.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const canvasSize = CANVAS_SIZE[activeApp.screenCategory];
  const frameSize = FRAME_SIZE[activeApp.screenCategory];
  const popoutThinBezel = isThinBezelModel(activeScreen.deviceModel);
  const popoutIndex = activeScreen.popoutItemIndex ?? DEFAULT_POPOUT_INDEX;
  const popoutItem = STATUS_LIST_ITEMS[popoutIndex] ?? STATUS_LIST_ITEMS[DEFAULT_POPOUT_INDEX];
  const popoutScale = activeScreen.popoutScale ?? DEFAULT_POPOUT_SCALE;
  const POPOUT_WIDTH = Math.round(Math.min(340, frameSize.w + 55) * popoutScale);
  const popoutHeight = activeScreen.popoutScreenshot && activeScreen.popoutAspectRatio
      ? Math.min(400, Math.max(60, POPOUT_WIDTH / activeScreen.popoutAspectRatio))
      : undefined;
  const popoutBorderRadius = activeScreen.popoutBorderRadius ?? DEFAULT_POPOUT_BORDER_RADIUS;
  const popoutBorderWidth = activeScreen.popoutBorderWidth ?? DEFAULT_POPOUT_BORDER_WIDTH;
  const popoutBorderColor = activeScreen.popoutBorderColor ?? DEFAULT_POPOUT_BORDER_COLOR;
  const popoutBorderOpacity = activeScreen.popoutBorderOpacity ?? DEFAULT_POPOUT_BORDER_OPACITY;
  const popoutShadowBlur = activeScreen.popoutShadowBlur ?? DEFAULT_POPOUT_SHADOW_BLUR;
  const popoutShadowColor = activeScreen.popoutShadowColor ?? DEFAULT_POPOUT_SHADOW_COLOR;
  const popoutShadowOpacity = activeScreen.popoutShadowOpacity ?? DEFAULT_POPOUT_SHADOW_OPACITY;
  const frameColor = activeScreen.frameColor ?? DEFAULT_FRAME_COLOR;
  const fontFamily = activeScreen.fontFamily ?? DEFAULT_FONT_FAMILY;
  const titleFontSize = activeScreen.titleFontSize ?? DEFAULT_TITLE_FONT_SIZE;
  const subtitleFontSize = activeScreen.subtitleFontSize ?? DEFAULT_SUBTITLE_FONT_SIZE;

  return (
      <div className="flex flex-col h-screen bg-[#0a0a0a] text-white font-sans overflow-hidden border-t border-neutral-800">
        {/* Background Blurs */}
        <div className="ambient-blur">
          <div className="ambient-blur-1" />
          <div className="ambient-blur-2" />
        </div>

        <AppSelectBar
            apps={apps}
            activeAppId={activeAppId}
            onSelect={setActiveAppId}
            onAdd={() => setIsNewAppModalOpen(true)}
            onRemove={removeApp}
            onRename={renameApp}
            onExport={handleExportProject}
            onImportFile={handleImportProject}
        />

        <NewAppModal
            open={isNewAppModalOpen}
            onClose={() => setIsNewAppModalOpen(false)}
            onCreate={addApp}
        />

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar - Navigation */}
          <div className="w-20 border-r border-neutral-800 bg-[#0a0a0a] flex flex-col items-center py-6 gap-6 z-20">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-900/20">
              <Sparkles size={24} fill="currentColor" />
            </div>

            <div className="flex-1 flex flex-col gap-4 overflow-y-auto px-2">
              {activeApp.screens.map((screen, index) => (
                  <button
                      key={screen.id}
                      onClick={() => setActiveScreenId(screen.id)}
                      className={`w-14 h-20 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-1 group relative ${
                          activeApp.activeScreenId === screen.id
                              ? 'border-indigo-500 bg-indigo-500/10 shadow-sm'
                              : 'border-neutral-800 bg-neutral-900/50 hover:border-neutral-700'
                      }`}
                  >
                    <div
                        className="w-8 h-12 rounded-[4px] shadow-sm mb-1"
                        style={{
                          background: screen.gradient
                              ? `linear-gradient(${screen.gradient.angle}deg, ${screen.gradient.from}, ${screen.gradient.to})`
                              : screen.bgColor
                        }}
                    />
                    <span className="text-[10px] font-bold text-neutral-500 group-hover:text-neutral-300">0{index + 1}</span>
                    {activeApp.screens.length > 1 && (
                        <button
                            onClick={(e) => { e.stopPropagation(); removeScreen(screen.id); }}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={10} />
                        </button>
                    )}
                  </button>
              ))}
              <button
                  onClick={addScreen}
                  className="w-14 h-14 rounded-xl border-2 border-dashed border-neutral-800 flex items-center justify-center text-neutral-600 hover:text-neutral-400 hover:border-neutral-600 transition-all"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>

          {/* Main Preview Area */}
          <div className="flex-1 overflow-auto bg-transparent flex flex-col relative">
            {/* Toolbar */}
            <div className="h-14 bg-black/40 backdrop-blur-xl border-b border-neutral-800 flex items-center justify-between px-8 sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-widest text-indigo-400">Preview Mode</span>
                <ChevronRight size={14} className="text-neutral-700" />
                <span className="text-sm font-semibold text-gray-300">{activeScreen.title || 'Untitled Screen'}</span>
              </div>
              <button
                  disabled={isExporting}
                  onClick={handleExportAll}
                  className="flex items-center gap-2 bg-neutral-100 text-neutral-900 px-4 py-1.5 rounded-full text-xs font-bold hover:bg-white transition-colors shadow-lg disabled:opacity-50"
              >
                {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                Export All (.zip)
              </button>
            </div>

            {/* Canvas */}
            <div className="flex-1 flex items-center justify-center p-12 relative">
              <AnimatePresence>
                {isExporting && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                    >
                      <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4 text-center max-w-sm">
                        <div className="w-16 h-16 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                        <div>
                          <h3 className="text-lg font-bold">Exporting Screens</h3>
                          <p className="text-xs text-neutral-500 mt-1">Generating high-resolution assets... {exportProgress}%</p>
                        </div>
                        <div className="w-full bg-neutral-800 h-1.5 rounded-full mt-2 overflow-hidden">
                          <motion.div
                              className="bg-indigo-500 h-full"
                              animate={{ width: `${exportProgress}%` }}
                          />
                        </div>
                      </div>
                    </motion.div>
                )}
              </AnimatePresence>
              <motion.div
                  ref={previewRef}
                  layoutId="preview-card"
                  className="shadow-[0_40px_100px_rgba(0,0,0,0.6)] flex flex-col relative overflow-hidden"
                  style={{
                    width: canvasSize.w,
                    height: canvasSize.h,
                    borderRadius: CARD_CORNER_RADIUS,
                    background: activeScreen.gradient
                        ? `linear-gradient(${activeScreen.gradient.angle}deg, ${activeScreen.gradient.from}, ${activeScreen.gradient.to})`
                        : activeScreen.bgColor,
                    color: activeScreen.textColor
                  }}
              >
                {/* Template Layouts */}
                <div className="flex-1 flex flex-col p-8 pt-16">
                  {activeScreen.layout === 'top-text' && (
                      <div className="flex flex-col gap-4 text-center items-center mb-12">
                        <h2 className="font-extrabold leading-tight tracking-tight" style={{ fontFamily, fontSize: titleFontSize }}>{activeScreen.title}</h2>
                        <p className="opacity-80 leading-relaxed max-w-[80%]" style={{ fontFamily, fontSize: subtitleFontSize }}>{activeScreen.subtitle}</p>
                      </div>
                  )}

                  {activeScreen.layout === 'list-popout' && (
                      <div className="flex flex-col gap-8 text-center items-center mb-8">
                        <h2 className="font-extrabold leading-tight tracking-tight px-4" style={{ fontFamily, fontSize: titleFontSize }}>{activeScreen.title}</h2>
                      </div>
                  )}

                  <div className={`flex-1 flex items-center justify-center transition-all duration-500 relative ${activeScreen.layout === 'bottom-text' ? 'mb-12' : ''}`}>
                    {activeScreen.layout === 'list-popout' ? (
                        <div className="relative">
                          <div
                              className={`relative mx-auto shadow-2xl overflow-hidden transition-all duration-700 ${
                                  activeApp.screenCategory === 'tablet' ? 'rounded-[1.6rem]' : activeApp.platform === 'android' ? 'rounded-[2.6rem]' : 'rounded-[3.2rem]'
                              } ${popoutThinBezel ? 'border-[3px]' : 'border-8'}`}
                              style={{ width: frameSize.w, height: frameSize.h, backgroundColor: frameColor, borderColor: frameColor }}
                          >
                            {activeScreen.showDeviceOverlay && (
                                activeApp.platform === 'android' ? (
                                    <div className="absolute top-3 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-black rounded-full z-20 ring-2 ring-neutral-900/80" />
                                ) : (
                                    <div className={`absolute top-4 left-1/2 -translate-x-1/2 bg-black rounded-full z-20 transition-all duration-700 ${
                                        activeApp.screenCategory === 'tablet' ? 'w-3 h-3' : popoutThinBezel ? 'w-12 h-3.5 opacity-60 blur-[0.5px]' : 'w-24 h-6'
                                    }`} />
                                )
                            )}
                            {activeScreen.screenshot ? (
                                <img src={activeScreen.screenshot} className="w-full h-full object-cover object-top" />
                            ) : (
                                <MockStatusList
                                    popoutIndex={popoutIndex}
                                    onSelectPopout={(index) => updateActiveScreen({ popoutItemIndex: index })}
                                />
                            )}
                            {activeScreen.showDeviceOverlay && activeApp.screenCategory !== 'tablet' && (
                                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/30 rounded-full z-20" />
                            )}
                          </div>

                          {/* The Popout Item */}
                          <div
                              className={`absolute left-1/2 -translate-x-1/2 top-[35%] bg-neutral-900 z-30 ring-4 ring-white/5 overflow-hidden ${
                                  activeScreen.popoutScreenshot ? '' : 'p-5 flex items-center gap-4 min-h-[90px]'
                              }`}
                              style={{
                                width: POPOUT_WIDTH,
                                height: popoutHeight,
                                borderRadius: popoutBorderRadius,
                                borderWidth: popoutBorderWidth,
                                borderStyle: 'solid',
                                borderColor: hexToRgba(popoutBorderColor, popoutBorderOpacity / 100),
                                boxShadow: `0 20px ${popoutShadowBlur}px ${hexToRgba(popoutShadowColor, popoutShadowOpacity / 100)}`,
                              }}
                          >
                            {activeScreen.popoutScreenshot ? (
                                <img src={activeScreen.popoutScreenshot} className="absolute inset-0 w-full h-full object-cover" />
                            ) : (
                                <>
                                  <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-900/40">
                                    <motion.div
                                        animate={{ scale: [1, 1.1, 1] }}
                                        transition={{ repeat: Infinity, duration: 2 }}
                                    >
                                      <Sparkles size={24} fill="currentColor" />
                                    </motion.div>
                                  </div>
                                  <div className="flex-1">
                                    <div className="text-base font-bold text-white leading-tight">{popoutItem.label}</div>
                                    <div className="text-xs text-neutral-400 font-semibold mt-0.5">{popoutItem.sub}</div>
                                  </div>
                                  <div className="text-xs text-neutral-500 font-bold whitespace-nowrap">{popoutItem.time}</div>
                                </>
                            )}
                          </div>
                        </div>
                    ) : (
                        <DeviceFrame
                            platform={activeApp.platform}
                            screenCategory={activeApp.screenCategory}
                            model={activeScreen.deviceModel}
                            screenshot={activeScreen.screenshot}
                            showOverlay={activeScreen.showDeviceOverlay}
                            frameColor={frameColor}
                        />
                    )}
                  </div>

                  {activeScreen.layout === 'bottom-text' && (
                      <div className="flex flex-col gap-4 text-center items-center mt-8">
                        <h2 className="font-extrabold leading-tight tracking-tight" style={{ fontFamily, fontSize: titleFontSize }}>{activeScreen.title}</h2>
                        <p className="opacity-80 leading-relaxed max-w-[80%]" style={{ fontFamily, fontSize: subtitleFontSize }}>{activeScreen.subtitle}</p>
                      </div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>

          {/* Editor Sidebar */}
          <div className="w-[320px] bg-[#0d0d0d] border-l border-neutral-800 flex flex-col h-full z-20">
            <div className="p-6 border-b border-neutral-800">
              <h1 className="text-lg font-bold flex items-center gap-2">
                <Layout size={20} className="text-indigo-400" />
                Designer
              </h1>
            </div>

            <div className="flex border-b border-neutral-800 px-3 pt-3 gap-1">
              {([
                { id: 'general', label: 'General' },
                { id: 'text', label: 'Text' },
                { id: 'screenshots', label: 'Screenshot' },
              ] as const).map((tab) => (
                  <button
                      key={tab.id}
                      onClick={() => setSettingsTab(tab.id)}
                      className={`flex-1 px-3 py-2 text-[11px] font-bold uppercase tracking-wider rounded-t-lg transition-all border-b-2 ${
                          settingsTab === tab.id
                              ? 'text-indigo-400 border-indigo-500'
                              : 'text-neutral-500 border-transparent hover:text-neutral-300'
                      }`}
                  >
                    {tab.label}
                  </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8">
              {settingsTab === 'screenshots' && (
              <>
              {/* Screenshot Section */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Monitor size={16} className="text-indigo-400/60" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500">Mockup</h3>
                </div>
                <div className="flex flex-col gap-4">
                  <div
                      onClick={() => document.getElementById('screenshot-upload')?.click()}
                      className="w-full aspect-video bg-[#141414] border-2 border-dashed border-neutral-800 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-[#1a1a1a] hover:border-neutral-700 transition-all group"
                  >
                    {activeScreen.screenshot ? (
                        <div className="relative w-full h-full overflow-hidden rounded-lg">
                          <img src={activeScreen.screenshot} className="w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="bg-white text-black px-3 py-1.5 rounded-full text-[10px] font-bold shadow-sm">Replace Screenshot</span>
                          </div>
                        </div>
                    ) : (
                        <>
                          <ImageIcon className="text-neutral-700" size={32} />
                          <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Drag screenshot here</span>
                        </>
                    )}
                    <input
                        type="file"
                        id="screenshot-upload"
                        className="hidden"
                        accept="image/*"
                        onChange={handleScreenshotUpload}
                    />
                  </div>

                  {activeScreen.layout === 'list-popout' && (
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Popout Content</label>

                        {activeScreen.screenshot ? (
                            <ScreenshotAreaSelector
                                src={activeScreen.screenshot}
                                onCrop={(dataUrl, aspectRatio) => updateActiveScreen({ popoutScreenshot: dataUrl, popoutAspectRatio: aspectRatio })}
                            />
                        ) : (
                            <p className="text-[10px] text-neutral-600 leading-relaxed">
                              Upload a screenshot above, then drag to select the area you want to feature in the popout.
                            </p>
                        )}

                        {activeScreen.popoutScreenshot && (
                            <div className="flex items-center gap-2 mt-1">
                              <img src={activeScreen.popoutScreenshot} className="w-12 h-12 object-cover rounded-lg border border-neutral-800 shrink-0" />
                              <span className="text-[9px] text-neutral-500 font-semibold uppercase tracking-wider flex-1">Currently used in popout</span>
                              <button
                                  onClick={() => updateActiveScreen({ popoutScreenshot: null, popoutAspectRatio: null })}
                                  className="text-[9px] font-bold text-red-500/60 uppercase hover:text-red-500 transition-colors shrink-0"
                              >
                                Clear
                              </button>
                            </div>
                        )}

                        <div
                            onClick={() => document.getElementById('popout-upload')?.click()}
                            className="text-[9px] font-bold text-neutral-500 hover:text-neutral-300 uppercase tracking-wider cursor-pointer self-start transition-colors"
                        >
                          or upload a separate image
                        </div>
                        <input
                            type="file"
                            id="popout-upload"
                            className="hidden"
                            accept="image/*"
                            onChange={handlePopoutScreenshotUpload}
                        />

                        <div className="flex flex-col gap-1.5 mt-2">
                          <div className="flex justify-between items-center">
                            <label className="text-[9px] font-bold text-neutral-400 uppercase">Size</label>
                            <span className="text-[10px] font-mono text-indigo-400">{Math.round(popoutScale * 100)}%</span>
                          </div>
                          <input
                              type="range"
                              min={MIN_POPOUT_SCALE}
                              max={MAX_POPOUT_SCALE}
                              step="0.05"
                              value={popoutScale}
                              onChange={(e) => updateActiveScreen({ popoutScale: parseFloat(e.target.value) })}
                              className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                          />
                        </div>

                        <div className="flex flex-col gap-1.5 mt-2">
                          <div className="flex justify-between items-center">
                            <label className="text-[9px] font-bold text-neutral-400 uppercase">Corner Radius</label>
                            <span className="text-[10px] font-mono text-indigo-400">{popoutBorderRadius}px</span>
                          </div>
                          <input
                              type="range"
                              min="0"
                              max={MAX_POPOUT_BORDER_RADIUS}
                              value={popoutBorderRadius}
                              onChange={(e) => updateActiveScreen({ popoutBorderRadius: parseInt(e.target.value) })}
                              className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                          />
                        </div>

                        <div className="flex flex-col gap-1.5 mt-2">
                          <div className="flex justify-between items-center">
                            <label className="text-[9px] font-bold text-neutral-400 uppercase">Border Width</label>
                            <span className="text-[10px] font-mono text-indigo-400">{popoutBorderWidth}px</span>
                          </div>
                          <input
                              type="range"
                              min="0"
                              max={MAX_POPOUT_BORDER_WIDTH}
                              value={popoutBorderWidth}
                              onChange={(e) => updateActiveScreen({ popoutBorderWidth: parseInt(e.target.value) })}
                              className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                          />
                        </div>

                        <div className="flex items-center gap-4 mt-1">
                          <div className="flex-1 flex flex-col gap-1.5">
                            <label className="text-[9px] font-bold text-neutral-400 uppercase">Border Color</label>
                            <input
                                type="color"
                                value={popoutBorderColor}
                                onChange={(e) => updateActiveScreen({ popoutBorderColor: e.target.value })}
                                className="w-full h-8 rounded cursor-pointer bg-transparent border-0"
                            />
                          </div>
                          <div className="flex-1 flex flex-col gap-1.5">
                            <div className="flex justify-between items-center">
                              <label className="text-[9px] font-bold text-neutral-400 uppercase">Opacity</label>
                              <span className="text-[10px] font-mono text-indigo-400">{popoutBorderOpacity}%</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={popoutBorderOpacity}
                                onChange={(e) => updateActiveScreen({ popoutBorderOpacity: parseInt(e.target.value) })}
                                className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 mt-2"
                            />
                          </div>
                        </div>

                        <div className="flex flex-col gap-1.5 mt-2">
                          <div className="flex justify-between items-center">
                            <label className="text-[9px] font-bold text-neutral-400 uppercase">Shadow Blur</label>
                            <span className="text-[10px] font-mono text-indigo-400">{popoutShadowBlur}px</span>
                          </div>
                          <input
                              type="range"
                              min="0"
                              max={MAX_POPOUT_SHADOW_BLUR}
                              value={popoutShadowBlur}
                              onChange={(e) => updateActiveScreen({ popoutShadowBlur: parseInt(e.target.value) })}
                              className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                          />
                        </div>

                        <div className="flex items-center gap-4 mt-1">
                          <div className="flex-1 flex flex-col gap-1.5">
                            <label className="text-[9px] font-bold text-neutral-400 uppercase">Shadow Color</label>
                            <input
                                type="color"
                                value={popoutShadowColor}
                                onChange={(e) => updateActiveScreen({ popoutShadowColor: e.target.value })}
                                className="w-full h-8 rounded cursor-pointer bg-transparent border-0"
                            />
                          </div>
                          <div className="flex-1 flex flex-col gap-1.5">
                            <div className="flex justify-between items-center">
                              <label className="text-[9px] font-bold text-neutral-400 uppercase">Opacity</label>
                              <span className="text-[10px] font-mono text-indigo-400">{popoutShadowOpacity}%</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={popoutShadowOpacity}
                                onChange={(e) => updateActiveScreen({ popoutShadowOpacity: parseInt(e.target.value) })}
                                className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 mt-2"
                            />
                          </div>
                        </div>
                      </div>
                  )}
                </div>
              </section>
              </>
              )}

              {settingsTab === 'general' && (
              <>
              {/* Layout Section */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Layout size={16} className="text-indigo-400/60" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500">Layout</h3>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                      onClick={() => updateActiveScreen({ layout: 'top-text' })}
                      className={`p-3 rounded-xl border flex flex-col gap-2 items-center transition-all ${activeScreen.layout === 'top-text' ? 'border-indigo-500 bg-indigo-500/10' : 'border-neutral-800 bg-transparent opacity-60'}`}
                  >
                    <div className="w-8 h-10 border border-neutral-800 rounded-[2px] relative flex flex-col gap-1 p-1">
                      <div className="w-full h-1 bg-neutral-700 rounded-full" />
                      <div className="flex-1 w-full bg-neutral-800 rounded-[1px]" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-tighter">Text Top</span>
                  </button>
                  <button
                      onClick={() => updateActiveScreen({ layout: 'bottom-text' })}
                      className={`p-3 rounded-xl border flex flex-col gap-2 items-center transition-all ${activeScreen.layout === 'bottom-text' ? 'border-indigo-500 bg-indigo-500/10' : 'border-neutral-800 bg-transparent opacity-60'}`}
                  >
                    <div className="w-8 h-10 border border-neutral-800 rounded-[2px] relative flex flex-col gap-1 p-1">
                      <div className="flex-1 w-full bg-neutral-800 rounded-[1px]" />
                      <div className="w-full h-1 bg-neutral-700 rounded-full" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-tighter">Text Bottom</span>
                  </button>
                  <button
                      onClick={() => updateActiveScreen({ layout: 'list-popout' })}
                      className={`p-3 rounded-xl border flex flex-col gap-2 items-center transition-all ${activeScreen.layout === 'list-popout' ? 'border-indigo-500 bg-indigo-500/10' : 'border-neutral-800 bg-transparent opacity-60'}`}
                  >
                    <div className="w-8 h-10 border border-neutral-800 rounded-[2px] relative flex flex-col gap-1 p-1">
                      <div className="w-full h-1 bg-neutral-700 rounded-full mb-1" />
                      <div className="flex-1 w-full bg-neutral-800 rounded-[1px] relative">
                        <div className="absolute -left-1 right-1 top-1/2 h-1 bg-indigo-500 shadow-sm" />
                      </div>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-tighter">List Popout</span>
                  </button>
                </div>
              </section>

              {/* Device Section */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Monitor size={16} className="text-indigo-400/60" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500">Device</h3>
                </div>
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Device Model</label>
                    <select
                        value={activeScreen.deviceModel}
                        onChange={(e) => updateActiveScreen({ deviceModel: e.target.value as DeviceModel })}
                        className="w-full bg-[#141414] border border-neutral-800 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    >
                      {getDeviceOptions(activeApp.platform, activeApp.screenCategory).map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Frame Color</label>
                    <div className="flex items-center gap-2">
                      {FRAME_COLOR_PRESETS.map((preset) => (
                          <button
                              key={preset.value}
                              onClick={() => updateActiveScreen({ frameColor: preset.value })}
                              title={preset.label}
                              style={{ backgroundColor: preset.value }}
                              className={`w-8 h-8 rounded-full border border-neutral-700 shadow-sm transition-all ${frameColor === preset.value ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-black' : ''}`}
                          />
                      ))}
                      <input
                          type="color"
                          value={frameColor}
                          onChange={(e) => updateActiveScreen({ frameColor: e.target.value })}
                          className="w-8 h-8 rounded-full cursor-pointer bg-transparent border-0"
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Overlay Section */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Overlay Controls</label>
                <button
                    onClick={() => updateActiveScreen({ showDeviceOverlay: !activeScreen.showDeviceOverlay })}
                    className={`w-full p-2.5 rounded-xl border text-[11px] font-bold transition-all flex items-center justify-between ${
                        activeScreen.showDeviceOverlay ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400' : 'bg-[#141414] border-neutral-800 text-neutral-500'
                    }`}
                >
                  Show Notch & Indicator
                  <div className={`w-8 h-4 rounded-full relative transition-all ${activeScreen.showDeviceOverlay ? 'bg-indigo-500' : 'bg-neutral-800'}`}>
                    <div className={`absolute top-1 w-2 h-2 bg-white rounded-full transition-all ${activeScreen.showDeviceOverlay ? 'left-5' : 'left-1'}`} />
                  </div>
                </button>
              </div>

              {/* Style Section */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Palette size={16} className="text-indigo-400/60" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500">Background</h3>
                </div>

                <div className="flex flex-col gap-5">
                  <div className="grid grid-cols-4 gap-2">
                    {GRADIENT_PRESETS.map((grad, i) => (
                        <button
                            key={i}
                            onClick={() => updateActiveScreen({
                              gradient: grad,
                              textColor: '#ffffff'
                            })}
                            className={`aspect-square rounded-full border-2 transition-transform hover:scale-110 cursor-pointer ${activeScreen.gradient?.from === grad.from && activeScreen.gradient?.to === grad.to ? 'border-white ring-2 ring-indigo-500 ring-offset-2 ring-offset-black' : 'border-transparent'}`}
                            style={{ background: `linear-gradient(${grad.angle}deg, ${grad.from}, ${grad.to})` }}
                        />
                    ))}
                  </div>

                  {/* Custom Gradient Controls */}
                  <div className="flex flex-col gap-3 p-4 bg-[#141414] rounded-2xl border border-neutral-800">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Custom Gradient</span>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 flex flex-col gap-1.5">
                        <label className="text-[9px] font-bold text-neutral-400 uppercase">From</label>
                        <div className="flex items-center gap-2">
                          <input
                              type="color"
                              value={activeScreen.gradient?.from || '#ffffff'}
                              onChange={(e) => updateActiveScreen({
                                gradient: { ...activeScreen.gradient!, from: e.target.value }
                              })}
                              className="w-full h-8 rounded cursor-pointer bg-transparent border-0"
                          />
                        </div>
                      </div>
                      <div className="flex-1 flex flex-col gap-1.5">
                        <label className="text-[9px] font-bold text-neutral-400 uppercase">To</label>
                        <div className="flex items-center gap-2">
                          <input
                              type="color"
                              value={activeScreen.gradient?.to || '#000000'}
                              onChange={(e) => updateActiveScreen({
                                gradient: { ...activeScreen.gradient!, to: e.target.value }
                              })}
                              className="w-full h-8 rounded cursor-pointer bg-transparent border-0"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5 mt-1">
                      <div className="flex justify-between items-center">
                        <label className="text-[9px] font-bold text-neutral-400 uppercase">Angle</label>
                        <span className="text-[10px] font-mono text-indigo-400">{activeScreen.gradient?.angle || 0}°</span>
                      </div>
                      <input
                          type="range"
                          min="0"
                          max="360"
                          value={activeScreen.gradient?.angle || 0}
                          onChange={(e) => updateActiveScreen({
                            gradient: { ...activeScreen.gradient!, angle: parseInt(e.target.value) }
                          })}
                          className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              </section>
              </>
              )}

              {settingsTab === 'text' && (
              <>
              {/* Text Section */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Type size={16} className="text-indigo-400/60" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500">Text</h3>
                </div>
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-neutral-400 px-1">Headline</label>
                    <textarea
                        value={activeScreen.title}
                        onChange={(e) => updateActiveScreen({ title: e.target.value })}
                        className="w-full bg-[#141414] border border-neutral-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 min-h-[80px] resize-none font-semibold transition-all"
                        placeholder="Enter main headline..."
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-neutral-400 px-1">Description</label>
                    <textarea
                        value={activeScreen.subtitle}
                        onChange={(e) => updateActiveScreen({ subtitle: e.target.value })}
                        className="w-full bg-[#141414] border border-neutral-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 min-h-[60px] resize-none transition-all"
                        placeholder="Enter supporting text..."
                    />
                  </div>
                </div>
              </section>

              {/* Style Section */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Palette size={16} className="text-indigo-400/60" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500">Typography</h3>
                </div>

                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Text Contrast</label>
                    <div className="flex gap-2">
                      <button
                          onClick={() => updateActiveScreen({ textColor: '#ffffff' })}
                          className={`w-8 h-8 rounded-full border border-neutral-700 bg-white shadow-sm transition-all ${activeScreen.textColor === '#ffffff' ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-black' : ''}`}
                      />
                      <button
                          onClick={() => updateActiveScreen({ textColor: '#171717' })}
                          className={`w-8 h-8 rounded-full border border-neutral-700 bg-neutral-900 shadow-sm transition-all ${activeScreen.textColor === '#171717' ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-black' : ''}`}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Font</label>
                    <select
                        value={fontFamily}
                        onChange={(e) => updateActiveScreen({ fontFamily: e.target.value })}
                        className="w-full bg-[#141414] border border-neutral-800 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        style={{ fontFamily }}
                    >
                      {FONT_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value} style={{ fontFamily: opt.value }}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[9px] font-bold text-neutral-400 uppercase">Title Size</label>
                      <span className="text-[10px] font-mono text-indigo-400">{titleFontSize}px</span>
                    </div>
                    <input
                        type="range"
                        min={MIN_TITLE_FONT_SIZE}
                        max={MAX_TITLE_FONT_SIZE}
                        value={titleFontSize}
                        onChange={(e) => updateActiveScreen({ titleFontSize: parseInt(e.target.value) })}
                        className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[9px] font-bold text-neutral-400 uppercase">Subtitle Size</label>
                      <span className="text-[10px] font-mono text-indigo-400">{subtitleFontSize}px</span>
                    </div>
                    <input
                        type="range"
                        min={MIN_SUBTITLE_FONT_SIZE}
                        max={MAX_SUBTITLE_FONT_SIZE}
                        value={subtitleFontSize}
                        onChange={(e) => updateActiveScreen({ subtitleFontSize: parseInt(e.target.value) })}
                        className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>
                </div>
              </section>
              </>
              )}
            </div>

            <div className="p-6 border-t border-neutral-800">
              <button
                  onClick={handleDownload}
                  className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-900/40 flex items-center justify-center gap-2"
              >
                <Download size={18} />
                Export Image
              </button>
            </div>
          </div>
        </div>
      </div>
  );
}
