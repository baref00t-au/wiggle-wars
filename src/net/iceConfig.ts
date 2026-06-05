// WebRTC ICE servers used for both same-WiFi and internet play.
//
// STUN (free, public) lets two devices discover how to reach each other directly
// across the internet — no hosting needed, and enough for most home networks.
//
// TURN is a RELAY for the most locked-down networks (symmetric NAT, strict
// firewalls) where a direct connection can't be made. It is OPTIONAL — many
// connections never need it. GitHub Pages CANNOT run a TURN server (it serves only
// static files); a TURN relay needs an always-on host: a tiny VPS running `coturn`,
// a cloud VM (Azure/GCP/AWS), or a managed TURN service (e.g. Metered.ca has a free
// tier). To enable it, add an entry below with your TURN url + credentials and
// rebuild. See docs/online-play.md.

export const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  // Optional relay for restrictive networks — fill in to enable:
  // { urls: 'turn:YOUR_HOST:3478', username: 'YOUR_USER', credential: 'YOUR_SECRET' },
];
