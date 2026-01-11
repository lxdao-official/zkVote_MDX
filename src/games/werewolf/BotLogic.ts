import type { TFunction } from 'i18next';
import { getAIConfig, callOpenRouterAPI, buildWerewolfPrompt } from './AIConfig';

export type Role = 'villager' | 'werewolf' | 'seer' | 'witch';

export interface Player {
  id: number;
  name: string;
  isDead: boolean;
  role: Role;
  isUser: boolean;
  isBot: boolean;
}

export interface DialogueHistory {
  speakerId: number;
  text: string;
  day: number;
  analysis?: {
    sentiment: 'accusation' | 'defense' | 'neutral' | 'claim';
    targetId?: number;
    claimedRole?: Role;
  };
}

export interface BotMemory {
  id: number;
  suspects: Record<number, number>; // 0-100, higher is more suspicious
  trusts: Record<number, number>; // 0-100, higher is more trusted
  knownRoles: Record<number, Role>; // Roles definitely known (e.g. Seer checks, Wolf teammates)
  claimedRole?: Role; // If the bot has claimed a role publicly
  dialogueHistory: DialogueHistory[]; // AI分析的对话历史
  behaviorPattern: Record<number, { aggressive: number; defensive: number; consistent: number }>; // 行为模式分析
}

// Initialize memory for a bot
export const initBotMemory = (bot: Player, allPlayers: Player[]): BotMemory => {
  const memory: BotMemory = {
    id: bot.id,
    suspects: {},
    trusts: {},
    knownRoles: {},
    dialogueHistory: [],
    behaviorPattern: {},
  };

  // Initial Knowledge
  if (bot.role === 'werewolf') {
    // Wolves know other wolves
    allPlayers.forEach(p => {
      if (p.role === 'werewolf') {
        memory.knownRoles[p.id] = 'werewolf';
        memory.trusts[p.id] = 100;
      } else {
        memory.suspects[p.id] = 0; // Wolves know they are good (targets)
      }
    });
  } else {
    // Good guys know nothing initially, except themselves
    memory.knownRoles[bot.id] = bot.role;
    memory.trusts[bot.id] = 100;
  }

  return memory;
};

// Update memory based on events (e.g. someone died, someone voted)
export const updateBotMemory = (
  memory: BotMemory, 
  event: { type: 'VOTE' | 'DEATH' | 'SEER_CHECK' | 'WITCH_SAVE', actorId?: number, targetId?: number, role?: Role }
) => {
  // Simple heuristics
  if (event.type === 'VOTE' && event.actorId !== undefined && event.targetId !== undefined) {
    // If someone I trust voted for someone, I suspect that target more
    const trust = memory.trusts[event.actorId] || 50;
    if (trust > 70) {
      memory.suspects[event.targetId] = (memory.suspects[event.targetId] || 0) + 10;
    }
    // If someone I suspect voted for someone, maybe that target is good?
    const suspicion = memory.suspects[event.actorId] || 0;
    if (suspicion > 70) {
      memory.trusts[event.targetId] = (memory.trusts[event.targetId] || 50) + 10;
    }
  }
  
  if (event.type === 'SEER_CHECK' && memory.knownRoles[memory.id] === 'seer' && event.targetId !== undefined && event.role) {
    memory.knownRoles[event.targetId] = event.role;
    if (event.role === 'werewolf') {
      memory.suspects[event.targetId] = 100;
    } else {
      memory.trusts[event.targetId] = 100;
      memory.suspects[event.targetId] = 0;
    }
  }
};

// Decide who to vote for
export const decideBotVote = (bot: Player, memory: BotMemory, livingPlayers: Player[]): number | null => {
  const candidates = livingPlayers.filter(p => p.id !== bot.id);
  if (candidates.length === 0) return null;

  // 1. If I know a Wolf (and I'm good), vote them!
  if (bot.role !== 'werewolf') {
    const knownWolf = candidates.find(p => memory.knownRoles[p.id] === 'werewolf');
    if (knownWolf) return knownWolf.id;
  }

  // 2. If I am a Wolf, vote for a non-wolf with high suspicion from others (bandwagon)
  // Or just a random good guy
  if (bot.role === 'werewolf') {
    const goodGuys = candidates.filter(p => p.role !== 'werewolf');
    if (goodGuys.length > 0) {
      return goodGuys[Math.floor(Math.random() * goodGuys.length)].id;
    }
  }

  // 3. Vote for most suspicious
  let maxSuspicion = -1;
  let targetId = null;
  
  candidates.forEach(p => {
    const score = memory.suspects[p.id] || 0;
    // Add some randomness so it's not deterministic
    const randomFactor = Math.random() * 20; 
    if (score + randomFactor > maxSuspicion) {
      maxSuspicion = score + randomFactor;
      targetId = p.id;
    }
  });

  return targetId || candidates[Math.floor(Math.random() * candidates.length)].id;
};

