
import { useState, useEffect, useCallback } from 'react';
import { 
  Player, Enemy, Card, CardType, GamePhase, IntentType, EffectType, 
  TargetType, StatusType, FloatingText, VFXEvent, Status, SkillType, CardTheme, HandPassiveType 
} from '../types';
import { generateId, CARD_REWARD_POOL, SKILL_REWARD_POOL } from '../constants';
import { generateEnemyProfile } from '../services/geminiService';
import { PRESET_ENEMIES } from '../data/enemies'; 

export const useGame = () => {
  const [phase, setPhase] = useState<GamePhase>('START_SCREEN');
  const [level, setLevel] = useState(1);
  const [turnCount, setTurnCount] = useState(1);
  
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
  const [flashTargets, setFlashTargets] = useState<string[]>([]); // New: White flash on hit
  const [rewards, setRewards] = useState<{cards: Card[], skill?: any}>({cards: []});

  // --- VFX Helpers ---
  const triggerVFX = (type: VFXEvent['type'], startX: number, startY: number, endX?: number, endY?: number, theme?: CardTheme) => {
      const id = generateId();
      setVfxEvents(prev => [...prev, { id, type, startX, startY, endX, endY, theme }]);
      setTimeout(() => {
          setVfxEvents(prev => prev.filter(e => e.id !== id));
      }, 600);
  };

  const addFloatingText = (text: string, targetId: string | null, x?: number, y?: number, color: string = 'text-white', size: 'small' | 'medium' | 'large' = 'medium') => {
    const id = Date.now() + Math.random();
    setFloatingTexts(prev => [...prev, { id, text, targetId: targetId || undefined, x, y, color, size }]);
    setTimeout(() => setFloatingTexts(prev => prev.filter(ft => ft.id !== id)), 1200);
  };

  const triggerShake = (targetId: string) => {
      setShakingTargets(prev => [...prev, targetId]);
      setFlashTargets(prev => [...prev, targetId]); // Trigger flash
      setTimeout(() => {
          setShakingTargets(prev => prev.filter(id => id !== targetId));
          setFlashTargets(prev => prev.filter(id => id !== targetId));
      }, 500);
  };

  // --- Combat Logic ---
  const calculateDamage = (baseValue: number, source: 'PLAYER' | Enemy, target: 'PLAYER' | Enemy): number => {
      let dmg = baseValue;
      
      // Source Mods
      if (source === 'PLAYER') {
          const strength = player.statuses.find(s => s.type === StatusType.STRENGTH)?.value || 0;
          dmg += strength;
          
          if (player.skills.some(s => s.type === SkillType.PASSIVE && s.passiveEffect === 'DAMAGE_BOOST_1')) {
              dmg += 1;
          }

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
      } else {
          // Enemy Source Mods
          const strength = source.statuses.find(s => s.type === StatusType.STRENGTH)?.value || 0;
          dmg += strength;
          if (source.statuses.find(s => s.type === StatusType.WEAK)) {
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
    if (targets.length > 0 && sourceCoords) {
         targets.forEach(t => {
             const targetEl = document.querySelector(`[data-enemy-id="${t.id}"]`);
             if (targetEl) {
                 const rect = targetEl.getBoundingClientRect();
                 // Adjust for 720p canvas scaling if needed, but rects are screen coords
                 // Actually useDragController handles scaling, here we just need visual start/end
                 // Use a simpler "Slash" at target location
                 if (effect.type === EffectType.DAMAGE) {
                     triggerVFX('SLASH', rect.left + rect.width/2, rect.top + rect.height/2, undefined, undefined, theme);
                 } else if (effect.type === EffectType.APPLY_STATUS) {
                     triggerVFX('PROJECTILE', sourceCoords.x, sourceCoords.y, rect.left + rect.width/2, rect.top + rect.height/2, theme);
                 }
             }
         });
    }

    switch (effect.type) {
        case EffectType.DAMAGE: {
            setTimeout(() => { 
                targets.forEach(enemy => {
                    const dmg = calculateDamage(effect.value, 'PLAYER', enemy);
                    let finalDmg = dmg;
                    
                    // Block Logic
                    if (enemy.block > 0) {
                        if (enemy.block >= dmg) {
                            setEnemies(prev => prev.map(e => e.id === enemy.id ? { ...e, block: e.block - dmg } : e));
                            finalDmg = 0;
                            addFloatingText("格挡", enemy.id, undefined, undefined, 'text-gray-400', 'small');
                        } else {
                            finalDmg -= enemy.block;
                            setEnemies(prev => prev.map(e => e.id === enemy.id ? { ...e, block: 0 } : e));
                        }
                    }
                    
                    if (finalDmg > 0) {
                        setEnemies(prev => prev.map(e => e.id === enemy.id ? { ...e, currentHp: Math.max(0, e.currentHp - finalDmg) } : e));
                        triggerShake(enemy.id);
                        addFloatingText(`-${finalDmg}`, enemy.id, undefined, undefined, 'text-red-500 font-black', 'large');
                        // Impact VFX on target
                        const targetEl = document.querySelector(`[data-enemy-id="${enemy.id}"]`);
                        if(targetEl) {
                            const rect = targetEl.getBoundingClientRect();
                             triggerVFX('IMPACT', rect.left + rect.width/2, rect.top + rect.height/2);
                        }
                    }
                });
            }, 200); // Fast reaction
            break;
        }
        case EffectType.BLOCK:
            setPlayer(p => ({ ...p, block: p.block + effect.value }));
            addFloatingText(`+${effect.value} 🛡️`, 'PLAYER', undefined, undefined, 'text-blue-400', 'medium');
            triggerVFX('BUFF', window.innerWidth * 0.15, window.innerHeight * 0.6); // Rough player pos
            break;
        case EffectType.HEAL:
            setPlayer(p => ({ ...p, currentHp: Math.min(p.maxHp, p.currentHp + effect.value) }));
            addFloatingText(`+${effect.value} ❤️`, 'PLAYER', undefined, undefined, 'text-green-500', 'medium');
            break;
        case EffectType.DRAW:
            drawCards(effect.value);
            break;
        case EffectType.ADD_ENERGY:
            setPlayer(p => ({ ...p, currentEnergy: p.currentEnergy + effect.value }));
            addFloatingText(`+${effect.value} ⚡`, 'PLAYER', undefined, undefined, 'text-yellow-400', 'medium');
            break;
        case EffectType.APPLY_STATUS: {
            setTimeout(() => {
                if (effect.target === TargetType.SELF) {
                    setPlayer(p => ({...p, statuses: applyStatus(p.statuses, effect.statusType!, effect.value)}));
                    addFloatingText(`${effect.statusType}`, 'PLAYER', undefined, undefined, 'text-purple-400', 'small');
                } else {
                    targets.forEach(t => {
                        setEnemies(prev => prev.map(e => e.id === t.id ? {
                            ...e, statuses: applyStatus(e.statuses, effect.statusType!, effect.value)
                        } : e));
                        addFloatingText(`${effect.statusType}`, t.id, undefined, undefined, 'text-purple-400', 'small');
                    });
                }
            }, 200);
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
      setTurnCount(1);

      const profile = await generateEnemyProfile(lvl);
      const scale = Math.pow(1.15, lvl - 1);
      const bossHp = Math.floor(100 * scale);
      
      const mainEnemy: Enemy = {
          id: generateId(),
          name: profile.name, description: profile.description, emoji: profile.emoji,
          maxHp: bossHp, currentHp: bossHp, block: 0, statuses: [], 
          intent: IntentType.ATTACK, intentValue: 6 + Math.floor(lvl * 1.5), isBoss: true
      };
      
      const initialEnemies = [mainEnemy];
      const numMinions = Math.floor(Math.random() * 2) + 1; 
      const minionTemplates = PRESET_ENEMIES.filter(e => !e.isBoss);
      
      for (let i = 0; i < numMinions; i++) {
          const t = minionTemplates[Math.floor(Math.random() * minionTemplates.length)];
          const minionHp = Math.floor(bossHp * 0.3); 
          initialEnemies.push({
              id: generateId(),
              name: t.name, description: t.description, emoji: t.emoji,
              maxHp: minionHp, currentHp: minionHp, block: 0, statuses: [],
              intent: IntentType.ATTACK, intentValue: Math.floor(lvl * 0.8) + 3, isBoss: false
          });
      }

      setEnemies(initialEnemies);
      
      // Deck Init
      const initialDrawPile = [...currentDeck].sort(() => Math.random() - 0.5);
      let initialHand: Card[] = [];

      if (player.fixedStartingHand.length > 0) {
          for (const fixedId of player.fixedStartingHand) {
              const idx = initialDrawPile.findIndex(c => c.templateId === fixedId);
              if (idx !== -1) {
                  initialHand.push(initialDrawPile[idx]);
                  initialDrawPile.splice(idx, 1);
              }
          }
      }

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
      let currentDraw = [...drawPile];
      let currentDiscard = [...discardPile];
      let currentHand = [...hand];
      
      for(let i=0; i<count; i++) {
          if (currentDraw.length === 0) {
              if (currentDiscard.length === 0) break;
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

  const drawToLimit = (limit: number) => {
      const currentCount = hand.length;
      if (currentCount >= limit) return;
      drawCards(limit - currentCount);
  };

  useEffect(() => {
      if (phase === 'PLAYER_TURN') {
          setPlayer(p => ({
              ...p, 
              block: 0, 
              currentEnergy: p.maxEnergy,
              statuses: p.statuses.map(s => s.type === StatusType.DOUBLE_NEXT_ATTACK ? s : {...s, value: Math.max(0, s.value - 1)}).filter(s => s.value > 0 || s.type === StatusType.STRENGTH),
              skills: p.skills.map(s => s.type === SkillType.ACTIVE ? {...s, currentCooldown: Math.max(0, (s.currentCooldown || 0) - 1)} : s)
          }));
          
          drawToLimit(player.baseDrawCount);
      }
  }, [phase]); 

  const playCard = (card: Card, targetId?: string, mouseX?: number, mouseY?: number) => {
      if (player.currentEnergy < card.cost) return;
      setPlayer(p => ({ ...p, currentEnergy: p.currentEnergy - card.cost }));
      setHand(prev => prev.filter(c => c.id !== card.id));
      setDiscardPile(prev => [...prev, card]);

      let consumeDouble = false;
      if (card.type === CardType.ATTACK && player.statuses.find(s => s.type === StatusType.DOUBLE_NEXT_ATTACK)) {
          consumeDouble = true;
      }

      card.effects.forEach(eff => resolveEffect(eff, targetId, {x: mouseX || 0, y: mouseY || 0}, card.theme));

      if (consumeDouble) {
           setPlayer(p => ({...p, statuses: p.statuses.filter(s => s.type !== StatusType.DOUBLE_NEXT_ATTACK)}));
           addFloatingText("双倍消耗!", 'PLAYER', undefined, undefined, 'text-yellow-400', 'small');
      }
  };

  const playCardBatch = (cards: Card[], targetId?: string, startX?: number, startY?: number) => {
      const totalCost = cards.reduce((sum, c) => sum + c.cost, 0);
      if (player.currentEnergy < totalCost) {
          addFloatingText("能量不足!", 'PLAYER', undefined, undefined, 'text-red-500', 'medium');
          return;
      }
      setPlayer(p => ({ ...p, currentEnergy: p.currentEnergy - totalCost }));
      const cardIds = new Set(cards.map(c => c.id));
      setHand(prev => prev.filter(c => !cardIds.has(c.id)));
      setDiscardPile(prev => [...prev, ...cards]);
      cards.forEach((card, index) => {
          setTimeout(() => {
              card.effects.forEach(eff => resolveEffect(eff, targetId, {x: startX || 0, y: startY || 0}, card.theme));
          }, index * 200);
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
      hand.forEach(card => {
          if (card.handPassive) {
              const { type, value } = card.handPassive;
              if (type === HandPassiveType.HEAL_ON_TURN_END) {
                  setPlayer(p => ({ ...p, currentHp: Math.min(p.maxHp, p.currentHp + value) }));
                  addFloatingText(`+${value} ❤️`, 'PLAYER', undefined, undefined, 'text-green-500', 'medium');
              } else if (type === HandPassiveType.BLOCK_ON_TURN_END) {
                  setPlayer(p => ({ ...p, block: p.block + value }));
                  addFloatingText(`+${value} 🛡️`, 'PLAYER', undefined, undefined, 'text-blue-400', 'medium');
              }
          }
      });
      setPhase('ENEMY_TURN');
  };

  useEffect(() => {
      if (phase === 'PLAYER_TURN') {
          const enemiesAlive = enemies.some(e => e.currentHp > 0);
          if (!enemiesAlive) return;

          const hasPlayableCard = hand.some(c => c.cost <= player.currentEnergy);
          const hasUsableSkill = player.skills.some(s => 
              s.type === SkillType.ACTIVE && 
              (s.cost || 0) <= player.currentEnergy && 
              (s.currentCooldown || 0) === 0
          );

          if (!hasPlayableCard && !hasUsableSkill) {
              const timer = setTimeout(() => {
                  addFloatingText("无牌可出", 'PLAYER', undefined, undefined, 'text-gray-400 text-2xl font-bold');
                  endTurn();
              }, 1500);
              return () => clearTimeout(timer);
          }
      }
  }, [phase, hand, player.currentEnergy, player.skills, enemies]);

  // Enemy Turn AI
  useEffect(() => {
    if (phase === 'ENEMY_TURN') {
        const runEnemyAI = async () => {
            if (turnCount > 10) {
                addFloatingText("🔥 狂暴!", 'PLAYER', undefined, undefined, 'text-red-600 font-black', 'large');
                setEnemies(prev => prev.map(e => ({...e, statuses: applyStatus(e.statuses, StatusType.STRENGTH, 1)})));
                await new Promise(r => setTimeout(r, 800));
            }

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
                        addFloatingText(`-${take}`, 'PLAYER', undefined, undefined, 'text-red-600 font-black', 'large');
                        triggerVFX('SLASH', window.innerWidth * 0.15, window.innerHeight * 0.6, undefined, undefined, CardTheme.DARK);
                    }
                } else if (enemy.intent === IntentType.BUFF) {
                    setEnemies(prev => prev.map(e => e.id === enemy.id ? {...e, block: e.block + 10} : e));
                } else if (enemy.intent === IntentType.SUMMON) {
                    if (enemies.filter(e => e.currentHp > 0).length < 4) {
                         const minionTemplates = PRESET_ENEMIES.filter(e => !e.isBoss);
                         const t = minionTemplates[Math.floor(Math.random() * minionTemplates.length)];
                         const bossHp = enemies.find(e => e.isBoss)?.maxHp || 100;
                         const minionHp = Math.floor(bossHp * 0.3);
                         
                         const newMinion: Enemy = {
                            id: generateId(),
                            name: t.name, description: t.description, emoji: t.emoji,
                            maxHp: minionHp, currentHp: minionHp, block: 0, statuses: [],
                            intent: IntentType.ATTACK, intentValue: Math.floor(level * 0.8) + 3, isBoss: false
                        };
                        setEnemies(prev => [...prev, newMinion]);
                        triggerVFX('EXPLOSION', 800, 400, undefined, undefined, CardTheme.DARK); // Approx
                        addFloatingText("援军!", enemy.id, undefined, undefined, 'text-purple-500', 'medium');
                    } else {
                        addFloatingText("召唤失败", enemy.id, undefined, undefined, 'text-gray-400', 'small');
                    }
                } else if (enemy.intent === IntentType.SPECIAL) {
                    const dmg = calculateDamage(Math.floor(enemy.intentValue * 1.5), enemy, 'PLAYER');
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
                        addFloatingText(`💥 ${take}`, 'PLAYER', undefined, undefined, 'text-red-800 font-black', 'large');
                        triggerVFX('EXPLOSION', window.innerWidth * 0.15, window.innerHeight * 0.6, undefined, undefined, CardTheme.FIRE);
                    }
                }

                // Prepare Next Intent
                let nextType = IntentType.ATTACK;
                let nextVal = 0;

                if (enemy.isBoss) {
                    const rand = Math.random();
                    const activeMinions = enemies.filter(e => e.currentHp > 0 && !e.isBoss).length;
                    
                    if (activeMinions < 2 && rand < 0.3) {
                        nextType = IntentType.SUMMON;
                    } else if (rand < 0.5) {
                        nextType = IntentType.ATTACK;
                        nextVal = 6 + Math.floor(level * 1.5);
                    } else if (rand < 0.7) {
                        nextType = IntentType.BUFF;
                    } else if (rand < 0.85) {
                        nextType = IntentType.SPECIAL;
                        nextVal = 10 + Math.floor(level * 2);
                    } else {
                        nextType = IntentType.ATTACK;
                        nextVal = 6 + Math.floor(level * 1.5);
                    }
                } else {
                     nextType = Math.random() > 0.6 ? IntentType.BUFF : IntentType.ATTACK;
                     nextVal = nextType === IntentType.ATTACK ? 3 + Math.floor(level * 0.8) : 0;
                }
                
                setEnemies(prev => prev.map(e => e.id === enemy.id ? {...e, intent: nextType, intentValue: nextVal} : e));
            }
            
            setTurnCount(prev => prev + 1);
            setPhase('PLAYER_TURN');
        };
        runEnemyAI();
    }
  }, [phase]);

  useEffect(() => {
      if (enemies.length > 0 && enemies.every(e => e.currentHp <= 0) && phase !== 'REWARD' && phase !== 'LOADING') {
          setTimeout(() => {
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
      turnCount, 
      player, setPlayer,
      deck, setDeck,
      hand, drawPile, discardPile,
      enemies, floatingTexts, vfxEvents, shakingTargets, flashTargets,
      rewards,
      startLevel, playCard, playCardBatch, useSkill, endTurn,
      calculateDamage
  };
};
