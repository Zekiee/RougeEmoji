
import { useState, useRef, useEffect } from 'react';
import { DragState, Card, Skill, TargetType, CardTheme } from '../types';

interface UseDragControllerProps {
    game: any; // Using any here to avoid circular dependency hell or complex typing for the hook, but conceptually it's the object from useGame
}

export const useDragController = ({ game }: UseDragControllerProps) => {
    const dragStateRef = useRef<DragState>({
        isDragging: false, itemId: null, startX: 0, startY: 0, currentX: 0, currentY: 0, dragType: 'CARD', needsTarget: false
    });
    
    // Sync state for rendering
    const [dragState, setDragState] = useState<DragState>(dragStateRef.current);
    
    // Ref to game to avoid stale closures in event listeners
    const gameRef = useRef(game);
    useEffect(() => { gameRef.current = game; }, [game]);

    const updateDragState = (newState: DragState) => {
        dragStateRef.current = newState;
        setDragState(newState);
    };

    // 统一获取坐标的辅助函数
    const getEventXY = (e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent) => {
        if ('touches' in e && e.touches.length > 0) {
            return { x: e.touches[0].clientX, y: e.touches[0].clientY };
        } else if ('changedTouches' in e && e.changedTouches.length > 0) {
            return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
        } else if ('clientX' in e) {
            return { x: e.clientX, y: e.clientY };
        }
        return { x: 0, y: 0 };
    };

    useEffect(() => {
        const handleMove = (e: MouseEvent | TouchEvent) => {
            const ds = dragStateRef.current;
            if (ds.isDragging) {
                if (e.cancelable) e.preventDefault();
                
                const { x, y } = getEventXY(e);
                const offsetY = ('touches' in e) ? -60 : 0;
                updateDragState({ ...ds, currentX: x, currentY: y + offsetY });
            }
        };

        const handleDrop = (e: MouseEvent | TouchEvent) => {
            const ds = dragStateRef.current;
            const currentGame = gameRef.current;
            const { x: clientX, y: clientY } = getEventXY(e);
            const { needsTarget, itemId, dragType, groupTag } = ds;
            
            const elements = document.elementsFromPoint(clientX, clientY);
            const enemyElement = elements.find(el => el.hasAttribute('data-enemy-id'));
            const targetId = enemyElement?.getAttribute('data-enemy-id');

            if (needsTarget) {
                if (targetId && itemId) {
                    if (dragType === 'CARD') {
                        if (groupTag) {
                            const stack = currentGame.hand.filter((c: Card) => c.groupTag === groupTag || c.id === itemId);
                            currentGame.playCardBatch(stack, targetId, ds.startX, ds.startY);
                        } else {
                            const card = currentGame.hand.find((c: Card) => c.id === itemId);
                            if (card) currentGame.playCard(card, targetId, ds.startX, ds.startY);
                        }
                    } else {
                        currentGame.useSkill(itemId, targetId, ds.startX, ds.startY);
                    }
                }
            } else {
                // 调整判定区域
                if (clientY < window.innerHeight * 0.6 && itemId) {
                     if (dragType === 'CARD') {
                         const card = currentGame.hand.find((c: Card) => c.id === itemId);
                         if (card) currentGame.playCard(card, undefined, ds.startX, ds.startY);
                     } else {
                         currentGame.useSkill(itemId, undefined, ds.startX, ds.startY);
                     }
                }
            }
            updateDragState({ isDragging: false, itemId: null, startX: 0, startY: 0, currentX: 0, currentY: 0, dragType: 'CARD', needsTarget: false });
        };

        const handleEnd = (e: MouseEvent | TouchEvent) => {
            const ds = dragStateRef.current;
            if (ds.isDragging) {
                handleDrop(e);
            }
        };

        window.addEventListener('mousemove', handleMove, { passive: false });
        window.addEventListener('mouseup', handleEnd);
        window.addEventListener('touchmove', handleMove, { passive: false });
        window.addEventListener('touchend', handleEnd);
        window.addEventListener('touchcancel', handleEnd);

        return () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleEnd);
            window.removeEventListener('touchmove', handleMove);
            window.removeEventListener('touchend', handleEnd);
            window.removeEventListener('touchcancel', handleEnd);
        };
    }, []);

    const startDragCard = (e: React.MouseEvent | React.TouchEvent, card: Card) => {
        if (gameRef.current.phase !== 'PLAYER_TURN' || gameRef.current.player.currentEnergy < card.cost) return;
        
        const { x, y } = getEventXY(e);
        const needsTarget = card.effects.some(ef => ef.target === TargetType.SINGLE_ENEMY);
        const offsetY = ('touches' in e) ? -60 : 0;
        
        updateDragState({
            isDragging: true, itemId: card.id,
            startX: x, startY: y, currentX: x, currentY: y + offsetY,
            dragType: 'CARD', needsTarget, groupTag: card.groupTag, theme: card.theme,
            sourceItem: card
        });
    };

    const startDragSkill = (e: React.MouseEvent | React.TouchEvent, skill: Skill) => {
        if (gameRef.current.phase !== 'PLAYER_TURN' || 
            (skill.cost && gameRef.current.player.currentEnergy < skill.cost) || 
            (skill.currentCooldown || 0) > 0) return;

        const { x, y } = getEventXY(e);
        const needsTarget = skill.effects?.some(ef => ef.target === TargetType.SINGLE_ENEMY) || false;
        const offsetY = ('touches' in e) ? -60 : 0;

        updateDragState({
            isDragging: true, itemId: skill.id,
            startX: x, startY: y, currentX: x, currentY: y + offsetY,
            dragType: 'SKILL', needsTarget, theme: CardTheme.HOLY,
            sourceItem: skill
        });
    };

    return {
        dragState,
        startDragCard,
        startDragSkill
    };
};
