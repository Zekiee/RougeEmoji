
export enum CardType {
  ATTACK = 'ATTACK',
  SKILL = 'SKILL',
  POWER = 'POWER'
}

export enum CardTheme {
  PHYSICAL = 'PHYSICAL',
  FIRE = 'FIRE',
  ICE = 'ICE',
  POISON = 'POISON',
  HOLY = 'HOLY',
  DARK = 'DARK'
}

export enum IntentType {
  ATTACK = 'ATTACK',
  DEFEND = 'DEFEND',
  BUFF = 'BUFF',
  SUMMON = 'SUMMON',
  SPECIAL = 'SPECIAL'
}

// --- 卡牌 ID 枚举 ---
export enum CardId {
  // Warrior
  STRIKE = 'strike',
  SHURIKEN = 'shuriken',
  BLOCK = 'block',
  UPPERCUT = 'uppercut',
  TACTICAL_GRIP = 'tactical-grip', 
  SPIKED_SHIELD = 'spiked-shield', 

  // Mage
  FIREBALL = 'fireball',
  FROST_NOVA = 'frost-nova',
  MAGIC_SHIELD = 'magic-shield',
  MEDITATE = 'meditate',
  MOLTEN_CORE = 'molten-core', 

  // Vampire
  CLAW = 'claw',
  DRAIN_LIFE = 'drain-life',
  DARK_PACT = 'dark-pact',
  MIST_FORM = 'mist-form',
  CURSED_DOLL = 'cursed-doll', 

  // Neutral / Special
  PHOTOSYNTHESIS = 'photosynthesis', 

  // Rewards
  ROUNDHOUSE_KICK = 'roundhouse-kick',
  BOMB_TOSS = 'bomb-toss',
  FLEX = 'flex',
  BLIZZARD = 'blizzard',
  HOLY_HEAL = 'holy-heal'
}

// --- 效果系统 ---

export enum EffectType {
  DAMAGE = 'DAMAGE',
  BLOCK = 'BLOCK',
  HEAL = 'HEAL',
  DRAW = 'DRAW',
  APPLY_STATUS = 'APPLY_STATUS',
  ADD_ENERGY = 'ADD_ENERGY'
}

export enum TargetType {
  SINGLE_ENEMY = 'SINGLE_ENEMY',
  ALL_ENEMIES = 'ALL_ENEMIES',
  SELF = 'SELF',
  RANDOM_ENEMY = 'RANDOM_ENEMY'
}

export enum StatusType {
  VULNERABLE = 'VULNERABLE', // 易伤
  WEAK = 'WEAK', // 虚弱
  STRENGTH = 'STRENGTH', // 力量
  DOUBLE_NEXT_ATTACK = 'DOUBLE_NEXT_ATTACK', // 下次攻击翻倍
  BURN = 'BURN', // 燃烧 (每回合扣血)
  FREEZE = 'FREEZE', // 冰冻 (跳过回合)
}

export interface CardEffect {
  type: EffectType;
  value: number;
  target: TargetType;
  statusType?: StatusType;
}

// --- 手牌被动系统 ---
export enum HandPassiveType {
    DAMAGE_BOOST = 'DAMAGE_BOOST', // 手里有此牌，攻击伤害增加
    HEAL_ON_TURN_END = 'HEAL_ON_TURN_END', // 回合结束回血
    BLOCK_ON_TURN_END = 'BLOCK_ON_TURN_END', // 回合结束获得格挡
}

export interface HandPassive {
    type: HandPassiveType;
    value: number;
    description: string;
}

export interface Card {
  id: string;
  templateId?: CardId; 
  name: string;
  cost: number;
  type: CardType;
  theme?: CardTheme; // 视觉主题
  effects: CardEffect[];
  description: string;
  emoji?: string;
  spriteIndex?: number; // 新增：图集索引 (0, 1, 2...)
  groupTag?: string;
  handPassive?: HandPassive; 
}

// --- 技能系统 ---

export enum SkillType {
  ACTIVE = 'ACTIVE', // 主动技能，有冷却
  PASSIVE = 'PASSIVE' // 被动技能，永久生效
}

export interface Skill {
  id: string;
  name: string;
  type: SkillType;
  description: string;
  emoji: string;
  // 主动技能属性
  cost?: number;
  cooldown?: number; 
  currentCooldown?: number;
  effects?: CardEffect[]; // 主动效果
  // 被动技能属性 (在逻辑中硬编码处理或扩展EffectType)
  passiveEffect?: string; 
}

export interface Character {
  id: string;
  name: string;
  description: string;
  maxHp: number;
  maxEnergy: number;
  emoji: string;
  initialSkill: Skill; // 初始技能
  unlockLevel: number;
  colorTheme: string;
  startingDeck: CardId[]; 
  baseDrawCount: number; 
  fixedStartingHand?: CardId[]; 
}

// --- 实体系统 ---

export interface Status {
  type: StatusType;
  value: number;
}

export interface Enemy {
  id: string;
  name: string;
  description: string;
  maxHp: number;
  currentHp: number;
  block: number;
  intent: IntentType;
  intentValue: number;
  emoji: string;
  statuses: Status[];
  isBoss?: boolean;
}

export interface Player {
  maxHp: number;
  currentHp: number;
  maxEnergy: number;
  currentEnergy: number;
  block: number;
  statuses: Status[];
  skills: Skill[]; // 拥有的技能列表
  baseDrawCount: number;
  fixedStartingHand: CardId[]; 
  emoji: string; 
}

export interface FloatingText {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
}

// --- VFX ---
export interface VFXEvent {
  id: string;
  type: 'PROJECTILE' | 'IMPACT' | 'SHAKE' | 'BUFF';
  startX?: number;
  startY?: number;
  endX?: number;
  endY?: number;
  emoji?: string;
  theme?: CardTheme;
}

export type GamePhase = 'START_SCREEN' | 'CHARACTER_SELECT' | 'PLAYER_TURN' | 'ENEMY_TURN' | 'REWARD' | 'GAME_OVER' | 'LOADING';

// --- UI/Drag ---
export interface DragState {
    isDragging: boolean;
    itemId: string | null; 
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    dragType: 'CARD' | 'SKILL';
    needsTarget: boolean;
    groupTag?: string;
    theme?: CardTheme;
    sourceItem?: Card | Skill;
}
