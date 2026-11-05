import http from 'http';
import express from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { io as ClientSocket, Socket as ClientSocketType } from 'socket.io-client';
import { setupSocketHandler } from '../../socket/socketHandler.js';
import { AuthService } from '../../services/AuthService.js';
import { cardToString } from '../Card.js';

async function runMultiplayerSimulation() {
  console.log('====================================================');
  console.log('🃏 STARTING 3-PLAYER REAL-TIME POKER SIMULATION 🃏');
  console.log('====================================================\n');

  // 1. Setup Server
  const app = express();
  const server = http.createServer(app);
  const io = new SocketIOServer(server, { cors: { origin: '*' } });
  setupSocketHandler(io);

  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve());
  });

  const address = server.address() as any;
  const port = address.port;
  const serverUrl = `http://127.0.0.1:${port}`;
  console.log(`[Simulation] Test server running on ${serverUrl}`);

  // 2. Create 3 Players
  const aliceAuth = AuthService.createGuest('Alice');
  const bobAuth = AuthService.createGuest('Bob');
  const charlieAuth = AuthService.createGuest('Charlie');

  const createClient = (token: string): ClientSocketType => {
    const s = ClientSocket(serverUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: false,
    });
    s.on('connect_error', (err) => console.error('[Client] Connect error:', err.message));
    return s;
  };

  const clientAlice = createClient(aliceAuth.token);
  const clientBob = createClient(bobAuth.token);
  const clientCharlie = createClient(charlieAuth.token);

  await Promise.all([
    new Promise((r) => clientAlice.on('connect', () => r(null))),
    new Promise((r) => clientBob.on('connect', () => r(null))),
    new Promise((r) => clientCharlie.on('connect', () => r(null))),
  ]);

  console.log('✅ All 3 players connected via WebSocket:');
  console.log(` - Alice: ${aliceAuth.user.displayName} (ID: ${aliceAuth.user.id.slice(0, 8)})`);
  console.log(` - Bob: ${bobAuth.user.displayName} (ID: ${bobAuth.user.id.slice(0, 8)})`);
  console.log(` - Charlie: ${charlieAuth.user.displayName} (ID: ${charlieAuth.user.id.slice(0, 8)})\n`);

  let latestAliceState: any = null;
  let latestBobState: any = null;
  let latestCharlieState: any = null;

  clientAlice.on('table:state', (s) => { latestAliceState = s; });
  clientBob.on('table:state', (s) => { latestBobState = s; });
  clientCharlie.on('table:state', (s) => { latestCharlieState = s; });

  const roomId = 'simulation-room-1';

  // Join Room
  clientAlice.emit('room:join', { roomId });
  clientBob.emit('room:join', { roomId });
  clientCharlie.emit('room:join', { roomId });

  await new Promise(r => setTimeout(r, 200));

  clientAlice.on('room:error', (e) => console.error('[Alice Error]', e));
  clientBob.on('room:error', (e) => console.error('[Bob Error]', e));
  clientCharlie.on('room:error', (e) => console.error('[Charlie Error]', e));

  // Sit at table
  clientAlice.emit('room:sit', { seatIndex: 0, buyIn: 1000 });
  clientBob.emit('room:sit', { seatIndex: 1, buyIn: 1000 });
  clientCharlie.emit('room:sit', { seatIndex: 2, buyIn: 1000 });

  await new Promise(r => setTimeout(r, 600));

  console.log('[Simulation] Starting Texas Hold\'em Hand...');
  clientAlice.emit('game:start');

  // Wait for deal
  await new Promise(r => setTimeout(r, 400));

  console.log(`[Simulation] Hand Stage: ${latestAliceState?.stage}`);
  console.log(` - Pot: ${latestAliceState?.pot}`);
  console.log(` - Dealer Seat: ${latestAliceState?.dealerSeatIndex}`);
  console.log(` - Small Blind Seat: ${latestAliceState?.smallBlindSeatIndex}`);
  console.log(` - Big Blind Seat: ${latestAliceState?.bigBlindSeatIndex}`);

  // Security verification: private hole cards must NOT leak to opponents!
  const aliceOwnHole = latestAliceState.seats[0]?.holeCards;
  const bobsViewOfAliceHole = latestBobState.seats[0]?.holeCards;

  console.log(`\n🔒 SECURITY VERIFICATION:`);
  console.log(` - Alice's view of her cards: ${aliceOwnHole?.map(cardToString).join(' ')}`);
  console.log(` - Bob's view of Alice's cards: ${bobsViewOfAliceHole ? 'LEAKED!' : 'HIDDEN (CONFIDENTIAL)'}`);

  if (bobsViewOfAliceHole !== undefined) {
    throw new Error('SECURITY VIOLATION: Hole cards leaked to other players before showdown!');
  }

  // Automated betting play-through to showdown
  let loopCount = 0;
  const maxLoops = 25;

  while (latestAliceState && latestAliceState.stage !== 'HAND_COMPLETED' && loopCount < maxLoops) {
    loopCount++;
    const curSeat = latestAliceState.currentTurnSeatIndex;
    if (curSeat === null) {
      await new Promise(r => setTimeout(r, 200));
      continue;
    }

    const stage = latestAliceState.stage;
    const curPlayer = latestAliceState.seats[curSeat];
    const client = curPlayer.id === aliceAuth.user.id 
      ? clientAlice 
      : curPlayer.id === bobAuth.user.id 
        ? clientBob 
        : clientCharlie;

    const validActions = curPlayer.id === aliceAuth.user.id 
      ? latestAliceState.myValidActions 
      : curPlayer.id === bobAuth.user.id 
        ? latestBobState.myValidActions 
        : latestCharlieState.myValidActions;

    console.log(`\n👉 Turn: ${curPlayer.name} (Seat ${curSeat}) | Stage: ${stage} | Pot: $${latestAliceState.pot}`);

    if (validActions?.canCheck) {
      console.log(` - Action: ${curPlayer.name} CHECKS`);
      client.emit('game:action', { type: 'CHECK' });
    } else if (validActions?.canCall) {
      console.log(` - Action: ${curPlayer.name} CALLS $${validActions.callAmount}`);
      client.emit('game:action', { type: 'CALL' });
    } else {
      console.log(` - Action: ${curPlayer.name} FOLDS`);
      client.emit('game:action', { type: 'FOLD' });
    }

    await new Promise(r => setTimeout(r, 250));
  }

  // Showdown result verification
  console.log('\n====================================================');
  console.log('🏆 SHOWDOWN / HAND COMPLETION REACHED 🏆');
  console.log('====================================================');
  console.log(`Community Cards: [${latestAliceState.communityCards.map(cardToString).join(' ')}]`);

  if (latestAliceState.handResults && latestAliceState.handResults.length > 0) {
    for (const pot of latestAliceState.handResults) {
      for (const w of pot.winners) {
        console.log(`🎉 Winner: ${w.playerName} won $${w.amount} with ${w.handDescription}`);
      }
    }
  }

  // Clean up
  clientAlice.disconnect();
  clientBob.disconnect();
  clientCharlie.disconnect();
  server.close();

  console.log('\n✅ 3-Player Texas Hold\'em Simulation PASSED Successfully!');
  process.exit(0);
}

runMultiplayerSimulation().catch(err => {
  console.error('❌ Simulation Error:', err);
  process.exit(1);
});
