import { Card, CardType, EffectType, TargetType, StatusType, CardTheme, CardId, HandPassiveType } from '../types';

// 使用 Record<CardId, ...> 确保覆盖所有枚举值
export const CARD_DATABASE: Record<CardId, Omit<Card, 'id'>> = {
  // --- 勇者卡牌 ---
  [CardId.STRIKE]: {
    name: '普通拳',
    cost: 1,
    type: CardType.ATTACK,
    theme: CardTheme.PHYSICAL,
    effects: [{ type: EffectType.DAMAGE, value: 6, target: TargetType.SINGLE_ENEMY }],
    description: '造成 6 点伤害。',
    emoji: '🥊'
  },
  [CardId.SHURIKEN]: {
    name: '连击手里剑',
    cost: 0,
    type: CardType.ATTACK,
    theme: CardTheme.PHYSICAL,
    effects: [{ type: EffectType.DAMAGE, value: 3, target: TargetType.SINGLE_ENEMY }],
    description: '0费3伤。连锁：打出所有手里剑。',
    emoji: '💠',
    groupTag: 'shuriken'
  },
  [CardId.BLOCK]: {
    name: '纸板盾',
    cost: 1,
    type: CardType.SKILL,
    theme: CardTheme.PHYSICAL,
    effects: [{ type: EffectType.BLOCK, value: 5, target: TargetType.SELF }],
    description: '获得 5 点格挡。',
    emoji: '📦'
  },
  [CardId.UPPERCUT]: {
    name: '升龙拳',
    cost: 2,
    type: CardType.ATTACK,
    theme: CardTheme.FIRE,
    effects: [
        { type: EffectType.DAMAGE, value: 12, target: TargetType.SINGLE_ENEMY }
    ],
    description: '造成 12 点伤害。',
    emoji: '☄️'
  },
  [CardId.TACTICAL_GRIP]: {
    name: '战术握把',
    cost: 1,
    type: CardType.SKILL,
    theme: CardTheme.PHYSICAL,
    effects: [{ type: EffectType.DAMAGE, value: 3, target: TargetType.SINGLE_ENEMY }],
    description: '造成3点伤害。保留：其它攻击伤害+1。',
    emoji: '✊',
    handPassive: {
        type: HandPassiveType.DAMAGE_BOOST,
        value: 1,
        description: '✋ 手牌被动：攻击伤害 +1'
    }
  },
  [CardId.SPIKED_SHIELD]: {
    name: '尖刺盾',
    cost: 2,
    type: CardType.ATTACK,
    theme: CardTheme.PHYSICAL,
    effects: [{ type: EffectType.DAMAGE, value: 5, target: TargetType.SINGLE_ENEMY }, { type: EffectType.BLOCK, value: 5, target: TargetType.SELF }],
    description: '5攻5防。保留：回合结束获得3格挡。',
    emoji: '🛡️',
    handPassive: {
        type: HandPassiveType.BLOCK_ON_TURN_END,
        value: 3,
        description: '✋ 手牌被动：回合结束 +3 格挡'
    }
  },

  // --- 法师卡牌 ---
  [CardId.FIREBALL]: {
    name: '火球术',
    cost: 1,
    type: CardType.ATTACK,
    theme: CardTheme.FIRE,
    effects: [
      { type: EffectType.DAMAGE, value: 8, target: TargetType.SINGLE_ENEMY },
      { type: EffectType.APPLY_STATUS, value: 2, target: TargetType.SINGLE_ENEMY, statusType: StatusType.BURN }
    ],
    description: '造成 8 点伤害，施加 2 层燃烧。',
    emoji: '🔥'
  },
  [CardId.FROST_NOVA]: {
    name: '冰霜新星',
    cost: 2,
    type: CardType.ATTACK,
    theme: CardTheme.ICE,
    effects: [
      { type: EffectType.DAMAGE, value: 4, target: TargetType.ALL_ENEMIES },
      { type: EffectType.APPLY_STATUS, value: 1, target: TargetType.ALL_ENEMIES, statusType: StatusType.WEAK }
    ],
    description: '对所有敌人造成 4 点伤害，施加虚弱。',
    emoji: '❄️'
  },
  [CardId.MAGIC_SHIELD]: {
    name: '魔法盾',
    cost: 1,
    type: CardType.SKILL,
    theme: CardTheme.HOLY,
    effects: [{ type: EffectType.BLOCK, value: 8, target: TargetType.SELF }],
    description: '获得 8 点格挡。',
    emoji: '🛡️'
  },
  [CardId.MEDITATE]: {
    name: '冥想',
    cost: 0,
    type: CardType.SKILL,
    theme: CardTheme.HOLY,
    effects: [{ type: EffectType.ADD_ENERGY, value: 1, target: TargetType.SELF }],
    description: '获得 1 点能量。',
    emoji: '🧘'
  },
  [CardId.MOLTEN_CORE]: {
    name: '熔岩核心',
    cost: 3,
    type: CardType.POWER,
    theme: CardTheme.FIRE,
    effects: [{ type: EffectType.APPLY_STATUS, value: 3, target: TargetType.ALL_ENEMIES, statusType: StatusType.BURN }],
    description: '全体3层燃烧。保留：攻击伤害+2。',
    emoji: '🌋',
    handPassive: {
        type: HandPassiveType.DAMAGE_BOOST,
        value: 2,
        description: '✋ 手牌被动：攻击伤害 +2'
    }
  },

  // --- 吸血鬼卡牌 ---
  [CardId.CLAW]: {
    name: '利爪',
    cost: 0,
    type: CardType.ATTACK,
    theme: CardTheme.DARK,
    effects: [{ type: EffectType.DAMAGE, value: 4, target: TargetType.SINGLE_ENEMY }],
    description: '造成 4 点伤害。',
    emoji: '💅'
  },
  [CardId.DRAIN_LIFE]: {
    name: '吸血',
    cost: 1,
    type: CardType.ATTACK,
    theme: CardTheme.DARK,
    effects: [
        { type: EffectType.DAMAGE, value: 5, target: TargetType.SINGLE_ENEMY },
        { type: EffectType.HEAL, value: 2, target: TargetType.SELF }
    ],
    description: '造成 5 伤害，回 2 血。',
    emoji: '🍷'
  },
  [CardId.DARK_PACT]: {
    name: '黑暗契约',
    cost: 0,
    type: CardType.SKILL,
    theme: CardTheme.DARK,
    effects: [
        { type: EffectType.DAMAGE, value: 3, target: TargetType.SELF },
        { type: EffectType.DRAW, value: 2, target: TargetType.SELF },
        { type: EffectType.ADD_ENERGY, value: 1, target: TargetType.SELF }
    ],
    description: '受到 3 点伤害，抽 2 张牌，得 1 能量。',
    emoji: '📜'
  },
  [CardId.MIST_FORM]: {
    name: '雾化',
    cost: 1,
    type: CardType.SKILL,
    theme: CardTheme.DARK,
    effects: [{ type: EffectType.BLOCK, value: 10, target: TargetType.SELF }],
    description: '获得 10 点格挡。',
    emoji: '🌫️'
  },
  [CardId.CURSED_DOLL]: {
    name: '诅咒玩偶',
    cost: 2,
    type: CardType.SKILL,
    theme: CardTheme.DARK,
    effects: [{ type: EffectType.DAMAGE, value: 10, target: TargetType.SINGLE_ENEMY }],
    description: '造成10点伤害。保留：回合结束回2血。',
    emoji: '🧸',
    handPassive: {
        type: HandPassiveType.HEAL_ON_TURN_END,
        value: 2,
        description: '✋ 手牌被动：回合结束 +2 血'
    }
  },

  // --- 中立/特殊 ---
  [CardId.PHOTOSYNTHESIS]: {
      name: '光合作用',
      cost: 0,
      type: CardType.SKILL,
      theme: CardTheme.HOLY,
      effects: [{ type: EffectType.ADD_ENERGY, value: 2, target: TargetType.SELF }],
      description: '获得2能量。保留：回合结束回2血。',
      emoji: '🌱',
      handPassive: {
          type: HandPassiveType.HEAL_ON_TURN_END,
          value: 2,
          description: '✋ 手牌被动：回合结束 +2 血'
      }
  },


  // --- 奖励卡牌 ---
  [CardId.ROUNDHOUSE_KICK]: {
    name: '回旋踢',
    cost: 1,
    type: CardType.ATTACK,
    theme: CardTheme.PHYSICAL,
    effects: [{ type: EffectType.DAMAGE, value: 5, target: TargetType.ALL_ENEMIES }],
    description: '对所有敌人造成 5 点伤害。',
    emoji: '🦶'
  },
  [CardId.BOMB_TOSS]: {
    name: '炸弹投掷',
    cost: 2,
    type: CardType.ATTACK,
    theme: CardTheme.FIRE,
    effects: [{ type: EffectType.DAMAGE, value: 18, target: TargetType.RANDOM_ENEMY }],
    description: '对随机敌人造成 18 点伤害。',
    emoji: '💣'
  },
  [CardId.FLEX]: {
    name: '肌肉强化',
    cost: 1,
    type: CardType.SKILL,
    theme: CardTheme.PHYSICAL,
    effects: [{ type: EffectType.APPLY_STATUS, value: 2, target: TargetType.SELF, statusType: StatusType.STRENGTH }],
    description: '获得 2 点力量（攻击增加）。',
    emoji: '💪'
  },
  [CardId.BLIZZARD]: {
    name: '暴风雪',
    cost: 2,
    type: CardType.ATTACK,
    theme: CardTheme.ICE,
    effects: [
      { type: EffectType.DAMAGE, value: 5, target: TargetType.ALL_ENEMIES },
      { type: EffectType.APPLY_STATUS, value: 2, target: TargetType.ALL_ENEMIES, statusType: StatusType.WEAK }
    ],
    description: 'AOE 5伤害，施加2层虚弱。',
    emoji: '🌨️'
  },
  [CardId.HOLY_HEAL]: {
    name: '神圣治疗',
    cost: 1,
    type: CardType.SKILL,
    theme: CardTheme.HOLY,
    effects: [{ type: EffectType.HEAL, value: 8, target: TargetType.SELF }],
    description: '恢复 8 点生命。',
    emoji: '🩹'
  }
};