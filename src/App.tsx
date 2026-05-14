/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toPng } from 'html-to-image';
import { 
  Smartphone, 
  Type, 
  Image as ImageIcon, 
  Palette, 
  Download, 
  Plus, 
  Trash2, 
  Layout, 
  ChevronRight,
  Monitor,
  Layers,
  Sparkles
} from 'lucide-react';

// --- Types ---

type Gradient = {
  from: string;
  to: string;
  angle: number;
};

type PreviewState = {
  id: string;
  title: string;
  subtitle: string;
  screenshot: string | null;
  popoutScreenshot: string | null;
  bgColor: string;
  gradient: Gradient | null;
  textColor: string;
  deviceModel: 'iphone-17-pro' | 'iphone-15-pro' | 'iphone-14' | 'iphone-se';
  layout: 'top-text' | 'bottom-text' | 'full-screenshot' | 'list-popout';
  showDeviceOverlay: boolean;
};

// --- Mock Templates ---

const INITIAL_SCREEN: PreviewState = {
  id: '1',
  title: 'Discover Amazing Places',
  subtitle: 'The best companion for your next journey',
  screenshot: null,
  popoutScreenshot: null,
  bgColor: '#f97316',
  gradient: { from: '#f97316', to: '#ed213a', angle: 45 },
  textColor: '#ffffff',
  deviceModel: 'iphone-17-pro',
  layout: 'top-text',
  showDeviceOverlay: true,
};

// --- Components ---

