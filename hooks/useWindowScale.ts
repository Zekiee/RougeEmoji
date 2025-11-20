
import { useState, useEffect } from 'react';

// 修改为 720P 分辨率，这样在手机和电脑上元素都会显得更大
export const DESIGN_WIDTH = 1280;
export const DESIGN_HEIGHT = 720;

export const useWindowScale = () => {
    const [containerStyle, setContainerStyle] = useState<React.CSSProperties>({});
    const [scale, setScale] = useState(1);
    const [isPortrait, setIsPortrait] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            const w = window.innerWidth;
            const h = window.innerHeight;
            
            // Determine physical orientation
            const isVert = h > w;
            setIsPortrait(isVert);
            
            // Target dimension matching
            const availableWidth = isVert ? h : w;
            const availableHeight = isVert ? w : h;
            
            // Calculate scale to CONTAIN the 1280x720 box within the screen
            const scaleX = availableWidth / DESIGN_WIDTH;
            const scaleY = availableHeight / DESIGN_HEIGHT;
            const finalScale = Math.min(scaleX, scaleY);
            
            setScale(finalScale);

            setContainerStyle({
                width: `${DESIGN_WIDTH}px`,
                height: `${DESIGN_HEIGHT}px`,
                position: 'fixed',
                top: '50%',
                left: '50%',
                // Rotate 90deg if portrait to force landscape mode
                transform: `translate(-50%, -50%) rotate(${isVert ? 90 : 0}deg) scale(${finalScale})`,
                transformOrigin: 'center center',
            });
        };
        
        window.addEventListener('resize', handleResize);
        handleResize();
        
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return { containerStyle, scale, isPortrait };
};
