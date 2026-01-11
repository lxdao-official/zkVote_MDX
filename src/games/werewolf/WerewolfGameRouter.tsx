// import { useState, useEffect } from 'react';
// import { WerewolfGame } from './WerewolfGame';
// import { MultiplayerWerewolfGame } from './MultiplayerWerewolfGame';
import { PixelButton } from './components/PixelComponents';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import './dev-notice.css';

export const WerewolfGameRouter = () => {
  // 暂时显示"正在开发中"页面
  // const [gameMode, setGameMode] = useState<'menu' | 'single' | 'multi'>('menu');
  
  // // Check URL for room parameter - auto-select multiplayer
  // useEffect(() => {
  //   const params = new URLSearchParams(window.location.search);
  //   const roomParam = params.get('room');
  //   if (roomParam && gameMode === 'menu') {
  //     setTimeout(() => setGameMode('multi'), 0);
  //   }
  // // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []);
  
  // if (gameMode === 'single') {
  //   return <WerewolfGame />;
  // }
  
  // if (gameMode === 'multi') {
  //   return <MultiplayerWerewolfGame />;
  // }
  
  // 正在开发中页面
  return (
    <div className="werewolf-menu-container">
      {/* Animated Background */}
      <div className="menu-bg-overlay"></div>
      <div className="menu-stars"></div>
      <div className="menu-moon">🌕</div>
      
      {/* Header */}
      <div className="menu-header">
        <div className="menu-title-wrapper">
          <div className="menu-wolf-icon">🐺</div>
          <h1 className="menu-main-title">Werewolf</h1>
          <div className="menu-subtitle">Zero-Knowledge Social Deduction</div>
        </div>
        <div className="menu-lang-switcher">
          <LanguageSwitcher />
        </div>
      </div>
      
      {/* Main Content */}
      <div className="menu-content">
        {/* 正在开发中提示 */}
        <div className="menu-dev-notice">
          <div className="dev-notice-icon">🚧</div>
          <h2 className="dev-notice-title">正在开发中</h2>
          <p className="dev-notice-text">
            狼人杀游戏功能正在开发中，敬请期待
          </p>
          <div className="dev-notice-details">
            <p>即将推出的功能：</p>
            <ul>
              <li>单人模式 - 与AI对战</li>
              <li>多人模式 - P2P在线对战</li>
              <li>零知识证明隐私保护</li>
              <li>实时聊天系统</li>
            </ul>
          </div>
        </div>
        
        <div className="menu-welcome">
          <h2 className="menu-welcome-title">Choose Your Adventure</h2>
          <p className="menu-welcome-text">
            Master the art of deception with blockchain-powered privacy
          </p>
        </div>
        
        {/* Game Mode Cards */}
        <div className="menu-mode-grid">
          {/* Single Player Card - 禁用状态 */}
          <div 
            className="menu-mode-card mode-single mode-disabled"
            style={{ opacity: 0.6, cursor: 'not-allowed' }}
          >
            <div className="mode-card-glow"></div>
            <div className="mode-card-content">
              <div className="mode-icon-wrapper">
                <div className="mode-icon">🎮</div>
                <div className="mode-icon-badge" style={{ backgroundColor: '#94a3b8' }}>开发中</div>
              </div>
              <h3 className="mode-title">Single Player</h3>
              <p className="mode-description">
                Challenge AI opponents and master your strategy in solo play
              </p>
              <ul className="mode-features">
                <li>✓ 7 AI Opponents</li>
                <li>✓ Instant Start</li>
                <li>✓ Learn & Practice</li>
              </ul>
              <div className="mode-button-wrapper">
                <PixelButton 
                  variant="parchment" 
                  className="w-full" 
                  onClick={(e) => {
                    e.stopPropagation();
                    alert('此功能正在开发中，敬请期待！');
                  }}
                  disabled
                  style={{ opacity: 0.5, cursor: 'not-allowed' }}
                >
                  <span className="button-text">开发中</span>
                </PixelButton>
              </div>
            </div>
          </div>
          
          {/* Multiplayer Card - 禁用状态 */}
          <div 
            className="menu-mode-card mode-multi mode-disabled"
            style={{ opacity: 0.6, cursor: 'not-allowed' }}
          >
            <div className="mode-card-glow mode-card-glow-green"></div>
            <div className="mode-card-content">
              <div className="mode-icon-wrapper">
                <div className="mode-icon">🌐</div>
                <div className="mode-icon-badge mode-badge-online" style={{ backgroundColor: '#94a3b8' }}>开发中</div>
              </div>
              <h3 className="mode-title">Multiplayer</h3>
              <p className="mode-description">
                Play with friends online in P2P encrypted rooms
              </p>
              <ul className="mode-features">
                <li>✓ 4-12 Players</li>
                <li>✓ Mix AI & Humans</li>
                <li>✓ Invite via Link</li>
              </ul>
              <div className="mode-button-wrapper">
                <PixelButton 
                  variant="parchment" 
                  className="w-full" 
                  onClick={(e) => {
                    e.stopPropagation();
                    alert('此功能正在开发中，敬请期待！');
                  }}
                  disabled
                  style={{ opacity: 0.5, cursor: 'not-allowed' }}
                >
                  <span className="button-text">开发中</span>
                </PixelButton>
              </div>
            </div>
          </div>
        </div>
        
        {/* Features Section */}
        <div className="menu-features-section">
          <h3 className="features-title">Powered by Web3 Technology</h3>
          <div className="features-grid">
            <div className="feature-item">
              <div className="feature-icon">🔐</div>
              <div className="feature-name">ZK Proofs</div>
              <div className="feature-desc">Privacy-preserving gameplay</div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">🤖</div>
              <div className="feature-name">Smart AI</div>
              <div className="feature-desc">Advanced bot opponents</div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">💬</div>
              <div className="feature-name">Live Chat</div>
              <div className="feature-desc">Real-time communication</div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">🎨</div>
              <div className="feature-name">Pixel Art</div>
              <div className="feature-desc">Retro gaming aesthetics</div>
            </div>
          </div>
        </div>
        
        {/* Quick Guide */}
        <div className="menu-quick-guide">
          <div className="guide-header">
            <span className="guide-icon">ℹ️</span>
            <h4 className="guide-title">Quick Start Guide</h4>
          </div>
          <div className="guide-steps">
            <div className="guide-step">
              <span className="step-number">1</span>
              <span className="step-text">Choose game mode</span>
            </div>
            <div className="guide-step">
              <span className="step-number">2</span>
              <span className="step-text">Connect wallet & generate identity</span>
            </div>
            <div className="guide-step">
              <span className="step-number">3</span>
              <span className="step-text">Create or join a room</span>
            </div>
            <div className="guide-step">
              <span className="step-number">4</span>
              <span className="step-text">Play and deceive!</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
