
import { Character, SkillType, EffectType, TargetType, CardId } from '../types';

export const WARRIOR_DATA: Character = {
  id: 'warrior',
  name: '勇者',
  description: '攻守兼备的战士，使用物理攻击粉碎敌人。',
  maxHp: 80,
  maxEnergy: 3,
  emoji: '⚔️',
  unlockLevel: 0,
  colorTheme: 'bg-rose-600',
  initialSkill: {
    id: 'warrior-slash',
    name: '强力斩击',
    type: SkillType.ACTIVE,
    cost: 2,
    cooldown: 3,
    currentCooldown: 0,
    description: '造成 12 点伤害。 (冷却: 3回合)',
    emoji: '💥',
    effects: [{ type: EffectType.DAMAGE, value: 12, target: TargetType.SINGLE_ENEMY }]
  },
  startingDeck: [
      // 攻击牌 (14)
      CardId.STRIKE, CardId.STRIKE, CardId.STRIKE, CardId.STRIKE, CardId.STRIKE, 
      CardId.STRIKE, CardId.STRIKE, CardId.STRIKE, CardId.STRIKE, CardId.STRIKE,
      CardId.SHURIKEN, CardId.SHURIKEN, CardId.SHURIKEN, CardId.SHURIKEN,
      // 手牌被动牌 (6)
      CardId.TACTICAL_GRIP, CardId.TACTICAL_GRIP, CardId.TACTICAL_GRIP,
      CardId.SPIKED_SHIELD, CardId.SPIKED_SHIELD, CardId.SPIKED_SHIELD,
      // 技能/强力牌 (10)
      CardId.BLOCK, CardId.BLOCK, CardId.BLOCK, CardId.BLOCK, CardId.BLOCK, CardId.BLOCK,
      CardId.UPPERCUT, CardId.UPPERCUT, CardId.UPPERCUT, CardId.UPPERCUT
  ],
  baseDrawCount: 8 // Changed to 8
};
