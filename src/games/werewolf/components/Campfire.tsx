import React from 'react';
import './Campfire.css';

export const Campfire = () => {
  const size = 128; // Larger size for the centerpiece

  // Helper to render a pixel rect
  const P = ({ x, y, color, w = 1, h = 1, className, style }: { x: number; y: number; color: string; w?: number; h?: number; className?: string; style?: React.CSSProperties }) => (
    <rect x={x} y={y} width={w} height={h} fill={color} className={className} style={style} />
  );

  return (
    <div className="campfire-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 32 32" 
        xmlns="http://www.w3.org/2000/svg" 
        style={{ imageRendering: 'pixelated', overflow: 'visible' }}
      >
        {/* 木柴 (深色木头) - 32x32 网格 */}
        <P x={6} y={26} w={20} h={3} color="#4E342E" />
        <P x={7} y={24} w={18} h={2} color="#5D4037" />
        <P x={4} y={28} w={4} h={2} color="#3E2723" />
        <P x={24} y={28} w={4} h={2} color="#3E2723" />
        
        {/* 内部火焰 (白热) */}
        <P x={13} y={19} w={6} h={6} color="#FFF" className="fire-core" />
        
        {/* 中部火焰 (黄色) */}
        <P x={11} y={17} w={10} h={7} color="#FFEB3B" className="fire-mid" style={{ mixBlendMode: 'screen' }} />
        <P x={13} y={13} w={6} h={4} color="#FFEB3B" className="fire-mid-2" />

        {/* 外部火焰 (橙色/红色) */}
        <P x={10} y={20} w={12} h={5} color="#FF9800" className="fire-outer" opacity="0.9" />
        <P x={14} y={10} w={4} h={3} color="#FF5722" className="fire-tip" />
        <P x={11} y={15} w={2} h={3} color="#FF5722" className="fire-tip-2" />
        <P x={19} y={15} w={2} h={3} color="#FF5722" className="fire-tip-3" />

        {/* 火花 */}
        <P x={9} y={12} w={1} h={1} color="#FFD700" className="spark s1" />
        <P x={21} y={11} w={1} h={1} color="#FFD700" className="spark s2" />
        <P x={16} y={6} w={1} h={1} color="#FFD700" className="spark s3" />
        <P x={13} y={8} w={1} h={1} color="#FFD700" className="spark s4" />
      </svg>
      <style>{`
        .fire-core { animation: pulse 0.8s infinite alternate; }
        .fire-mid { animation: flicker 0.6s infinite alternate; }
        .fire-mid-2 { animation: flicker 0.5s infinite alternate-reverse; }
        .fire-tip { animation: flicker 0.4s infinite alternate; }
        .fire-tip-2 { animation: flicker 0.5s infinite alternate-reverse; animation-delay: 0.1s; }
        .fire-tip-3 { animation: flicker 0.6s infinite alternate; animation-delay: 0.2s; }
        
        .spark { opacity: 0; }
        .s1 { animation: floatUp 1.2s infinite linear; animation-delay: 0.2s; }
        .s2 { animation: floatUp 1.5s infinite linear; animation-delay: 0.5s; }
        .s3 { animation: floatUp 1.0s infinite linear; animation-delay: 0.8s; }
        .s4 { animation: floatUp 1.8s infinite linear; animation-delay: 0.1s; }

        @keyframes pulse {
          0% { opacity: 0.8; transform: scale(0.95); transform-origin: center; }
          100% { opacity: 1; transform: scale(1.05); transform-origin: center; }
        }
        @keyframes flicker {
          0% { transform: translateY(0px); }
          100% { transform: translateY(-2px); }
        }
        @keyframes floatUp {
          0% { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(-20px); opacity: 0; }
        }
      `}</style>
    </div>
  );
};
