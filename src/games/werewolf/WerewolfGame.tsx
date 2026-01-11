import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { PixelCard, PixelButton } from './components/PixelComponents';
import { DetailedPixelAvatar } from './components/DetailedPixelAvatar';
import { MagicCircle } from './components/MagicCircle';
import { Campfire } from './components/Campfire';
import { useSemaphoreIdentity } from '../../zk/useSemaphoreIdentity';
import { useAccount } from 'wagmi';
import ConnectWallet from '../../components/ConnectWallet';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import { 
  initBotMemory, 
  updateBotMemory, 
  decideBotVote, 
  generateSmartDialogue,
  analyzeDialogue,
  updateBehaviorPattern
} from './BotLogic';
import type { BotMemory } from './BotLogic';
import { setAIConfig } from './AIConfig';
import './WerewolfGame.css';

type GamePhase = 'LOBBY' | 'ROLE_REVEAL' | 'NIGHT' | 'DAY_DISCUSS' | 'DAY_VOTE' | 'GAME_OVER';
type Role = 'villager' | 'werewolf' | 'seer' | 'witch';

interface Player {
  id: number;
  name: string;
  isDead: boolean;
  role: Role;
  isUser: boolean;
  isBot: boolean;
}

const BOT_NAMES = ['Bot-Alpha', 'Bot-Beta', 'Bot-Gamma', 'Bot-Delta', 'Bot-Epsilon', 'Bot-Zeta', 'Bot-Eta'];

