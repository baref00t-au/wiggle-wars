import type { DataConnection, Peer } from 'peerjs';
import type { ClientMsg, HostMsg } from './protocol';

// Thin host transport over PeerJS (WebRTC DataChannels). Signalling goes through
// the PeerJS broker (default: their free cloud — needs internet for the handshake);
// gameplay data is device-to-device. PeerJS is lazy-loaded so it isn't in the main
// game bundle. NOTE: this transport can't be unit-tested without real peers — the
// testable logic lives in protocol.ts.

const PREFIX = 'wigglewars-v1-';
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no ambiguous 0/O/1/I/L

function makeCode(len = 4): string {
  let s = '';
  for (let i = 0; i < len; i++) s += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  return s;
}

export interface HostCallbacks {
  onReady: (code: string) => void;
  onJoin: (connId: string, name: string) => void;
  onInput: (connId: string, turn: -1 | 0 | 1) => void;
  onLeave: (connId: string) => void;
  onError: (message: string) => void;
}

export class NetHost {
  readonly code: string;
  private peer: Peer | null = null;
  private conns = new Map<string, DataConnection>();
  private closed = false;

  constructor(private cb: HostCallbacks) {
    this.code = makeCode();
    void this.init();
  }

  private async init(): Promise<void> {
    try {
      const { Peer } = await import('peerjs');
      if (this.closed) return;
      this.peer = new Peer(PREFIX + this.code);
      this.peer.on('open', () => this.cb.onReady(this.code));
      this.peer.on('connection', (conn) => this.handleConn(conn));
      this.peer.on('error', (e: { type?: string; message?: string }) => {
        this.cb.onError(e?.message ?? 'connection error');
      });
    } catch {
      this.cb.onError('Could not start networking.');
    }
  }

  private handleConn(conn: DataConnection): void {
    conn.on('open', () => {
      this.conns.set(conn.peer, conn);
    });
    conn.on('data', (data: unknown) => {
      const msg = data as ClientMsg;
      if (!msg || typeof msg !== 'object') return;
      if (msg.t === 'join') this.cb.onJoin(conn.peer, String(msg.name ?? 'Player').slice(0, 12));
      else if (msg.t === 'input') this.cb.onInput(conn.peer, msg.turn);
    });
    const drop = (): void => {
      if (this.conns.delete(conn.peer)) this.cb.onLeave(conn.peer);
    };
    conn.on('close', drop);
    conn.on('error', drop);
  }

  /** Swap join/input/leave handling (the lobby hands over to the game mode). */
  setHandlers(h: Partial<HostCallbacks>): void {
    this.cb = { ...this.cb, ...h };
  }

  clientIds(): string[] {
    return [...this.conns.keys()];
  }

  broadcast(msg: HostMsg): void {
    for (const conn of this.conns.values()) if (conn.open) conn.send(msg);
  }

  sendTo(connId: string, msg: HostMsg): void {
    const conn = this.conns.get(connId);
    if (conn?.open) conn.send(msg);
  }

  close(): void {
    this.closed = true;
    for (const conn of this.conns.values()) {
      try {
        conn.close();
      } catch {
        /* ignore */
      }
    }
    this.conns.clear();
    try {
      this.peer?.destroy();
    } catch {
      /* ignore */
    }
  }
}

export { PREFIX as PEER_PREFIX };
