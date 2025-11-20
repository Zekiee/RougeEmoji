
import { useState, useEffect, useCallback } from 'react';
import { 
  Player, Enemy, Card, CardType, GamePhase, IntentType, EffectType, 
  TargetType, StatusType, FloatingText, VFXEvent, Status, SkillType, CardTheme, HandPassiveType 
} from '../types';
import { generateId, CARD_REWARD_POOL, SKILL_REWARD_POOL } from '../constants';
import { generateEnemyProfile } from '../services/geminiService';

export const useGame = () => {
  const [phase, setPhase] = useState<GamePhase>('START_SCREEN');
  const [level, setLevel] = useState(1);
  
  const [player, setPlayer] = useState<Player>({
    maxHp: 100, currentHp: 100, maxEnergy: 3, currentEnergy: 3, block: 0, statuses: [], skills: [],
    baseDrawCount: 8, fixedStartingHand: [], emoji: '🤨'
  });
  
  const [deck, setDeck] = useState<Card[]>([]);
  const [drawPile, setDrawPile] = useState<Card[]>([]);
  const [hand, setHand] = useState<Card[]>([]);
  const [discardPile, setDiscardPile] = useState<Card[]>([]);
  
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [vfxEvents, setVfxEvents] = useState<VFXEvent[]>([]);
  const [shakingTargets, setShakingTargets] = useState<string[]>([]);
  const [rewards, setRewards] = useState<{cards: Card[], skill?: any}>({cards: []});

  // --- VFX Helpers ---
  const triggerVFX = (type: VFXEvent['type'], startX: number, startY: number, endX?: number, endY?: number, theme?: CardTheme) => {
      const id = generateId();
      setVfxEvents(prev => [...prev, { id, type, startX, startY, endX, endY, theme }]);
      setTimeout(() => {
          setVfxEvents(prev => prev.filter(e => e.id !== id));
      }, 500); // VFX 持续时间
  };

  const addFloatingText = (text: string, x: number, y: number, color: string = 'text-white') => {
    const id = Date.now() + Math.random();
    setFloatingTexts(prev => [...prev, { id, text, x, y, color }]);
    setTimeout(() => setFloatingTexts(prev => prev.filter(ft => ft.id !== id)), 1200);
  };

  const triggerShake = (targetId: string) => {
      setShakingTargets(prev => [...prev, targetId]);
      setTimeout(() => setShakingTargets(prev => prev.filter(id => id !== targetId)), 500);
  };

  // --- Combat Logic ---
  const calculateDamage = (baseValue: number, source: 'PLAYER' | Enemy, target: 'PLAYER' | Enemy): number => {
      let dmg = baseValue;
      
      // Source Mods
      if (source === 'PLAYER') {
          const strength = player.statuses.find(s => s.type === StatusType.STRENGTH)?.value || 0;
          dmg += strength;
          
          // Passive: Mage Boost
          if (player.skills.some(s => s.type === SkillType.PASSIVE && s.passiveEffect === 'DAMAGE_BOOST_1')) {
              dmg += 1;
          }

          // Hand Passives: Damage Boost
          // Check cards in hand for damage boosts
          const handDamageBonus = hand.reduce((acc, card) => {
              if (card.handPassive && card.handPassive.type === HandPassiveType.DAMAGE_BOOST) {
                  return acc + card.handPassive.value;
              }
              return acc;
          }, 0);
          dmg += handDamageBonus;

          if (player.statuses.find(s => s.type === StatusType.DOUBLE_NEXT_ATTACK)) {
              dmg *= 2;
          }
          if (player.statuses.find(s => s.type === StatusType.WEAK)) {
              dmg = Math.floor(dmg * 0.75);
          }
      }

      // Target Mods
      const targetStatuses = target === 'PLAYER' ? player.statuses : target.statuses;
      if (targetStatuses.find(s => s.type === StatusType.VULNERABLE)) {
          dmg = Math.floor(dmg * 1.5);
      }

      return dmg;
  };

  const resolveEffect = (effect: Card['effects'][0], targetId: string | undefined, sourceCoords?: {x: number, y: number}, theme?: CardTheme) => {
    let targets: Enemy[] = [];
    
    if (effect.target === TargetType.SINGLE_ENEMY && targetId) {
        targets = enemies.filter(e => e.id === targetId);
    } else if (effect.target === TargetType.ALL_ENEMIES) {
        targets = enemies.filter(e => e.currentHp > 0);
    } else if (effect.target === TargetType.RANDOM_ENEMY) {
        const alive = enemies.filter(e => e.currentHp > 0);
        if (alive.length > 0) targets = [alive[Math.floor(Math.random() * alive.length)]];
    }

    // VFX Trigger
    if (targets.length > 0 && sourceCoords && (effect.type === EffectType.DAMAGE || effect.type === EffectType.APPLY_STATUS)) {
        // 简化：对第一个目标发射投射物
        const targetEl = document.querySelector(`[data-enemy-id="${targets[0].id}"]`);
        if (targetEl) {
            const rect = targetEl.getBoundingClientRect();
            triggerVFX('PROJECTILE', sourceCoords.x, sourceCoords.y, rect.left + rect.width/2, rect.top + rect.height/2, theme);
        }
    }

    switch (effect.type) {
        case EffectType.DAMAGE: {
            setTimeout(() => { // 延迟伤害以匹配投射物飞行时间
                targets.forEach(enemy => {
                    const dmg = calculateDamage(effect.value, 'PLAYER', enemy);
                    let finalDmg = dmg;
                    
                    // Block Logic
                    if (enemy.block > 0) {
                        if (enemy.block >= dmg) {
                            setEnemies(prev => prev.map(e => e.id === enemy.id ? { ...e, block: e.block - dmg } : e));
                            finalDmg = 0;
                            addFloatingText("格挡", 50, 40, 'text-gray-400');
                        } else {
                            finalDmg -= enemy.block;
                            setEnemies(prev => prev.map(e => e.id === enemy.id ? { ...e, block: 0 } : e));
                        }
                    }
                    
                    if (finalDmg > 0) {
                        setEnemies(prev => prev.map(e => e.id === enemy.id ? { ...e, currentHp: Math.max(0, e.currentHp - finalDmg) } : e));
                        triggerShake(enemy.id);
                        addFloatingText(`-${finalDmg}`, 50 + Math.random()*10, 30, 'text-red-500 font-black text-4xl');
                    }
                });
            }, 300);
            break;
        }
        case EffectType.BLOCK:
            setPlayer(p => ({ ...p, block: p.block + effect.value }));
            addFloatingText(`+${effect.value} 🛡️`, 20, 50, 'text-blue-400');
            break;
        case EffectType.HEAL:
            setPlayer(p => ({ ...p, currentHp: Math.min(p.maxHp, p.currentHp + effect.value) }));
            addFloatingText(`+${effect.value} ❤️`, 20, 60, 'text-green-500');
            break;
        case EffectType.DRAW:
            drawCards(effect.value);
            break;
        case EffectType.ADD_ENERGY:
            setPlayer(p => ({ ...p, currentEnergy: p.currentEnergy + effect.value }));
            addFloatingText(`+${effect.value} ⚡`, 15, 70, 'text-yellow-400');
            break;
        case EffectType.APPLY_STATUS: {
            setTimeout(() => {
                if (effect.target === TargetType.SELF) {
                    setPlayer(p => ({...p, statuses: applyStatus(p.statuses, effect.statusType!, effect.value)}));
                    addFloatingText(`${effect.statusType}`, 20, 40, 'text-purple-400');
                } else {
                    targets.forEach(t => {
                        setEnemies(prev => prev.map(e => e.id === t.id ? {
                            ...e, statuses: applyStatus(e.statuses, effect.statusType!, effect.value)
                        } : e));
                    });
                }
            }, 300);
            break;
        }
    }
  };

  const applyStatus = (current: Status[], type: StatusType, value: number): Status[] => {
      const existing = current.find(s => s.type === type);
      if (existing) {
          return current.map(s => s.type === type ? { ...s, value: s.value + value } : s);
      }
      return [...current, { type, value }];
  };

  // --- Turn Management ---
  
  const startLevel = async (lvl: number, currentDeck: Card[]) => {
      setPhase('LOADING');
      setEnemies([]);
      setHand([]);
      setDiscardPile([]);
      setDrawPile([]);

      const profile = await generateEnemyProfile(lvl);
      const hp = profile.isBoss ? 100 + (lvl * 15) : 30 + (lvl * 6);
      const mainEnemy: Enemy = {
          id: generateId(),
          name: profile.name, description: profile.description, emoji: profile.emoji,
          maxHp: hp, currentHp: hp, block: 0, statuses: [], 
          intent: IntentType.ATTACK, intentValue: 6 + lvl, isBoss: profile.isBoss
      };
      
      setEnemies([mainEnemy]);
      
      // Deck Init Logic
      const initialDrawPile = [...currentDeck].sort(() => Math.random() - 0.5);
      let initialHand: Card[] = [];

      // 1. 处理固定起手牌
      if (player.fixedStartingHand.length > 0) {
          for (const fixedId of player.fixedStartingHand) {
              const idx = initialDrawPile.findIndex(c => c.templateId === fixedId);
              if (idx !== -1) {
                  initialHand.push(initialDrawPile[idx]);
                  initialDrawPile.splice(idx, 1);
              }
          }
      }

      // 2. 补齐手牌到 baseDrawCount
      const needed = player.baseDrawCount - initialHand.length;
      if (needed > 0) {
          for (let i = 0; i < needed; i++) {
              if (initialDrawPile.length > 0) {
                  initialHand.push(initialDrawPile.pop()!);
              }
          }
      }

      setDrawPile(initialDrawPile);
      setHand(initialHand);
      setPhase('PLAYER_TURN');
  };

  const drawCards = (count: number) => {
      // 修正后的抽牌逻辑：先更新状态，避免闭包陷阱
      let currentDraw = [...drawPile];
      let currentDiscard = [...discardPile];
      let currentHand = [...hand];
      
      for(let i=0; i<count; i++) {
          if (currentDraw.length === 0) {
              if (currentDiscard.length === 0) break; // 无牌可抽
              currentDraw = currentDiscard.sort(() => Math.random() - 0.5);
              currentDiscard = [];
          }
          const card = currentDraw.pop();
          if (card) currentHand.push(card);
      }
      
      setDrawPile(currentDraw);
      setDiscardPile(currentDiscard);
      setHand(currentHand);
  };

  // Refactored to draw up to a limit instead of a fixed number
  const drawToLimit = (limit: number) => {
      const currentCount = hand.length;
      if (currentCount >= limit) return;
      drawCards(limit - currentCount);
  };

  useEffect(() => {
      if (phase === 'PLAYER_TURN') {
          // Turn Start
          setPlayer(p => ({
              ...p, 
              block: 0, 
              currentEnergy: p.maxEnergy,
              statuses: p.statuses.map(s => s.type === StatusType.DOUBLE_NEXT_ATTACK ? s : {...s, value: Math.max(0, s.value - 1)}).filter(s => s.value > 0 || s.type === StatusType.STRENGTH),
              skills: p.skills.map(s => s.type === SkillType.ACTIVE ? {...s, currentCooldown: Math.max(0, (s.currentCooldown || 0) - 1)} : s)
          }));
          
          // drawCards(player.baseDrawCount); // OLD
          drawToLimit(player.baseDrawCount); // NEW: Draw until full
      }
  }, [phase]); 

  const playCard = (card: Card, targetId?: string, mouseX?: number, mouseY?: number) => {
      if (player.currentEnergy < card.cost) return;
      
      // 消耗能量
      setPlayer(p => ({ ...p, currentEnergy: p.currentEnergy - card.cost }));
      
      // 移出手牌 -> 弃牌堆
      setHand(prev => prev.filter(c => c.id !== card.id));
      setDiscardPile(prev => [...prev, card]);

      // 检查双倍伤害Buff
      let consumeDouble = false;
      if (card.type === CardType.ATTACK && player.statuses.find(s => s.type === StatusType.DOUBLE_NEXT_ATTACK)) {
          consumeDouble = true;
      }

      // 结算效果
      card.effects.forEach(eff => resolveEffect(eff, targetId, {x: mouseX || 0, y: mouseY || 0}, card.theme));

      // 移除一次性Buff
      if (consumeDouble) {
           setPlayer(p => ({...p, statuses: p.statuses.filter(s => s.type !== StatusType.DOUBLE_NEXT_ATTACK)}));
           addFloatingText("双倍消耗!", 20, 70, 'text-yellow-400');
      }
  };

  // 新增：批量出牌（用于连击机制）
  const playCardBatch = (cards: Card[], targetId?: string, startX?: number, startY?: number) => {
      // 计算总消耗
      const totalCost = cards.reduce((sum, c) => sum + c.cost, 0);
      if (player.currentEnergy < totalCost) {
          addFloatingText("能量不足!", 50, 50, 'text-red-500');
          return;
      }

      // 1. 立即扣除能量
      setPlayer(p => ({ ...p, currentEnergy: p.currentEnergy - totalCost }));

      // 2. 立即将这些牌全部移入手牌 -> 弃牌堆（防止视觉上残留）
      const cardIds = new Set(cards.map(c => c.id));
      setHand(prev => prev.filter(c => !cardIds.has(c.id)));
      setDiscardPile(prev => [...prev, ...cards]);

      // 3. 依次触发效果（带延迟，增加打击感）
      cards.forEach((card, index) => {
          setTimeout(() => {
              card.effects.forEach(eff => resolveEffect(eff, targetId, {x: startX || 0, y: startY || 0}, card.theme));
          }, index * 200); // 每张牌间隔200ms
      });
  };

  const useSkill = (skillId: string, targetId?: string, mouseX?: number, mouseY?: number) => {
      const skillIdx = player.skills.findIndex(s => s.id === skillId);
      if (skillIdx === -1) return;
      const skill = player.skills[skillIdx];
      
      if (skill.type === SkillType.ACTIVE && (skill.currentCooldown || 0) === 0 && player.currentEnergy >= (skill.cost || 0)) {
           setPlayer(p => {
               const newSkills = [...p.skills];
               newSkills[skillIdx] = { ...skill, currentCooldown: skill.cooldown };
               return { ...p, currentEnergy: p.currentEnergy - (skill.cost || 0), skills: newSkills };
           });

           skill.effects?.forEach(eff => resolveEffect(eff, targetId, {x: mouseX || 0, y: mouseY || 0}, CardTheme.HOLY));
      }
  };

  const endTurn = () => {
      // New Logic: Hand Retention & Hand Passives
      
      // 1. Trigger Hand Passives
      hand.forEach(card => {
          if (card.handPassive) {
              const { type, value } = card.handPassive;
              if (type === HandPassiveType.HEAL_ON_TURN_END) {
                  setPlayer(p => ({ ...p, currentHp: Math.min(p.maxHp, p.currentHp + value) }));
                  addFloatingText(`+${value} ❤️`, 20, 60, 'text-green-500');
              } else if (type === HandPassiveType.BLOCK_ON_TURN_END) {
                  setPlayer(p => ({ ...p, block: p.block + value }));
                  addFloatingText(`+${value} 🛡️`, 20, 50, 'text-blue-400');
              }
          }
      });

      // 2. Do NOT clear hand
      // setDiscardPile(prev => [...prev, ...hand]); 
      // setHand([]);

      setPhase('ENEMY_TURN');
  };

  // Auto-End Turn Logic
  useEffect(() => {
      if (phase === 'PLAYER_TURN') {
          // Check if any enemies are alive (to avoid triggering during win condition delay)
          const enemiesAlive = enemies.some(e => e.currentHp > 0);
          if (!enemiesAlive) return;

          // Check if any card is playable
          const hasPlayableCard = hand.some(c => c.cost <= player.currentEnergy);

          // Check if any skill is usable
          const hasUsableSkill = player.skills.some(s => 
              s.type === SkillType.ACTIVE && 
              (s.cost || 0) <= player.currentEnergy && 
              (s.currentCooldown || 0) === 0
          );

          if (!hasPlayableCard && !hasUsableSkill) {
              const timer = setTimeout(() => {
                  addFloatingText("无牌可出", 50, 20, 'text-gray-400 text-2xl font-bold');
                  endTurn();
              }, 1500); // 1.5s delay
              return () => clearTimeout(timer);
          }
      }
  }, [phase, hand, player.currentEnergy, player.skills, enemies]);

  // Enemy Turn AI
  useEffect(() => {
    if (phase === 'ENEMY_TURN') {
        const runEnemyAI = async () => {
            for (const enemy of enemies) {
                if (enemy.currentHp <= 0) continue;
                await new Promise(r => setTimeout(r, 600));
                
                // Logic
                if (enemy.intent === IntentType.ATTACK) {
                    const dmg = calculateDamage(enemy.intentValue, enemy, 'PLAYER');
                    let take = dmg;
                    if (player.block >= take) {
                        setPlayer(p => ({...p, block: p.block - take}));
                        take = 0;
                    } else {
                        take -= player.block;
                        setPlayer(p => ({...p, block: 0}));
                    }
                    if (take > 0) {
                        setPlayer(p => ({...p, currentHp: p.currentHp - take}));
                        triggerShake('PLAYER');
                        addFloatingText(`-${take}`, 20, 50, 'text-red-600 font-black text-3xl');
                    }
                } else if (enemy.intent === IntentType.BUFF) {
                    setEnemies(prev => prev.map(e => e.id === enemy.id ? {...e, block: e.block + 10} : e));
                }

                // Prepare Next Intent
                const nextType = Math.random() > 0.7 ? IntentType.BUFF : IntentType.ATTACK;
                const nextVal = nextType === IntentType.ATTACK ? 5 + Math.floor(level * 1.2) : 0;
                
                setEnemies(prev => prev.map(e => e.id === enemy.id ? {...e, intent: nextType, intentValue: nextVal} : e));
            }
            setPhase('PLAYER_TURN');
        };
        runEnemyAI();
    }
  }, [phase]);

  // Win/Loss Check
  useEffect(() => {
      if (enemies.length > 0 && enemies.every(e => e.currentHp <= 0) && phase !== 'REWARD' && phase !== 'LOADING') {
          setTimeout(() => {
              // Gen rewards
              const cardRewards = Array(3).fill(null).map(() => ({...CARD_REWARD_POOL[Math.floor(Math.random()*CARD_REWARD_POOL.length)], id: generateId()}));
              const skillReward = enemies.some(e => e.isBoss) ? {...SKILL_REWARD_POOL[0], id: generateId()} : undefined;
              
              setRewards({ cards: cardRewards, skill: skillReward });
              setPhase('REWARD');
          }, 800);
      }
  }, [enemies]);
  
  useEffect(() => {
      if (player.currentHp <= 0 && phase !== 'GAME_OVER') setPhase('GAME_OVER');
  }, [player.currentHp]);

  return {
      phase, setPhase, level, setLevel,
      player, setPlayer,
      deck, setDeck,
      hand, drawPile, discardPile,
      enemies, floatingTexts, vfxEvents, shakingTargets,
      rewards,
      startLevel, playCard, playCardBatch, useSkill, endTurn,
      calculateDamage // exposed for UI preview
  };
};
