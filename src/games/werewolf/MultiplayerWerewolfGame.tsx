import { useState, useEffect, useCallback, useRef } from 'react';
import { PixelCard, PixelButton } from './components/PixelComponents';
import { DetailedPixelAvatar } from './components/DetailedPixelAvatar';
import { useSemaphoreIdentity } from '../../zk/useSemaphoreIdentity';
import { useAccount } from 'wagmi';
import ConnectWallet from '../../components/ConnectWallet';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import { useTranslation } from 'react-i18next';
import { 
  initBotMemory, 
  generateSmartDialogue,
  type BotMemory
} from './BotLogic';
import { 
  MultiplayerManager,
  type MultiplayerPlayer,
  type GameState,
  type Role,
  type GamePhase 
} from './MultiplayerManager';
import { Campfire } from './components/Campfire';
import { setAIConfig } from './AIConfig';
import './WerewolfGame.css';

const BOT_NAMES = ['Bot-Alpha', 'Bot-Beta', 'Bot-Gamma', 'Bot-Delta', 'Bot-Epsilon', 'Bot-Zeta', 'Bot-Eta'];

export const MultiplayerWerewolfGame = () => {
  const { isConnected } = useAccount();
  const { identity, generateIdentity } = useSemaphoreIdentity();
  
  // Multiplayer State
  const multiplayerManagerRef = useRef(new MultiplayerManager());
  const multiplayerManager = multiplayerManagerRef.current;
  const [isHost, setIsHost] = useState(false);
  const isHostRef = useRef(false); // 用于在回调中访问最新的 isHost 值
  const [roomId, setRoomId] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [gameMode, setGameMode] = useState<'CREATE' | 'JOIN' | 'PLAYING' | null>(null);
  
  // Room Config
  const [totalPlayers, setTotalPlayers] = useState(6);
  const [botCount, setBotCount] = useState(3);
  const [inviteLink, setInviteLink] = useState('');
  const [joinRoomId, setJoinRoomId] = useState('');
  
  // Game State
  const [phase, setPhase] = useState<GamePhase>('LOBBY');
  const [myRole, setMyRole] = useState<Role>('villager');
  const [players, setPlayers] = useState<MultiplayerPlayer[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [chatMessages, setChatMessages] = useState<{playerId: number, playerName: string, message: string, timestamp: number}[]>([]);
  const [myPlayerId, setMyPlayerId] = useState<number>(-1);
  const myPlayerIdRef = useRef(-1); // 用于在回调中访问最新的 myPlayerId
  const [isReady, setIsReady] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<number | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [dayCount, setDayCount] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_votes, setVotes] = useState<Record<number, number>>({}); // playerId -> targetId
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_nightActions, setNightActions] = useState<Record<number, { targetId: number, action: string }>>({});
  const { t } = useTranslation();
  
  // AI Config State
  const [geminiKey, setGeminiKey] = useState<string>('');
  const [useAI, setUseAI] = useState(false);
  
  // Bot Logic State
  const [botMemories, setBotMemories] = useState<Record<number, BotMemory>>({});
  
  // 同步 ref 和 state
  useEffect(() => {
    isHostRef.current = isHost;
  }, [isHost]);
  
  useEffect(() => {
    myPlayerIdRef.current = myPlayerId;
  }, [myPlayerId]);

  const addLog = useCallback((msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
  }, []);

  // Setup Multiplayer Callbacks
  useEffect(() => {
    console.log('Setting up multiplayer callbacks. isHost:', isHost);
    
    multiplayerManager.onPlayerJoined = (player: MultiplayerPlayer) => {
      console.log('📥 onPlayerJoined triggered:', player);
      console.log('   Current isHostRef:', isHostRef.current);
      addLog(`${player.name} joined the game`);
      
      setPlayers(prev => {
        console.log('   Current players before add:', prev);
        
        // 避免重复添加
        if (prev.find(p => p.peerId === player.peerId)) {
          console.log('   ⚠️ Player already exists, skipping');
          return prev;
        }
        
        // 为新玩家分配ID（基于当前玩家数量）
        const newId = prev.length;
        const newPlayer = { ...player, id: newId };
        const updatedPlayers = [...prev, newPlayer];
        
        console.log('   ✅ Updated players list:', updatedPlayers);
        console.log('   Room has', updatedPlayers.length, 'players now');
        
        return updatedPlayers;
      });
      
      // 如果是房主，在状态更新后广播
      // 注意：这里我们使用 setTimeout 来确保 setPlayers 已经执行（虽然不完全保证，但在React批处理中通常有效）
      // 更好的做法是使用 useEffect 监听 players 变化，但为了简化逻辑，我们在这里处理
      if (isHostRef.current) {
        setTimeout(() => {
          // 获取最新的 players 状态（这里有点 tricky，因为闭包问题，我们可能拿不到最新的）
          // 所以我们重新构建一次逻辑，或者依赖 setPlayers 的回调
          // 但由于 setPlayers 没有回调，我们只能依赖 ref 或者重新计算
          
          // 重新计算 updatedPlayers 以确保准确性
          setPlayers(current => {
             console.log('   🏠 Host broadcasting updated player list:', current);
             multiplayerManager.updateGameState({ players: current });
             return current;
          });
        }, 100);
      }
    };

    multiplayerManager.onPlayerLeft = (peerId: string) => {
      addLog(`Player left the game`);
      setPlayers(prev => prev.filter(p => p.peerId !== peerId));
    };

    multiplayerManager.onPlayerReady = (peerId: string) => {
      console.log('onPlayerReady triggered for:', peerId);
      setPlayers(prev => {
        const updated = prev.map(p => 
          p.peerId === peerId ? { ...p, isReady: true } : p
        );
        console.log('Updated players after ready:', updated);
        
        // 房主广播更新后的玩家列表
        if (isHostRef.current) {
          console.log('Host: Broadcasting player ready state');
          setTimeout(() => {
            multiplayerManager.updateGameState({ players: updated });
          }, 100);
        }
        
        return updated;
      });
    };

    multiplayerManager.onGameStateUpdate = (gameState: Partial<GameState>) => {
      console.log('📨 onGameStateUpdate triggered:', gameState);
      
      if (gameState.phase) {
        console.log('   Phase updated to:', gameState.phase);
        setPhase(gameState.phase);
      }
      
      if (gameState.players) {
        console.log('   📋 Players updated. Count:', gameState.players.length);
        console.log('   Players:', gameState.players);
        setPlayers(gameState.players);
        
        // 如果是新加入的玩家，找到自己的ID
        if (myPlayerIdRef.current === -1) {
          const myPeerId = multiplayerManager.getLocalPeerId();
          console.log('   🔍 Looking for my peerId:', myPeerId);
          const myPlayer = gameState.players.find(p => p.peerId === myPeerId);
          if (myPlayer) {
            setMyPlayerId(myPlayer.id);
            myPlayerIdRef.current = myPlayer.id; // 立即更新 ref
            console.log('   ✅ My player ID assigned:', myPlayer.id);
          } else {
            console.log('   ⚠️ Could not find myself in player list');
          }
        }
      }
      
      if (gameState.dayCount !== undefined) setDayCount(gameState.dayCount);
      if (gameState.chatMessages) setChatMessages(gameState.chatMessages);
    };

    multiplayerManager.onChatMessage = (message) => {
      setChatMessages(prev => [...prev, message]);
    };

    multiplayerManager.onRoleAssignment = (role: Role) => {
      setMyRole(role);
      addLog(`You are a ${role}!`);
    };

    multiplayerManager.onVoteAction = (playerId: number, targetId: number) => {
      const voter = players.find(p => p.id === playerId);
      const target = players.find(p => p.id === targetId);
      addLog(`${voter?.name} voted for ${target?.name}`);
      
      // Update local votes state
      setVotes(prev => {
        const newVotes = { ...prev, [playerId]: targetId };
        
        // Host Logic: Check if voting is complete
        if (isHostRef.current) {
          const livingPlayers = players.filter(p => !p.isDead);
          const voteCount = Object.keys(newVotes).length;
          
          // Note: This simple check assumes all living players (including bots) must vote.
          // Bots currently don't vote in multiplayer automatically yet, so we might get stuck if we wait for them.
          // For now, let's assume bots vote immediately or we trigger them.
          
          if (voteCount >= livingPlayers.length) {
            console.log('🗳️ All votes received. Tallying results...');
            handleVotingResults(newVotes, players);
          }
        }
        
        return newVotes;
      });
    };

    multiplayerManager.onNightAction = (playerId: number, targetId: number, action: string) => {
      console.log(`Night action: Player ${playerId} performed ${action} on ${targetId}`);
      
      if (isHostRef.current) {
        setNightActions(prev => {
          const newActions = { ...prev, [playerId]: { targetId, action } };
          checkNightCompletion(newActions, players);
          return newActions;
        });
      }
    };

    multiplayerManager.onConnectionError = (error: string) => {
      addLog(`Connection error: ${error}`);
      alert(`Connection error: ${error}`);
    };

    return () => {
      multiplayerManager.disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle Voting Results (Host Only)
  const handleVotingResults = (currentVotes: Record<number, number>, currentPlayers: MultiplayerPlayer[]) => {
    const voteCounts: Record<number, number> = {};
    Object.values(currentVotes).forEach(targetId => {
      voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
    });
    
    let maxVotes = 0;
    let executedId: number | null = null;
    let tie = false;
    
    Object.entries(voteCounts).forEach(([idStr, count]) => {
      const id = parseInt(idStr);
      if (count > maxVotes) {
        maxVotes = count;
        executedId = id;
        tie = false;
      } else if (count === maxVotes) {
        tie = true;
      }
    });
    
    let updatedPlayers = [...currentPlayers];
    let logMessage = '';
    
    if (tie || executedId === null) {
      logMessage = 'Vote resulted in a tie. No one was eliminated.';
    } else {
      const victim = currentPlayers.find(p => p.id === executedId);
      logMessage = `${victim?.name} was eliminated by vote.`;
      updatedPlayers = updatedPlayers.map(p => p.id === executedId ? { ...p, isDead: true } : p);
    }
    
    // Broadcast results and move to Night
    setTimeout(() => {
      multiplayerManager.updateGameState({
        players: updatedPlayers,
        phase: 'NIGHT',
        dayCount: dayCount + 1 // Increment day count? Or wait for morning? Usually Night starts next cycle.
      });
      
      // Reset local state for next round
      setVotes({});
      setHasVoted(false);
      setSelectedTarget(null);
      
      // Add log about result
      const resultMsg = {
        playerId: -1, // System message
        playerName: 'System',
        message: logMessage,
        timestamp: Date.now()
      };
      multiplayerManager.sendChatMessage(resultMsg);

      // Trigger Bot Night Actions
      if (isHostRef.current) {
        triggerBotNightActions(updatedPlayers);
      }
      
    }, 2000);
  };

  // Check if night actions are complete (Host Only)
  const checkNightCompletion = (actions: Record<number, { targetId: number, action: string }>, currentPlayers: MultiplayerPlayer[]) => {
    const livingPlayers = currentPlayers.filter(p => !p.isDead);
    
    // Identify roles that MUST act
    const werewolves = livingPlayers.filter(p => p.role === 'werewolf');
    const seer = livingPlayers.find(p => p.role === 'seer');
    
    // Check if werewolves have acted (at least one action from werewolves)
    const werewolfAction = Object.entries(actions).find(([pid]) => {
      const player = currentPlayers.find(p => p.id === parseInt(pid));
      return player?.role === 'werewolf';
    });
    
    // Check if seer has acted (if alive)
    const seerAction = seer ? actions[seer.id] : true;
    
    const isWerewolfDone = werewolves.length === 0 || !!werewolfAction;
    const isSeerDone = !seer || !!seerAction;
    
    if (isWerewolfDone && isSeerDone) {
      console.log('🌙 All night actions received. Resolving night...');
      resolveNight(actions, currentPlayers);
    }
  };

  // Resolve Night Actions (Host Only)
  const resolveNight = (actions: Record<number, { targetId: number, action: string }>, currentPlayers: MultiplayerPlayer[]) => {
    let updatedPlayers = [...currentPlayers];
    const deadIds: number[] = [];
    
    // 1. Werewolf Kill
    const werewolfActions = Object.entries(actions)
      .filter(([pid]) => {
        const player = currentPlayers.find(p => p.id === parseInt(pid));
        return player?.role === 'werewolf';
      })
      .map(([, data]) => data.targetId);
      
    if (werewolfActions.length > 0) {
      const targetId = werewolfActions[0];
      deadIds.push(targetId);
    }
    
    // Apply deaths
    updatedPlayers = updatedPlayers.map(p => {
      if (deadIds.includes(p.id)) {
        return { ...p, isDead: true };
      }
      return p;
    });
    
    // Broadcast results and move to Day
    setTimeout(() => {
      multiplayerManager.updateGameState({
        players: updatedPlayers,
        phase: 'DAY_DISCUSS'
      });
      
      setNightActions({});
      
      // Announce deaths
      const deadNames = updatedPlayers.filter(p => deadIds.includes(p.id)).map(p => p.name).join(', ');
      const msg = deadNames ? `${deadNames} died last night.` : 'No one died last night.';
      
      const resultMsg = {
        playerId: -1,
        playerName: 'System',
        message: msg,
        timestamp: Date.now()
      };
      multiplayerManager.sendChatMessage(resultMsg);
      
      // Start Discussion
      if (isHostRef.current) {
        startDiscussion(updatedPlayers);
      }
      
    }, 2000);
  };

  // Trigger Bot Night Actions (Host Only)
  const triggerBotNightActions = (currentPlayers: MultiplayerPlayer[]) => {
    const bots = currentPlayers.filter(p => p.isBot && !p.isDead);
    const livingPlayers = currentPlayers.filter(p => !p.isDead);
    
    bots.forEach(bot => {
      setTimeout(() => {
        if (bot.role === 'werewolf') {
          // Bot werewolf kills random non-werewolf
          const targets = livingPlayers.filter(p => p.role !== 'werewolf');
          if (targets.length > 0) {
            const target = targets[Math.floor(Math.random() * targets.length)];
            multiplayerManager.sendNightAction(bot.id, target.id, 'KILL');
          }
        } else if (bot.role === 'seer') {
          // Bot seer checks random player
          const targets = livingPlayers.filter(p => p.id !== bot.id);
          if (targets.length > 0) {
            const target = targets[Math.floor(Math.random() * targets.length)];
            multiplayerManager.sendNightAction(bot.id, target.id, 'CHECK');
          }
        }
      }, Math.random() * 3000 + 1000);
    });
  };

  // Create Room
  const handleCreateRoom = async () => {
    try {
      const name = playerName || 'Player';
      console.log('🏠 Creating room as:', name);
      
      const roomId = await multiplayerManager.createRoom();
      console.log('✅ Room created with ID:', roomId);
      
      setRoomId(roomId);
      setIsHost(true);
      isHostRef.current = true; // 立即更新 ref
      console.log('✅ isHostRef set to true');
      
      setGameMode('PLAYING');
      
      // Generate invite link
      const link = `${window.location.origin}${window.location.pathname}?room=${roomId}`;
      setInviteLink(link);
      console.log('📎 Invite link:', link);
      
      // Add host as first player
      const hostPlayer: MultiplayerPlayer = {
        id: 0,
        name,
        peerId: multiplayerManager.getLocalPeerId(),
        isDead: false,
        role: 'villager',
        isUser: true,
        isBot: false,
        isHost: true,
        isReady: false
      };
      
      setPlayers([hostPlayer]);
      setMyPlayerId(0);
      myPlayerIdRef.current = 0; // 立即更新 ref
      
      console.log('✅ Host player added:', hostPlayer);
      addLog('Room created! Share the link to invite players.');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Failed to create room:', errorMessage);
      alert('Failed to create room: ' + errorMessage);
    }
  };

  // Join Room
  const handleJoinRoom = async () => {
    if (!joinRoomId.trim()) {
      alert('Please enter a valid room ID');
      return;
    }
    
    try {
      const name = playerName || 'Player';
      console.log('👤 Joining room as:', name, 'Room ID:', joinRoomId);
      
      addLog('Connecting to room...');
      await multiplayerManager.joinRoom(joinRoomId, name);
      
      console.log('✅ Connected to room');
      setRoomId(joinRoomId);
      setIsHost(false);
      isHostRef.current = false; // 立即更新 ref
      console.log('✅ isHostRef set to false');
      
      setGameMode('PLAYING');
      
      console.log('✅ Joined room successfully');
      addLog('Joined room! Waiting for host to start...');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // 更友好的错误提示
      let userMessage = 'Failed to join room.\n\n';
      if (errorMessage.includes('timeout')) {
        userMessage += '⏱️ Connection timeout. Possible reasons:\n' +
                      '• The room ID is incorrect\n' +
                      '• The host has left the room\n' +
                      '• Network connection issues\n\n' +
                      'Please verify the room ID and try again.';
      } else if (errorMessage.includes('not found')) {
        userMessage += '❌ Room not found.\n' +
                      'Please check the room ID is correct.';
      } else if (errorMessage.includes('network')) {
        userMessage += '🌐 Network error.\n' +
                      'Please check your internet connection.';
      } else {
        userMessage += '❌ ' + errorMessage;
      }
      
      alert(userMessage);
      addLog('Connection failed: ' + errorMessage);
    }
  };

  // Check URL for room parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam && !gameMode) {
      setJoinRoomId(roomParam);
      setGameMode('JOIN');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Toggle Ready
  const toggleReady = () => {
    const newReadyState = !isReady;
    setIsReady(newReadyState);
    multiplayerManager.setPlayerReady();
    
    setPlayers(prev => {
      const updated = prev.map(p => 
        p.id === myPlayerIdRef.current ? { ...p, isReady: newReadyState } : p
      );
      
      console.log('Toggle ready, updated players:', updated);
      
      // 如果是房主，广播更新
      if (isHostRef.current) {
        setTimeout(() => {
          multiplayerManager.updateGameState({ players: updated });
        }, 100);
      }
      
      return updated;
    });
  };

  // Start Game (Host Only)
  const startGame = () => {
    if (!isHost) return;
    
    const humanPlayers = players.filter(p => !p.isBot);
    // Host is always considered ready
    const readyPlayers = humanPlayers.filter(p => p.isHost || p.isReady);
    
    if (readyPlayers.length < humanPlayers.length) {
      alert('Not all players are ready!');
      return;
    }
    
    // Create bots to fill remaining slots
    const currentPlayerCount = players.length;
    const botsNeeded = Math.max(0, totalPlayers - currentPlayerCount);
    
    const newBots: MultiplayerPlayer[] = [];
    for (let i = 0; i < botsNeeded; i++) {
      newBots.push({
        id: currentPlayerCount + i,
        name: BOT_NAMES[i % BOT_NAMES.length] + (i >= BOT_NAMES.length ? `-${Math.floor(i / BOT_NAMES.length)}` : ''),
        peerId: `bot-${i}`,
        isDead: false,
        role: 'villager',
        isUser: false,
        isBot: true,
        isHost: false,
        isReady: true
      });
    }
    
    const allPlayers = [...players, ...newBots];
    
    // Assign roles randomly
    const rolesPool: Role[] = [];
    const playerCount = allPlayers.length;
    
    // Game balance: 25% werewolves, 1 seer, 1 witch, rest villagers
    const werewolfCount = Math.max(1, Math.floor(playerCount * 0.25));
    for (let i = 0; i < werewolfCount; i++) rolesPool.push('werewolf');
    rolesPool.push('seer');
    if (playerCount >= 6) rolesPool.push('witch');
    while (rolesPool.length < playerCount) rolesPool.push('villager');
    
    // Shuffle roles
    for (let i = rolesPool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rolesPool[i], rolesPool[j]] = [rolesPool[j], rolesPool[i]];
    }
    
    // Assign roles to players
    const playersWithRoles = allPlayers.map((p, i) => ({
      ...p,
      role: rolesPool[i]
    }));
    
    setPlayers(playersWithRoles);

    // Initialize Bot Memories
    const initialMemories: Record<number, BotMemory> = {};
    playersWithRoles.filter(p => p.isBot).forEach(bot => {
      initialMemories[bot.id] = initBotMemory(bot, playersWithRoles);
    });
    setBotMemories(initialMemories);
    
    // Send role to each human player
    playersWithRoles.filter(p => !p.isBot).forEach(p => {
      if (p.id === myPlayerId) {
        setMyRole(p.role);
      } else {
        multiplayerManager.assignRole(p.peerId, p.role);
      }
    });
    
    // Update game state
    multiplayerManager.updateGameState({
      phase: 'ROLE_REVEAL',
      players: playersWithRoles,
      dayCount: 1
    });
    
    setPhase('ROLE_REVEAL');
    setDayCount(1);
    addLog('Game started! Roles assigned.');
  };

  // AI Discussion Logic (Host Only)
  const startDiscussion = async (currentPlayers: MultiplayerPlayer[]) => {
    if (!isHost) return;
    
    const bots = currentPlayers.filter(p => p.isBot && !p.isDead);
    const newMemories = { ...botMemories };
    
    for (const bot of bots) {
      const memory = newMemories[bot.id];
      if (memory) {
        // Generate dialogue
        const text = await generateSmartDialogue(bot, memory, dayCount, currentPlayers, t);
        
        // Broadcast chat message
        const message = {
          playerId: bot.id,
          playerName: bot.name,
          message: text,
          timestamp: Date.now()
        };
        
        multiplayerManager.sendChatMessage(message);
        setChatMessages(prev => [...prev, message]);
        
        // Update memory (simplified for multiplayer)
        // In a full implementation, we would sync memories or have each client update their local bot state
      }
    }
    
    // Transition to Vote Phase
    setTimeout(() => {
      multiplayerManager.updateGameState({ phase: 'DAY_VOTE' });
      setPhase('DAY_VOTE');
      
      // Host triggers bot votes
      if (isHost) {
        triggerBotVotes(currentPlayers);
      }
    }, 2000);
  };
  
  // Trigger Bot Votes (Host Only)
  const triggerBotVotes = (currentPlayers: MultiplayerPlayer[]) => {
    const bots = currentPlayers.filter(p => p.isBot && !p.isDead);
    const livingPlayers = currentPlayers.filter(p => !p.isDead);
    
    bots.forEach(bot => {
      // Simple random vote for now, or use BotLogic if available
      // To avoid all bots voting instantly, add random delays
      setTimeout(() => {
        const targets = livingPlayers.filter(p => p.id !== bot.id);
        if (targets.length > 0) {
          const target = targets[Math.floor(Math.random() * targets.length)];
          multiplayerManager.sendVote(bot.id, target.id);
        }
      }, Math.random() * 3000 + 1000);
    });
  };

  // Send chat message
  const [chatInput, setChatInput] = useState('');
  const sendChatMessage = () => {
    if (!chatInput.trim()) return;
    
    const myPlayer = players.find(p => p.id === myPlayerId);
    if (!myPlayer) return;
    
    const message = {
      playerId: myPlayerId,
      playerName: myPlayer.name,
      message: chatInput,
      timestamp: Date.now()
    };
    
    multiplayerManager.sendChatMessage(message);
    setChatMessages(prev => [...prev, message]);
    setChatInput('');
  };

  // Vote action
  const handleVote = () => {
    if (selectedTarget === null) return;
    
    setHasVoted(true);
    multiplayerManager.sendVote(myPlayerId, selectedTarget);
    addLog(`You voted for ${players.find(p => p.id === selectedTarget)?.name}`);
  };

  // Copy invite link
  const copyInviteLink = () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(inviteLink)
        .then(() => alert('Invite link copied to clipboard!'))
        .catch(err => {
          console.error('Failed to copy:', err);
          alert('Failed to copy link. Please copy it manually.');
        });
    } else {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement("textarea");
      textArea.value = inviteLink;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        alert('Invite link copied to clipboard!');
      } catch (err) {
        console.error('Fallback copy failed:', err);
        alert('Failed to copy link. Please copy it manually.');
      }
      document.body.removeChild(textArea);
    }
  };

  // Render Campfire Scene
  const renderCampfireScene = () => {
    const radius = 180; // 增加半径以适应500px容器
    const centerX = 250;
    const centerY = 250;

    return (
      <div className="scene-container" style={{ width: '500px', height: '500px', margin: '0 auto', position: 'relative' }}>
        <div className="campfire-wrapper" style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
          <Campfire />
        </div>
        
        {players.map((p, index) => {
          const angle = (index * (360 / players.length)) - 90;
          const radian = (angle * Math.PI) / 180;
          const x = centerX + radius * Math.cos(radian);
          const y = centerY + radius * Math.sin(radian);
          
          const isMe = p.id === myPlayerId;
          const isSelected = selectedTarget === p.id;
          // Find the latest chat message from this player to show as bubble
          const lastMessage = [...chatMessages].reverse().find(m => m.playerId === p.id);
          const showBubble = lastMessage && (Date.now() - lastMessage.timestamp < 5000); // Show for 5 seconds
          
          return (
            <div 
              key={p.id}
              className={`scene-player ${p.isDead ? 'dead' : ''} ${isSelected ? 'selected' : ''}`}
              style={{ 
                position: 'absolute',
                left: `${x}px`, 
                top: `${y}px`,
                transform: 'translate(-50%, -50%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: p.isDead || p.isUser ? 'default' : 'pointer',
                zIndex: 10
              }}
              onClick={() => !p.isDead && !p.isUser && setSelectedTarget(p.id)}
            >
              {showBubble && (
                <div className="pixel-bubble" style={{
                  position: 'absolute',
                  bottom: '100%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: '#fff',
                  color: '#000',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  whiteSpace: 'nowrap',
                  marginBottom: '4px',
                  border: '2px solid #000',
                  zIndex: 20
                }}>
                  {lastMessage.message.length > 15 ? lastMessage.message.substring(0, 15) + '...' : lastMessage.message}
                </div>
              )}
              
              <div className="avatar-wrapper" style={{ position: 'relative' }}>
                <DetailedPixelAvatar 
                  role={
                    p.id === myPlayerId ? myRole : // Show my own role
                    (myRole === 'werewolf' && p.role === 'werewolf') ? 'werewolf' : // Show teammates if I am werewolf
                    p.isDead ? p.role : // Show role if dead
                    'villager' // Otherwise show as villager (unknown)
                  } 
                  size={48} 
                  isDead={p.isDead}
                  avatarId={p.id}
                />
                {p.isDead && <div className="tombstone" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>🪦</div>}
              </div>
              <div className="player-name-tag" style={{ 
                background: 'rgba(0,0,0,0.7)', 
                padding: '2px 4px', 
                borderRadius: '4px', 
                fontSize: '10px', 
                marginTop: '4px',
                maxWidth: '80px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {p.name} {isMe && '(You)'}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Render lobby
  if (!gameMode) {
    return (
      <div className="ww-container">
        <div className="ww-header">
          <h1 className="ww-title">🐺 Werewolf Online</h1>
          <div style={{ position: 'absolute', top: '20px', right: '20px' }}>
            <LanguageSwitcher />
          </div>
        </div>
        
        <div className="flex justify-center items-center min-h-[60vh]">
          <PixelCard className="max-w-md w-full">
            <div className="p-8 space-y-6">
              <h2 className="text-2xl font-bold text-center">Select Game Mode</h2>
              
              <div className="space-y-2">
                <label className="block text-sm">Your Name:</label>
                <input 
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-4 py-2 bg-gray-800 border-2 border-gray-600 rounded text-white"
                />
              </div>
              
              {!isConnected ? (
                <div className="flex justify-center">
                  <ConnectWallet />
                </div>
              ) : !identity ? (
                <div className="flex justify-center">
                  <PixelButton variant="parchment" onClick={generateIdentity}>
                    Generate ZK Identity
                  </PixelButton>
                </div>
              ) : (
                <div className="space-y-4">
                  <PixelButton 
                    variant="parchment" 
                    onClick={() => setGameMode('CREATE')}
                    className="w-full"
                  >
                    🎮 Create New Room
                  </PixelButton>
                  
                  <PixelButton 
                    variant="parchment" 
                    onClick={() => setGameMode('JOIN')}
                    className="w-full"
                  >
                    🔗 Join Existing Room
                  </PixelButton>
                </div>
              )}
            </div>
          </PixelCard>
        </div>
      </div>
    );
  }

  // Create room lobby
  if (gameMode === 'CREATE' && !roomId) {
    return (
      <div className="ww-container">
        <div className="ww-header">
          <h1 className="ww-title">🐺 Create Room</h1>
        </div>
        
        <div className="flex justify-center items-center min-h-[60vh]">
          <PixelCard className="max-w-md w-full">
            <div className="p-8 space-y-6">
              <h2 className="text-2xl font-bold text-center">Room Settings</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm mb-2">Total Players: {totalPlayers}</label>
                  <input 
                    type="range"
                    min="4"
                    max="12"
                    value={totalPlayers}
                    onChange={(e) => setTotalPlayers(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm mb-2">AI Bots: {botCount}</label>
                  <input 
                    type="range"
                    min="0"
                    max={totalPlayers - 1}
                    value={botCount}
                    onChange={(e) => setBotCount(Number(e.target.value))}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Human Players: {totalPlayers - botCount}
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <PixelButton 
                  variant="parchment" 
                  onClick={handleCreateRoom}
                  className="w-full"
                >
                  Create Room
                </PixelButton>
                
                <PixelButton 
                  variant="parchment" 
                  onClick={() => setGameMode(null)}
                  className="w-full"
                >
                  Back
                </PixelButton>
              </div>
            </div>
          </PixelCard>
        </div>
      </div>
    );
  }

  // Join room lobby
  if (gameMode === 'JOIN' && !roomId) {
    return (
      <div className="ww-container">
        <div className="ww-header">
          <h1 className="ww-title">🐺 Join Room</h1>
        </div>
        
        <div className="flex justify-center items-center min-h-[60vh]">
          <PixelCard className="max-w-md w-full">
            <div className="p-8 space-y-6">
              <h2 className="text-2xl font-bold text-center">Enter Room ID</h2>
              
              <div className="space-y-2">
                <label className="block text-sm">Room ID:</label>
                <input 
                  type="text"
                  value={joinRoomId}
                  onChange={(e) => setJoinRoomId(e.target.value)}
                  placeholder="werewolf-1234567890-xxxxx"
                  className="w-full px-4 py-2 bg-gray-800 border-2 border-gray-600 rounded text-white font-mono text-sm"
                />
                <p className="text-xs text-gray-400 mt-1">
                  💡 Tip: Copy the full room ID from the invite link
                </p>
              </div>
              
              {/* 帮助提示 */}
              <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-3 text-xs">
                <div className="font-bold mb-1 text-blue-300">📌 How to join:</div>
                <ol className="space-y-1 text-gray-300">
                  <li>1. Get the invite link from the host</li>
                  <li>2. Click the link (auto-fills room ID)</li>
                  <li>3. Or manually paste the room ID above</li>
                  <li>4. Click "Join Room"</li>
                </ol>
              </div>
              
              <div className="space-y-2">
                <PixelButton 
                  variant="parchment" 
                  onClick={handleJoinRoom}
                  className="w-full"
                  disabled={!joinRoomId.trim()}
                >
                  {joinRoomId.trim() ? 'Join Room' : 'Enter Room ID First'}
                </PixelButton>
                
                <PixelButton 
                  variant="parchment" 
                  onClick={() => setGameMode(null)}
                  className="w-full"
                >
                  Back
                </PixelButton>
              </div>
            </div>
          </PixelCard>
        </div>
      </div>
    );
  }

  // Game lobby (waiting for players)
  if (phase === 'LOBBY') {
    const humanPlayers = players.filter(p => !p.isBot);
    // Host is always considered ready
    const readyCount = humanPlayers.filter(p => p.isHost || p.isReady).length;
    const canStart = isHost && readyCount === humanPlayers.length && humanPlayers.length > 0;
    
    return (
      <div className="ww-container">
        <div className="ww-header">
          <h1 className="ww-title">🐺 Game Lobby</h1>
        </div>
        
        <div className="ww-grid">
          <div className="game-area">
            <PixelCard>
              <div className="p-8 space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold mb-4">
                    {isHost ? '🎮 You are the Host' : '⏳ Waiting for Host'}
                  </h2>
                  
                  {isHost && inviteLink && (
                    <div className="bg-gray-800 p-4 rounded mb-4">
                      <p className="text-sm mb-2">📎 Invite Link:</p>
                      <div className="flex gap-2">
                        <input 
                          type="text"
                          value={inviteLink}
                          readOnly
                          className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-xs font-mono"
                        />
                        <PixelButton variant="parchment" onClick={copyInviteLink}>
                          Copy
                        </PixelButton>
                      </div>
                    </div>
                  )}
                  
                  <div className="mb-6">
                    <p className="text-lg">Players: {humanPlayers.length} / {totalPlayers - botCount}</p>
                    <p className="text-sm text-gray-400">AI Bots: {botCount}</p>
                    <p className="text-sm text-gray-400">Ready: {readyCount} / {humanPlayers.length}</p>
                  </div>

                  {/* AI配置区 */}
                  {isHost && (
                    <div className="ai-config-section" style={{ margin: '1.5rem 0', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', textAlign: 'left' }}>
                      <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>🤖 AI增强模式（可选）</h3>
                      <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginBottom: '1rem' }}>
                        输入OpenRouter API Key让机器人更聪明（使用免费Gemini模型）
                      </p>
                      <input 
                        type="text" 
                        placeholder="粘贴您的OpenRouter API Key（可选）"
                        value={geminiKey}
                        onChange={(e) => {
                          setGeminiKey(e.target.value);
                          if (e.target.value.trim()) {
                            setAIConfig({ provider: 'openrouter', apiKey: e.target.value.trim() });
                            setUseAI(true);
                          } else {
                            setAIConfig({ provider: 'local' });
                            setUseAI(false);
                          }
                        }}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          background: '#1f2937',
                          border: '2px solid #374151',
                          color: 'white',
                          borderRadius: '4px',
                          fontFamily: 'monospace',
                          fontSize: '0.85rem'
                        }}
                      />
                      {useAI && <p style={{ fontSize: '0.75rem', color: '#4ade80', marginTop: '0.5rem' }}>✅ AI已启用 (OpenRouter)</p>}
                      <p style={{ fontSize: '0.7rem', color: '#6b7280', marginTop: '0.5rem' }}>
                        申请地址：<a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa' }}>openrouter.ai/keys</a> (免费额度充足)
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-bold">Players in Lobby:</h3>
                  {players.map((player) => (
                    <div 
                      key={player.id} 
                      className="flex items-center justify-between bg-gray-800 p-3 rounded"
                    >
                      <div className="flex items-center gap-3">
                        <DetailedPixelAvatar role="villager" size={32} />
                        <span>{player.name} {player.isHost && '👑'} {player.id === myPlayerId && '(You)'}</span>
                      </div>
                      <span>{player.isHost || player.isReady ? '✅ Ready' : '⏳ Not Ready'}</span>
                    </div>
                  ))}
                </div>
                
                <div className="space-y-2">
                  {!isHost && (
                    <PixelButton 
                      variant="parchment" 
                      onClick={toggleReady}
                      className="w-full"
                    >
                      {isReady ? '❌ Not Ready' : '✅ Ready'}
                    </PixelButton>
                  )}
                  
                  {isHost && (
                    <PixelButton 
                      variant="parchment" 
                      onClick={startGame}
                      className="w-full"
                      disabled={!canStart}
                    >
                      🎮 Start Game
                    </PixelButton>
                  )}
                </div>
              </div>
            </PixelCard>
          </div>
          
          <div className="sidebar">
            <PixelCard title="Game Log">
              <div className="ww-log-container">
                {logs.map((log, i) => <div key={i} className="ww-log-item">{log}</div>)}
              </div>
            </PixelCard>
          </div>
        </div>
      </div>
    );
  }

  // Role reveal
  if (phase === 'ROLE_REVEAL') {
    return (
      <div className="ww-container">
        <div className="ww-header">
          <h1 className="ww-title">🐺 Your Role</h1>
        </div>
        
        <div className="flex justify-center items-center min-h-[60vh]">
          <PixelCard className="max-w-md w-full">
            <div className="p-8 text-center space-y-6">
              <h2 className="text-2xl font-bold">You are a</h2>
              <div className="flex justify-center">
                <DetailedPixelAvatar role={myRole} size={128} />
              </div>
              <h3 className="text-3xl font-bold">{myRole.toUpperCase()}</h3>
              <p className="text-sm text-gray-400">
                {myRole === 'werewolf' && 'Eliminate villagers at night'}
                {myRole === 'seer' && 'Check one player\'s identity each night'}
                {myRole === 'witch' && 'You have healing and poison potions'}
                {myRole === 'villager' && 'Find and eliminate the werewolves'}
              </p>
              
              {isHost && (
                <PixelButton 
                  variant="parchment" 
                  onClick={() => {
                    // Start Day Discussion
                    multiplayerManager.updateGameState({ phase: 'DAY_DISCUSS' });
                    setPhase('DAY_DISCUSS');
                    
                    // Host triggers bot discussions
                    if (isHost) {
                      startDiscussion(players);
                    }
                  }}
                >
                  Start Day Discussion
                </PixelButton>
              )}
              
              {!isHost && (
                <p className="text-sm text-gray-400">Waiting for host to start discussion...</p>
              )}
            </div>
          </PixelCard>
        </div>
      </div>
    );
  }

  // Main game view (simplified for now)
  return (
    <div className="ww-container">
      {/* 聊天记录面板 */}
      {(phase as GamePhase) !== 'LOBBY' && (
        <div className="chat-panel">
          <div className="chat-header">💬 Chat Log</div>
          <div className="chat-messages">
            {chatMessages.map((msg, idx) => {
              const player = players.find(p => p.id === msg.playerId);
              return (
                <div key={idx} className="chat-message">
                  <div className="chat-avatar">
                    <DetailedPixelAvatar 
                      role={
                        player?.id === myPlayerId ? myRole : // Show my own role
                        (myRole === 'werewolf' && player?.role === 'werewolf') ? 'werewolf' : // Show teammates if I am werewolf
                        player?.isDead ? player.role : // Show role if dead
                        'villager' // Otherwise show as villager (unknown)
                      }
                      isDead={player?.isDead || false}
                      size={32}
                      avatarId={msg.playerId}
                    />
                  </div>
                  <div className="chat-content">
                    <div className="chat-name">{msg.playerName}</div>
                    <div className="chat-text">
                      {msg.message}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Chat Input Area */}
          <div style={{ padding: '10px', borderTop: '2px solid #000', background: '#1a1a2e' }}>
            <div className="flex gap-2">
              <input 
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                placeholder="Type message..."
                className="flex-1 px-2 py-1 bg-gray-800 border border-gray-600 rounded text-xs text-white"
                style={{ fontFamily: 'monospace' }}
              />
              <PixelButton variant="parchment" onClick={sendChatMessage}>
                Send
              </PixelButton>
            </div>
          </div>
        </div>
      )}

      <div className="ww-header">
        <h1 className="ww-title">🐺 Werewolf Game - {phase} (Day {dayCount})</h1>
      </div>
      
      <div className="ww-grid">
        <div className="game-area">
          <PixelCard className="h-full">
            <div className="game-layout-vertical">
              {/* 1. Phase Header Box */}
              <div className="phase-box">
                <div className="phase-text">
                  {phase === 'NIGHT' ? t('werewolf.phases.night') : 
                   phase === 'DAY_DISCUSS' ? t('werewolf.phases.discussion') :
                   phase === 'DAY_VOTE' ? t('werewolf.phases.day') :
                   t('werewolf.phases.gameOver')} 
                   <span className="day-count"> (Day {dayCount})</span>
                </div>
              </div>

              {/* 2. Main Game Scene (Grass/Trees) */}
              <div className="game-scene picnic-theme">
                {renderCampfireScene()}
              </div>

              {/* 3. Action Panel Box */}
              <div className="action-box">
                <div className="action-content">
                  {phase === 'DAY_VOTE' && !hasVoted && (
                    <>
                      <p>{t('werewolf.actions.vote')}</p>
                      <PixelButton 
                        variant="parchment" 
                        onClick={handleVote}
                        disabled={selectedTarget === null}
                        className="w-full"
                      >
                        Vote to Eliminate
                      </PixelButton>
                    </>
                  )}
                  {phase === 'DAY_DISCUSS' && (
                    <p className="text-sm text-gray-400">Listening to other players...</p>
                  )}
                  {phase === 'NIGHT' && (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-400">
                        {myRole === 'villager' ? 'You are sleeping... 💤' : 
                         myRole === 'werewolf' ? 'Choose a target to eliminate...' :
                         myRole === 'seer' ? 'Choose a player to check...' :
                         myRole === 'witch' ? 'Wait for your turn...' : ''}
                      </p>
                      
                      {myRole === 'werewolf' && !players.find(p => p.id === myPlayerId)?.isDead && (
                        <PixelButton 
                          variant="parchment" 
                          onClick={() => {
                            if (selectedTarget !== null) {
                              multiplayerManager.sendNightAction(myPlayerId, selectedTarget, 'KILL');
                              addLog(`You chose to eliminate ${players.find(p => p.id === selectedTarget)?.name}`);
                              setSelectedTarget(null);
                            }
                          }}
                          disabled={selectedTarget === null}
                          className="w-full"
                        >
                          🐺 Kill Target
                        </PixelButton>
                      )}
                      
                      {myRole === 'seer' && !players.find(p => p.id === myPlayerId)?.isDead && (
                        <PixelButton 
                          variant="parchment" 
                          onClick={() => {
                            if (selectedTarget !== null) {
                              multiplayerManager.sendNightAction(myPlayerId, selectedTarget, 'CHECK');
                              const target = players.find(p => p.id === selectedTarget);
                              addLog(`🔮 You checked ${target?.name}: They are a ${target?.role}`);
                              setSelectedTarget(null);
                            }
                          }}
                          disabled={selectedTarget === null}
                          className="w-full"
                        >
                          🔮 Check Identity
                        </PixelButton>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </PixelCard>
        </div>
        
        <div className="sidebar space-y-4">
          <PixelCard title="Game Log">
            <div className="ww-log-container">
              {logs.map((log, i) => <div key={i} className="ww-log-item">{log}</div>)}
            </div>
          </PixelCard>
        </div>
      </div>
    </div>
  );
};
