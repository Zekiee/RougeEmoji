
import React, { useState, useEffect } from 'react';
import { useGame } from './hooks/useGame';
import { useWindowScale } from './hooks/useWindowScale';
import { useDragController } from './hooks/useDragController';
import { CARD_DATABASE } from './data/cards'; 
import { generateId } from './constants';
import { CardTheme } from './types';

// Screens & Components
import StartScreen from './components/screens/StartScreen';
import CharacterSelectScreen from './components/screens/CharacterSelectScreen';
import GameScreen from './components/screens/GameScreen';
import SettingsModal from './components/SettingsModal';

export const App = () => {
  const game = useGame();
  const { globalScale, isPortrait } = useWindowScale();
  const { dragState, startDragCard, startDragSkill } = useDragController({ game });

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

  // --- Helper for entering fullscreen (passed to start button) ---
  const enterFullScreen = () => {
    const docEl = document.documentElement as any;
    const requestFull = docEl.requestFullscreen || docEl.webkitRequestFullscreen || docEl.msRequestFullscreen;
    if (requestFull) {
        requestFull.call(docEl).catch((e: any) => console.log("Fullscreen blocked", e));
    }
    // Attempt orientation lock
    const screen = window.screen as any;
    if (screen && screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('landscape').catch(() => {});
    }
  };

  // --- Render Helpers for Global Overlays ---
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
          <svg className="fixed inset-0 w-full h-full pointer-events-none z-[9999] overflow-visible">
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
          <div 
            className="fixed pointer-events-none z-[9999] opacity-60 transform -translate-x-1/2 -translate-y-1/2" 
            style={{ 
                left: dragState.currentX, 
                top: dragState.currentY,
                transform: `translate(-50%, -50%) scale(${1.25 * globalScale})` 
            }}
          >
              <div className="text-7xl filter drop-shadow-2xl animate-pulse">{dragState.sourceItem?.emoji || '🃏'}</div>
          </div>
      );
  };

  const renderLoading = () => (
    <div className="flex flex-col items-center justify-center h-full bg-amber-50 pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
      <div className="text-9xl mb-8 animate-spin filter drop-shadow-xl">⏳</div>
      <h2 className="text-3xl md:text-4xl font-black text-slate-700 animate-pulse">生成地下城...</h2>
    </div>
  );

  // --- Main Render ---
  return (
      <div className="fixed inset-0 bg-amber-50 overflow-hidden flex items-center justify-center select-none">
          {/* Global Scaled Stage */}
          <div 
              style={{ 
                  width: `${window.innerWidth / globalScale}px`, 
                  height: `${window.innerHeight / globalScale}px`, 
                  transform: `scale(${globalScale})`,
                  transformOrigin: 'center center'
              }}
              className="relative shadow-2xl overflow-hidden bg-amber-50"
          >
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
          </div>

          {/* Global Overlays (Outside Scaler) */}
          {renderArrow()}
          {renderGhost()}
          
          {/* Portrait Warning Overlay */}
          {isPortrait && (
              <div className="fixed inset-0 bg-slate-900/95 z-[9999] flex flex-col items-center justify-center text-white p-8 animate-pop">
                  <div className="text-8xl mb-8 animate-bounce">📱</div>
                  <h2 className="text-3xl font-black mb-4 text-center">请横屏游戏</h2>
                  <p className="text-slate-400 text-center">为了最佳体验，请旋转您的手机</p>
                  <div className="mt-12 w-16 h-24 border-4 border-white rounded-xl animate-spin"></div>
              </div>
          )}
      </div>
  );
};
