
import React from 'react';

interface StartScreenProps {
    onStart: () => void;
    onOpenSettings: () => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onStart, onOpenSettings }) => {
    return (
        <div className="flex flex-col items-center justify-center h-full bg-amber-50 relative overflow-hidden p-4 text-center pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col items-center">
            <button 
                onClick={onOpenSettings}
                className="absolute -top-16 -right-4 md:-top-20 md:-right-12 p-3 bg-white/50 hover:bg-white rounded-full backdrop-blur-sm transition-all duration-300 hover:shadow-md hover:rotate-45 group"
            >
                <span className="text-2xl md:text-3xl opacity-70 group-hover:opacity-100">⚙️</span>
            </button>
    
            <h1 className="text-5xl md:text-7xl font-black text-rose-500 mb-4 md:mb-8 animate-pop drop-shadow-lg tracking-tighter">表情包大乱斗</h1>
            <div className="text-7xl md:text-9xl mb-8 md:mb-12 animate-float drop-shadow-2xl">🏰</div>
            <button onClick={onStart} className="group relative px-12 py-4 md:px-16 md:py-6 bg-rose-500 text-white text-xl md:text-3xl font-black rounded-full shadow-[0_6px_0_rgb(190,18,60)] md:shadow-[0_10px_0_rgb(190,18,60)] hover:shadow-[0_4px_0_rgb(190,18,60)] hover:translate-y-1 active:shadow-none active:translate-y-3 transition-all">
                <span className="relative z-10">开始冒险</span>
                <div className="absolute inset-0 rounded-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </button>
          </div>
        </div>
    );
};

export default StartScreen;
