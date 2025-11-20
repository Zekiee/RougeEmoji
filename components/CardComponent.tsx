
import React from 'react';
import { Card, CardType, TargetType, CardTheme } from '../types';

interface CardProps {
  card: Card;
  onMouseDown?: (e: React.MouseEvent | React.TouchEvent, card: Card) => void;
  onClick?: (e: React.MouseEvent, card: Card) => void;
  playable: boolean;
  disabled?: boolean;
  selected?: boolean;
  isDragging?: boolean;
  isGroupHighlighted?: boolean;
  index?: number; // 用于动画延迟
}

const CardComponent: React.FC<CardProps> = ({ card, onMouseDown, onClick, playable, disabled, selected, isDragging, isGroupHighlighted, index = 0 }) => {
  
  const getTypeColor = (type: CardType) => {
    switch (type) {
      case CardType.ATTACK: return 'bg-rose-500';
      case CardType.SKILL: return 'bg-sky-500';
      case CardType.POWER: return 'bg-emerald-500';
      default: return 'bg-slate-500';
    }
  };

  const getThemeStyle = (theme?: CardTheme) => {
      switch(theme) {
          case CardTheme.FIRE: return 'shadow-[0_2px_0_#c2410c] md:shadow-[0_4px_0_#c2410c] border-orange-100 bg-orange-50';
          case CardTheme.ICE: return 'shadow-[0_2px_0_#0e7490] md:shadow-[0_4px_0_#0e7490] border-cyan-100 bg-cyan-50';
          case CardTheme.POISON: return 'shadow-[0_2px_0_#7e22ce] md:shadow-[0_4px_0_#7e22ce] border-purple-100 bg-purple-50';
          case CardTheme.DARK: return 'shadow-[0_2px_0_#374151] md:shadow-[0_4px_0_#374151] border-gray-400 bg-gray-100';
          case CardTheme.HOLY: return 'shadow-[0_2px_0_#a16207] md:shadow-[0_4px_0_#a16207] border-yellow-100 bg-yellow-50';
          default: return 'shadow-[0_2px_0_#94a3b8] md:shadow-[0_4px_0_#94a3b8] border-white bg-slate-50';
      }
  };

  const getTypeLabel = (type: CardType) => {
    switch (type) {
      case CardType.ATTACK: return '攻击';
      case CardType.SKILL: return '技能';
      case CardType.POWER: return '能力';
      default: return '未知';
    }
  };

  const getTargetIcon = () => {
    const mainEffect = card.effects[0];
    if (!mainEffect) return null;
    switch(mainEffect.target) {
        case TargetType.ALL_ENEMIES: return <span className="text-[8px] md:text-[9px] bg-yellow-400 text-black px-1 rounded font-black tracking-tighter shadow-sm">ALL</span>;
        case TargetType.RANDOM_ENEMY: return <span className="text-[8px] md:text-[9px] bg-purple-400 text-white px-1 rounded font-black tracking-tighter shadow-sm">RND</span>;
        case TargetType.SELF: return <span className="text-[8px] md:text-[9px] bg-green-500 text-white px-1 rounded font-black tracking-tighter shadow-sm">SELF</span>;
        default: return null;
    }
  };

  // 统一处理触摸和鼠标开始
  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
      if (playable && !disabled && onMouseDown) {
          onMouseDown(e, card);
      }
  };

  // Removed the ghost return block so the card stays visible

  return (
    <div 
      onMouseDown={handleStart}
      onTouchStart={handleStart}
      onClick={(e) => playable && !disabled && onClick && onClick(e, card)}
      style={{ animationDelay: `${index * 0.05}s` }}
      className={`
        relative 
        w-24 h-36 md:w-32 md:h-48 
        rounded-lg md:rounded-xl border-2 md:border-[3px] 
        transition-all duration-200 transform select-none
        flex flex-col overflow-hidden animate-draw-card origin-bottom
        ${getThemeStyle(card.theme)}
        ${selected ? 'ring-4 ring-yellow-400 -translate-y-8 scale-110 z-50' : ''}
        ${isGroupHighlighted ? 'ring-4 ring-emerald-400 -translate-y-4 scale-105' : ''}
        ${isDragging ? 'ring-4 ring-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.6)] z-50' : ''}
        ${playable && !disabled && !selected && !isGroupHighlighted && !isDragging ? 'hover:-translate-y-8 md:hover:-translate-y-12 hover:scale-110 hover:z-50 hover:shadow-xl cursor-grab active:cursor-grabbing' : ''}
        ${disabled && !selected ? 'opacity-80 grayscale cursor-not-allowed brightness-90' : ''}
      `}
    >
      {/* Cost Bubble */}
      <div className="absolute -top-2 -left-2 w-7 h-7 md:w-9 md:h-9 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center z-20 shadow-[0_2px_0_#1e3a8a] border-2 border-white">
        <span className="text-white font-black text-base md:text-lg font-sans drop-shadow-md">{card.cost}</span>
      </div>

      {/* Group Tag Indicator */}
      {card.groupTag && <div className="absolute -top-1 -right-1 z-30 text-sm bg-white rounded-full w-5 h-5 md:w-6 md:h-6 flex items-center justify-center shadow-sm border border-gray-200">🔗</div>}
      
      {/* Target Icon */}
      <div className="absolute top-1 right-1 md:top-2 md:right-2 z-20">{getTargetIcon()}</div>
      
      {/* Card Art Area */}
      <div className={`h-16 md:h-24 w-full flex items-center justify-center text-4xl md:text-6xl relative overflow-hidden bg-white/50`}>
        <div className={`absolute inset-0 opacity-10 bg-current`} style={{color: card.theme === CardTheme.FIRE ? 'red' : 'black'}}></div>
        <span className="filter drop-shadow-md transform hover:scale-110 transition-transform duration-300 relative z-10">{card.emoji || '🃏'}</span>
      </div>

      {/* Type Ribbon */}
      <div className={`h-4 md:h-5 ${getTypeColor(card.type)} w-full flex items-center justify-center shadow-sm relative z-10`}>
        <span className="text-white text-[8px] md:text-[10px] font-black uppercase tracking-widest drop-shadow-sm">{getTypeLabel(card.type)}</span>
      </div>

      {/* Name */}
      <div className="px-1 pt-1 md:pt-2 pb-0 text-center h-6 md:h-8 flex items-center justify-center">
        <h3 className="font-black text-slate-800 text-[10px] md:text-xs leading-tight line-clamp-2">{card.name}</h3>
      </div>

      {/* Description */}
      <div className="flex-1 px-1 md:px-2 pb-1 md:pb-2 text-center flex items-start justify-center overflow-hidden flex-col">
        <p className="text-[8px] md:text-[9px] text-slate-600 font-bold leading-tight scale-90 origin-top">{card.description}</p>
      </div>
      
      {/* Hand Passive Indicator (New) */}
      {card.handPassive && (
          <div className="absolute bottom-0 left-0 right-0 bg-yellow-100 text-yellow-800 text-[8px] font-bold text-center py-0.5 border-t border-yellow-200 z-10">
              ✋ 保留有益
          </div>
      )}

      <style>{`
        @keyframes draw-card-anim {
            0% { transform: translate(-50px, 100px) rotate(-20deg); opacity: 0; }
            100% { transform: translate(0, 0) rotate(0deg); opacity: 1; }
        }
        .animate-draw-card {
            animation: draw-card-anim 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) backwards;
        }
      `}</style>
    </div>
  );
};

export default CardComponent;
