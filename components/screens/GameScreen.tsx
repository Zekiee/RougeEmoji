
import React from 'react';
import { DragState, SkillType, CardTheme } from '../../types';
import CardComponent from '../CardComponent';
import EnemyComponent from '../EnemyComponent';
import VFXLayer from '../VFXLayer';
import RewardScreen from './RewardScreen';

interface GameScreenProps {
    game: any; // Typed from useGame hook
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

    return (
        <div className="relative w-full h-full bg-amber-50 overflow-hidden flex flex-col select-none font-sans touch-none pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')] opacity-40 pointer-events-none"></div>
          
          {/* Fullscreen Toggle Button */}
          <div className="absolute top-2 left-2 md:top-4 md:left-4 z-50 opacity-50 hover:opacity-100 transition-opacity">
              <button onClick={enterFullScreen} className="bg-black/20 p-2 rounded-lg text-white text-lg">⛶</button>
          </div>
    
          {/* Main Battlefield Stage */}
          <div className="relative flex flex-col w-full h-full">
              <VFXLayer events={game.vfxEvents} />
              
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
                <div className="absolute inset-0 z-50 bg-slate-900/95 flex flex-col items-center justify-center animate-pop p-8 text-center">
                  <div className="text-8xl md:text-9xl mb-6">💀</div>
                  <h2 className="text-5xl md:text-7xl text-white font-black mb-8">你挂了</h2>
                  <p className="text-gray-400 mb-12 font-bold text-xl">你到达了第 {game.level} 层</p>
                  <button onClick={onExitGame} className="px-10 py-5 bg-white text-slate-900 text-2xl font-bold rounded-full shadow-lg hover:scale-105 transition-transform">返回主菜单</button>
                </div>
              )}
    
              {/* --- Top Floating HUD --- */}
              <div className="absolute top-2 md:top-6 left-0 right-0 flex justify-center z-20 pointer-events-none">
                  <div className="bg-white/90 backdrop-blur-md px-4 py-2 md:px-8 md:py-3 rounded-full shadow-lg border-b-4 border-slate-200 flex items-center gap-4 md:gap-8 pointer-events-auto transition-all origin-top scale-90 md:scale-100">
                      {/* Level */}
                      <div className="flex flex-col items-center">
                          <span className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Level</span>
                          <span className="text-xl md:text-2xl font-black text-slate-700 leading-none">{game.level}</span>
                      </div>
    
                      {/* Turn Count */}
                      <div className="flex flex-col items-center">
                          <span className={`text-[8px] md:text-[10px] font-black uppercase tracking-widest ${game.turnCount >= 9 ? 'text-red-500' : 'text-slate-400'}`}>Turn</span>
                          <span className={`text-xl md:text-2xl font-black leading-none ${game.turnCount >= 9 ? 'text-red-600 animate-pulse' : 'text-slate-700'}`}>{game.turnCount}</span>
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
              {/* Removed max-w-6xl to allow full width usage on wide screens */}
              <div className="flex-1 relative flex items-center justify-center w-full mx-auto pb-24 md:pb-32 px-4 md:px-12 z-10">
                 
                 {/* Floating Text Layer */}
                 <div className="absolute inset-0 pointer-events-none">
                    {game.floatingTexts.map((ft: any) => (<div key={ft.id} className={`absolute z-50 animate-damage ${ft.color} font-black text-stroke text-2xl md:text-3xl`} style={{ left: `${ft.x}%`, top: `${ft.y}%` }}>{ft.text}</div>))}
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
                         {game.player.skills.map((skill: any) => (
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
                     {game.enemies.map((enemy: any) => (
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
              <div className="absolute bottom-0 left-0 right-0 h-48 md:h-64 z-20 pointer-events-none pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
                  {/* Draw Pile */}
                  <div 
                    className="absolute left-2 md:left-8 bottom-2 md:bottom-8 pointer-events-auto group hidden md:block cursor-pointer active:scale-95 transition-transform"
                    onClick={() => {/* Visual feedback or view deck feature later */}}
                  >
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
    
                  {/* End Turn Button - Mobile Optimized Position */}
                  <div className="absolute bottom-48 right-2 md:bottom-36 md:right-8 pointer-events-auto z-30 flex flex-col items-end gap-2">
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
                          {game.hand.map((card: any, index: number) => {
                              const total = game.hand.length;
                              const center = (total - 1) / 2;
                              const offset = index - center;
                              // Adjust fan curve
                              const rotate = offset * 4; 
                              const translateY = Math.abs(offset) * 4; 
                              const isBeingDragged = dragState.isDragging && dragState.itemId === card.id;
                              const isGroupMatch = dragState.isDragging && dragState.groupTag && card.groupTag === dragState.groupTag && card.id !== dragState.itemId;
                              
                              // Increased spacing now that we have more width (was 800*0.8, now can assume larger virtual width)
                              const maxSpacing = 90; // Increased from 70 to fill width better
                              const xSpacing = Math.min(maxSpacing, (1000 * 0.8) / total); // Use 1000 as approximate available width
    
                              return (
                                <div key={card.id} className="origin-bottom transition-all duration-300 absolute bottom-0"
                                    style={{ 
                                        left: `${(index - center) * xSpacing}px`,
                                        zIndex: isBeingDragged ? 100 : index,
                                        transform: isBeingDragged 
                                            ? `translate(${(index - center) * xSpacing}px, -180px) scale(1.25) rotate(0deg)` 
                                            : `translate(0px, ${translateY}px) rotate(${rotate}deg)`,
                                        opacity: 1 
                                    }}
                                >
                                    <div className={isBeingDragged ? 'block' : 'block'}>
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
              </div>
          </div>
        </div>
      );
}

export default GameScreen;
