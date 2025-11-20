
import { useState, useEffect } from 'react';

export const useWindowScale = () => {
    const [globalScale, setGlobalScale] = useState(1);
    const [isPortrait, setIsPortrait] = useState(window.innerHeight > window.innerWidth);

    useEffect(() => {
        const handleResize = () => {
            const w = window.innerWidth;
            const h = window.innerHeight;
            
            setIsPortrait(h > w);
            
            if (w === 0 || h === 0) return;
  
            // --- 分辨率适配逻辑优化 ---
            // 之前的 800x420 导致在 896x414 这种分辨率下 scale 接近 1，元素过大。
            // 提高设计基准分辨率，相当于在小屏幕上 "Zoom Out"。
            // 设置基准高度为 640px (适配大多数移动端逻辑高度)，基准宽度为 1136px。
            const SAFE_WIDTH = 1136;
            const SAFE_HEIGHT = 640; 
            
            const scaleX = w / SAFE_WIDTH;
            const scaleY = h / SAFE_HEIGHT;
            
            // 取最小值，确保内容全部可见
            // 在宽屏手机上，通常由高度决定缩放比例 (scaleY)，这会让左右两侧视野更广
            let newScale = Math.min(scaleX, scaleY);
  
            // Safety check
            if (!Number.isFinite(newScale) || newScale <= 0) newScale = 1;
  
            // 桌面端优化：限制最大缩放，防止在大显示器上UI大得离谱
            if (newScale > 1.1) newScale = 1.1;
            
            // 移动端最小值保护，防止字太小看不见
            if (newScale < 0.35) newScale = 0.35;
  
            setGlobalScale(newScale);
        };
        
        window.addEventListener('resize', handleResize);
        handleResize(); // Init
        
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return { globalScale, isPortrait };
};