const DeviceFrame = ({ model, screenshot, showOverlay }: { model: string, screenshot: string | null, showOverlay: boolean }) => {
  const is17Pro = model === 'iphone-17-pro';
  
  return (
    <div className={`relative mx-auto w-[280px] h-[605px] bg-neutral-900 rounded-[3.2rem] shadow-2xl overflow-hidden border-neutral-800 transition-all duration-700 ${
      is17Pro ? 'border-[3px]' : 'border-8'
    }`}>
      {/* Notch / Dynamic Island */}
      {showOverlay && (
        <div className={`absolute top-4 left-1/2 -translate-x-1/2 bg-black rounded-full z-10 transition-all duration-700 ${
          is17Pro ? 'w-12 h-3.5 opacity-60 blur-[0.5px]' : 'w-24 h-6'
        }`} />
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
      
      {/* Home Indicator */}
      {showOverlay && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/30 rounded-full z-10" />
      )}
    </div>
  );
};

const MockStatusList = () => {
  const items = [
    { label: 'Will arrive at the branch 34', sub: 'Berdyoliv', time: 'May 15 | 14:34', status: 'pending' },
    { label: 'Will leave the depo', sub: 'Zhytomyr', time: 'May 15 | 07:35', status: 'pending' },
    { label: 'Will arrive at the depo', sub: 'Zhytomyr', time: 'May 14 | 15:42', status: 'pending' },
    { label: 'Will leave the terminal', sub: 'Zhytomyr', time: 'May 14 | 10:12', status: 'pending' },
    { label: 'Arrived at the terminal', sub: 'Zhytomyr', time: 'May 13 | 07:01', status: 'active' },
    { label: 'Left the terminal', sub: 'Khmelnytskyi', time: 'May 13 | 02:51', status: 'completed' },
    { label: 'Arrived at the terminal', sub: 'Khmelnytskyi', time: 'May 12 | 21:59', status: 'completed' },
    { label: 'Left the branch 34', sub: 'Khmelnytskyi', time: 'May 12 | 19:43', status: 'completed' },
  ];

  return (
    <div className="w-full bg-white flex flex-col p-6 pt-16 relative h-full">
      <div className="absolute left-8 top-16 bottom-0 w-[2.5px] bg-neutral-100" />
      <div className="flex flex-col gap-6 relative">
        {items.map((item, i) => (
          <div key={i} className={`flex items-start gap-4 relative ${item.status === 'active' ? 'opacity-10 py-6' : ''}`}>
             <div className={`w-4 h-4 rounded-full mt-1.5 z-10 border-[3px] shadow-sm ${
               item.status === 'completed' ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-neutral-200'
             }`} />
             <div className="flex-1">
               <div className="text-[12px] font-bold text-neutral-800 leading-tight">{item.label}</div>
               <div className="text-[10px] text-neutral-400 font-semibold mt-0.5">{item.sub}</div>
             </div>
             <div className="text-[10px] text-neutral-400 font-bold pt-1">{item.time}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function App() {
  const [screens, setScreens] = useState<PreviewState[]>([INITIAL_SCREEN]);
  const [activeScreenId, setActiveScreenId] = useState<string>('1');
  const previewRef = useRef<HTMLDivElement>(null);
  
  const activeScreen = screens.find(s => s.id === activeScreenId) || screens[0];

  const handleDownload = async () => {
    if (previewRef.current === null) return;
    try {
      const dataUrl = await toPng(previewRef.current, { cacheBust: true, pixelRatio: 3 });
      const link = document.createElement('a');
      link.download = `ios-preview-${activeScreen.id}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Download failed', err);
    }
  };

  const handlePopoutScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (prev) => {
        updateActiveScreen({ popoutScreenshot: prev.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const updateActiveScreen = (updates: Partial<PreviewState>) => {
    setScreens(prev => prev.map(s => s.id === activeScreenId ? { ...s, ...updates } : s));
  };

  const addScreen = () => {
    const newId = (screens.length + 1).toString();
    const newScreen = { ...activeScreen, id: newId };
    setScreens([...screens, newScreen]);
    setActiveScreenId(newId);
  };

  const removeScreen = (id: string) => {
    if (screens.length <= 1) return;
    const newScreens = screens.filter(s => s.id !== id);
    setScreens(newScreens);
    if (activeScreenId === id) setActiveScreenId(newScreens[0].id);
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

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-white font-sans overflow-hidden border-t border-neutral-800">
      {/* Background Blurs */}
      <div className="ambient-blur">
        <div className="ambient-blur-1" />
        <div className="ambient-blur-2" />
      </div>

      {/* Sidebar - Navigation */}
      <div className="w-20 border-r border-neutral-800 bg-[#0a0a0a] flex flex-col items-center py-6 gap-6 z-20">
        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-900/20">
          <Sparkles size={24} fill="currentColor" />
        </div>
        
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto px-2">
          {screens.map((screen, index) => (
            <button
              key={screen.id}
              onClick={() => setActiveScreenId(screen.id)}
              className={`w-14 h-20 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-1 group relative ${
                activeScreenId === screen.id 
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
              {screens.length > 1 && (
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
          <button className="flex items-center gap-2 bg-neutral-100 text-neutral-900 px-4 py-1.5 rounded-full text-xs font-bold hover:bg-white transition-colors shadow-lg">
            <Download size={14} />
            Export All
          </button>
        </div>

        {/* Canvas */}
        <div className="flex-1 flex items-center justify-center p-12">
          <motion.div 
            ref={previewRef}
            layoutId="preview-card"
            className="w-[428px] h-[926px] bg-white rounded-[32px] shadow-[0_40px_100px_rgba(0,0,0,0.6)] flex flex-col relative overflow-hidden"
            style={{ 
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
                  <h2 className="text-4xl font-extrabold leading-tight tracking-tight">{activeScreen.title}</h2>
                  <p className="opacity-80 text-lg leading-relaxed max-w-[80%]">{activeScreen.subtitle}</p>
                </div>
              )}

              {activeScreen.layout === 'list-popout' && (
                <div className="flex flex-col gap-8 text-center items-center mb-8">
                  <h2 className="text-4xl font-extrabold leading-tight tracking-tight px-4">{activeScreen.title}</h2>
                </div>
              )}

              <div className={`flex-1 flex items-center justify-center transition-all duration-500 relative ${activeScreen.layout === 'bottom-text' ? 'mb-12' : ''}`}>
                {activeScreen.layout === 'list-popout' ? (
                  <div className="relative">
                    <div className={`relative mx-auto w-[280px] h-[580px] bg-white rounded-[3.2rem] shadow-2xl overflow-hidden border-[3px] border-neutral-800/10`}>
                      <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-full z-20" />
                      {activeScreen.screenshot ? (
                        <img src={activeScreen.screenshot} className="w-full h-full object-cover object-top" />
                      ) : (
                        <MockStatusList />
                      )}
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-black/10 rounded-full" />
                    </div>
                    
                    {/* The Popout Item */}
                    <div className="absolute left-1/2 -translate-x-1/2 top-[35%] w-[340px] bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] p-5 flex items-center gap-4 z-30 border border-neutral-100 ring-4 ring-neutral-900/5 overflow-hidden min-h-[90px]">
                      {activeScreen.popoutScreenshot ? (
                        <img src={activeScreen.popoutScreenshot} className="absolute inset-0 w-full h-full object-cover" />
                      ) : (
                        <>
                          <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                            <motion.div
                              animate={{ scale: [1, 1.1, 1] }}
                              transition={{ repeat: Infinity, duration: 2 }}
                            >
                              <Sparkles size={24} fill="currentColor" />
                            </motion.div>
                          </div>
                          <div className="flex-1">
                            <div className="text-base font-bold text-neutral-900 leading-tight">Arrived at the terminal</div>
                            <div className="text-xs text-neutral-500 font-semibold mt-0.5">Zhytomyr</div>
                          </div>
                          <div className="text-xs text-neutral-400 font-bold whitespace-nowrap">May 13 | 07:01</div>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <DeviceFrame 
                    model={activeScreen.deviceModel} 
                    screenshot={activeScreen.screenshot} 
                    showOverlay={activeScreen.showDeviceOverlay}
                  />
                )}
              </div>

              {activeScreen.layout === 'bottom-text' && (
                <div className="flex flex-col gap-4 text-center items-center mt-8">
                  <h2 className="text-4xl font-extrabold leading-tight tracking-tight">{activeScreen.title}</h2>
                  <p className="opacity-80 text-lg leading-relaxed max-w-[80%]">{activeScreen.subtitle}</p>
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

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8">
          {/* Content Section */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Type size={16} className="text-indigo-400/60" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500">Typography</h3>
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
                  <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Popout Screenshot (Optional)</label>
                  <div 
                    onClick={() => document.getElementById('popout-upload')?.click()}
                    className="w-full h-16 bg-[#141414] border-2 border-dashed border-neutral-800 rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-[#1a1a1a] hover:border-neutral-700 transition-all group"
                  >
                    {activeScreen.popoutScreenshot ? (
                      <div className="relative w-full h-full overflow-hidden rounded-lg">
                        <img src={activeScreen.popoutScreenshot} className="w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="bg-white text-black px-2 py-1 rounded-full text-[9px] font-bold shadow-sm">Replace Popout</span>
                        </div>
                      </div>
                    ) : (
                      <>
                        <ImageIcon className="text-neutral-700" size={20} />
                        <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider text-center px-2 leading-none">Upload Popout Graphics</span>
                      </>
                    )}
                    <input 
                      type="file" 
                      id="popout-upload" 
                      className="hidden" 
                      accept="image/*"
                      onChange={handlePopoutScreenshotUpload}
                    />
                  </div>
                  {activeScreen.popoutScreenshot && (
                    <button 
                      onClick={() => updateActiveScreen({ popoutScreenshot: null })}
                      className="text-[9px] font-bold text-red-500/60 uppercase self-end hover:text-red-500 transition-colors"
                    >
                      Clear Popout Image
                    </button>
                  )}
                </div>
              )}

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
            </div>
          </section>

          {/* Style Section */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Palette size={16} className="text-indigo-400/60" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500">Appearance</h3>
            </div>
            
            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-4 gap-2">
                {[
                  { from: '#6366f1', to: '#a855f7', angle: 45 },
                  { from: '#7928CA', to: '#FF0080', angle: 45 },
                  { from: '#0a0a0a', to: '#262626', angle: 45 },
                  { from: '#11998e', to: '#38ef7d', angle: 45 },
                  { from: '#232526', to: '#414345', angle: 45 },
                  { from: '#8e2de2', to: '#4a00e0', angle: 45 },
                  { from: '#ff9966', to: '#ff5e62', angle: 45 },
                  { from: '#02aab0', to: '#00cdac', angle: 45 },
                ].map((grad, i) => (
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
            </div>
          </section>
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
  );
}
