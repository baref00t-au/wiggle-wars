import { el } from './dom';
import { colorFor } from '../render/colors';
import { NetHost } from '../net/host';
import { NetClient } from '../net/client';
import type { HostMsg, ResetMsg } from '../net/protocol';
import type { WifiPlayer } from '../modes/localWifiHost';

// §7.1 Lobby — host shows a room code, clients join with it. Everyone is on the
// same WiFi; signalling briefly uses the PeerJS broker (needs internet), then play
// is device-to-device. See the privacy note in for-teachers.md / ETHICS.md.

const MAX_CLIENTS = 31; // + the host = up to 32 players

export interface LobbyCallbacks {
  onHost: (netHost: NetHost, players: WifiPlayer[]) => void;
  onClient: (netClient: NetClient, myPlayerId: string, reset: ResetMsg) => void;
  onExit: () => void;
}

export function renderLobby(container: HTMLElement, cb: LobbyCallbacks): () => void {
  const wrap = el('div', 'menu lobby');
  container.append(wrap);

  let netHost: NetHost | null = null;
  let netClient: NetClient | null = null;
  let handedOff = false;

  function closeNet(): void {
    if (handedOff) return;
    netHost?.close();
    netClient?.close();
    netHost = null;
    netClient = null;
  }

  function backToChoice(): void {
    closeNet();
    showChoice();
  }

  function header(title: string): void {
    wrap.replaceChildren();
    wrap.append(el('h1', 'menu-title', title));
  }

  // ---------- choice ----------
  function showChoice(): void {
    header('📡 WiFi / Online');
    wrap.append(
      el('p', 'menu-sub', 'Play on your own devices — same WiFi, or over the internet with a code. One device hosts.'),
    );
    const host = el('button', 'btn primary start', '🖧 Host a game');
    host.addEventListener('click', showHosting);
    const join = el('button', 'btn start', '🔑 Join a game');
    join.addEventListener('click', showJoin);
    const back = el('button', 'btn', '← Menu');
    back.addEventListener('click', cb.onExit);
    wrap.append(host, join, back);
    wrap.append(el('p', 'menu-foot', 'The first connection uses the internet; the game itself is device-to-device.'));
  }

  // ---------- host ----------
  function showHosting(): void {
    const clients = new Map<string, { name: string }>();
    let code: string | null = null;

    function broadcastLobby(): void {
      netHost?.broadcast({
        t: 'lobby',
        players: roster().map((p) => ({ id: p.playerId, colorIndex: p.colorIndex, name: p.name })),
      });
    }

    function roster(): WifiPlayer[] {
      const players: WifiPlayer[] = [{ playerId: 'p1', colorIndex: 0, name: colorFor(0).name }];
      let i = 0;
      for (const [connId, c] of clients) {
        players.push({ playerId: `p${i + 2}`, colorIndex: i + 1, name: c.name, connId });
        i++;
      }
      return players;
    }

    function render(): void {
      header('🖧 Hosting');
      if (!code) {
        wrap.append(el('p', 'menu-sub', 'Starting…'));
      } else {
        wrap.append(el('p', 'menu-sub', 'Tell the other players this code:'));
        wrap.append(el('div', 'room-code', code));
      }
      const players = roster();
      wrap.append(el('p', 'lobby-count', `${players.length} / ${MAX_CLIENTS + 1} players joined`));

      const list = el('div', 'lobby-list');
      for (const p of players) {
        const row = el('div', 'lobby-row');
        const dot = el('span', 'dot-glyph', colorFor(p.colorIndex).glyph);
        dot.style.color = colorFor(p.colorIndex).line;
        row.append(dot, el('span', 'lobby-name', p.connId ? p.name : `${p.name} (you, host)`));
        list.append(row);
      }
      wrap.append(list);

      const start = el('button', 'btn primary start', 'Start game');
      start.disabled = players.length < 2;
      start.addEventListener('click', () => {
        handedOff = true;
        cb.onHost(netHost!, players);
      });
      const cancel = el('button', 'btn', '← Back');
      cancel.addEventListener('click', backToChoice);
      wrap.append(start, cancel);
      if (players.length < 2) wrap.append(el('p', 'menu-foot', 'Waiting for at least one player to join…'));
    }

    netHost = new NetHost({
      onReady: (c) => {
        code = c;
        render();
      },
      onJoin: (connId, name) => {
        if (clients.size < MAX_CLIENTS) {
          clients.set(connId, { name });
          broadcastLobby();
          render();
        }
      },
      onInput: () => {},
      onLeave: (connId) => {
        if (clients.delete(connId)) {
          broadcastLobby();
          render();
        }
      },
      onError: (msg) => showError(msg, backToChoice),
    });
    render();
  }

  // ---------- join ----------
  function showJoin(): void {
    header('🔑 Join a game');
    wrap.append(el('p', 'menu-sub', 'Enter the code the host gives you.'));

    const nameInput = el('input', 'name-input');
    nameInput.type = 'text';
    nameInput.maxLength = 12;
    nameInput.placeholder = 'Your name';

    const codeInput = el('input', 'name-input code-input');
    codeInput.type = 'text';
    codeInput.maxLength = 4;
    codeInput.placeholder = 'CODE';
    codeInput.autocapitalize = 'characters';

    wrap.append(nameInput, codeInput);

    const join = el('button', 'btn primary start', 'Join');
    join.addEventListener('click', () => {
      const code = codeInput.value.trim().toUpperCase();
      if (code.length < 3) return;
      connect(code, nameInput.value.trim() || 'Player');
    });
    const back = el('button', 'btn', '← Back');
    back.addEventListener('click', backToChoice);
    wrap.append(join, back);
  }

  function connect(code: string, name: string): void {
    header('🔑 Joining…');
    wrap.append(el('p', 'menu-sub', `Connecting to ${code}…`));
    const cancel = el('button', 'btn', 'Cancel');
    cancel.addEventListener('click', backToChoice);
    wrap.append(cancel);

    let myPlayerId = '';

    netClient = new NetClient(code, {
      onOpen: () => {
        netClient?.send({ t: 'join', name });
        showWaiting();
      },
      onMessage: (m: HostMsg) => {
        if (m.t === 'welcome') myPlayerId = m.playerId;
        else if (m.t === 'lobby') showWaiting(m.players);
        else if (m.t === 'reset') {
          handedOff = true;
          cb.onClient(netClient!, myPlayerId, m);
        } else if (m.t === 'end') {
          showError(m.reason, backToChoice);
        }
      },
      onClose: () => showError('Lost connection to the host.', backToChoice),
      onError: (msg) => showError(msg, backToChoice),
    });

    function showWaiting(players?: { id: string; colorIndex: number; name: string }[]): void {
      header('🔑 In the lobby');
      wrap.append(el('p', 'menu-sub', 'Connected! Waiting for the host to start…'));
      if (players) {
        wrap.append(el('p', 'lobby-count', `${players.length} / ${MAX_CLIENTS + 1} players joined`));
        const list = el('div', 'lobby-list');
        for (const p of players) {
          const row = el('div', 'lobby-row');
          const dot = el('span', 'dot-glyph', colorFor(p.colorIndex).glyph);
          dot.style.color = colorFor(p.colorIndex).line;
          row.append(dot, el('span', 'lobby-name', p.name));
          list.append(row);
        }
        wrap.append(list);
      }
      const leave = el('button', 'btn', '← Leave');
      leave.addEventListener('click', backToChoice);
      wrap.append(leave);
    }
  }

  function showError(message: string, onOk: () => void): void {
    header('Connection problem');
    wrap.append(el('p', 'menu-sub', message));
    const ok = el('button', 'btn primary', 'OK');
    ok.addEventListener('click', onOk);
    wrap.append(ok);
  }

  showChoice();

  return () => {
    closeNet();
    wrap.remove();
  };
}
