
import React, { useState, useEffect } from 'react';
import { Enemy, IntentType, Status, StatusType } from '../types';

interface EnemyProps {
  enemy: Enemy;
  isShake: boolean;
  isSelected?: boolean; // 是否处于“选中目标”模式下的高亮
  isTargetable?: boolean; // 是否可以被选中
  onClick?: (id: string) => void;
}

const EnemyComponent: React.FC<EnemyProps> = ({ enemy, isShake, isSelected, isTargetable, onClick }) => {
  
  const isDead = enemy.currentHp <= 0;
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
      if (isDead) {
          // Wait for death pop animation (approx 0.6s) then collapse layout
          const timer = setTimeout(() => setIsCollapsed(true), 600);
          return () => clearTimeout(timer);
      } else {
          setIsCollapsed(false);
      }
  }, [isDead]);

  const getIntentIcon = () => {
    switch (enemy.intent) {
      case IntentType.ATTACK: return '⚔️';
      case IntentType.DEFEND: return '🛡️';
      case IntentType.BUFF: return '💪';
      case IntentType.SUMMON: return '📣';
      case IntentType.SPECIAL: return '⚠️';
    }
  };

  const getIntentColor = () => {
    switch (enemy.intent) {
      case IntentType.ATTACK: return 'text-rose-600';
      case IntentType.DEFEND: return 'text-sky-600';
      case IntentType.BUFF: return 'text-emerald-600';
      case IntentType.SUMMON: return 'text-purple-600';
      case IntentType.SPECIAL: return 'text-yellow-600';
    }
  };

  const getStatusIcon = (type: StatusType) => {
      switch(type) {
          case StatusType.VULNERABLE: return '💔';
          case StatusType.WEAK: return '🥀';
          case StatusType.STRENGTH: return '💪';
          default: return '✨';
      }
  };

  return (
    <div 
        data-enemy-id={enemy.id} // 关键：用于拖拽释放时的检测
        className={`
            relative flex flex-col items-center transition-all duration-500 ease-in-out select-none
            ${(isTargetable && !isDead) ? 'cursor-pointer' : ''}
            ${isSelected ? 'scale-105 z-10' : ''}
            ${isDead ? 'pointer-events-none' : ''}
            ${isCollapsed ? 'w-0 -ml-4 md:-ml-8 opacity-0' : 'w-24 md:w-32 opacity-100'}
        `}
        onClick={() => isTargetable && !isDead && onClick && onClick(enemy.id)}
    >
      {/* Soul Effect (Only when dead) - Absolute positioned, so it escapes the width collapse visually if overflow is visible */}
      {isDead && (
          <div className="absolute top-1/2 left-1/2 text-6xl z-50 animate-soul-rise">👻</div>
      )}

      {/* Main Body Wrapper */}
      <div className={`flex flex-col items-center w-full ${isDead ? 'animate-death-pop' : ''}`}>
        
          {/* Target Selection Highlight */}
          {(isTargetable && !isDead) && (
              <div className="absolute -inset-4 bg-red-500/5 rounded-[40%] animate-pulse pointer-events-none border-2 border-red-400/50 border-dashed scale-110 z-0"></div>
          )}

          {/* Intent Bubble */}
          <div className="mb-2 md:mb-3 bg-white/90 backdrop-blur-sm border-2 border-slate-100 px-2 py-1 md:px-3 md:py-1.5 rounded-2xl shadow-lg flex items-center gap-2 animate-float z-20 min-w-[50px] md:min-w-[60px] justify-center pointer-events-none">
            <span className={`text-lg md:text-xl leading-none ${getIntentColor()}`}>{getIntentIcon()}</span>
            {enemy.intentValue > 0 && (
                <span className={`font-black text-base md:text-lg leading-none ${getIntentColor()}`}>{enemy.intentValue}</span>
            )}
          </div>

          {/* Enemy Body Container */}
          <div className={`relative flex flex-col items-center group`}>
              {/* Block Shield */}
              {enemy.block > 0 && (
                  <div className="absolute -top-2 -right-2 z-30 bg-blue-500 text-white text-[10px] md:text-xs font-black px-2 py-1 rounded-lg shadow-md border border-white flex items-center gap-1 animate-pop">
                      🛡️ {enemy.block}
                  </div>
              )}

              {/* Emoji Avatar */}
              <div className={`
                flex items-center justify-center text-7xl md:text-8xl 
                filter drop-shadow-xl transition-transform duration-100 relative z-10
                ${isShake ? 'animate-shake' : 'animate-float'}
                ${enemy.isBoss ? 'text-[8rem] md:text-[10rem]' : ''} 
                ${(isTargetable && !isDead) ? 'group-hover:scale-110 transition-transform' : ''}
              `}>
                {enemy.emoji}
              </div>
              
              {/* Ground Shadow */}
              <div className="w-16 md:w-20 h-4 md:h-5 bg-black/20 rounded-[50%] blur-md animate-shadow -mt-3 md:-mt-4 z-0"></div>
          </div>

          {/* Status Bar */}
          <div className="flex gap-1 h-5 md:h-6 mt-2 mb-1 pointer-events-none min-h-[20px]">
              {enemy.statuses.map((status, idx) => (
                  <div key={idx} className="bg-slate-800/80 backdrop-blur text-white rounded-md px-1 py-0.5 text-[8px] md:text-[10px] flex items-center shadow-sm animate-pop" title={status.type}>
                      <span>{getStatusIcon(status.type)}</span>
                      <span className="font-bold ml-1">{status.value}</span>
                  </div>
              ))}
          </div>

          {/* Health Bar */}
          <div className="w-20 md:w-28 relative pointer-events-none group">
            <div className="h-3 md:h-4 w-full bg-slate-200 rounded-full overflow-hidden shadow-inner border-2 border-white ring-1 ring-black/10">
              <div 
                className="h-full bg-rose-500 transition-all duration-500 ease-out relative"
                style={{ width: `${Math.max(0, (enemy.currentHp / enemy.maxHp) * 100)}%` }}
              >
                  <div className="absolute inset-0 bg-white/20 w-full h-1/2 top-0"></div>
              </div>
            </div>
            {/* HP Text Overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[8px] md:text-[9px] font-black text-white drop-shadow-md tracking-wider">{enemy.currentHp}/{enemy.maxHp}</span>
            </div>
          </div>
          
          <p className="mt-1 text-slate-500 font-bold text-[10px] md:text-xs text-center max-w-[100px] md:max-w-[120px] truncate pointer-events-none opacity-70">{enemy.name}</p>
      </div>
    </div>
  );
};

export default EnemyComponent;
