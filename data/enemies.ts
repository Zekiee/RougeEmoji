
export interface EnemyTemplate {
    name: string;
    description: string;
    emoji: string;
    intentDescription: string;
    isBoss: boolean;
}

export const PRESET_ENEMIES: EnemyTemplate[] = [
    // --- 小兵 (6个) ---
    {
        name: "暴躁史莱姆",
        description: "它看起来心情很不好，可能是因为它是绿色的。",
        emoji: "🤢",
        intentDescription: "准备撞击",
        isBoss: false
    },
    {
        name: "摸鱼骷髅",
        description: "上班时间在玩手机，被你发现了。",
        emoji: "💀",
        intentDescription: "挥舞骨头",
        isBoss: false
    },
    {
        name: "实习生哥布林",
        description: "为了转正，它必须打败你。",
        emoji: "👺",
        intentDescription: "努力攻击",
        isBoss: false
    },
    {
        name: "熬夜蝙蝠",
        description: "黑眼圈比你还重，性格非常暴躁。",
        emoji: "🦇",
        intentDescription: "吸血冲动",
        isBoss: false
    },
    {
        name: "自闭仙人掌",
        description: "不想说话，只想扎人。",
        emoji: "🌵",
        intentDescription: "尖刺防御",
        isBoss: false
    },
    {
        name: "路痴幽灵",
        description: "它找不到回家的路，所以决定缠着你。",
        emoji: "👻",
        intentDescription: "恐怖尖叫",
        isBoss: false
    },
    // --- Boss (4个) ---
    {
        name: "996大魔王",
        description: "拥有无穷无尽的项目和福报。",
        emoji: "😈",
        intentDescription: "发布需求",
        isBoss: true
    },
    {
        name: "暴走机甲",
        description: "由于系统Bug，它决定毁灭世界。",
        emoji: "🤖",
        intentDescription: "激光充能",
        isBoss: true
    },
    {
        name: "远古巨龙",
        description: "虽然看起来很凶，但其实是在守护它的零食。",
        emoji: "🐉",
        intentDescription: "火焰吐息",
        isBoss: true
    },
    {
        name: "外星指挥官",
        description: "试图通过表情包来征服地球。",
        emoji: "👽",
        intentDescription: "心灵控制",
        isBoss: true
    }
];
