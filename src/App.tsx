import { useState } from 'react';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { wagmiConfig } from './wagmiConfig';
import ZKVotePage from './page/ZKVotePage'
import { WerewolfGameRouter } from './games/werewolf/WerewolfGameRouter';
import './App.css'

const queryClient = new QueryClient();

function App() {
  const [page, setPage] = useState<'home' | 'game'>('home');

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider appInfo={{ appName: 'MyFirstZKVote' }}>
          <div style={{
            minHeight: '100vh'
          }}>
            {page === 'home' ? (
              <>
                <ZKVotePage />
                <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 1000 }}>
                  <button 
                    onClick={() => setPage('game')}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: '#6b21a8',
                      color: 'white',
                      border: '4px solid #4c1d95',
                      borderRadius: '0',
                      fontFamily: 'monospace',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      boxShadow: '4px 4px 0px rgba(0,0,0,0.5)',
                      imageRendering: 'pixelated'
                    }}
                  >
                    🐺 Play ZK Werewolf
                  </button>
                </div>
              </>
            ) : (
              <div className="relative">
                <button 
                  onClick={() => setPage('home')}
                  className="absolute top-4 left-4 z-50 px-4 py-2 bg-gray-800 text-white border-2 border-gray-600 font-mono hover:bg-gray-700"
                >
                  ← Back to Tutorial
                </button>
                <WerewolfGameRouter />
              </div>
            )}
          </div>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App
