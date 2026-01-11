import Peer from 'peerjs';
import type { DataConnection } from 'peerjs';

export type Role = 'villager' | 'werewolf' | 'seer' | 'witch';
export type GamePhase = 'LOBBY' | 'ROLE_REVEAL' | 'NIGHT' | 'DAY_DISCUSS' | 'DAY_VOTE' | 'GAME_OVER';

export interface MultiplayerPlayer {
  id: number;
  name: string;
  peerId: string; // PeerJS connection ID
  isDead: boolean;
  role: Role;
  isUser: boolean;
  isBot: boolean;
  isHost: boolean;
  isReady: boolean;
}

export interface GameState {
  phase: GamePhase;
  players: MultiplayerPlayer[];
  dayCount: number;
  votes: Record<number, number>; // playerId -> targetId
  chatMessages: ChatMessage[];
  currentActingPlayer?: number; // 当前行动的玩家ID（夜晚阶段）
}

export interface ChatMessage {
  playerId: number;
  playerName: string;
  message: string;
  timestamp: number;
}

export interface RoomConfig {
  totalPlayers: number;
  botCount: number;
  humanPlayers: number;
}

export type MessageType = 
  | 'PLAYER_JOIN'
  | 'PLAYER_LEAVE'
  | 'PLAYER_READY'
  | 'GAME_START'
  | 'GAME_STATE_UPDATE'
  | 'CHAT_MESSAGE'
  | 'VOTE_ACTION'
  | 'NIGHT_ACTION'
  | 'ROLE_ASSIGNMENT';

export interface NetworkMessage {
  type: MessageType;
  senderId: string;
  timestamp: number;
  data: unknown;
}

export class MultiplayerManager {
  private peer: Peer | null = null;
  private connections: Map<string, DataConnection> = new Map();
  private isHost: boolean = false;
  private roomId: string = '';
  private localPeerId: string = '';
  
  // Callbacks
  public onPlayerJoined?: (player: MultiplayerPlayer) => void;
  public onPlayerLeft?: (peerId: string) => void;
  public onPlayerReady?: (peerId: string) => void;
  public onGameStateUpdate?: (gameState: Partial<GameState>) => void;
  public onChatMessage?: (message: ChatMessage) => void;
  public onVoteAction?: (playerId: number, targetId: number) => void;
  public onNightAction?: (playerId: number, targetId: number, action: string) => void;
  public onRoleAssignment?: (role: Role) => void;
  public onConnectionError?: (error: string) => void;

  constructor() {}

