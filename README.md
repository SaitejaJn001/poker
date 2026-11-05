# ♠️ High Roller Poker: Premium Multiplayer Texas Hold'em

A complete, production-grade real-time multiplayer Texas Hold'em Poker application crafted for private groups of friends, luxury poker clubs, and competitive games.

Built with a dark luxury casino aesthetic (PokerStars / Monte Carlo inspired), Apple-level design finish, server-authoritative Texas Hold'em rules engine, cryptographically secure Fisher-Yates shuffling, side-pot mathematics, Web Audio API procedural sound synthesizers, and real-time WebSockets.

---

## ✨ Features

### 1. Luxury Casino UI & Visual Design
- **Theme**: Deep obsidian and charcoal backdrops, emerald green felt, royal gold accents, and subtle vignettes.
- **Realistic Oval Table**: Responsive elliptical layout accommodating 2 to 9 players with seats automatically centered on the local player at the 6 o'clock position.
- **Cards & Chips**: 3D card perspective flips, suit colors (♥ ♦ in crimson, ♠ ♣ in deep slate/emerald), and stacked casino chip denominations ($1, $5, $25, $100, $500, $1K).
- **Turn Timer Ring**: Glowing gold SVG countdown indicator around the active player's avatar with warning alert chimes when under 5 seconds.
- **Winning Celebrations**: Hand highlight badges and confetti particles for big showdown wins.

### 2. Complete Texas Hold'em Rules Engine
- Standard 52-card deck with server-side `crypto.randomInt` Fisher-Yates shuffle.
- All standard hand rankings:
  1. Royal Flush
  2. Straight Flush
  3. Four of a Kind
  4. Full House
  5. Flush
  6. Straight (including A-2-3-4-5 "Wheel" straight)
  7. Three of a Kind
  8. Two Pair
  9. One Pair
  10. High Card
- Accurate kicker tiebreakers and exact split-pot logic with odd-chip distribution.
- Advanced multi-level side pots for unequal all-in stacks.
- Blinds & button rotation (handles Heads-Up 2-player rules and 3–9 player table rotations).
- Full betting rounds: Preflop, Flop, Turn, River, and Showdown.
- Action verification: Fold, Check, Call, Bet, Raise (enforcing minimum raise increments), and All-in.
- Hand strength helper HUD ("Two Pair, Aces and Kings") to guide players.

### 3. Real-Time Multiplayer & Security
- **Server Authoritative**: All game logic, pot calculations, and deck shuffling run strictly on the Node.js backend.
- **Confidentiality / Zero Hole Card Leaks**: Per-client state serialization. Other players' private cards are masked and never broadcast until showdown.
- **Disconnection Handling**: Connection drop preservation; turn timer auto-checks or folds gracefully.
- **Shareable Invitation Links**: One-click room link copy (`?room=XYZ`) and QR/code sharing via WhatsApp/Telegram.
- **In-Game Chat & Reactions**: Floating emoji reaction bubbles (🔥, 🏆, 😂, 🦈, 🚀, 😭) that animate directly over player avatars.

### 4. Zero-Asset Procedural Audio System
- Built-in Web Audio API synthesizer generates rich, zero-latency micro-sounds without relying on external MP3 downloads:
  - Clay chip click & clatter
  - Card slide & shuffle swish
  - Card 3D snap/flip
  - Double wooden check tap
  - Smooth fold whoosh
  - Warning timer tick
  - Royal victory fanfare chords

---

## 🏗️ Architecture

```
PokerWebsite/
├── packages/
│   ├── backend/                 # Node.js + Express + Socket.IO + Texas Hold'em Engine
│   │   ├── src/
│   │   │   ├── engine/          # Pure Poker Game Engine
│   │   │   │   ├── Card.ts
│   │   │   │   ├── Deck.ts      # Cryptographic Fisher-Yates shuffle
│   │   │   │   ├── HandEvaluator.ts # Best 5-of-7 combinatoric evaluator
│   │   │   │   ├── PotManager.ts    # Main pot & side pots
│   │   │   │   ├── PokerTable.ts    # State machine & turn management
│   │   │   │   └── types.ts
│   │   │   ├── services/        # RoomManager & AuthService
│   │   │   ├── database/        # Persistent DB repository
│   │   │   ├── routes/          # REST endpoints (/api/auth, /api/rooms, /api/stats)
│   │   │   ├── socket/          # WebSocket realtime handlers
│   │   │   └── index.ts
│   │   └── package.json
│   └── frontend/                # React 18 + TypeScript + Vite + Tailwind CSS
│       ├── src/
│       │   ├── audio/           # Web Audio API synthesizers
│       │   ├── components/      # PokerTable, Seats, Cards, Chips, ActionBar, Chat
│       │   ├── context/         # AuthContext & GameContext
│       │   ├── pages/           # LobbyPage & TablePage
│       │   └── main.tsx
│       └── package.json
├── docker-compose.yml
└── package.json
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- npm (v9+)

### 1. Install & Build
```bash
npm install
npm run build
```

### 2. Run Tests
```bash
# Run unit tests for HandEvaluator, PotManager, and PokerTable
npm run test

# Run the automated 3-player real-time Socket.IO simulation
npm run test:sim
```

### 3. Start Development Servers
```bash
npm run dev
```
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:3001`

### 4. Docker Deployment
```bash
docker compose up --build
```
This launches PostgreSQL, Redis, Backend, and Frontend containers.

---

## 🔒 Security & Fair Play Model
1. The server deck is created and shuffled using `crypto.randomInt()`.
2. Clients never receive un-dealt cards in any WebSocket broadcast.
3. Opponents' hole cards are masked as `hasCards: true` and `holeCards: undefined` until the showdown stage.
4. Betting action validation prevents out-of-turn actions, illegal raise amounts, and negative chip balances.

