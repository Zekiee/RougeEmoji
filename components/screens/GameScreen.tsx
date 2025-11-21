
import React from 'react';
import { DragState, SkillType, CardTheme, FloatingText } from '../../types';
import CardComponent from '../CardComponent';
import EnemyComponent from '../EnemyComponent';
import RewardScreen from './RewardScreen';

interface GameScreenProps {
    game: any;
    dragState: DragState;
    startDragCard: (e: any, card: any) => void;
    startDragSkill: (e: any, skill: any) => void;
    onExitGame: () => void;
}

const GameScreen: React.FC<GameScreenProps> = ({ game, dragState, startDragCard, startDragSkill, onExitGame }) => {
    
    const enterFullScreen = () => {
        const docEl = document.documentElement as any;
        const requestFull = docEl.requestFullscreen || docEl.webkitRequestFullscreen || docEl.msRequestFullscreen;
        if (requestFull) {
            requestFull.call(docEl).catch((e: any) => console.log("Fullscreen blocked", e));
        }
    };

    // Helper to filter texts for a specific target
    const getTextsFor = (targetId: string) => game.floatingTexts.filter((ft: FloatingText) => ft.targetId === targetId);

    return (
        <div className="absolute inset-0 w-full h-full bg-amber-50 overflow-hidden select-none">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')] opacity-40 pointer-events-none"></div>
          
          {/* Fullscreen Toggle */}
          <div className="absolute top-4 left-4 z-50 opacity-50 hover:opacity-100 transition-opacity">
              <button onClick={enterFullScreen} className="bg-black/20 p-2 rounded-lg text-white text-2xl">⛶</button>
          </div>
    
          {/* --- TOP BAR (Global Stats Only) --- */}
          <div className="absolute top-0 left-0 right-0 h-16 z-20 flex justify-center pt-2 pointer-events-none">
              <div className="bg-white/90 backdrop-blur-md px-8 py-1 rounded-b-2xl shadow-lg border-b-2 border-slate-200 flex items-center gap-8 pointer-events-auto">
                   {/* Level */}
                   <div className="flex flex-col items-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Level</span>
                      <span className="text-2xl font-black text-slate-700 leading-none">{game.level}</span>
                   </div>
                   
                   <div className="w-px h-8 bg-slate-300"></div>

                   {/* Turn Count */}
                   <div className="flex flex-col items-center">
                      <span className={`text-[10px] font-black uppercase tracking-widest ${game.turnCount >= 9 ? 'text-red-500' : 'text-slate-400'}`}>Turn</span>
                      <span className={`text-2xl font-black leading-none ${game.turnCount >= 9 ? 'text-red-600 animate-pulse' : 'text-slate-700'}`}>{game.turnCount}</span>
                   </div>
              </div>
          </div>

          {/* --- ENEMIES ZONE (Top Half) --- */}
          <div className="absolute top-[14%] left-0 right-0 flex justify-center items-end z-10 h-[35%] pointer-events-none">
             <div className="flex items-end gap-2 md:gap-6 pointer-events-auto px-4 pb-4">
                 {game.enemies.map((enemy: any) => (
                     <EnemyComponent 
                        key={enemy.id} 
                        enemy={enemy} 
                        isShake={game.shakingTargets.includes(enemy.id)} 
                        isFlash={game.flashTargets.includes(enemy.id)}
                        isActive={game.activeEnemyId === enemy.id}
                        isTargetable={dragState.isDragging && dragState.needsTarget} 
                        isSelected={dragState.isHoveringTarget === enemy.id}
                        floatingTexts={getTextsFor(enemy.id)}
                        onClick={(id) => {}}
                     />
                 ))}
             </div>
          </div>

          {/* --- PLAYER ZONE (Bottom Left) --- */}
          <div className={`absolute left-[8%] bottom-[20%] z-10 flex flex-col items-center transition-transform duration-100 ${game.shakingTargets.includes('PLAYER') ? 'animate-shake' : ''}`}>
               
               {/* Player Floating Texts */}
               <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0 overflow-visible z-50 pointer-events-none">
                    {getTextsFor('PLAYER').map(ft => (
                        <div key={ft.id} className={`absolute whitespace-nowrap animate-damage ${ft.color} text-stroke font-black text-5xl flex justify-center w-60 -ml-30 text-center`}>
                            {ft.text}
                        </div>
                    ))}
               </div>

               {/* Skills/Runes (Above Head) */}
               <div className="mb-4 flex gap-2 bg-white/40 p-1 rounded-xl backdrop-blur-sm">
                   {game.player.skills.map((skill: any) => (
                      <button 
                          key={skill.id}
                          onMouseDown={(e) => startDragSkill(e, skill)}
                          onTouchStart={(e) => startDragSkill(e, skill)}
                          disabled={game.phase !== 'PLAYER_TURN' || (skill.currentCooldown || 0) > 0}
                          className={`relative w-10 h-10 rounded-lg shadow-sm flex items-center justify-center text-xl border-2 border-white transition-all hover:scale-110 hover:shadow-md
                          ${skill.type === SkillType.PASSIVE ? 'bg-purple-500' : (skill.currentCooldown || 0) > 0 ? 'bg-slate-400' : 'bg-amber-400'}`}
                          title={skill.description}
                      >
                          {skill.emoji}
                          {(skill.currentCooldown || 0) > 0 && <div className="absolute inset-0 bg-slate-800/60 rounded-lg flex items-center justify-center text-white font-bold text-xs">{skill.currentCooldown}</div>}
                      </button>
                   ))}
               </div>

               {/* Block Shield */}
               {game.player.block > 0 && (
                   <div className="absolute top-10 -right-4 z-20 bg-blue-500 text-white w-12 h-12 flex items-center justify-center rounded-full font-black shadow-lg border-2 border-white animate-pop text-lg">
                       🛡️{game.player.block}
                   </div>
               )}
               
               {/* Avatar */}
               <div className="flex flex-col items-center">
                   <div className={`text-[8rem] md:text-[9rem] filter drop-shadow-2xl relative z-10 animate-float-slow leading-none ${game.flashTargets.includes('PLAYER') ? 'animate-hit-flash' : ''}`}>
                       {game.player.emoji}
                   </div>
                   <div className="w-28 h-5 bg-black/20 rounded-[50%] blur-md animate-shadow -mt-4"></div>
               </div>

               {/* Player Stats Panel (HP & Energy) */}
               <div className="mt-4 flex flex-col gap-1 bg-white/90 backdrop-blur p-2 rounded-xl border-2 border-slate-100 shadow-lg w-44 transform transition-transform hover:scale-105">
                    {/* HP Bar */}
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-rose-500 w-4">HP</span>
                        <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden border border-slate-300 relative">
                             <div className="h-full bg-rose-500 transition-all duration-300" style={{width: `${(game.player.currentHp / game.player.maxHp) * 100}%`}}>
                                 <div className="absolute inset-0 bg-white/20 w-full h-1/2 top-0"></div>
                             </div>
                        </div>
                        <span className="text-[10px] font-bold text-slate-600 w-6 text-right">{game.player.currentHp}</span>
                    </div>
                    
                    {/* Energy Bar */}
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-amber-500 w-4">MP</span>
                        <div className="flex-1 flex gap-1">
                             {[...Array(game.player.maxEnergy)].map((_, i) => (
                                  <div key={i} className={`w-3 h-3 rounded-full border border-amber-400 transition-all duration-300 ${i < game.player.currentEnergy ? 'bg-amber-400 shadow-[0_0_5px_rgba(251,191,36,0.8)]' : 'bg-slate-100'}`}></div>
                             ))}
                        </div>
                        <span className="text-[10px] font-bold text-slate-600 w-6 text-right">{game.player.currentEnergy}/{game.player.maxEnergy}</span>
                    </div>
               </div>
          </div>

          {/* --- CONTROLS LAYER --- */}
          
          {/* Deck Pile (Bottom Left) */}
          <div className="absolute left-4 bottom-4 z-20 pointer-events-auto group hover:scale-105 transition-transform cursor-pointer">
              <div className="w-16 h-24 bg-gradient-to-br from-amber-800 to-amber-900 rounded-lg border-2 border-amber-700 shadow-xl flex items-center justify-center relative">
                 <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] opacity-50 rounded-lg"></div>
                 <span className="z-10 text-amber-100 font-black text-2xl drop-shadow-md">{game.drawPile.length}</span>
                 <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">牌堆</div>
              </div>
          </div>

          {/* Discard Pile (Bottom Right) */}
          <div className="absolute right-4 bottom-4 z-20 pointer-events-auto group hover:scale-105 transition-transform">
               <div className="w-16 h-24 bg-slate-700 rounded-lg border-2 border-slate-600 flex items-center justify-center shadow-xl relative">
                 <span className="z-10 text-slate-200 font-black text-2xl drop-shadow-md">{game.discardPile.length}</span>
                 <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">弃牌</div>
              </div>
          </div>

          {/* End Turn Button (Right Side) */}
          <div className="absolute bottom-[40%] right-4 z-30 pointer-events-auto">
              <button 
                onClick={game.endTurn} 
                onTouchEnd={(e) => { e.stopPropagation(); game.endTurn(); }}
                disabled={game.phase !== 'PLAYER_TURN'} 
                className={`
                    w-24 h-24 rounded-full font-black text-white shadow-xl transition-all duration-200 border-4 border-white/30 flex flex-col items-center justify-center
                    ${game.phase === 'PLAYER_TURN' 
                        ? 'bg-gradient-to-br from-amber-500 to-orange-600 hover:scale-105 active:scale-95 shadow-orange-500/40' 
                        : 'bg-slate-500 grayscale cursor-not-allowed opacity-80'}
                `}
              >
                <span className="text-xl leading-none mb-1">{game.phase === 'ENEMY_TURN' ? '🚫' : '⚔️'}</span>
                <span className="text-xs uppercase tracking-wider">{game.phase === 'ENEMY_TURN' ? '敌方' : '结束'}</span>
              </button>
          </div>

          {/* Floating Texts Overlay (General) */}
          <div className="absolute inset-0 pointer-events-none z-40">
            {game.floatingTexts.filter((ft: any) => !ft.targetId).map((ft: any) => (<div key={ft.id} className={`absolute animate-damage ${ft.color} font-black text-stroke text-5xl`} style={{ left: `${ft.x}%`, top: `${ft.y}%` }}>{ft.text}</div>))}
          </div>

          {/* Hand Container (Bottom Center) */}
          <div className="absolute bottom-0 left-0 right-0 h-[240px] flex items-end justify-center pointer-events-none z-30 pb-2">
               <div className="relative flex items-end h-52 w-[700px] justify-center">
                  {game.hand.map((card: any, index: number) => {
                      const total = game.hand.length;
                      const center = (total - 1) / 2;
                      const offset = index - center;
                      const rotate = offset * 3; 
                      const translateY = Math.abs(offset) * 8; 
                      
                      const isBeingDragged = dragState.isDragging && dragState.itemId === card.id;
                      const isGroupMatch = dragState.isDragging && dragState.groupTag && card.groupTag === dragState.groupTag && card.id !== dragState.itemId;
                      
                      // Adjust spacing based on card count
                      const xSpacing = Math.min(90, 700 / (total + 1));

                      return (
                        <div key={card.id} className="origin-bottom transition-all duration-300 absolute bottom-0 will-change-transform pointer-events-auto"
                            style={{ 
                                left: '50%',
                                marginLeft: `${offset * xSpacing}px`, 
                                zIndex: isBeingDragged ? 100 : index,
                                transform: isBeingDragged 
                                    ? `translate(${offset * xSpacing}px, -200px) scale(0.01)` 
                                    : `translate(-50%, ${translateY}px) rotate(${rotate}deg)`,
                                opacity: isBeingDragged ? 0 : 1 
                            }}
                        >
                            <div className="-translate-x-1/2">
                                <CardComponent 
                                    card={card} 
                                    index={index}
                                    playable={game.phase === 'PLAYER_TURN' && game.player.currentEnergy >= card.cost} 
                                    disabled={game.phase !== 'PLAYER_TURN' || game.player.currentEnergy < card.cost}
                                    isDragging={isBeingDragged}
                                    isGroupHighlighted={isGroupMatch}
                                    onMouseDown={startDragCard}
                                />
                            </div>
                        </div>
                      );
                  })}
              </div>
          </div>

          {/* Overlays */}
          {game.phase === 'REWARD' && (
              <RewardScreen 
                rewards={game.rewards}
                onSelectCard={(card) => {
                    const newDeck = [...game.deck, card];
                    game.setDeck(newDeck);
                    game.setLevel((l: number) => l + 1);
                    game.setPlayer((p: any) => ({...p, currentHp: Math.min(p.maxHp, p.currentHp + 10)}));
                    game.startLevel(game.level + 1, newDeck);
                }}
                onSelectSkill={(skill) => {
                    game.setPlayer((p: any) => ({...p, skills: [...p.skills, skill]}));
                    game.setLevel((l: number) => l + 1);
                    game.setPlayer((p: any) => ({...p, currentHp: Math.min(p.maxHp, p.currentHp + 10)}));
                    game.startLevel(game.level + 1, game.deck);
                }}
                onSkip={() => {
                    game.setLevel((l: number) => l + 1); 
                    game.setPlayer((p: any) => ({...p, currentHp: Math.min(p.maxHp, p.currentHp + 10)})); 
                    game.startLevel(game.level + 1, game.deck);
                }}
              />
          )}

          {game.phase === 'GAME_OVER' && (
            <div className="absolute inset-0 z-50 bg-slate-900/95 flex flex-col items-center justify-center animate-pop">
              <div className="text-9xl mb-6">💀</div>
              <h2 className="text-8xl text-white font-black mb-8">你挂了</h2>
              <p className="text-gray-400 mb-12 font-bold text-3xl">你到达了第 {game.level} 层</p>
              <button onClick={onExitGame} className="px-12 py-6 bg-white text-slate-900 text-3xl font-bold rounded-full shadow-lg hover:scale-105 transition-transform">返回主菜单</button>
            </div>
          )}

        </div>
      );
}

export default GameScreen;
