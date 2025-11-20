
import React from 'react';

interface SettingsModalProps {
    onClose: () => void;
    onReset: () => void;
    isOpen: boolean;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, onReset, isOpen }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-sm md:max-w-md shadow-2xl transform scale-100 animate-pop relative" onClick={e => e.stopPropagation()}>
                <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
                >
                    ✕
                </button>
                
                <h2 className="text-2xl md:text-3xl font-black text-slate-800 mb-8 text-center">游戏设置</h2>
                
                <div className="space-y-6">
                    {/* Volume */}
                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="font-bold text-slate-700">主音量</label>
                            <span className="font-bold text-slate-400 text-sm">50%</span>
                        </div>
                        <input type="range" min="0" max="100" defaultValue="50" className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-rose-500" />
                    </div>

                    {/* Toggles */}
                    <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-700">音效</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" defaultChecked className="sr-only peer" />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
                        </label>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-700">震动反馈</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" defaultChecked className="sr-only peer" />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
                        </label>
                    </div>
                </div>

                <hr className="border-slate-100 my-6" />

                <button 
                    onClick={onReset}
                    className="w-full py-3 rounded-xl border-2 border-red-100 text-red-500 font-bold hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                >
                    <span>🗑️</span> 重置进度
                </button>

                <div className="mt-6 text-center">
                    <span className="px-3 py-1 bg-slate-100 rounded-full text-[10px] md:text-xs font-bold text-slate-400 tracking-widest">
                        v1.1.0
                    </span>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
