
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
      const isBossLevel = level % 5 === 0;
      
      let candidates: EnemyTemplate[];

      if (isBossLevel) {
        // 从 Boss 列表中选取
        candidates = PRESET_ENEMIES.filter(e => e.isBoss);
      } else {
        // 从小兵列表中选取
        candidates = PRESET_ENEMIES.filter(e => !e.isBoss);
      }

      // 随机选择一个
      const enemy = candidates[Math.floor(Math.random() * candidates.length)];

      resolve({
        ...enemy,
        // 稍微动态化名字，避免完全重复 (可选)
        name: enemy.name,
        isBoss: isBossLevel // 强制确保逻辑一致
      });
    }, 600); // 600ms 延迟
  });
};
