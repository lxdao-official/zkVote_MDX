export const PixelAvatar = ({ role, isDead }: { role: 'villager' | 'werewolf' | 'seer' | 'unknown'; isDead?: boolean }) => {
  const getColor = () => {
    if (isDead) return '#555';
    switch (role) {
      case 'werewolf': return '#e74c3c';
      case 'seer': return '#9b59b6';
      case 'villager': return '#f1c40f';
      default: return '#95a5a6';
    }
  };

  return (
    <svg width="64" height="64" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" style={{ imageRendering: 'pixelated' }}>
      {/* 背景 */}
      <rect x="3" y="3" width="10" height="10" fill={getColor()} />
      
      {/* 脸部 */}
      <rect x="5" y="5" width="6" height="6" fill="#ffccaa" />
      
      {/* 眼睛 */}
      <rect x="6" y="7" width="1" height="1" fill="black" />
      <rect x="9" y="7" width="1" height="1" fill="black" />
      
      {/* 嘴巴 */}
      {role === 'werewolf' && !isDead ? (
        <>
          <rect x="6" y="9" width="4" height="1" fill="black" />
          <rect x="6" y="10" width="1" height="1" fill="white" />
          <rect x="9" y="10" width="1" height="1" fill="white" />
        </>
      ) : (
        <rect x="7" y="10" width="2" height="1" fill="black" />
      )}

      {/* 死亡覆盖层 */}
      {isDead && (
        <>
          <line x1="4" y1="4" x2="12" y2="12" stroke="red" strokeWidth="1" />
          <line x1="12" y1="4" x2="4" y2="12" stroke="red" strokeWidth="1" />
        </>
      )}
    </svg>
  );
};
