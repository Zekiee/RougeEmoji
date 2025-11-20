
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
        <div className="absolute inset-0 z-50 bg-slate-900/90 flex flex-col items-center justify-center animate-pop backdrop-blur-md">
          <div className="absolute top-12 text-8xl animate-bounce">🎁</div>
          <h2 className="text-6xl text-white font-black mb-16 text-stroke-sm mt-20">战斗胜利！选择奖励</h2>
          
          <div className="flex gap-10 justify-center mb-16">
            {rewards.cards.map((card, idx) => (
              <div key={idx} className="transform hover:scale-110 transition-transform duration-300 hover:z-20">
                 <CardComponent card={card} playable={true} onClick={() => onSelectCard(card)} />
              </div>
            ))}
          </div>
          
          {rewards.skill && (
              <div className="mb-12 bg-gradient-to-br from-amber-100 to-amber-200 p-6 rounded-3xl cursor-pointer hover:scale-105 transition-transform shadow-2xl border-4 border-amber-300 relative overflow-hidden group w-[500px]" onClick={() => onSelectSkill(rewards.skill!)}>
                  <div className="absolute inset-0 bg-white/40 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="font-black text-amber-600 text-center mb-2 tracking-widest uppercase text-sm">稀有技能</div>
                  <div className="flex items-center gap-6">
                      <div className="text-6xl filter drop-shadow-md">{rewards.skill.emoji}</div>
                      <div className="text-left">
                          <div className="font-black text-3xl text-slate-800 mb-1">{rewards.skill.name}</div>
                          <div className="text-lg text-slate-600 font-bold leading-tight">{rewards.skill.description}</div>
                      </div>
                  </div>
              </div>
          )}
          
          <button onClick={onSkip} className="text-slate-400 hover:text-white font-bold underline decoration-2 underline-offset-8 transition-colors text-xl">跳过奖励 (恢复10点生命)</button>
        </div>
    );
};

export default RewardScreen;
