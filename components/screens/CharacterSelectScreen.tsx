
import React from 'react';
import { Character } from '../../types';
import { CHARACTERS } from '../../constants';

interface CharacterSelectScreenProps {
    maxLevelReached: number;
    onSelect: (char: Character) => void;
    onBack: () => void;
}

const CharacterSelectScreen: React.FC<CharacterSelectScreenProps> = ({ maxLevelReached, onSelect, onBack }) => {
    return (
        <div className="flex flex-col items-center justify-center h-full bg-slate-100 p-4 md:p-8 relative overflow-y-auto pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
          <div className="absolute inset-0 bg-grid-slate-200/50 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] fixed"></div>
          <button onClick={onBack} className="absolute top-4 left-4 z-30 text-slate-500 font-bold hover:text-slate-800 transition-colors bg-white/50 px-4 py-2 rounded-full">← 返回</button>
          <h2 className="text-3xl md:text-5xl font-black text-slate-800 mb-8 md:mb-12 z-10 mt-8 md:mt-0">选择你的英雄</h2>
          <div className="flex gap-4 md:gap-8 flex-wrap justify-center z-10 pb-8">
              {CHARACTERS.map(char => {
                  const isLocked = maxLevelReached < char.unlockLevel;
                  return (
                    <div key={char.id} 
                         onClick={() => {
                             if (!isLocked) {
                                 onSelect(char);
                             }
                         }} 
                         className={`
                            group relative w-60 md:w-72 p-4 md:p-8 rounded-3xl border-4 transition-all duration-300 flex flex-col items-center cursor-pointer shrink-0
                            ${isLocked 
                                ? 'border-gray-300 bg-gray-100 grayscale opacity-60' 
                                : `${char.colorTheme} border-white/50 shadow-xl hover:-translate-y-2 hover:shadow-2xl hover:border-white hover:rotate-1`
                            }
                         `}>
                        {isLocked && <div className="absolute inset-0 bg-black/10 rounded-3xl z-20 flex flex-col items-center justify-center backdrop-blur-sm"><span className="text-6xl mb-2">🔒</span><span className="font-bold bg-black/50 text-white px-3 py-1 rounded-full">Lv.{char.unlockLevel} 解锁</span></div>}
                        <div className="text-6xl md:text-8xl mb-4 md:mb-6 drop-shadow-2xl group-hover:scale-110 transition-transform duration-300">{char.emoji}</div>
                        <h3 className="text-2xl md:text-3xl font-black mb-2 text-white drop-shadow-md">{char.name}</h3>
                        <p className="text-xs md:text-sm mb-4 text-center font-bold text-white/90 leading-relaxed">{char.description}</p>
                        {!isLocked && <div className="mt-auto bg-white/20 px-4 py-1 rounded-full text-xs font-bold text-white uppercase tracking-widest">点击选择</div>}
                    </div>
                  );
              })}
          </div>
        </div>
    );
};

export default CharacterSelectScreen;
