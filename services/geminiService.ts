
import { PRESET_ENEMIES, EnemyTemplate } from '../data/enemies';

export interface GeneratedEnemyProfile {
  name: string;
  description: string;
  emoji: string;
  intentDescription: string;
  isBoss: boolean;
}

// 模拟异步生成敌人
export const generateEnemyProfile = async (level: number): Promise<GeneratedEnemyProfile> => {
  return new Promise((resolve) => {
    // 简单的延迟，模拟加载感
    setTimeout(() => {
      // 修改：不再区分小怪层，全部从 Boss 列表中选取
      const candidates = PRESET_ENEMIES.filter(e => e.isBoss);
      // 如果没有找到Boss（理论上不应该），则回退到全部
      const pool = candidates.length > 0 ? candidates : PRESET_ENEMIES;
      const enemy = pool[Math.floor(Math.random() * pool.length)];

      resolve({
        ...enemy,
        name: enemy.name,
        isBoss: true // 强制标记为 Boss
      });
    }, 600); // 600ms 延迟
  });
};
