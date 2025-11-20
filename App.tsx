
import React, { useState, useEffect, useRef } from 'react';
import { 
  Card, Character, GamePhase, TargetType, SkillType, CardTheme, Skill
} from './types';
import { CHARACTERS, generateId } from './constants';
import { CARD_DATABASE } from './data/cards'; // Import Database
import CardComponent from './components/CardComponent';
import EnemyComponent from './components/EnemyComponent';
import VFXLayer from './components/VFXLayer';
import { useGame } from './hooks/useGame';

interface DragState {
    isDragging: boolean;
    itemId: string | null; 
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    dragType: 'CARD' | 'SKILL';
    needsTarget: boolean;
    groupTag?: string;
    theme?: CardTheme;
    sourceItem?: Card | Skill;
}

// Hook to check orientation
const useOrientation = () => {
    const [isPortrait, setIsPortrait] = useState(window.innerHeight > window.innerWidth);
    useEffect(() => {
        const check = () => setIsPortrait(window.innerHeight > window.innerWidth);
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);
    return isPortrait;
};

const App: React.FC = () => {
  const game = useGame();
  const isPortrait = useOrientation();
  
  // --- Refs for avoiding stale closures in event listeners ---
  const gameRef = useRef(game);
  const dragStateRef = useRef<DragState>({
      isDragging: false, itemId: null, startX: 0, startY: 0, currentX: 0, currentY: 0, dragType: 'CARD', needsTarget: false
  });

  // Always keep refs updated with latest state
  useEffect(() => { gameRef.current = game; }, [game]);

  const [maxLevelReached, setMaxLevelReached] = useState(1);
  
  // UI 状态 (Synced with ref for rendering)
  const [dragState, setDragState] = useState<DragState>(dragStateRef.current);
  
  // Helper to sync both state and ref
  const updateDragState = (newState: DragState) => {
      dragStateRef.current = newState;
      setDragState(newState);
  };

  // --- 持久化 ---
  useEffect(() => {
      const savedMax = localStorage.getItem('rogue_emoji_max_level');
      if (savedMax) setMaxLevelReached(parseInt(savedMax));
  }, []);

  useEffect(() => {
      if (game.level > maxLevelReached) {
          setMaxLevelReached(game.level);
          localStorage.setItem('rogue_emoji_max_level', game.level.toString());
      }
  }, [game.level, maxLevelReached]);

  // --- 输入事件 ---
  
  // 统一获取坐标的辅助函数
  const getEventXY = (e: MouseEvent | TouchEvent) => {
      if ('touches' in e) {
          return { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
      return { x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY };
  };

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
        const ds = dragStateRef.current;
        if (ds.isDragging) {
            // Prevent scrolling while dragging
            if (e.cancelable) e.preventDefault();
            
            const { x, y } = getEventXY(e);
            updateDragState({ ...ds, currentX: x, currentY: y });
        }
    };

    const handleEnd = (e: MouseEvent | TouchEvent) => {
        const ds = dragStateRef.current;
        if (ds.isDragging) {
            handleDrop(e);
        }
    };

    const handleDrop = (e: MouseEvent | TouchEvent) => {
        const ds = dragStateRef.current;
        const currentGame = gameRef.current;

        // 获取最终松手时的坐标 (TouchEnd 没有 touches，只有 changedTouches)
        let clientX = ds.currentX;
        let clientY = ds.currentY;
        
        if ('changedTouches' in e) {
            // 如果是触摸结束，尽量使用 changedTouches
            if (e.changedTouches.length > 0) {
                clientX = e.changedTouches[0].clientX;
                clientY = e.changedTouches[0].clientY;
            }
        } else {
            clientX = (e as MouseEvent).clientX;
            clientY = (e as MouseEvent).clientY;
        }

        const { needsTarget, itemId, dragType, groupTag } = ds;
        const elements = document.elementsFromPoint(clientX, clientY);
        const enemyElement = elements.find(el => el.hasAttribute('data-enemy-id'));
        const targetId = enemyElement?.getAttribute('data-enemy-id');

        if (needsTarget) {
            if (targetId && itemId) {
                if (dragType === 'CARD') {
                    if (groupTag) {
                        const stack = currentGame.hand.filter(c => c.groupTag === groupTag || c.id === itemId);
                        currentGame.playCardBatch(stack, targetId, ds.startX, ds.startY);
                    } else {
                        const card = currentGame.hand.find(c => c.id === itemId);
                        if (card) currentGame.playCard(card, targetId, ds.startX, ds.startY);
                    }
                } else {
                    currentGame.useSkill(itemId, targetId, ds.startX, ds.startY);
                }
            }
        } else {
            // 调整判定区域，手机上可能不一样，这里简单设为屏幕高度的 60%
            if (clientY < window.innerHeight * 0.6 && itemId) {
                 if (dragType === 'CARD') {
                     const card = currentGame.hand.find(c => c.id === itemId);
                     if (card) currentGame.playCard(card, undefined, ds.startX, ds.startY);
                 } else {
                     currentGame.useSkill(itemId, undefined, ds.startX, ds.startY);
                 }
            }
        }
        updateDragState({ isDragging: false, itemId: null, startX: 0, startY: 0, currentX: 0, currentY: 0, dragType: 'CARD', needsTarget: false });
    };

    window.addEventListener('mousemove', handleMove, { passive: false });
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove, { passive: false }); // passive: false required to preventDefault
    window.addEventListener('touchend', handleEnd);
    window.addEventListener('touchcancel', handleEnd);

    return () => {
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleEnd);
        window.removeEventListener('touchmove', handleMove);
        window.removeEventListener('touchend', handleEnd);
        window.removeEventListener('touchcancel', handleEnd);
    };
  }, []);

  const startDragCard = (e: React.MouseEvent | React.TouchEvent, card: Card) => {
      if (game.phase !== 'PLAYER_TURN' || game.player.currentEnergy < card.cost) return;
      
      // Prevent default touch actions (scroll)
      // if ('touches' in e && e.cancelable) e.preventDefault(); 

      const { x, y } = getEventXY(e as any);
      const needsTarget = card.effects.some(ef => ef.target === TargetType.SINGLE_ENEMY);
      
      updateDragState({
          isDragging: true, itemId: card.id,
          startX: x, startY: y, currentX: x, currentY: y,
          dragType: 'CARD', needsTarget, groupTag: card.groupTag, theme: card.theme,
          sourceItem: card
      });
  };

  const startDragSkill = (e: React.MouseEvent | React.TouchEvent, skill: Skill) => {
      if (game.phase !== 'PLAYER_TURN' || 
          (skill.cost && game.player.currentEnergy < skill.cost) || 
          (skill.currentCooldown || 0) > 0) return;

      const { x, y } = getEventXY(e as any);
      const needsTarget = skill.effects?.some(ef => ef.target === TargetType.SINGLE_ENEMY) || false;
      
      updateDragState({
          isDragging: true, itemId: skill.id,
          startX: x, startY: y, currentX: x, currentY: y,
          dragType: 'SKILL', needsTarget, theme: CardTheme.HOLY,
          sourceItem: skill
      });
  };

  // --- 渲染辅助 ---
  const renderArrow = () => {
      if (!dragState.isDragging || !dragState.needsTarget) return null;
      const { startX, startY, currentX, currentY } = dragState;
      const controlX = startX; const controlY = currentY;
      const path = `M ${startX} ${startY} Q ${controlX} ${controlY} ${currentX} ${currentY}`;
      const angle = Math.atan2(currentY - controlY, currentX - controlX) * 180 / Math.PI;
      let color = "rgb(244, 63, 94)";
      if (dragState.theme === CardTheme.ICE) color = "rgb(103, 232, 249)";
      if (dragState.theme === CardTheme.POISON) color = "rgb(168, 85, 247)";

      return (
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-50 overflow-visible">
              <defs>
                  <filter id="glow">
                      <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                      <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                  </filter>
              </defs>
              <path d={path} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" strokeDasharray="12,12" className="animate-[dash_0.8s_linear_infinite]" filter="url(#glow)" />
              <polygon points="0,0 24,9 0,18" fill={color} transform={`translate(${currentX}, ${currentY}) rotate(${angle}) translate(-20, -9)`} filter="url(#glow)" />
          </svg>
      );
  };

  const renderGhost = () => {
      if (!dragState.isDragging || dragState.needsTarget) return null;
      return (
          <div className="fixed pointer-events-none z-50 opacity-60 transform -translate-x-1/2 -translate-y-1/2 scale-125" style={{ left: dragState.currentX, top: dragState.currentY }}>
              <div className="text-7xl filter drop-shadow-2xl animate-pulse">{dragState.sourceItem?.emoji || '🃏'}</div>
          </div>
      );
  };

  // --- 屏幕渲染 ---

  const renderStart = () => (
    <div className="flex flex-col items-center justify-center h-screen bg-amber-50 relative overflow-hidden p-4 text-center">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
      <h1 className="text-5xl md:text-7xl font-black text-rose-500 mb-4 md:mb-8 animate-pop drop-shadow-lg tracking-tighter">表情包大乱斗</h1>
      <div className="text-7xl md:text-9xl mb-8 md:mb-12 animate-float drop-shadow-2xl">🏰</div>
      <button onClick={() => game.setPhase('CHARACTER_SELECT')} className="group relative px-12 py-4 md:px-16 md:py-6 bg-rose-500 text-white text-xl md:text-3xl font-black rounded-full shadow-[0_6px_0_rgb(190,18,60)] md:shadow-[0_10px_0_rgb(190,18,60)] hover:shadow-[0_4px_0_rgb(190,18,60)] hover:translate-y-1 active:shadow-none active:translate-y-3 transition-all">
        <span className="relative z-10">开始冒险</span>
        <div className="absolute inset-0 rounded-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      </button>
    </div>
  );

  const renderLoading = () => (
    <div className="flex flex-col items-center justify-center h-screen bg-amber-50">
      <div className="text-9xl mb-8 animate-spin filter drop-shadow-xl">⏳</div>
      <h2 className="text-3xl md:text-4xl font-black text-slate-700 animate-pulse">生成地下城...</h2>
    </div>
  );

  const renderCharSelect = () => (
    <div className="flex flex-col items-center justify-center h-screen bg-slate-100 p-4 md:p-8 relative overflow-y-auto">
      <div className="absolute inset-0 bg-grid-slate-200/50 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] fixed"></div>
      <h2 className="text-3xl md:text-5xl font-black text-slate-800 mb-8 md:mb-12 z-10 mt-8 md:mt-0">选择你的英雄</h2>
      <div className="flex gap-4 md:gap-8 flex-wrap justify-center z-10 pb-8">
          {CHARACTERS.map(char => {
              const isLocked = maxLevelReached < char.unlockLevel;
              return (
                <div key={char.id} 
                     onClick={() => {
                         if (!isLocked) {
                             const starter = char.startingDeck.map(id => ({ 
                                 ...CARD_DATABASE[id], 
                                 id: generateId(),
                                 templateId: id 
                             }));
                             
                             game.setDeck(starter);
                             game.setPlayer(p => ({ 
                                 ...p, 
                                 maxHp: char.maxHp, 
                                 currentHp: char.maxHp, 
                                 maxEnergy: char.maxEnergy, 
                                 currentEnergy: char.maxEnergy, 
                                 skills: [char.initialSkill],
                                 baseDrawCount: char.baseDrawCount,
                                 fixedStartingHand: char.fixedStartingHand || [],
                                 emoji: char.emoji
                             }));
                             game.setLevel(1);
                             game.startLevel(1, starter);
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

  const renderReward = () => (
    <div className="absolute inset-0 z-50 bg-slate-900/90 flex flex-col items-center justify-center animate-pop backdrop-blur-sm p-4">
      <div className="absolute top-8 md:top-20 text-4xl md:text-6xl animate-bounce">🎁</div>
      <h2 className="text-3xl md:text-5xl text-white font-black mb-8 md:mb-12 text-stroke-sm">战斗胜利！选择奖励</h2>
      <div className="flex gap-4 md:gap-8 flex-wrap justify-center mb-8 md:mb-12">
        {game.rewards.cards.map((card, idx) => (
          <div key={idx} className="transform hover:scale-110 transition-transform duration-300">
             <CardComponent card={card} playable={true} onClick={() => {
                  const newDeck = [...game.deck, card];
                  game.setDeck(newDeck);
                  game.setLevel(l => l + 1);
                  game.setPlayer(p => ({...p, currentHp: Math.min(p.maxHp, p.currentHp + 10)}));
                  game.startLevel(game.level + 1, newDeck);
                }} 
             />
          </div>
        ))}
      </div>
      {game.rewards.skill && (
          <div className="mb-8 md:mb-12 bg-gradient-to-br from-amber-100 to-amber-200 p-4 md:p-6 rounded-2xl cursor-pointer hover:scale-105 transition-transform shadow-lg border-4 border-amber-300 relative overflow-hidden group" onClick={() => {
              game.setPlayer(p => ({...p, skills: [...p.skills, game.rewards.skill]}));
              game.setLevel(l => l + 1);
              game.setPlayer(p => ({...p, currentHp: Math.min(p.maxHp, p.currentHp + 10)}));
              game.startLevel(game.level + 1, game.deck);
          }}>
              <div className="absolute inset-0 bg-white/40 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="font-black text-amber-600 text-center mb-2 tracking-widest uppercase text-xs">稀有技能</div>
              <div className="flex items-center gap-4">
                  <div className="text-4xl md:text-5xl filter drop-shadow-md">{game.rewards.skill.emoji}</div>
                  <div>
                      <div className="font-black text-lg md:text-xl text-slate-800">{game.rewards.skill.name}</div>
                      <div className="text-xs text-slate-600 font-bold">{game.rewards.skill.description}</div>
                  </div>
              </div>
          </div>
      )}
      <button onClick={() => { game.setLevel(l => l + 1); game.setPlayer(p => ({...p, currentHp: Math.min(p.maxHp, p.currentHp + 15)})); game.startLevel(game.level + 1, game.deck); }} className="text-slate-400 hover:text-white font-bold underline decoration-2 underline-offset-4 transition-colors text-sm md:text-base">跳过奖励 (恢复15点生命)</button>
    </div>
  );

  const renderGame = () => (
    <div className="relative w-full h-screen bg-amber-50 overflow-hidden flex flex-col select-none font-sans touch-none">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')] opacity-40 pointer-events-none"></div>
      <VFXLayer events={game.vfxEvents} />
      {game.phase === 'REWARD' && renderReward()}
      {game.phase === 'GAME_OVER' && (
        <div className="absolute inset-0 z-50 bg-slate-900/95 flex flex-col items-center justify-center animate-pop p-8 text-center">
          <div className="text-8xl md:text-9xl mb-6">💀</div>
          <h2 className="text-5xl md:text-7xl text-white font-black mb-8">你挂了</h2>
          <p className="text-gray-400 mb-12 font-bold text-xl">你到达了第 {game.level} 层</p>
          <button onClick={() => game.setPhase('START_SCREEN')} className="px-10 py-5 bg-white text-slate-900 text-2xl font-bold rounded-full shadow-lg hover:scale-105 transition-transform">返回主菜单</button>
        </div>
      )}

      {renderArrow()}
      {renderGhost()}

      {/* --- Top Floating HUD --- */}
      <div className="absolute top-2 md:top-6 left-0 right-0 flex justify-center z-20 pointer-events-none">
          <div className="bg-white/90 backdrop-blur-md px-4 py-2 md:px-8 md:py-3 rounded-full shadow-lg border-b-4 border-slate-200 flex items-center gap-4 md:gap-12 pointer-events-auto transition-all origin-top scale-90 md:scale-100">
              {/* Level */}
              <div className="flex flex-col items-center">
                  <span className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Level</span>
                  <span className="text-xl md:text-2xl font-black text-slate-700 leading-none">{game.level}</span>
              </div>
              
              {/* Player Health */}
              <div className="flex items-center gap-2 md:gap-3">
                  <div className="text-rose-500 text-xl md:text-2xl animate-pulse">❤️</div>
                  <div className="flex flex-col w-24 md:w-32">
                      <div className="flex justify-between text-[10px] md:text-xs font-bold text-slate-600 mb-1">
                          <span>HP</span>
                          <span>{game.player.currentHp}/{game.player.maxHp}</span>
                      </div>
                      <div className="h-2 md:h-3 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                          <div className="h-full bg-rose-500 transition-all duration-300" style={{width: `${(game.player.currentHp / game.player.maxHp) * 100}%`}}></div>
                      </div>
                  </div>
              </div>

              {/* Energy */}
              <div className="flex items-center gap-2 md:gap-3">
                  <div className="flex flex-col items-end mr-1">
                      <span className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Energy</span>
                      <span className="text-lg md:text-xl font-black text-amber-500 leading-none">{game.player.currentEnergy}/{game.player.maxEnergy}</span>
                  </div>
                  <div className="flex gap-1">
                      {[...Array(game.player.maxEnergy)].map((_, i) => (
                          <div key={i} className={`w-3 h-3 md:w-4 md:h-4 rounded-full border-2 border-amber-300 transition-all duration-300 ${i < game.player.currentEnergy ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)] scale-110' : 'bg-transparent scale-90'}`}></div>
                      ))}
                  </div>
              </div>
          </div>
      </div>

      {/* --- Main Battlefield Stage --- */}
      <div className="flex-1 relative flex items-center justify-center w-full max-w-6xl mx-auto pb-24 md:pb-32 px-4 md:px-8 z-10">
         
         {/* Floating Text Layer */}
         <div className="absolute inset-0 pointer-events-none">
            {game.floatingTexts.map(ft => (<div key={ft.id} className={`absolute z-50 animate-damage ${ft.color} font-black text-stroke text-2xl md:text-3xl`} style={{ left: `${ft.x}%`, top: `${ft.y}%` }}>{ft.text}</div>))}
         </div>

         {/* Left: Player Area */}
         <div className={`relative flex flex-col items-center justify-end mr-auto transition-transform duration-100 ${game.shakingTargets.includes('PLAYER') ? 'animate-shake' : ''}`}>
             {/* Block Shield */}
             {game.player.block > 0 && (
                 <div className="absolute -top-4 md:-top-6 -right-2 md:-right-4 z-20 bg-blue-500 text-white w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full font-black shadow-lg border-2 border-white animate-pop text-sm md:text-base">
                     🛡️{game.player.block}
                 </div>
             )}
             
             {/* Player Avatar */}
             <div className="text-7xl md:text-9xl filter drop-shadow-2xl mb-2 md:mb-4 relative z-10 animate-float-slow">
                 {game.player.emoji}
             </div>
             {/* Shadow */}
             <div className="w-16 md:w-24 h-4 md:h-6 bg-black/20 rounded-[50%] blur-md animate-shadow"></div>

             {/* Skills/Runes Container */}
             <div className="mt-4 md:mt-6 flex gap-2 md:gap-3 p-1.5 md:p-2 bg-white/50 backdrop-blur-sm rounded-xl md:rounded-2xl border-2 border-white/50 shadow-sm">
                 {game.player.skills.map(skill => (
                    <button 
                        key={skill.id}
                        onMouseDown={(e) => startDragSkill(e, skill)}
                        onTouchStart={(e) => startDragSkill(e, skill)}
                        disabled={game.phase !== 'PLAYER_TURN' || (skill.currentCooldown || 0) > 0}
                        className={`relative w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl shadow-sm flex items-center justify-center text-lg md:text-xl border-2 border-white transition-all hover:scale-110 hover:shadow-md
                        ${skill.type === SkillType.PASSIVE ? 'bg-purple-500' : (skill.currentCooldown || 0) > 0 ? 'bg-slate-400' : 'bg-amber-400'}`}
                        title={skill.description}
                    >
                        {skill.emoji}
                        {(skill.currentCooldown || 0) > 0 && <div className="absolute inset-0 bg-slate-800/60 rounded-lg md:rounded-xl flex items-center justify-center text-white font-bold text-[10px] md:text-xs">{skill.currentCooldown}</div>}
                    </button>
                 ))}
             </div>
         </div>

         {/* Right: Enemy Area */}
         <div className="flex gap-4 md:gap-8 items-end justify-end ml-auto pl-4 md:pl-12">
             {game.enemies.map((enemy) => (
                 <EnemyComponent 
                    key={enemy.id} 
                    enemy={enemy} 
                    isShake={game.shakingTargets.includes(enemy.id)} 
                    isTargetable={dragState.isDragging && dragState.needsTarget} 
                 />
             ))}
         </div>
      </div>

      {/* --- Hand & UI Bottom --- */}
      <div className="absolute bottom-0 left-0 right-0 h-48 md:h-64 z-20 pointer-events-none">
          {/* Draw Pile */}
          <div className="absolute left-2 md:left-8 bottom-2 md:bottom-8 pointer-events-auto group hidden md:block">
              <div className="w-16 h-20 md:w-20 md:h-24 bg-gradient-to-br from-amber-800 to-amber-900 rounded-lg border-2 border-amber-700 shadow-xl flex items-center justify-center relative transform group-hover:-translate-y-1 transition-transform">
                 <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] opacity-50 rounded-lg"></div>
                 <div className="z-10 text-amber-100 font-black text-xl md:text-2xl drop-shadow-md">{game.drawPile.length}</div>
                 <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/70 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">牌堆</div>
              </div>
          </div>

          {/* Discard Pile */}
          <div className="absolute right-2 md:right-8 bottom-2 md:bottom-8 pointer-events-auto group hidden md:block">
               <div className="w-16 h-20 md:w-20 md:h-24 bg-slate-700 rounded-lg border-2 border-slate-600 flex items-center justify-center shadow-xl relative transform group-hover:-translate-y-1 transition-transform">
                 <div className="z-10 text-slate-200 font-black text-xl md:text-2xl drop-shadow-md">{game.discardPile.length}</div>
                 <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/70 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">弃牌</div>
              </div>
          </div>

          {/* End Turn Button - Mobile Optimized */}
          <div className="absolute bottom-24 right-2 md:bottom-36 md:right-8 pointer-events-auto z-30 flex flex-col items-end gap-2">
              <button 
                onClick={game.endTurn} 
                onTouchEnd={(e) => { e.stopPropagation(); game.endTurn(); }}
                disabled={game.phase !== 'PLAYER_TURN'} 
                className={`
                    px-4 py-2 md:px-6 md:py-3 rounded-xl font-black text-white shadow-lg transition-all duration-300 uppercase tracking-widest text-xs md:text-sm border-2 border-white/20
                    ${game.phase === 'PLAYER_TURN' 
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:scale-105 hover:shadow-orange-500/50 active:scale-95' 
                        : 'bg-slate-500 grayscale cursor-not-allowed opacity-80'}
                `}
              >
                {game.phase === 'ENEMY_TURN' ? '敌方回合' : '结束回合'}
              </button>
          </div>

          {/* Hand Cards */}
          <div className="flex items-end justify-center pointer-events-auto px-2 md:px-4 w-full h-full pb-2 md:pb-6 perspective-1000">
              <div className="relative flex items-end h-36 md:h-48">
                  {game.hand.map((card, index) => {
                      const total = game.hand.length;
                      const center = (total - 1) / 2;
                      const offset = index - center;
                      // Adjust fan curve
                      const rotate = offset * 5; 
                      const translateY = Math.abs(offset) * 6; // Less drop on mobile
                      const isBeingDragged = dragState.isDragging && dragState.itemId === card.id;
                      const isGroupMatch = dragState.isDragging && dragState.groupTag && card.groupTag === dragState.groupTag && card.id !== dragState.itemId;
                      // Mobile: tighter spacing (60px vs 90px)
                      const xSpacing = window.innerWidth < 768 ? 60 : 90;

                      return (
                        <div key={card.id} className="origin-bottom transition-all duration-300 absolute bottom-0"
                            style={{ 
                                left: `${(index - center) * xSpacing}px`, // Responsive overlap
                                zIndex: isBeingDragged ? 100 : index,
                                transform: isBeingDragged 
                                    ? `translate(${(index - center) * xSpacing}px, -100px) scale(1.1) rotate(0deg)` // Follow drag logical pos or hide
                                    : `translate(0px, ${translateY}px) rotate(${rotate}deg)`,
                                opacity: isBeingDragged ? 0 : 1 
                            }}
                        >
                            <div className={isBeingDragged ? 'hidden' : 'block'}>
                                <CardComponent 
                                    card={card} 
                                    index={index}
                                    playable={game.phase === 'PLAYER_TURN' && game.player.currentEnergy >= card.cost} 
                                    disabled={game.phase !== 'PLAYER_TURN'}
                                    isDragging={isBeingDragged}
                                    isGroupHighlighted={isGroupMatch}
                                    onMouseDown={startDragCard}
                                    // onTouchStart is handled inside CardComponent but passed here if needed context
                                />
                            </div>
                        </div>
                      );
                  })}
              </div>
          </div>
      </div>
      
      {/* Portrait Warning Overlay */}
      {isPortrait && (
          <div className="fixed inset-0 bg-slate-900/95 z-[100] flex flex-col items-center justify-center text-white p-8 animate-pop">
              <div className="text-8xl mb-8 animate-bounce">📱</div>
              <h2 className="text-3xl font-black mb-4 text-center">请横屏游戏</h2>
              <p className="text-slate-400 text-center">为了最佳体验，请旋转您的手机</p>
              <div className="mt-12 w-16 h-24 border-4 border-white rounded-xl animate-spin"></div>
          </div>
      )}
    </div>
  );

  if (game.phase === 'START_SCREEN') return renderStart();
  if (game.phase === 'CHARACTER_SELECT') return renderCharSelect();
  if (game.phase === 'LOADING') return renderLoading();

  return renderGame();
};

export default App;
