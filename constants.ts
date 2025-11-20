
import { Card, Character, Skill, SkillType, EffectType, TargetType, CardId } from './types';
import { WARRIOR_DATA } from './data/warrior';
import { MAGE_DATA } from './data/mage';
import { VAMPIRE_DATA } from './data/vampire';
import { CARD_DATABASE } from './data/cards';

// 生成唯一ID的辅助函数
export const generateId = () => Math.random().toString(36).substr(2, 9);

// --- 角色列表 ---
export const CHARACTERS: Character[] = [
  WARRIOR_DATA,
  MAGE_DATA,
  VAMPIRE_DATA
];

// --- 奖励池 (引用 ID) ---
export const CARD_REWARD_IDS: CardId[] = [
    CardId.ROUNDHOUSE_KICK, 
    CardId.BOMB_TOSS, 
    CardId.FLEX, 
    CardId.BLIZZARD, 
    CardId.HOLY_HEAL
];

// 导出完整的奖励对象列表 (供 hooks 使用)
export const CARD_REWARD_POOL: Omit<Card, 'id'>[] = CARD_REWARD_IDS.map(id => CARD_DATABASE[id]);

export const SKILL_REWARD_POOL: Omit<Skill, 'id'>[] = [
  {
    name: '雷霆一击',
    type: SkillType.ACTIVE,
    cost: 1,
    cooldown: 2,
    currentCooldown: 0,
    description: '造成 20 点伤害。',
    emoji: '⚡',
    effects: [{ type: EffectType.DAMAGE, value: 20, target: TargetType.SINGLE_ENEMY }]
  },
  {
    name: '吸血光环',
    type: SkillType.PASSIVE,
    description: '被动：回合结束时恢复 1 点生命。',
    emoji: '🦇',
    passiveEffect: 'HEAL_TURN_END'
  }
];
