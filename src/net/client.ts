import type { DataConnection, Peer } from 'peerjs';
import type { ClientMsg, HostMsg } from './protocol';
import { PEER_PREFIX } from './host';
import { ICE_SERVERS } from './iceConfig';

// Thin client transport: connect to the host's room code over a reliable, ordered
// DataChannel and relay messages. PeerJS is lazy-loaded. (Untestable without a real
// host — see protocol.ts for the tested logic.)

export interface ClientCallbacks {
  onOpen: () => void;
  onMessage: (msg: HostMsg) => void;
  onClose: () => void;
  onError: (message: string) => void;
}

export class NetClient {
  private peer: Peer | null = null;
  private conn: DataConnection | null = null;
  private closed = false;

  constructor(
    private code: string,
    private cb: ClientCallbacks,
  ) {
    void this.init();
  }

  private async init(): Promise<void> {
    try {
      const { Peer } = await import('peerjs');
      if (this.closed) return;
      this.peer = new Peer({ config: { iceServers: ICE_SERVERS } });
      this.peer.on('open', () => {
        if (this.closed || !this.peer) return;
        // Reliable + ordered so trail deltas never drop or reorder.
        this.conn = this.peer.connect(PEER_PREFIX + this.code.toUpperCase(), {
          reliable: true,
          serialization: 'json',
        });
        this.conn.on('open', () => this.cb.onOpen());
        this.conn.on('data', (d: unknown) => this.cb.onMessage(d as HostMsg));
        this.conn.on('close', () => this.cb.onClose());
        this.conn.on('error', (e: { message?: string }) => this.cb.onError(e?.message ?? 'connection error'));
      });
      this.peer.on('error', (e: { type?: string; message?: string }) => {
        const msg =
          e?.type === 'peer-unavailable' ? 'No game found with that code.' : (e?.message ?? 'connection error');
        this.cb.onError(msg);
      });
    } catch {
      this.cb.onError('Could not start networking.');
    }
  }

  /** Swap message/close/error handling (the lobby hands over to the game view). */
  setHandlers(h: Partial<ClientCallbacks>): void {
    this.cb = { ...this.cb, ...h };
  }

  send(msg: ClientMsg): void {
    if (this.conn?.open) this.conn.send(msg);
  }

  close(): void {
    this.closed = true;
    try {
      this.conn?.close();
    } catch {
      /* ignore */
    }
    try {
      this.peer?.destroy();
    } catch {
      /* ignore */
    }
  }
}
