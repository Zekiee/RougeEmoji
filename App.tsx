
import React, { useState, useEffect } from 'react';
import { useGame } from './hooks/useGame';
import { useWindowScale } from './hooks/useWindowScale';
import { useDragController } from './hooks/useDragController';
import { CARD_DATABASE } from './data/cards'; 
import { generateId } from './constants';
import { CardTheme } from './types';
import CardComponent from './components/CardComponent'; 

// Screens & Components
import StartScreen from './components/screens/StartScreen';
import CharacterSelectScreen from './components/screens/CharacterSelectScreen';
import GameScreen from './components/screens/GameScreen';
import SettingsModal from './components/SettingsModal';
import VFXLayer from './components/VFXLayer'; 

export const App = () => {
  const game = useGame();
  const { containerStyle, scale, isPortrait } = useWindowScale();
  const { dragState, startDragCard, startDragSkill } = useDragController({ game, scale, isPortrait });

  const [maxLevelReached, setMaxLevelReached] = useState(1);
  const [showSettings, setShowSettings] = useState(false);

  // --- Persistence ---
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

  // --- Helper for entering fullscreen ---
  const enterFullScreen = () => {
    const docEl = document.documentElement as any;
    const requestFull = docEl.requestFullscreen || docEl.webkitRequestFullscreen || docEl.msRequestFullscreen;
    if (requestFull) {
        requestFull.call(docEl).catch((e: any) => console.log("Fullscreen blocked", e));
    }
    const screen = window.screen as any;
    if (screen && screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('landscape').catch(() => {});
    }
  };

  // --- Render Helpers ---
  
  // Ghost Card Position Logic
  const getGhostPosition = () => {
      // If targeting (Arrow mode), clamp the visual card to near the hand
      if (dragState.needsTarget) {
          return {
              x: dragState.startX,
              y: dragState.startY - 150 // Pop up and stay fixed above hand
          };
      }
      // Otherwise follow finger
      return {
          x: dragState.currentX,
          y: dragState.currentY
      };
  };

  const renderArrow = () => {
      if (!dragState.isDragging || !dragState.needsTarget) return null;
      
      // Start from the clamped ghost position
      const ghostPos = getGhostPosition();
      const startX = ghostPos.x;
      const startY = ghostPos.y; 
      
      // End at finger
      const { currentX, currentY, isHoveringTarget } = dragState;
      
      // Control point for Quadratic Bezier
      const controlX = startX; 
      const controlY = currentY;
      
      const path = `M ${startX} ${startY} Q ${controlX} ${controlY} ${currentX} ${currentY}`;
      
      // Calculate arrow head rotation
      const angle = Math.atan2(currentY - controlY, currentX - controlX) * 180 / Math.PI;
      
      let color = "rgb(244, 63, 94)"; // Rose-500
      if (dragState.theme === CardTheme.ICE) color = "rgb(103, 232, 249)";
      if (dragState.theme === CardTheme.POISON) color = "rgb(168, 85, 247)";
      if (isHoveringTarget) color = "rgb(250, 204, 21)"; // Yellow/Gold highlight when hovering target

      return (
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-[90] overflow-visible">
              <defs>
                  <filter id="glow">
                      <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                      <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                  </filter>
              </defs>
              <path d={path} fill="none" stroke={color} strokeWidth={isHoveringTarget ? "12" : "8"} strokeLinecap="round" strokeDasharray="20,15" className="animate-[dash_0.5s_linear_infinite]" filter="url(#glow)" />
              <polygon points="0,0 30,12 0,24" fill={color} transform={`translate(${currentX}, ${currentY}) rotate(${angle}) translate(-30, -12) ${isHoveringTarget ? 'scale(1.5)' : ''}`} filter="url(#glow)" />
          </svg>
      );
  };

  const renderGhost = () => {
      if (!dragState.isDragging) return null;
      
      const { x, y } = getGhostPosition();
      
      if (dragState.dragType === 'CARD' && dragState.sourceItem) {
          return (
            <div 
                className="absolute pointer-events-none z-[100]" 
                style={{ 
                    left: x, 
                    top: y,
                    transform: `translate(-50%, -50%) scale(1.1)` 
                }}
            >
                <CardComponent 
                    card={dragState.sourceItem as any} 
                    playable={false} 
                    isDragging={true}
                    noAnim={true} // Disable entry animation
                />
            </div>
          );
      }
      
      return null;
  };

  const renderLoading = () => (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-amber-50">
      <div className="text-9xl mb-8 animate-spin filter drop-shadow-xl">⏳</div>
      <h2 className="text-5xl font-black text-slate-700 animate-pulse">生成地下城...</h2>
    </div>
  );

  // --- Main Render ---
  return (
      <div className="fixed inset-0 bg-stone-900 overflow-hidden select-none">
          {/* 
             The Virtual Container (1280x720).
             Everything inside works with 1280x720 coordinates.
          */}
          <div style={containerStyle} className="bg-amber-50 shadow-2xl overflow-hidden origin-center">
              
              {game.phase === 'START_SCREEN' && (
                  <StartScreen 
                      onStart={() => { enterFullScreen(); game.setPhase('CHARACTER_SELECT'); }}
                      onOpenSettings={() => setShowSettings(true)}
                  />
              )}

              {game.phase === 'CHARACTER_SELECT' && (
                  <CharacterSelectScreen 
                      maxLevelReached={maxLevelReached}
                      onBack={() => game.setPhase('START_SCREEN')}
                      onSelect={(char) => {
                           const starter = char.startingDeck.map(id => ({ 
                               ...CARD_DATABASE[id], 
                               id: generateId(),
                               templateId: id 
                           }));
                           
                           game.setDeck(starter);
                           game.setPlayer((p: any) => ({ 
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
                      }}
                  />
              )}

              {game.phase === 'LOADING' && renderLoading()}

              {(game.phase === 'PLAYER_TURN' || game.phase === 'ENEMY_TURN' || game.phase === 'REWARD' || game.phase === 'GAME_OVER') && (
                  <GameScreen 
                      game={game}
                      dragState={dragState}
                      startDragCard={startDragCard}
                      startDragSkill={startDragSkill}
                      onExitGame={() => game.setPhase('START_SCREEN')}
                  />
              )}
              
              <SettingsModal 
                  isOpen={showSettings}
                  onClose={() => setShowSettings(false)}
                  onReset={() => {
                      if(window.confirm('确定要重置所有游戏进度吗？')) {
                          localStorage.removeItem('rogue_emoji_max_level');
                          setMaxLevelReached(1);
                          setShowSettings(false);
                      }
                  }}
              />

              {/* Global Overlays INSIDE the scaled container */}
              <VFXLayer events={game.vfxEvents} />
              {renderArrow()}
              {renderGhost()}
              
          </div>
      </div>
  );
};
