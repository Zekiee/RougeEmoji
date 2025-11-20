
import React from 'react';
import { VFXEvent, CardTheme } from '../types';

interface VFXLayerProps {
  events: VFXEvent[];
}

const VFXLayer: React.FC<VFXLayerProps> = ({ events }) => {
  if (events.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-[100] overflow-hidden">
      {events.map(event => {
        if (event.type === 'PROJECTILE') {
            const dx = (event.endX || 0) - (event.startX || 0);
            const dy = (event.endY || 0) - (event.startY || 0);
            const angle = Math.atan2(dy, dx) * 180 / Math.PI;
            
            let trailColor = 'bg-white';
            let particle = '⚪';
            
            switch(event.theme) {
                case CardTheme.FIRE: trailColor = 'bg-orange-500'; particle = '🔥'; break;
                case CardTheme.ICE: trailColor = 'bg-cyan-300'; particle = '❄️'; break;
                case CardTheme.POISON: trailColor = 'bg-purple-500'; particle = '☠️'; break;
                case CardTheme.HOLY: trailColor = 'bg-yellow-200'; particle = '✨'; break;
                case CardTheme.DARK: trailColor = 'bg-gray-800'; particle = '🌑'; break;
                default: trailColor = 'bg-slate-300'; particle = '💨'; break;
            }

            return (
                <div 
                    key={event.id}
                    className="absolute flex items-center justify-center text-4xl animate-projectile"
                    style={{
                        left: event.startX,
                        top: event.startY,
                        '--tx': `${dx}px`,
                        '--ty': `${dy}px`
                    } as any}
                >
                    <div className="relative">
                        {particle}
                        <div className={`absolute top-1/2 left-1/2 w-20 h-2 rounded-full ${trailColor} blur-md -z-10 origin-left opacity-70`} 
                             style={{ transform: `translate(-50%, -50%) rotate(${angle + 180}deg)` }}>
                        </div>
                    </div>
                </div>
            );
        } else if (event.type === 'IMPACT') {
            return (
                <div 
                    key={event.id} 
                    className="absolute text-6xl animate-pop"
                    style={{ left: event.startX, top: event.startY, transform: 'translate(-50%, -50%)' }}
                >
                    💥
                </div>
            );
        } else if (event.type === 'SLASH') {
            return (
                <div key={event.id} className="absolute w-40 h-40" style={{ left: event.startX, top: event.startY, transform: 'translate(-50%, -50%) rotate(45deg)' }}>
                    <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
                         <path d="M 0,0 Q 50,50 100,0" fill="none" stroke="white" strokeWidth="4" className="animate-slash opacity-0 filter drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                    </svg>
                </div>
            );
        } else if (event.type === 'EXPLOSION') {
             return (
                <div key={event.id} className="absolute" style={{ left: event.startX, top: event.startY }}>
                    <div className="absolute w-20 h-20 bg-orange-500 rounded-full blur-xl opacity-50 animate-pop" style={{transform: 'translate(-50%, -50%)'}}></div>
                    <div className="absolute text-8xl animate-pop" style={{transform: 'translate(-50%, -50%)'}}>💣</div>
                </div>
            );
        } else if (event.type === 'BUFF') {
            return (
                <div key={event.id} className="absolute" style={{ left: event.startX, top: event.startY }}>
                    <div className="absolute w-40 h-40 border-4 border-yellow-300 rounded-full animate-pop opacity-0" style={{transform: 'translate(-50%, -50%)'}}></div>
                    <div className="absolute inset-0 flex items-center justify-center text-6xl animate-soul-rise">✨</div>
                </div>
            );
        }
        return null;
      })}
      
      <style>{`
        @keyframes projectile-fly {
            0% { transform: translate(0, 0) scale(0.5); opacity: 0.8; }
            100% { transform: translate(var(--tx), var(--ty)) scale(1.2); opacity: 1; }
        }
        .animate-projectile {
            animation: projectile-fly 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
      `}</style>
    </div>
  );
};

export default VFXLayer;
