# Playing over WiFi or the internet

Wiggle Wars multiplayer is host-authoritative and peer-to-peer (WebRTC): one device
hosts the game, the others join with a short room **code**. This works two ways:

- **Same WiFi (LAN):** just works.
- **Over the internet:** also works between most home networks — share the code by
  text or call. The first handshake uses a signalling broker (needs internet); after
  that, game data is **device-to-device**.

It's designed for people who know each other sharing a code — there is no public
lobby of strangers (a deliberate child-safety choice; see [`../ETHICS.md`](../ETHICS.md)).

## What it needs (and what it doesn't)

| Piece | Who provides it | Cost |
|---|---|---|
| The web app | GitHub Pages (already live) | free |
| Signalling (introduce the two devices) | PeerJS free cloud broker (built in) | free |
| STUN (find a direct path across the internet) | Google public STUN (built in) | free |
| **TURN** (relay for the most locked-down networks) | **you** — optional | free–~$5/mo |

**GitHub cannot host the TURN server** — Pages serves only static files, and TURN is
an always-on relay daemon. You only need TURN if some players on restrictive networks
(strict firewalls / symmetric NAT) can't connect; most home networks don't.

## Adding a TURN server (optional)

1. Get a TURN server:
   - **Managed (easiest):** [Metered.ca](https://www.metered.ca/) (free tier),
     Twilio, or Cloudflare — they give you a `turn:` URL + username + credential.
   - **Self-host:** run [`coturn`](https://github.com/coturn/coturn) on a small VPS
     (Hetzner / DigitalOcean ~$5/mo) or a cloud VM (Azure / GCP / AWS).
2. Add it in [`src/net/iceConfig.ts`](../src/net/iceConfig.ts):
   ```ts
   { urls: 'turn:your-host:3478', username: 'YOUR_USER', credential: 'YOUR_SECRET' },
   ```
3. `git push` — the site auto-redeploys.

## Privacy

No gameplay data passes through any server: signalling only exchanges the connection
handshake, and play is device-to-device. No student data is sent or stored. For zero
third-party contact you can also self-host the PeerJS signalling broker (a tiny Node
service) and point the app at it.