// AI对话分析：从文本中提取情感和目标
export const analyzeDialogue = (text: string): DialogueHistory['analysis'] => {
  // 确保text是字符串
  if (!text || typeof text !== 'string') {
    return { sentiment: 'neutral' };
  }
  
  const lowerText = text.toLowerCase();
  
  // 检测是否在指控某人
  if (lowerText.includes('suspicious') || lowerText.includes('可疑') || lowerText.includes('wolf') || lowerText.includes('狼')) {
    return { sentiment: 'accusation' };
  }
  
  // 检测是否在自我辩护
  if (lowerText.includes('innocent') || lowerText.includes('无辜') || lowerText.includes('believe') || lowerText.includes('相信')) {
    return { sentiment: 'defense' };
  }
  
  // 检测角色声明
  if (lowerText.includes('seer') || lowerText.includes('预言家')) {
    return { sentiment: 'claim', claimedRole: 'seer' };
  }
  
  return { sentiment: 'neutral' };
};

// AI学习：更新行为模式
export const updateBehaviorPattern = (memory: BotMemory, speakerId: number, analysis: DialogueHistory['analysis']) => {
  if (!memory.behaviorPattern[speakerId]) {
    memory.behaviorPattern[speakerId] = { aggressive: 0, defensive: 0, consistent: 0 };
  }
  
  const pattern = memory.behaviorPattern[speakerId];
  
  if (analysis?.sentiment === 'accusation') {
    pattern.aggressive += 10;
  } else if (analysis?.sentiment === 'defense') {
    pattern.defensive += 10;
  }
  
  // 如果角色声明与之前一致，增加一致性分数
  if (analysis?.claimedRole && memory.knownRoles[speakerId] === analysis.claimedRole) {
    pattern.consistent += 5;
  }
};

