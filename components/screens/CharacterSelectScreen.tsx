
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
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100">
          <div className="absolute inset-0 bg-grid-slate-200/50 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]"></div>
          
          <button onClick={onBack} className="absolute top-8 left-8 z-30 text-slate-500 font-bold hover:text-slate-800 transition-colors bg-white/80 px-6 py-3 rounded-full text-xl shadow-sm">← 返回</button>
          
          <h2 className="text-6xl font-black text-slate-800 mb-16 z-10 text-stroke-sm">选择你的英雄</h2>
          
          <div className="flex gap-12 justify-center z-10 items-stretch">
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
                            group relative w-80 p-8 rounded-[2.5rem] border-8 transition-all duration-300 flex flex-col items-center cursor-pointer
                            ${isLocked 
                                ? 'border-gray-300 bg-gray-100 grayscale opacity-60' 
                                : `${char.colorTheme} border-white/50 shadow-2xl hover:-translate-y-4 hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)] hover:border-white hover:rotate-1`
                            }
                         `}>
                        {isLocked && <div className="absolute inset-0 bg-black/10 rounded-[2rem] z-20 flex flex-col items-center justify-center backdrop-blur-sm"><span className="text-8xl mb-4">🔒</span><span className="font-bold bg-black/50 text-white px-4 py-2 rounded-full text-xl">Lv.{char.unlockLevel} 解锁</span></div>}
                        
                        <div className="text-9xl mb-8 drop-shadow-2xl group-hover:scale-110 transition-transform duration-300">{char.emoji}</div>
                        <h3 className="text-4xl font-black mb-4 text-white drop-shadow-md">{char.name}</h3>
                        <p className="text-lg mb-8 text-center font-bold text-white/90 leading-relaxed">{char.description}</p>
                        
                        {!isLocked && <div className="mt-auto bg-white/20 px-6 py-2 rounded-full text-sm font-bold text-white uppercase tracking-widest group-hover:bg-white group-hover:text-slate-900 transition-colors">点击选择</div>}
                    </div>
                  );
              })}
          </div>
        </div>
    );
};

export default CharacterSelectScreen;
