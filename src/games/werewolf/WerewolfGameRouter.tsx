import { useState, useEffect } from 'react';
import { WerewolfGame } from './WerewolfGame';
import { MultiplayerWerewolfGame } from './MultiplayerWerewolfGame';
import { PixelCard, PixelButton } from './components/PixelComponents';
import LanguageSwitcher from '../../components/LanguageSwitcher';

export const WerewolfGameRouter = () => {
  const [gameMode, setGameMode] = useState<'menu' | 'single' | 'multi'>('menu');
  
  // Check URL for room parameter - auto-select multiplayer
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam && gameMode === 'menu') {
      setTimeout(() => setGameMode('multi'), 0);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  if (gameMode === 'single') {
    return <WerewolfGame />;
  }
  
  if (gameMode === 'multi') {
    return <MultiplayerWerewolfGame />;
  }
  
  // Main menu
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
        <div className="menu-welcome">
          <h2 className="menu-welcome-title">Choose Your Adventure</h2>
          <p className="menu-welcome-text">
            Master the art of deception with blockchain-powered privacy
          </p>
        </div>
        
        {/* Game Mode Cards */}
        <div className="menu-mode-grid">
          {/* Single Player Card */}
          <div 
            className="menu-mode-card mode-single"
            onClick={() => setGameMode('single')}
          >
            <div className="mode-card-glow"></div>
            <div className="mode-card-content">
              <div className="mode-icon-wrapper">
                <div className="mode-icon">🎮</div>
                <div className="mode-icon-badge">Practice</div>
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
                <PixelButton variant="parchment" className="w-full" onClick={() => {}}>
                  <span className="button-text">Start Solo Game</span>
                </PixelButton>
              </div>
            </div>
          </div>
          
          {/* Multiplayer Card */}
          <div 
            className="menu-mode-card mode-multi"
            onClick={() => setGameMode('multi')}
          >
            <div className="mode-card-glow mode-card-glow-green"></div>
            <div className="mode-card-content">
              <div className="mode-icon-wrapper">
                <div className="mode-icon">🌐</div>
                <div className="mode-icon-badge mode-badge-online">Online</div>
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
                <PixelButton variant="parchment" className="w-full" onClick={() => {}}>
                  <span className="button-text">Play Online</span>
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