  /**
   * 创建房间（成为房主）
   */
  async createRoom(): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        // 使用时间戳创建唯一的 Peer ID
        const peerId = `werewolf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // PeerJS 配置 - 使用本地 PeerServer
        this.peer = new Peer(peerId, {
          debug: 3, // 最详细的日志
          host: '192.168.1.201',
          port: 9000,
          path: '/myapp',
          secure: false, // 本地不需要 HTTPS
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
            ]
          }
        });
        
        this.peer.on('open', (id) => {
          console.log('Room created with ID:', id);
          this.localPeerId = id;
          this.roomId = id;
          this.isHost = true;
          resolve(id);
        });

        this.peer.on('connection', (conn) => {
          this.handleIncomingConnection(conn);
        });

        this.peer.on('error', (err) => {
          console.error('Peer error:', err);
          let errorMsg = err.message;
          if (err.type === 'peer-unavailable') {
            errorMsg = 'Room not found or host disconnected. Please check the room ID.';
          } else if (err.type === 'network') {
            errorMsg = 'Network error. Please check your internet connection.';
          } else if (err.type === 'server-error') {
            errorMsg = 'Server connection failed. Please try again in a moment.';
          }
          this.onConnectionError?.(errorMsg);
          reject(err);
        });
      } catch (error: any) {
        reject(error);
      }
    });
  }

  /**
   * 加入房间（作为客人）
   */
  async joinRoom(roomId: string, playerName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const peerId = `player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // PeerJS 配置 - 使用本地 PeerServer
        this.peer = new Peer(peerId, {
          debug: 3, // 最详细的日志
          host: '192.168.1.201',
          port: 9000,
          path: '/myapp',
          secure: false,
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
            ]
          }
        });
        
        this.peer.on('open', (id) => {
          console.log('Connected as:', id);
          this.localPeerId = id;
          this.roomId = roomId;
          this.isHost = false;
          
          // 连接到房主，添加超时和重试
          console.log('Attempting to connect to room:', roomId);
          const conn = this.peer!.connect(roomId, {
            reliable: true,
            serialization: 'json'
          });
          
          // 设置连接超时
          const connectionTimeout = setTimeout(() => {
            if (!conn.open) {
              conn.close();
              reject(new Error('Connection timeout. The room may not exist or the host may have left.'));
            }
          }, 15000); // 15秒超时
          
          conn.on('open', () => {
            clearTimeout(connectionTimeout);
            console.log('Successfully connected to room!');
            this.connections.set(conn.peer, conn);
            
            // 连接成功后立即发送玩家信息
            const playerInfo: MultiplayerPlayer = {
              id: -1,
              name: playerName,
              peerId: this.localPeerId,
              isDead: false,
              role: 'villager',
              isUser: true,
              isBot: false,
              isHost: false,
              isReady: false
            };
            
            console.log('🚀 Sending PLAYER_JOIN to host:', playerInfo);
            conn.send({
              type: 'PLAYER_JOIN',
              senderId: this.localPeerId,
              timestamp: Date.now(),
              data: playerInfo
            });
            console.log('✅ PLAYER_JOIN message sent');
          });
          
          // 设置数据接收和错误处理
          conn.on('data', (data) => {
            console.log('📥 Client received data:', data);
            this.handleMessage(data as NetworkMessage, conn.peer);
          });
          
          conn.on('close', () => {
            console.log('❌ Disconnected from room');
            this.connections.delete(conn.peer);
          });
          
          conn.on('error', (err) => {
            console.error('❌ Connection error:', err);
            this.onConnectionError?.(err.message);
          });
          
          resolve();
        });

        this.peer.on('error', (err) => {
          console.error('Peer error:', err);
          this.onConnectionError?.(err.message);
          reject(err);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 处理传入的连接（房主接收玩家连接）
   */
  private handleIncomingConnection(conn: DataConnection) {
    console.log('🔗 Incoming connection from:', conn.peer);
    
    conn.on('open', () => {
      console.log('✅ Connection opened with:', conn.peer);
      this.connections.set(conn.peer, conn);
      console.log('📡 Waiting for player info from:', conn.peer);
    });

    conn.on('data', (data) => {
      console.log('📨 HOST received raw data from', conn.peer, ':', data);
      this.handleMessage(data as NetworkMessage, conn.peer);
    });

    conn.on('close', () => {
      console.log('Connection closed:', conn.peer);
      this.connections.delete(conn.peer);
      this.onPlayerLeft?.(conn.peer);
      
      // 广播玩家离开
      this.broadcast({
        type: 'PLAYER_LEAVE',
        senderId: this.localPeerId,
        timestamp: Date.now(),
        data: { peerId: conn.peer }
      });
    });

    conn.on('error', (err) => {
      console.error('Connection error:', err);
      this.onConnectionError?.(err.message);
    });
  }

  /**
   * 处理收到的消息
   */
  private handleMessage(message: NetworkMessage, fromPeerId: string) {
    console.log('Received message:', message);
    
    // Type guards for message.data
    const data = message.data as Record<string, any>;
    
    switch (message.type) {
      case 'PLAYER_JOIN':
        const newPlayer = data as MultiplayerPlayer;
        console.log('Processing PLAYER_JOIN:', newPlayer, 'from:', fromPeerId);
        
        if (this.isHost) {
          // 房主：给新玩家分配一个真实的ID，然后广播给所有人
          console.log('Host: Processing new player join');
          this.onPlayerJoined?.(newPlayer);
          
          // 广播给其他已连接的玩家（不包括新加入的）
          console.log('Host: Broadcasting to other players (except:', fromPeerId, ')');
          this.broadcastExcept(fromPeerId, message);
          
          // 注意：UI层会在onPlayerJoined回调中调用updateGameState来同步完整状态
        } else {
          // 普通玩家：收到房主广播的新玩家信息
          console.log('Client: Received new player from host');
          this.onPlayerJoined?.(newPlayer);
        }
        break;
        
      case 'PLAYER_LEAVE':
        this.onPlayerLeft?.(data.peerId as string);
        break;
        
      case 'PLAYER_READY':
        this.onPlayerReady?.(data.peerId as string);
        if (this.isHost) {
          this.broadcastExcept(fromPeerId, message);
        }
        break;
        
      case 'GAME_STATE_UPDATE':
        this.onGameStateUpdate?.(data as Partial<GameState>);
        // 房主广播给所有人
        if (this.isHost) {
          this.broadcastExcept(fromPeerId, message);
        }
        break;
        
      case 'CHAT_MESSAGE':
        this.onChatMessage?.(data as ChatMessage);
        // 转发聊天消息
        if (this.isHost) {
          this.broadcastExcept(fromPeerId, message);
        }
        break;
        
      case 'VOTE_ACTION':
        this.onVoteAction?.(data.playerId as number, data.targetId as number);
        if (this.isHost) {
          this.broadcastExcept(fromPeerId, message);
        }
        break;
        
      case 'NIGHT_ACTION':
        this.onNightAction?.(data.playerId as number, data.targetId as number, data.action as string);
        if (this.isHost) {
          this.broadcastExcept(fromPeerId, message);
        }
        break;
        
      case 'ROLE_ASSIGNMENT':
        this.onRoleAssignment?.(data.role as Role);
        break;
    }
  }

  /**
   * 发送消息
   */
  sendMessage(message: NetworkMessage) {
    this.connections.forEach((conn) => {
      if (conn.open) {
        conn.send(message);
      }
    });
  }

  /**
   * 广播消息给所有连接
   */
  broadcast(message: NetworkMessage) {
    console.log('Broadcasting message type:', message.type, 'to', this.connections.size, 'connections');
    let sentCount = 0;
    this.connections.forEach((conn, peerId) => {
      if (conn.open) {
        console.log('  -> Sending to:', peerId);
        conn.send(message);
        sentCount++;
      } else {
        console.log('  -> Connection not open:', peerId);
      }
    });
    console.log('Broadcast complete. Sent to', sentCount, 'clients');
  }

  /**
   * 广播消息给除了某个玩家之外的所有人
   */
  broadcastExcept(excludePeerId: string, message: NetworkMessage) {
    this.connections.forEach((conn, peerId) => {
      if (peerId !== excludePeerId && conn.open) {
        conn.send(message);
      }
    });
  }

  /**
   * 发送聊天消息
   */
  sendChatMessage(message: ChatMessage) {
    this.sendMessage({
      type: 'CHAT_MESSAGE',
      senderId: this.localPeerId,
      timestamp: Date.now(),
      data: message
    });
  }

  /**
   * 发送投票
   */
  sendVote(playerId: number, targetId: number) {
    this.sendMessage({
      type: 'VOTE_ACTION',
      senderId: this.localPeerId,
      timestamp: Date.now(),
      data: { playerId, targetId }
    });
  }

  /**
   * 发送夜晚行动
   */
  sendNightAction(playerId: number, targetId: number, action: string) {
    this.sendMessage({
      type: 'NIGHT_ACTION',
      senderId: this.localPeerId,
      timestamp: Date.now(),
      data: { playerId, targetId, action }
    });
  }

  /**
   * 标记玩家准备
   */
  setPlayerReady() {
    this.sendMessage({
      type: 'PLAYER_READY',
      senderId: this.localPeerId,
      timestamp: Date.now(),
      data: { peerId: this.localPeerId }
    });
  }

  /**
   * 更新游戏状态（房主专用）
   */
  updateGameState(gameState: Partial<GameState>) {
    if (!this.isHost) {
      console.warn('Only host can update game state');
      return;
    }
    
    console.log('Host: Broadcasting game state update to', this.connections.size, 'clients:', gameState);
    this.broadcast({
      type: 'GAME_STATE_UPDATE',
      senderId: this.localPeerId,
      timestamp: Date.now(),
      data: gameState
    });
    console.log('Host: Game state update sent');
  }

  /**
   * 分配角色（房主发送给特定玩家）
   */
  assignRole(peerId: string, role: Role) {
    const conn = this.connections.get(peerId);
    if (conn && conn.open) {
      conn.send({
        type: 'ROLE_ASSIGNMENT',
        senderId: this.localPeerId,
        timestamp: Date.now(),
        data: { role }
      });
    }
  }

  /**
   * 获取房间ID（用于分享）
   */
  getRoomId(): string {
    return this.roomId;
  }

  /**
   * 获取本地PeerID
   */
  getLocalPeerId(): string {
    return this.localPeerId;
  }

  /**
   * 是否是房主
   */
  getIsHost(): boolean {
    return this.isHost;
  }

  /**
   * 获取连接数量
   */
  getConnectionCount(): number {
    return this.connections.size;
  }

  /**
   * 断开所有连接
   */
  disconnect() {
    this.connections.forEach((conn) => {
      conn.close();
    });
    this.connections.clear();
    
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
  }
}
