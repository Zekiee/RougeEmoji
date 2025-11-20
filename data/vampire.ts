
import { Character, SkillType, EffectType, TargetType, CardId } from '../types';

export const VAMPIRE_DATA: Character = {
  id: 'vampire',
  name: '吸血鬼',
  description: '消耗生命值来获得强大的力量，并能通过吸血恢复。',
  maxHp: 60,
  maxEnergy: 3,
  emoji: '🧛',
  unlockLevel: 5,
  colorTheme: 'bg-purple-700',
  initialSkill: {
    id: 'vampire-bite',
    name: '鲜血盛宴',
    type: SkillType.ACTIVE,
    cost: 1,
    cooldown: 4,
    currentCooldown: 0,
    description: '对敌人造成 5 点伤害，恢复 5 点生命。(冷却: 4回合)',
    emoji: '🩸',
    effects: [
        { type: EffectType.DAMAGE, value: 5, target: TargetType.SINGLE_ENEMY },
        { type: EffectType.HEAL, value: 5, target: TargetType.SELF }
    ]
  },
  startingDeck: [
      // 攻击牌 (16)
      CardId.CLAW, CardId.CLAW, CardId.CLAW, CardId.CLAW, CardId.CLAW, 
      CardId.CLAW, CardId.CLAW, CardId.CLAW, CardId.CLAW, CardId.CLAW,
      CardId.DRAIN_LIFE, CardId.DRAIN_LIFE, CardId.DRAIN_LIFE, CardId.DRAIN_LIFE, 
      CardId.DRAIN_LIFE, CardId.DRAIN_LIFE,
      // 手牌被动 (4)
      CardId.CURSED_DOLL, CardId.CURSED_DOLL, CardId.CURSED_DOLL, CardId.CURSED_DOLL,
      // 技能牌 (10)
      CardId.DARK_PACT, CardId.DARK_PACT, CardId.DARK_PACT, CardId.DARK_PACT, CardId.DARK_PACT,
      CardId.MIST_FORM, CardId.MIST_FORM, CardId.MIST_FORM, CardId.MIST_FORM, CardId.MIST_FORM
  ],
  baseDrawCount: 8, // Changed to 8
  fixedStartingHand: [CardId.DRAIN_LIFE]
};
