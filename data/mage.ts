
import { Character, SkillType, CardId } from '../types';

export const MAGE_DATA: Character = {
  id: 'mage',
  name: '元素法师',
  description: '擅长使用火焰与冰霜的法术，拥有强大的AOE能力。',
  maxHp: 50,
  maxEnergy: 3,
  emoji: '🧙‍♂️',
  unlockLevel: 2,
  colorTheme: 'bg-sky-600',
  initialSkill: {
    id: 'mage-passive',
    name: '魔力涌动',
    type: SkillType.PASSIVE,
    description: '被动：所有造成伤害的技能伤害 +1。',
    emoji: '🔮',
    passiveEffect: 'DAMAGE_BOOST_1'
  },
  startingDeck: [
      // 攻击牌 (14)
      CardId.FIREBALL, CardId.FIREBALL, CardId.FIREBALL, CardId.FIREBALL, CardId.FIREBALL, 
      CardId.FIREBALL, CardId.FIREBALL, CardId.FIREBALL, CardId.FIREBALL, CardId.FIREBALL,
      CardId.FROST_NOVA, CardId.FROST_NOVA, CardId.FROST_NOVA, CardId.FROST_NOVA,
      // 手牌被动 (4)
      CardId.MOLTEN_CORE, CardId.MOLTEN_CORE, CardId.PHOTOSYNTHESIS, CardId.PHOTOSYNTHESIS,
      // 技能牌 (12)
      CardId.MAGIC_SHIELD, CardId.MAGIC_SHIELD, CardId.MAGIC_SHIELD, CardId.MAGIC_SHIELD, 
      CardId.MAGIC_SHIELD, CardId.MAGIC_SHIELD, CardId.MAGIC_SHIELD, CardId.MAGIC_SHIELD,
      CardId.MEDITATE, CardId.MEDITATE, CardId.MEDITATE, CardId.MEDITATE
  ],
  baseDrawCount: 8 // Changed to 8
};