export const WerewolfGame = () => {
  const { t } = useTranslation();
  const { isConnected } = useAccount();
  const { identity, generateIdentity } = useSemaphoreIdentity();
  
  const [phase, setPhase] = useState<GamePhase>('LOBBY');
  const [myRole, setMyRole] = useState<Role>('villager');
  const [players, setPlayers] = useState<Player[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [zkStatus, setZkStatus] = useState<'IDLE' | 'GENERATING' | 'VERIFIED'>('IDLE');
  const [selectedTarget, setSelectedTarget] = useState<number | null>(null);
  const [dayCount, setDayCount] = useState(0);
  const [seerCheckResult, setSeerCheckResult] = useState<string | null>(null);
  const [agentDialogues, setAgentDialogues] = useState<{id: number, text: string}[]>([]);
  
  // Bot Logic State
  const [botMemories, setBotMemories] = useState<Record<number, BotMemory>>({});
  
  // AI Config State
  const [geminiKey, setGeminiKey] = useState<string>('');
  const [useAI, setUseAI] = useState(false);
  
  // 聊天记录系统
  const [chatMessages, setChatMessages] = useState<{
    playerId: number;
    playerName: string;
    message: string;
    timestamp: number;
  }[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isTyping, _setIsTyping] = useState(false); // 是否正在打字动画
  const [isDiscussing, setIsDiscussing] = useState(false); // 防止重复触发讨论

  // Witch State
  const [witchPotions, setWitchPotions] = useState({ heal: true, poison: true });
  const [nightVictimId, setNightVictimId] = useState<number | null>(null);
  const [witchActionTaken, setWitchActionTaken] = useState(false);
  
  // User Action State
  const [hasVoted, setHasVoted] = useState(false);

  // Initialize Game
  const startGame = () => {
    if (!identity) {
      alert(t('werewolf.lobby.generateIdentity'));
      return;
    }
    
    // 8 Players: 2 Werewolves, 1 Seer, 1 Witch, 4 Villagers
    const rolesPool: Role[] = [
      'werewolf', 'werewolf', 
      'seer', 'witch', 
      'villager', 'villager', 'villager', 'villager'
    ];
    
    // Shuffle Roles
    for (let i = rolesPool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rolesPool[i], rolesPool[j]] = [rolesPool[j], rolesPool[i]];
    }

    const userRole = rolesPool[0];
    setMyRole(userRole);

    const newPlayers: Player[] = [
      { id: 0, name: 'You', isDead: false, role: userRole, isUser: true, isBot: false },
      ...BOT_NAMES.map((name, index) => ({
        id: index + 1,
        name,
        isDead: false,
        role: rolesPool[index + 1],
        isUser: false,
        isBot: true
      }))
    ];

    // Initialize Bot Memories
    const initialMemories: Record<number, BotMemory> = {};
    newPlayers.filter(p => p.isBot).forEach(bot => {
      initialMemories[bot.id] = initBotMemory(bot, newPlayers);
    });
    setBotMemories(initialMemories);

    setPlayers(newPlayers);
    setDayCount(1);
    setLogs([]);
    setAgentDialogues([]);
    setChatMessages([]); // 清空聊天记录
    setIsDiscussing(false); // 重置讨论标志
    setWitchPotions({ heal: true, poison: true });
    setHasVoted(false);
    addLog(t('werewolf.logs.gameStarted'));
    addLog(t('werewolf.logs.rolesDistributed'));
    setPhase('ROLE_REVEAL');
  };

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
  };
  

  // 添加聊天消息
  const addChatMessage = useCallback((playerId: number, playerName: string, message: string) => {
    setChatMessages(prev => [...prev, {
      playerId,
      playerName,
      message,
      timestamp: Date.now()
    }]);
  }, []);

  // ZK Action Simulator
  const performZkAction = async (actionType: 'KILL' | 'VOTE' | 'CHECK' | 'HEAL' | 'POISON' | 'NO_ACTION', targetId?: number) => {
    if (!identity) return;
    
    setZkStatus('GENERATING');
    addLog(t('werewolf.logs.generatingProof'));
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setZkStatus('VERIFIED');
      addLog(t('werewolf.logs.proofVerified'));
      
      if (actionType === 'KILL') {
        handleNightKill(targetId!);
      } else if (actionType === 'VOTE') {
        handleDayVote(targetId!);
      } else if (actionType === 'CHECK') {
        handleSeerCheck(targetId!);
      } else if (actionType === 'HEAL') {
        handleWitchAction('HEAL', targetId);
      } else if (actionType === 'POISON') {
        handleWitchAction('POISON', targetId!);
      } else if (actionType === 'NO_ACTION') {
        handleWitchAction('NO_ACTION');
      }
      
      setTimeout(() => setZkStatus('IDLE'), 500);
    } catch (e) {
      console.error(e);
      addLog(t('werewolf.logs.proofFailed'));
      setZkStatus('IDLE');
    }
  };

  // --- Bot Logic ---

  const getLivingPlayers = (currentPlayers: Player[]) => currentPlayers.filter(p => !p.isDead);

  const runBotWerewolfKill = (currentPlayers: Player[], userTargetId?: number): number | null => {
    // If user is werewolf, use their target. If not, bots vote.
    const werewolves = currentPlayers.filter(p => p.role === 'werewolf' && !p.isDead);
    if (werewolves.length === 0) return null;

    if (werewolves.some(p => p.isUser) && userTargetId !== undefined) {
      return userTargetId;
    }

    // Bots pick random non-wolf
    const targets = getLivingPlayers(currentPlayers).filter(p => p.role !== 'werewolf');
    if (targets.length > 0) {
      return targets[Math.floor(Math.random() * targets.length)].id;
    }
    return null;
  };

  const runBotWitchAction = (currentPlayers: Player[], victimId: number | null): { healed: boolean, poisonedId: number | null } => {
    // Only runs if Witch is a BOT and alive
    const witch = currentPlayers.find(p => p.role === 'witch');
    if (!witch || witch.isDead || witch.isUser) return { healed: false, poisonedId: null };

    // Simple Bot Logic:
    // 1. Always heal if someone is dying (and have potion)
    // 2. Rarely poison (10% chance)
    
    // Note: In this simplified version, we don't track potion usage for bots persistently across re-renders unless we store it in state.
    // For now, let's assume bot witch is generous and has potions if we haven't tracked it. 
    // Ideally, we should track bot witch potions in `players` or separate state.
    // Let's just randomize it for flavor.
    
    let healed = false;
    let poisonedId = null;

    if (victimId !== null && Math.random() > 0.2) {
       healed = true; // 80% chance to heal
    }

    if (!healed && Math.random() < 0.1) {
       // 10% chance to poison random non-witch
       const targets = getLivingPlayers(currentPlayers).filter(p => p.role !== 'witch');
       if (targets.length > 0) {
         poisonedId = targets[Math.floor(Math.random() * targets.length)].id;
       }
    }

    return { healed, poisonedId };
  };

  const runBotDayVotes = (currentPlayers: Player[], userVoteTargetId?: number): { executedId: number | null } => {
    const votes: Record<number, number> = {};
    const living = getLivingPlayers(currentPlayers);
    const newMemories = { ...botMemories };

    living.forEach(voter => {
      let targetId = -1;
      if (voter.isUser) {
        targetId = userVoteTargetId!;
      } else {
        const memory = newMemories[voter.id];
        if (memory) {
          const decision = decideBotVote(voter, memory, living);
          targetId = decision !== null ? decision : -1;
        } else {
          const targets = living.filter(p => p.id !== voter.id);
          if (targets.length > 0) {
            targetId = targets[Math.floor(Math.random() * targets.length)].id;
          }
        }
      }

      if (targetId !== -1) {
        votes[targetId] = (votes[targetId] || 0) + 1;
        const voterName = voter.name;
        const targetName = currentPlayers.find(p => p.id === targetId)?.name;
        addLog(t('werewolf.logs.votedFor', { voter: voterName, target: targetName }));

        // Update Memories: Everyone sees this vote
        Object.values(newMemories).forEach(mem => {
            updateBotMemory(mem, { type: 'VOTE', actorId: voter.id, targetId });
        });
      }
    });

    setBotMemories(newMemories);

    let maxVotes = 0;
    let executedId: number | null = null;
    let tie = false;

    Object.entries(votes).forEach(([idStr, count]) => {
      const id = parseInt(idStr);
      if (count > maxVotes) {
        maxVotes = count;
        executedId = id;
        tie = false;
      } else if (count === maxVotes) {
        tie = true;
      }
    });

    if (tie) return { executedId: null };
    return { executedId };
  };

  // --- Phase Handlers ---

  // 1. Night Start
  const startNight = () => {
    setPhase('NIGHT');
    setDayCount(prev => prev + 1);
    setSeerCheckResult(null);
    setAgentDialogues([]);
    setNightVictimId(null);
    setWitchActionTaken(false);
    setSelectedTarget(null);
    addLog(t('werewolf.logs.nightFalls'));

    // If User is Villager, auto-skip after delay
    if (myRole === 'villager' && !players.find(p => p.isUser)?.isDead) {
      setTimeout(() => resolveNight(null, null, null), 4000);
    }
    // If User is Dead, auto-skip
    if (players.find(p => p.isUser)?.isDead) {
      setTimeout(() => resolveNight(null, null, null), 4000);
    }
  };

  // 2. Werewolf Action (User or Bot)
  const handleNightKill = (targetId: number) => {
    // User is Werewolf
    setNightVictimId(targetId);
    addLog(`You targeted ${players.find(p => p.id === targetId)?.name} for elimination.`);
    
    // 如果用户是女巫，等待女巫行动；否则直接进入resolveNight
    if (myRole === 'witch' && !players.find(p => p.isUser)?.isDead) {
      // 女巫需要看到击杀信息，不自动进入下一步
      return;
    }
    
    // 其他角色：直接进入夜晚结算
    setTimeout(() => resolveNight(targetId, null, null), 1500);
  };

  // 3. Seer Action
  const handleSeerCheck = (targetId: number) => {
    const target = players.find(p => p.id === targetId);
    if (target) {
      const isGood = target.role !== 'werewolf';
      const roleStr = isGood ? t('werewolf.roles.villager') : t('werewolf.roles.werewolf');
      setSeerCheckResult(t('werewolf.logs.seerCheck', { name: target.name, role: roleStr }));
    }
    
    setZkStatus('IDLE'); // 重置ZK状态
    
    // 如果用户是女巫，等待女巫行动；否则直接进入resolveNight
    if (myRole === 'witch' && !players.find(p => p.isUser)?.isDead) {
      // 女巫需要看到击杀信息，不自动进入下一步
      return;
    }
    
    // 其他角色：预言家查验完毕后自动进入夜晚结算
    setTimeout(() => resolveNight(null, null, null), 1500);
  };

  // 4. Witch Action
  const handleWitchAction = (action: 'HEAL' | 'POISON' | 'NO_ACTION', targetId?: number) => {
    let healed = false;
    let poisonedId: number | null = null;

    if (action === 'HEAL') {
      healed = true;
      setWitchPotions(prev => ({ ...prev, heal: false }));
      addLog(t('werewolf.logs.witchHeal'));
    } else if (action === 'POISON' && targetId !== undefined) {
      poisonedId = targetId;
      setWitchPotions(prev => ({ ...prev, poison: false }));
      addLog(t('werewolf.logs.witchPoison'));
    } else if (action === 'NO_ACTION') {
      addLog('Witch chose not to act.');
    }

    setWitchActionTaken(true);
    setZkStatus('IDLE'); // 重置ZK状态
    
    // 等待一下然后进入夜晚结算
    setTimeout(() => resolveNight(nightVictimId, healed, poisonedId), 1500);
  };

  // Master Night Resolver
  // This is called when the "Active" player has finished their turn, or automatically.
  // We need to simulate the turns of others.
  const resolveNight = (userKilledId: number | null, userHealed: boolean | null, userPoisonedId: number | null) => {
    let finalVictimId = userKilledId;
    
    // 1. Werewolf Turn (if user didn't kill)
    if (myRole !== 'werewolf') {
      finalVictimId = runBotWerewolfKill(players);
    }

    // 1.5 Seer Turn (Bot)
    if (myRole !== 'seer') {
      const seerBot = players.find(p => p.role === 'seer' && p.isBot && !p.isDead);
      if (seerBot) {
        const memory = botMemories[seerBot.id];
        if (memory) {
          const unknownPlayers = players.filter(p => !memory.knownRoles[p.id] && p.id !== seerBot.id);
          if (unknownPlayers.length > 0) {
            const target = unknownPlayers[Math.floor(Math.random() * unknownPlayers.length)];
            updateBotMemory(memory, { type: 'SEER_CHECK', targetId: target.id, role: target.role });
            setBotMemories(prev => ({ ...prev, [seerBot.id]: memory }));
          }
        }
      }
    }

    // 2. Witch Turn (if user is not witch)
    let healed = userHealed === true;
    let poisonedId = userPoisonedId;

    if (myRole !== 'witch') {
      const botWitchResult = runBotWitchAction(players, finalVictimId);
      if (botWitchResult.healed) healed = true;
      if (botWitchResult.poisonedId) poisonedId = botWitchResult.poisonedId;
    }

    // Apply Deaths
    let deadIds: number[] = [];
    
    // Wolf Kill (unless healed)
    if (finalVictimId !== null && !healed) {
      deadIds.push(finalVictimId);
    }
    
    // Poison Kill
    if (poisonedId !== null) {
      deadIds.push(poisonedId);
    }

    // Update Players
    let newPlayers = [...players];
    deadIds.forEach(id => {
      newPlayers = newPlayers.map(p => p.id === id ? { ...p, isDead: true } : p);
    });

    setPlayers(newPlayers);

    // Transition to Day
    setTimeout(() => {
      setPhase('DAY_DISCUSS');
      addLog(t('werewolf.logs.morningBreaks'));
      
      if (deadIds.length === 0) {
        addLog(t('werewolf.logs.peacefulNight'));
      } else {
        deadIds.forEach(id => {
          const victim = players.find(p => p.id === id);
          addLog(t('werewolf.logs.foundDead', { name: victim?.name }));
        });
      }
      
      if (!checkGameOver(newPlayers)) {
        startDiscussion(newPlayers);
      }
    }, 2000);
  };

  const startDiscussion = async (currentPlayers: Player[]) => {
    // 防止重复调用
    if (isDiscussing) {
      console.log('Already discussing, skipping...');
      return;
    }
    
    setIsDiscussing(true);
    setAgentDialogues([]);
    const bots = currentPlayers.filter(p => p.isBot && !p.isDead);
    const newMemories = { ...botMemories };
    
    for (const bot of bots) {
      // 移除延迟，让AI更快响应
      const memory = newMemories[bot.id];
      if (memory) {
        // 等待AI返回结果
        const text = await generateSmartDialogue(bot, memory, dayCount, currentPlayers, t);
        
        // 直接添加到聊天记录，无打字机效果
        addChatMessage(bot.id, bot.name, text);
        
        setAgentDialogues(prev => [...prev, { id: bot.id, text }]);
        
        // AI分析：记录对话并更新行为模式
        const analysis = analyzeDialogue(text);
        
        // ✨ 关键修复：所有bot都要看到这条发言
        const dialogueEntry = {
          speakerId: bot.id,
          text,
          day: dayCount,
          analysis
        };
        
        // 把这条发言加到所有bot的记忆中（包括发言者自己）
        Object.values(newMemories).forEach(otherMemory => {
          otherMemory.dialogueHistory.push(dialogueEntry);
          
          // 如果不是自己，还要学习这个对话的行为模式
          if (otherMemory.id !== bot.id) {
            updateBehaviorPattern(otherMemory, bot.id, analysis);
            // 如果有角色声明，记录下来
            if (analysis?.claimedRole) {
              otherMemory.knownRoles[bot.id] = analysis.claimedRole;
            }
          }
        });
      }
    }
    
    setBotMemories(newMemories);
    setIsDiscussing(false);

    setTimeout(() => {
      setPhase('DAY_VOTE');
      setHasVoted(false);
      setSelectedTarget(null);
    }, 1000);
  };

  const handleDayVote = (targetId: number) => {
    setHasVoted(true);
    const { executedId } = runBotDayVotes(players, targetId);

    let newPlayers = [...players];
    if (executedId !== null) {
      newPlayers = newPlayers.map(p => p.id === executedId ? { ...p, isDead: true } : p);
      const victim = players.find(p => p.id === executedId);
      addLog(t('werewolf.logs.voteResult', { name: victim?.name }));
    } else {
      addLog(t('werewolf.logs.voteTie'));
    }

    setPlayers(newPlayers);

    if (!checkGameOver(newPlayers)) {
      setTimeout(() => {
        startNight();
      }, 3000);
    }
  };

  const checkGameOver = (currentPlayers: Player[]) => {
    const wolves = currentPlayers.filter(p => p.role === 'werewolf' && !p.isDead).length;
    const good = currentPlayers.filter(p => p.role !== 'werewolf' && !p.isDead).length;

    if (wolves === 0) {
      setPhase('GAME_OVER');
      addLog(t('werewolf.logs.villagersWin'));
      return true;
    } else if (wolves >= good) {
      setPhase('GAME_OVER');
      addLog(t('werewolf.logs.werewolvesWin'));
      return true;
    }
    return false;
  };

  // --- Render Helpers ---

  const renderCampfireScene = () => {
    const radius = 180; // 增加半径以适应500px容器
    const centerX = 250;
    const centerY = 250;

    return (
      <div className="scene-container" style={{ width: '500px', height: '500px' }}>
        <div className="campfire-wrapper">
          <Campfire />
        </div>
        {players.map((p, i) => {
          const angle = (i * (360 / players.length)) - 90;
          const radian = (angle * Math.PI) / 180;
          const x = centerX + radius * Math.cos(radian);
          const y = centerY + radius * Math.sin(radian);
          
          const dialogue = agentDialogues.find(d => d.id === p.id);

          return (
            <div 
              key={p.id}
              className={`scene-player ${p.isDead ? 'dead' : ''} ${selectedTarget === p.id ? 'selected' : ''}`}
              style={{ 
                left: `${x}px`, 
                top: `${y}px`,
                transform: 'translate(-50%, -50%)'
              }}
              onClick={() => handlePlayerClick(p)}
            >
              {dialogue && (
                <div className="pixel-bubble">
                  {dialogue.text}
                </div>
              )}
              <div className="avatar-wrapper">
                <DetailedPixelAvatar 
                  role={p.isUser ? myRole : (p.isDead ? p.role : 'unknown')} 
                  isDead={p.isDead}
                  avatarId={p.id}
                />
                {p.isDead && <div className="tombstone">🪦</div>}
              </div>
              <div className="player-name-tag">
                {p.name} {p.isUser && '(You)'}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const handlePlayerClick = (p: Player) => {
    if (p.isDead || p.isUser) return;
    
    if (phase === 'NIGHT') {
      if (myRole === 'werewolf') setSelectedTarget(p.id);
      if (myRole === 'seer') setSelectedTarget(p.id);
      if (myRole === 'witch') setSelectedTarget(p.id); // For poison
    } else if (phase === 'DAY_VOTE' && !hasVoted) {
      setSelectedTarget(p.id);
    }
  };

  // Special Witch Logic for Night
  // We need to know who died to show the Heal option
  // But in this simplified flow, we might not know the exact victim ID until we run the bot logic.
  // To make it interactive, we'd need a "Wait for Wolves" phase.
  // For now, let's simulate: If User is Witch, we pause and calculate who the bots killed.
  useEffect(() => {
    if (phase === 'NIGHT' && myRole === 'witch' && !witchActionTaken && nightVictimId === null) {
      // Simulate waiting for wolves
      const timer = setTimeout(() => {
        const victimId = runBotWerewolfKill(players);
        setNightVictimId(victimId);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [phase, myRole, witchActionTaken, nightVictimId, players]);


  const renderActionPanel = () => {
    if (phase === 'LOBBY' || phase === 'GAME_OVER' || phase === 'ROLE_REVEAL') return null;
    if (players.find(p => p.isUser)?.isDead) return <div className="action-panel">You are dead. Spectating...</div>;

    if (phase === 'NIGHT') {
      if (myRole === 'villager') {
        return <div className="action-content">You are sleeping... 💤</div>;
      }
      
      if (myRole === 'werewolf') {
        return (
          <div className="action-content">
            <p>{t('werewolf.actions.kill')}</p>
            <PixelButton 
              disabled={selectedTarget === null || zkStatus === 'GENERATING'}
              onClick={() => selectedTarget !== null && performZkAction('KILL', selectedTarget)}
              variant="parchment"
            >
              {t('werewolf.actions.kill')}
            </PixelButton>
          </div>
        );
      }
      
      if (myRole === 'seer') {
        return (
          <div className="action-content">
            <p>{t('werewolf.actions.check')}</p>
            {seerCheckResult && <div className="seer-result">{seerCheckResult}</div>}
            {!seerCheckResult && (
              <PixelButton 
                disabled={selectedTarget === null || zkStatus === 'GENERATING'}
                onClick={() => selectedTarget !== null && performZkAction('CHECK', selectedTarget)}
                variant="parchment"
              >
                {t('werewolf.actions.check')}
              </PixelButton>
            )}
            {seerCheckResult && (
               <PixelButton variant="parchment" onClick={() => resolveNight(null, null, null)}>{t('werewolf.actions.endTurn')}</PixelButton>
            )}
          </div>
        );
      }

      if (myRole === 'witch') {
        if (witchActionTaken) return <div className="action-content">You have finished your turn.</div>;
        
        return (
          <div className="action-content">
            <p>Witch Actions</p>
            {nightVictimId !== null && (
              <div className="mb-4">
                <p>Someone was attacked tonight...</p>
                <PixelButton 
                  disabled={!witchPotions.heal || zkStatus === 'GENERATING' || nightVictimId === 0}
                  onClick={() => performZkAction('HEAL', nightVictimId)}
                  variant="parchment"
                >
                  {t('werewolf.actions.heal')} ({witchPotions.heal ? '1' : '0'})
                </PixelButton>
                {nightVictimId === 0 && <p className="text-xs text-red-400 mt-1">You cannot heal yourself.</p>}
              </div>
            )}
            
            <div className="mb-4">
              <p>Poison a player?</p>
              <PixelButton 
                disabled={!witchPotions.poison || selectedTarget === null || zkStatus === 'GENERATING'}
                onClick={() => selectedTarget !== null && performZkAction('POISON', selectedTarget)}
                variant="parchment"
              >
                {t('werewolf.actions.poison')} ({witchPotions.poison ? '1' : '0'})
              </PixelButton>
            </div>

            <PixelButton variant="parchment" onClick={() => performZkAction('NO_ACTION')}>
              {t('werewolf.actions.noAction')}
            </PixelButton>
          </div>
        );
      }
    }

    if (phase === 'DAY_DISCUSS') {
      return (
        <div className="action-content">
          <p>{t('werewolf.phases.discussion')}</p>
          <p className="text-sm text-gray-400">Listening to other players...</p>
        </div>
      );
    }

    if (phase === 'DAY_VOTE') {
      return (
        <div className="action-content">
          <p>{t('werewolf.actions.vote')}</p>
          <PixelButton 
            disabled={selectedTarget === null || zkStatus === 'GENERATING' || hasVoted}
            onClick={() => selectedTarget !== null && performZkAction('VOTE', selectedTarget)}
            variant="parchment"
          >
            {hasVoted ? 'Voted' : t('werewolf.actions.vote')}
          </PixelButton>
        </div>
      );
    }
  };

  return (
    <div className="ww-container">
      <MagicCircle active={zkStatus === 'GENERATING'} />
      
      {/* 聊天记录面板 */}
      {phase !== 'LOBBY' && (
        <div className="chat-panel">
          <div className="chat-header">💬 {t('werewolf.chatLog')}</div>
          <div className="chat-messages">
            {chatMessages.map((msg, idx) => {
              const player = players.find(p => p.id === msg.playerId);
              return (
                <div key={idx} className="chat-message">
                  <div className="chat-avatar">
                    <DetailedPixelAvatar 
                      role={player?.role || 'villager'}
                      isDead={player?.isDead || false}
                      size={32}
                      avatarId={msg.playerId}
                    />
                  </div>
                  <div className="chat-content">
                    <div className="chat-name">{msg.playerName}</div>
                    <div className="chat-text">
                      {msg.message}
                      {idx === chatMessages.length - 1 && isTyping && (
                        <span className="typing-cursor">▋</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      <div className="ww-header">
        <h1 className="ww-title">{t('werewolf.title')}</h1>
        <div style={{ position: 'absolute', top: '20px', right: '20px' }}>
          <LanguageSwitcher />
        </div>
      </div>

      <div className="ww-grid">
        {/* Main Game Area */}
        <div className="game-area">
          <PixelCard className="h-full">
            {phase === 'LOBBY' && (
              <div className="ww-lobby">
                <h2>{t('werewolf.lobby.welcome')}</h2>
                <p>{t('werewolf.lobby.desc')}</p>
                <p>{t('werewolf.lobby.players')}</p>
                <p>{t('werewolf.lobby.roles')}</p>
                
                {/* AI配置区 */}
                <div className="ai-config-section" style={{ margin: '1.5rem 0', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
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
                
                {!isConnected ? (
                  <div className="flex-center"><ConnectWallet /></div>
                ) : !identity ? (
                  <div className="flex-center"><PixelButton variant="parchment" onClick={generateIdentity}>{t('werewolf.lobby.generateIdentity')}</PixelButton></div>
                ) : (
                  <div className="flex-center">
                    <p className="ready-text">{t('werewolf.lobby.identityReady')}</p>
                    <PixelButton variant="parchment" onClick={startGame}>{t('werewolf.lobby.startGame')}</PixelButton>
                  </div>
                )}
              </div>
            )}

            {phase === 'ROLE_REVEAL' && (
              <div className="ww-role-reveal">
                <h2>{t('werewolf.roleReveal.title')}</h2>
                <div className="ww-role-box">
                  <DetailedPixelAvatar role={myRole} size={128} />
                  <p className="ww-role-name">{t(`werewolf.roles.${myRole}`)}</p>
                </div>
                <p style={{ fontSize: '0.875rem', color: '#9ca3af', maxWidth: '400px', margin: '0 auto 2rem' }}>
                  {t('werewolf.roleReveal.desc')}
                </p>
                <PixelButton variant="parchment" onClick={startNight}>{t('werewolf.roleReveal.enterNight')}</PixelButton>
              </div>
            )}

            {(phase === 'NIGHT' || phase === 'DAY_DISCUSS' || phase === 'DAY_VOTE' || phase === 'GAME_OVER') && (
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
                  {phase === 'GAME_OVER' && (
                     <div className="game-over-overlay">
                       <PixelButton variant="parchment" onClick={startGame}>{t('werewolf.actions.playAgain')}</PixelButton>
                     </div>
                  )}
                </div>

                {/* 3. Action Panel Box */}
                <div className="action-box">
                  {renderActionPanel()}
                </div>
              </div>
            )}
          </PixelCard>
        </div>

        {/* Sidebar */}
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
};