// Generate Dialogue with AI Support
export const generateSmartDialogue = async (
  bot: Player, 
  memory: BotMemory, 
  day: number, 
  livingPlayers: Player[],
  t: TFunction
): Promise<string> => {
  const config = getAIConfig();
  
  // 如果配置了AI API，使用真实AI
  if ((config.provider === 'gemini' || config.provider === 'openrouter') && config.apiKey) {
    try {
      console.log(`🤖 使用${config.provider}生成对话...`); // 添加日志
      const roleMap: Record<Role, string> = {
        'werewolf': '狼人',
        'seer': '预言家',
        'witch': '女巫',
        'villager': '村民'
      };
      
      const myKnowledge = bot.role === 'werewolf' 
        ? `你知道其他狼人是：${Object.entries(memory.knownRoles)
            .filter(([_, r]) => r === 'werewolf')
            .map(([id, _]) => livingPlayers.find(p => p.id === parseInt(id))?.name)
            .join(', ')}`
        : bot.role === 'seer'
        ? `你查验的结果：${Object.entries(memory.knownRoles)
            .map(([id, role]) => `${livingPlayers.find(p => p.id === parseInt(id))?.name}是${roleMap[role]}`)
            .join(', ')}`
        : '你不知道任何额外信息';
      
      const prompt = buildWerewolfPrompt({
        role: roleMap[bot.role],
        day,
        players: livingPlayers.map(p => p.name),
        deadPlayers: livingPlayers.filter(p => p.isDead).map(p => p.name),
        dialogueHistory: memory.dialogueHistory.map(d => {
          const speaker = livingPlayers.find(p => p.id === d.speakerId);
          return `${speaker?.name || 'Unknown'}: ${d.text}`;
        }), // 传递完整对话历史，不限制条数
        myKnowledge,
        botName: bot.name // 传递机器人自己的名字
      });
      
      const aiResponse = await callOpenRouterAPI(prompt, config.apiKey);
      console.log(`✅ AI响应成功: ${aiResponse.substring(0, 30)}...`); // 确认AI成功返回
      return aiResponse;
    } catch (error) {
      console.error('❌ AI调用失败，使用本地逻辑:', error);
      // 失败则降级到本地逻辑
    }
  }
  
  // 本地逻辑（原有的简单AI）
  const myRole = bot.role;
  
  // AI策略：分析所有玩家的行为模式来决定如何隐藏身份
  const analyzePlayerBehavior = (targetId: number) => {
    const pattern = memory.behaviorPattern[targetId];
    if (!pattern) return 'unknown';
    
    if (pattern.aggressive > 30) return 'aggressive';
    if (pattern.defensive > 30) return 'defensive';
    if (pattern.consistent > 20) return 'consistent';
    return 'neutral';
  };
  
  // --- Day 1: 伪装阶段 - 所有角色都表现得像普通村民 ---
  if (day === 1) {
    // 狼人：表现得害怕且无辜
    if (myRole === 'werewolf') return t('werewolf.dialogue.intro.villager2');
    // 预言家：第一天不暴露，观察
    if (myRole === 'seer') return t('werewolf.dialogue.intro.villager3');
    // 女巫：保持低调
    if (myRole === 'witch') return t('werewolf.dialogue.intro.villager4');
    return t(`werewolf.dialogue.intro.villager${Math.floor(Math.random() * 4) + 1}`);
  }

  // --- Day 2+: AI驱动的策略性发言 ---
  
  // 1. 预言家逻辑：根据场上局势决定是否暴露
  if (myRole === 'seer') {
    const knownWolfId = Object.keys(memory.knownRoles).find(id => memory.knownRoles[parseInt(id)] === 'werewolf');
    if (knownWolfId) {
      const target = livingPlayers.find(p => p.id === parseInt(knownWolfId));
      if (target) {
        // AI分析：如果场上有人声称预言家，概率降低暴露
        const seerClaimers = Object.entries(memory.behaviorPattern).filter(
          ([id, pattern]) => memory.knownRoles[parseInt(id)] !== 'seer' && pattern.consistent > 10
        );
        
        if (seerClaimers.length > 0 && Math.random() < 0.7) {
          // 软指控，不暴露身份
          return t('werewolf.dialogue.accuse.suspicious', { target: target.name });
        } else if (day >= 3 && Math.random() > 0.4) {
          // Day 3+更可能硬跳
          return t('werewolf.dialogue.seer.claim', { target: target.name, result: t('werewolf.roles.werewolf') });
        } else {
          return t('werewolf.dialogue.accuse.gut', { target: target.name });
        }
      }
    }
  }

  // 2. 狼人逻辑：高级欺骗策略
  if (myRole === 'werewolf') {
    const goodGuys = livingPlayers.filter(p => p.role !== 'werewolf' && p.id !== bot.id);
    if (goodGuys.length > 0) {
      // AI策略：攻击行为最激进的玩家（可能是预言家）
      const aggressivePlayers = goodGuys.filter(p => {
        const behavior = analyzePlayerBehavior(p.id);
        return behavior === 'aggressive';
      });
      
      const target = aggressivePlayers.length > 0 
        ? aggressivePlayers[Math.floor(Math.random() * aggressivePlayers.length)]
        : goodGuys[Math.floor(Math.random() * goodGuys.length)];
      
      // 高级策略：根据局势选择是否伪装预言家
      if (day >= 2 && Math.random() < 0.15) {
        memory.claimedRole = 'seer'; // 记录自己声称了预言家
        return t('werewolf.dialogue.wolf.lieSeer', { target: target.name });
      }
      
      // 普通指控，保持低调
      return t('werewolf.dialogue.wolf.vote', { target: target.name });
    }
  }

  // 3. Villager/Witch Logic: Suspicion
  // Find most suspicious person in memory
  let suspectId = -1;
  let maxScore = -1;
  livingPlayers.forEach(p => {
    if (p.id === bot.id) return;
    const s = memory.suspects[p.id] || 0;
    if (s > maxScore) {
      maxScore = s;
      suspectId = p.id;
    }
  });

  if (suspectId !== -1 && maxScore > 30) {
    const target = livingPlayers.find(p => p.id === suspectId);
    if (target) {
      return t('werewolf.dialogue.accuse.suspicious', { target: target.name });
    }
  }

  // Default: Defensive or Random
  const defensiveKeys = [
    'werewolf.dialogue.defend.innocent',
    'werewolf.dialogue.defend.sleeping',
    'werewolf.dialogue.defend.believeMe'
  ];
  return t(defensiveKeys[Math.floor(Math.random() * defensiveKeys.length)]);
};
