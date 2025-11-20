
import { useState, useRef, useEffect } from 'react';
import { DragState, Card, Skill, TargetType, CardTheme } from '../types';
import { DESIGN_WIDTH, DESIGN_HEIGHT } from './useWindowScale';

interface UseDragControllerProps {
    game: any;
    scale: number;
    isPortrait: boolean;
}

export const useDragController = ({ game, scale, isPortrait }: UseDragControllerProps) => {
    const dragStateRef = useRef<DragState>({
        isDragging: false, itemId: null, startX: 0, startY: 0, currentX: 0, currentY: 0, dragType: 'CARD', needsTarget: false
    });
    
    const [dragState, setDragState] = useState<DragState>(dragStateRef.current);
    const gameRef = useRef(game);
    useEffect(() => { gameRef.current = game; }, [game]);

    const updateDragState = (newState: DragState) => {
        dragStateRef.current = newState;
        setDragState(newState);
    };

    // Transform Screen Coordinates (clientX/Y) to Game Coordinates (0-1600, 0-900)
    const getGameXY = (e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent) => {
        let clientX = 0;
        let clientY = 0;

        if ('touches' in e && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else if ('changedTouches' in e && e.changedTouches.length > 0) {
            clientX = e.changedTouches[0].clientX;
            clientY = e.changedTouches[0].clientY;
        } else if ('clientX' in e) {
            clientX = (e as React.MouseEvent).clientX;
            clientY = (e as React.MouseEvent).clientY;
        }

        // Center of the screen
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        // Vector from center
        const dx = clientX - centerX;
        const dy = clientY - centerY;

        let gameX = 0;
        let gameY = 0;

        if (isPortrait) {
            // If rotated 90deg clockwise:
            // Screen X+ maps to Game Y+
            // Screen Y+ maps to Game X- (inverted)
            // Need to reverse the rotation logic carefully based on CSS rotate(90deg)
            
            // Visual: Top of Phone (Screen Y=0) is Left of Game (Game X=0)
            // Visual: Right of Phone (Screen X=Max) is Top of Game (Game Y=0) -> Wait, CSS rotate(90)
            
            // CSS rotate(90deg) turns the element clockwise.
            // Screen Top (Y=0) -> aligns with Game Left
            // Screen Right (X=Max) -> aligns with Game Top
            
            // Let's use un-rotated vector logic
            // Rotate vector -90deg to map back to local space
            // x' = x*cos(-90) - y*sin(-90) = y
            // y' = x*sin(-90) + y*cos(-90) = -x
            
            gameX = dy / scale;
            gameY = -dx / scale;
        } else {
            gameX = dx / scale;
            gameY = dy / scale;
        }

        // Add offset to return to 0-1600 coordinate space (from center-relative)
        return { 
            x: gameX + DESIGN_WIDTH / 2, 
            y: gameY + DESIGN_HEIGHT / 2 
        };
    };

    useEffect(() => {
        const handleMove = (e: MouseEvent | TouchEvent) => {
            const ds = dragStateRef.current;
            if (ds.isDragging) {
                if (e.cancelable) e.preventDefault();
                const { x, y } = getGameXY(e);
                updateDragState({ ...ds, currentX: x, currentY: y });
            }
        };

        const handleDrop = (e: MouseEvent | TouchEvent) => {
            const ds = dragStateRef.current;
            const currentGame = gameRef.current;
            const { x, y } = getGameXY(e); // Get Game Coordinates
            const { needsTarget, itemId, dragType, groupTag } = ds;
            
            // Hit Test using Document (Screen Coordinates) for Element detection
            // We still use document.elementsFromPoint with raw client coordinates to find the DIV
            let clientX = 0, clientY = 0;
            if('changedTouches' in e && e.changedTouches.length > 0) {
                clientX = e.changedTouches[0].clientX; clientY = e.changedTouches[0].clientY;
            } else if ('clientX' in e) {
                clientX = (e as MouseEvent).clientX; clientY = (e as MouseEvent).clientY;
            }

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
                // Drop zone logic (Upper area of the screen)
                // In Game Coordinates: Y < 600 (approx 2/3 up)
                if (y < 600 && itemId) {
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
    }, [scale, isPortrait]); // Re-bind if scale/orientation changes to ensure math is correct

    const startDragCard = (e: React.MouseEvent | React.TouchEvent, card: Card) => {
        if (gameRef.current.phase !== 'PLAYER_TURN' || gameRef.current.player.currentEnergy < card.cost) return;
        
        const { x, y } = getGameXY(e);
        const needsTarget = card.effects.some(ef => ef.target === TargetType.SINGLE_ENEMY);
        const offsetY = -100; // Visual lift in Game Units
        
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

        const { x, y } = getGameXY(e);
        const needsTarget = skill.effects?.some(ef => ef.target === TargetType.SINGLE_ENEMY) || false;
        const offsetY = -100;

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
