
import React from 'react';
import CardComponent from '../CardComponent';
import { Card, Skill } from '../../types';

interface RewardScreenProps {
    rewards: { cards: Card[]; skill?: Skill };
    onSelectCard: (card: Card) => void;
    onSelectSkill: (skill: Skill) => void;
    onSkip: () => void;
}

const RewardScreen: React.FC<RewardScreenProps> = ({ rewards, onSelectCard, onSelectSkill, onSkip }) => {
    return (
        <div className="absolute inset-0 z-50 bg-slate-900/90 flex flex-col items-center justify-center animate-pop backdrop-blur-sm p-4 pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
          <div className="absolute top-8 md:top-20 text-4xl md:text-6xl animate-bounce">🎁</div>
          <h2 className="text-3xl md:text-5xl text-white font-black mb-8 md:mb-12 text-stroke-sm">战斗胜利！选择奖励</h2>
          <div className="flex gap-4 md:gap-8 flex-wrap justify-center mb-8 md:mb-12">
            {rewards.cards.map((card, idx) => (
              <div key={idx} className="transform hover:scale-110 transition-transform duration-300">
                 <CardComponent card={card} playable={true} onClick={() => onSelectCard(card)} />
              </div>
            ))}
          </div>
          {rewards.skill && (
              <div className="mb-8 md:mb-12 bg-gradient-to-br from-amber-100 to-amber-200 p-4 md:p-6 rounded-2xl cursor-pointer hover:scale-105 transition-transform shadow-lg border-4 border-amber-300 relative overflow-hidden group" onClick={() => onSelectSkill(rewards.skill!)}>
                  <div className="absolute inset-0 bg-white/40 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="font-black text-amber-600 text-center mb-2 tracking-widest uppercase text-xs">稀有技能</div>
                  <div className="flex items-center gap-4">
                      <div className="text-4xl md:text-5xl filter drop-shadow-md">{rewards.skill.emoji}</div>
                      <div>
                          <div className="font-black text-lg md:text-xl text-slate-800">{rewards.skill.name}</div>
                          <div className="text-xs text-slate-600 font-bold">{rewards.skill.description}</div>
                      </div>
                  </div>
              </div>
          )}
          <button onClick={onSkip} className="text-slate-400 hover:text-white font-bold underline decoration-2 underline-offset-4 transition-colors text-sm md:text-base">跳过奖励 (恢复10点生命)</button>
        </div>
    );
};

export default RewardScreen;
