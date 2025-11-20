
import React from 'react';

interface StartScreenProps {
    onStart: () => void;
    onOpenSettings: () => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onStart, onOpenSettings }) => {
    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-amber-50">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 pointer-events-none"></div>
          
          <button 
            onClick={onOpenSettings}
            className="absolute top-8 right-8 p-4 bg-white/50 hover:bg-white rounded-full backdrop-blur-sm transition-all duration-300 hover:shadow-md hover:rotate-45 group z-20"
          >
            <span className="text-4xl opacity-70 group-hover:opacity-100">⚙️</span>
          </button>

          <div className="relative z-10 flex flex-col items-center scale-125">
            <h1 className="text-8xl font-black text-rose-500 mb-10 animate-pop drop-shadow-lg tracking-tighter text-stroke">表情包大乱斗</h1>
            <div className="text-[12rem] mb-16 animate-float drop-shadow-2xl">🏰</div>
            <button onClick={onStart} className="group relative px-20 py-8 bg-rose-500 text-white text-4xl font-black rounded-full shadow-[0_12px_0_rgb(190,18,60)] hover:shadow-[0_6px_0_rgb(190,18,60)] hover:translate-y-2 active:shadow-none active:translate-y-4 transition-all">
                <span className="relative z-10">开始冒险</span>
                <div className="absolute inset-0 rounded-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </button>
          </div>
          
          <div className="absolute bottom-4 text-slate-400 font-bold text-lg">Rogue Emoji v1.2</div>
        </div>
    );
};

export default StartScreen;
