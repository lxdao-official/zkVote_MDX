type Role = 'villager' | 'werewolf' | 'seer' | 'witch' | 'unknown';

export const DetailedPixelAvatar = ({ role, isDead, size = 64, avatarId = 0 }: { role: Role; isDead?: boolean; size?: number; avatarId?: number }) => {
  // Use 64x64 grid for higher detail (64-bit pixel art) 

  // Helper to render a pixel rect
  const P = ({ x, y, color, w = 1, h = 1 }: { x: number; y: number; color: string; w?: number; h?: number }) => (
    <rect x={x} y={y} width={w} height={h} fill={color} />
  );

  // Color Palettes
  const colors = {
    skin: '#ffccaa',
    skinShadow: '#eebb99',
    hairVillager: '#8B4513',
    hairSeer: '#FFFFFF',
    hairWolf: '#555555',
    hairWitch: '#2c3e50',
    clothVillager: '#3498db',
    clothSeer: '#9b59b6',
    clothWolf: '#333333',
    clothWitch: '#8e44ad',
    eye: '#000000',
    eyeWolf: '#ff0000',
    dead: '#7f8c8d',
    gold: '#FFD700',
    silver: '#C0C0C0',
    potionRed: '#e74c3c',
    potionGreen: '#2ecc71',
  };

  const renderVillager = () => (
    <>
      {/* 帽子 */}
      <P x={10} y={4} w={12} h={2} color={colors.hairVillager} />
      <P x={8} y={6} w={16} h={2} color={colors.hairVillager} />
      <P x={7} y={8} w={18} h={2} color={colors.hairVillager} />
      
      {/* 脸部 */}
      <P x={10} y={10} w={12} h={10} color={colors.skin} />
      
      {/* 眼睛 */}
      <P x={12} y={13} w={2} h={2} color={colors.eye} />
      <P x={18} y={13} w={2} h={2} color={colors.eye} />
      
      {/* 嘴巴 */}
      <P x={14} y={17} w={4} h={1} color="#a0522d" />

      {/* 身体 */}
      <P x={9} y={20} w={14} h={10} color={colors.clothVillager} />
      <P x={14} y={20} w={4} h={10} color="#2980b9" /> {/* 围巾/细节 */}
      
      {/* 手臂 */}
      <P x={7} y={21} w={2} h={7} color={colors.skin} />
      <P x={23} y={21} w={2} h={7} color={colors.skin} />
      
      {/* 腿 */}
      <P x={12} y={30} w={3} h={2} color="#34495e" />
      <P x={17} y={30} w={3} h={2} color="#34495e" />
    </>
  );

  const renderSeer = () => (
    <>
      {/* 兜帽背景 */}
      <P x={8} y={4} w={16} h={18} color="#6c3483" />
      
      {/* 脸部 */}
      <P x={10} y={10} w={12} h={10} color={colors.skin} />
      
      {/* 眼睛 (神秘) */}
      <P x={12} y={13} w={2} h={2} color="#8e44ad" />
      <P x={18} y={13} w={2} h={2} color="#8e44ad" />
      
      {/* 胡须 */}
      <P x={10} y={17} w={12} h={3} color="#ecf0f1" />
      
      {/* 兜帽边缘 */}
      <P x={8} y={6} w={16} h={2} color="#8e44ad" />
      <P x={8} y={8} w={2} h={12} color="#8e44ad" />
      <P x={22} y={8} w={2} h={12} color="#8e44ad" />

      {/* 身体 */}
      <P x={9} y={20} w={14} h={10} color={colors.clothSeer} />
      
      {/* 水晶球 */}
      <P x={23} y={24} w={6} h={6} color="#3498db" />
      <P x={24} y={25} w={2} h={2} color="#fff" /> {/* 光泽 */}
      
      {/* 腿 */}
      <P x={12} y={30} w={3} h={2} color="#5d4e7a" />
      <P x={17} y={30} w={3} h={2} color="#5d4e7a" />
    </>
  );

  const renderWerewolf = () => (
    <>
      {/* 耳朵 */}
      <P x={7} y={3} w={4} h={5} color={colors.hairWolf} />
      <P x={21} y={3} w={4} h={5} color={colors.hairWolf} />
      
      {/* 头部 */}
      <P x={9} y={6} w={14} h={12} color={colors.hairWolf} />
      <P x={7} y={10} w={18} h={8} color={colors.hairWolf} />
      
      {/* 眼睛 (红色发光) */}
      <P x={11} y={12} w={3} h={3} color={colors.eyeWolf} />
      <P x={18} y={12} w={3} h={3} color={colors.eyeWolf} />
      
      {/* 鼻嘴 */}
      <P x={13} y={16} w={6} h={4} color="#333" />
      <P x={14} y={19} w={1} h={1} color="#fff" /> {/* 獠牙 */}
      <P x={17} y={19} w={1} h={1} color="#fff" /> {/* 獠牙 */}

      {/* 身体 (弓背) */}
      <P x={7} y={20} w={18} h={10} color={colors.clothWolf} />
      
      {/* 爪子 */}
      <P x={3} y={22} w={4} h={6} color="#7f8c8d" />
      <P x={25} y={22} w={4} h={6} color="#7f8c8d" />
      
      {/* 腿 */}
      <P x={10} y={30} w={4} h={2} color="#1a1a1a" />
      <P x={18} y={30} w={4} h={2} color="#1a1a1a" />
    </>
  );

  const renderWitch = () => (
    <>
      {/* 帽子 (尖顶) */}
      <P x={14} y={1} w={4} h={2} color={colors.hairWitch} />
      <P x={12} y={3} w={8} h={2} color={colors.hairWitch} />
      <P x={10} y={5} w={12} h={2} color={colors.hairWitch} />
      <P x={8} y={7} w={16} h={2} color={colors.hairWitch} />
      
      {/* 头发 */}
      <P x={9} y={9} w={14} h={4} color="#34495e" />
      
      {/* 脸部 */}
      <P x={10} y={10} w={12} h={10} color={colors.skin} />
      
      {/* 眼睛 */}
      <P x={12} y={13} w={2} h={2} color={colors.eye} />
      <P x={18} y={13} w={2} h={2} color={colors.eye} />
      
      {/* 嘴巴 */}
      <P x={14} y={17} w={4} h={1} color="#9b59b6" />
      
      {/* 长袍 */}
      <P x={9} y={20} w={14} h={10} color={colors.clothWitch} />
      <P x={14} y={20} w={4} h={10} color="#9b59b6" />
      
      {/* 药水瓶 */}
      <P x={5} y={23} w={3} h={5} color={colors.potionRed} /> {/* 毒药 */}
      <P x={5} y={22} w={3} h={1} color="#333" /> {/* 瓶塞 */}
      
      <P x={24} y={23} w={3} h={5} color={colors.potionGreen} /> {/* 治疗 */}
      <P x={24} y={22} w={3} h={1} color="#333" /> {/* 瓶塞 */}
      
      {/* 腿 */}
      <P x={12} y={30} w={3} h={2} color="#6c3483" />
      <P x={17} y={30} w={3} h={2} color="#6c3483" />
    </>
  );

  // 8种不同风格的32x32像素角色（隐藏真实身份）
  const renderUnknownVariant = (variant: number) => {
    const styles = [
      // Style 0: 骑士
      () => (
        <>
          <P x={10} y={5} w={12} h={3} color="#c0c0c0" /> {/* 头盔 */}
          <P x={9} y={8} w={14} h={2} color="#a8a8a8" />
          <P x={11} y={10} w={10} h={8} color="#f5deb3" /> {/* 脸部 */}
          <P x={13} y={13} w={2} h={2} color="#000" />
          <P x={17} y={13} w={2} h={2} color="#000" />
          <P x={9} y={18} w={14} h={12} color="#708090" /> {/* 盔甲 */}
          <P x={14} y={21} w={4} h={6} color="#ffd700" /> {/* 盾牌 */}
          <P x={12} y={30} w={3} h={2} color="#696969" />
          <P x={17} y={30} w={3} h={2} color="#696969" />
        </>
      ),
      // Style 1: 法师
      () => (
        <>
          <P x={14} y={2} w={4} h={2} color="#4169e1" /> {/* 帽尖 */}
          <P x={12} y={4} w={8} h={2} color="#4169e1" />
          <P x={10} y={6} w={12} h={2} color="#4169e1" />
          <P x={9} y={8} w={14} h={2} color="#4169e1" /> {/* 帽檐 */}
          <P x={11} y={10} w={10} h={8} color="#ffe4c4" /> {/* 脸部 */}
          <P x={13} y={13} w={2} h={2} color="#8b4513" />
          <P x={17} y={13} w={2} h={2} color="#8b4513" />
          <P x={9} y={18} w={14} h={12} color="#191970" /> {/* 长袍 */}
          <P x={24} y={23} w={2} h={7} color="#8b4513" /> {/* 法杖 */}
          <P x={12} y={30} w={3} h={2} color="#0d0d3d" />
          <P x={17} y={30} w={3} h={2} color="#0d0d3d" />
        </>
      ),
      // Style 2: 刺客
      () => (
        <>
          <P x={9} y={6} w={14} h={14} color="#2f4f4f" /> {/* 兜帽 */}
          <P x={12} y={12} w={8} h={6} color="#000" /> {/* 脸部阴影 */}
          <P x={14} y={14} w={2} h={1} color="#ff0000" /> {/* 眼睛发光 */}
          <P x={16} y={14} w={2} h={1} color="#ff0000" />
          <P x={8} y={20} w={16} h={10} color="#1a1a1a" /> {/* 斗篷 */}
          <P x={5} y={24} w={2} h={5} color="#c0c0c0" /> {/* 匕首 */}
          <P x={10} y={30} w={4} h={2} color="#0d0d0d" />
          <P x={18} y={30} w={4} h={2} color="#0d0d0d" />
        </>
      ),
      // Style 3: 农民
      () => (
        <>
          <P x={10} y={6} w={12} h={3} color="#deb887" /> {/* 草帽 */}
          <P x={9} y={9} w={14} h={2} color="#d2691e" />
          <P x={11} y={11} w={10} h={8} color="#ffdab9" /> {/* 脸部 */}
          <P x={13} y={14} w={2} h={2} color="#000" />
          <P x={17} y={14} w={2} h={2} color="#000" />
          <P x={14} y={17} w={4} h={1} color="#8b4513" /> {/* 微笑 */}
          <P x={9} y={19} w={14} h={11} color="#8b7355" /> {/* 背心 */}
          <P x={23} y={23} w={2} h={7} color="#654321" /> {/* 草叉 */}
          <P x={12} y={30} w={3} h={2} color="#654321" />
          <P x={17} y={30} w={3} h={2} color="#654321" />
        </>
      ),
      // Style 4: 商人
      () => (
        <>
          <P x={10} y={5} w={12} h={4} color="#8b0000" /> {/* 帽子 */}
          <P x={11} y={10} w={10} h={8} color="#ffefd5" /> {/* 脸部 */}
          <P x={13} y={13} w={2} h={2} color="#000" />
          <P x={17} y={13} w={2} h={2} color="#000" />
          <P x={9} y={18} w={14} h={12} color="#800020" /> {/* 华丽外套 */}
          <P x={14} y={21} w={4} h={5} color="#ffd700" /> {/* 金扣子 */}
          <P x={5} y={24} w={3} h={5} color="#8b4513" /> {/* 钱袋 */}
          <P x={12} y={30} w={3} h={2} color="#4d0010" />
          <P x={17} y={30} w={3} h={2} color="#4d0010" />
        </>
      ),
      // Style 5: 猎人
      () => (
        <>
          <P x={10} y={6} w={12} h={3} color="#556b2f" /> {/* 兜帽 */}
          <P x={11} y={10} w={10} h={8} color="#d2b48c" /> {/* 脸部 */}
          <P x={13} y={13} w={2} h={2} color="#000" />
          <P x={17} y={13} w={2} h={2} color="#000" />
          <P x={9} y={18} w={14} h={12} color="#6b8e23" /> {/* 束腰外衣 */}
          <P x={3} y={21} w={5} h={2} color="#8b4513" /> {/* 弓 */}
          <P x={4} y={19} w={2} h={4} color="#8b4513" />
          <P x={12} y={30} w={3} h={2} color="#3d5016" />
          <P x={17} y={30} w={3} h={2} color="#3d5016" />
        </>
      ),
      // Style 6: 铁匠
      () => (
        <>
          <P x={10} y={9} w={12} h={9} color="#cd853f" /> {/* 脸部 */}
          <P x={9} y={10} w={14} h={3} color="#8b4513" /> {/* 头巾 */}
          <P x={13} y={13} w={2} h={2} color="#000" />
          <P x={17} y={13} w={2} h={2} color="#000" />
          <P x={9} y={18} w={14} h={12} color="#654321" /> {/* 围裙 */}
          <P x={24} y={23} w={2} h={7} color="#696969" /> {/* 锤子 */}
          <P x={14} y={24} w={4} h={3} color="#ff4500" /> {/* 熔炉光芒 */}
          <P x={12} y={30} w={3} h={2} color="#3d2810" />
          <P x={17} y={30} w={3} h={2} color="#3d2810" />
        </>
      ),
      // Style 7: 吟游诗人
      () => (
        <>
          <P x={10} y={4} w={12} h={3} color="#9370db" /> {/* 羽毛帽 */}
          <P x={19} y={2} w={3} h={5} color="#00ff00" /> {/* 羽毛 */}
          <P x={11} y={10} w={10} h={8} color="#ffe4b5" /> {/* 脸部 */}
          <P x={13} y={13} w={2} h={2} color="#000" />
          <P x={17} y={13} w={2} h={2} color="#000" />
          <P x={9} y={18} w={14} h={12} color="#ff69b4" /> {/* 彩色服装 */}
          <P x={5} y={24} w={3} h={5} color="#daa520" /> {/* 鲁特琴 */}
          <P x={12} y={30} w={3} h={2} color="#cc3674" />
          <P x={17} y={30} w={3} h={2} color="#cc3674" />
        </>
      ),
    ];
    return styles[variant % 8]();
  };

  const renderUnknown = () => renderUnknownVariant(avatarId);

  const getContent = () => {
    if (isDead) {
      return (
        <>
          {/* Tombstone Shape */}
          <path d="M8 30 L8 10 Q16 2 24 10 L24 30 Z" fill="#bdc3c7" />
          <rect x="4" y="30" width="24" height="2" fill="#7f8c8d" />
          {/* RIP Text (Pixelated) */}
          <P x={12} y={14} w={2} h={6} color="#7f8c8d" /> {/* R */}
          <P x={14} y={14} w={2} h={2} color="#7f8c8d" />
          <P x={14} y={18} w={2} h={2} color="#7f8c8d" />
          
          <P x={18} y={14} w={2} h={6} color="#7f8c8d" /> {/* I */}
        </>
      );
    }
    switch (role) {
      case 'villager': return renderVillager();
      case 'seer': return renderSeer();
      case 'werewolf': return renderWerewolf();
      case 'witch': return renderWitch();
      default: return renderUnknown();
    }
  };

  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 32 32" 
      xmlns="http://www.w3.org/2000/svg" 
      style={{ imageRendering: 'pixelated', filter: isDead ? 'grayscale(100%)' : 'none' }}
    >
      {getContent()}
    </svg>
  );
};
