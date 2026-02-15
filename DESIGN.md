# Skribble Clone - Design Document

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT (React + RSBuild)               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │  React Router│  │  Canvas     │  │  Socket.io-client   │ │
│  │  (Routing)   │  │  (Drawing)  │  │  (Real-time comms)  │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└──────────────────────────┬──────────────────────────────────┘
                           │ WebSocket (SignalR or Socket.io)
┌──────────────────────────▼──────────────────────────────────┐
│                   SERVER (ASP.NET Core)                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │  Controllers │  │  Hub (Real- │  │  Domain Services    │ │
│  │  (REST API)  │  │  time)      │  │  (Game Logic)       │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │  Room Store │  │  Game State │  │  Player Session     │ │
│  │  (In-mem)   │  │  Manager    │  │  Manager            │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React + RSBuild |
| **Routing** | React Router v6 |
| **Backend** | ASP.NET Core |
| **Real-time** | SignalR (recommended) or Socket.io |
| **State** | In-memory (ConcurrentDictionary) |
| **Styling** | Tailwind CSS |
| **HTTP Client** | Axios |

---

## Phase 1: Project Setup & Foundation

### 1.1 Backend Setup
- [ ] Create ASP.NET Core Web API project
- [ ] Configure CORS for React client
- [ ] Add SignalR support
- [ ] Setup dependency injection container
- [ ] Configure logging (Serilog recommended)
- [ ] Create basic folder structure (Controllers, Hubs, Services, Models)
- [ ] Add health check endpoint `/health`

### 1.2 Frontend Setup
- [ ] Initialize React project with RSBuild
- [ ] Configure React Router v6
- [ ] Setup folder structure (pages, components, hooks, services, types)
- [ ] Configure environment variables (.env for API URL, WS URL)
- [ ] Setup SignalR client
- [ ] Create API service layer with Axios
- [ ] Add error boundary component

### 1.3 Integration Test
- [ ] Frontend successfully calls backend health endpoint
- [ ] WebSocket connection established between client and server
- [ ] Test ping/pong message exchange

---

## Phase 2: Room Management Core

### 2.1 Room Domain Model
- [ ] Create `Room` entity (Id, Code, HostId, MaxPlayers, CurrentPlayers, Status, Settings)
- [ ] Create `Player` entity (Id, Name, RoomId, IsHost, ConnectionId, Score)
- [ ] Create `RoomSettings` value object (MaxPlayers, Rounds, CustomWords[], TimeLimit)
- [ ] Define RoomStatus enum (Lobby, Playing, Finished)

### 2.2 Room Store (In-Memory)
- [ ] Implement `IRoomRepository` interface
- [ ] Create thread-safe room storage (ConcurrentDictionary)
- [ ] Methods: Create, GetById, GetByCode, Update, Delete, AddPlayer, RemovePlayer
- [ ] Room expiration/cleanup logic (remove inactive rooms after 2 hours)

### 2.3 Room API Endpoints
- [ ] `POST /api/rooms` - Create room (returns room code)
- [ ] `GET /api/rooms/{code}` - Get room details
- [ ] `POST /api/rooms/{code}/join` - Join room (returns player token)
- [ ] `DELETE /api/rooms/{code}/leave` - Leave room

### 2.4 Room Hub (Real-time)
- [ ] Setup `RoomHub` with SignalR
- [ ] Event: `PlayerJoined` - broadcast to room when player joins
- [ ] Event: `PlayerLeft` - broadcast when player disconnects
- [ ] Event: `RoomUpdated` - broadcast room state changes

### 2.5 Frontend - Create Room
- [ ] Create `/` route - Landing page with "Create Room" button
- [ ] Create room configuration form (max players, rounds, custom words)
- [ ] API call to create room
- [ ] Redirect to `/lobby/{roomCode}` after creation
- [ ] Store player token in localStorage/context

### 2.6 Frontend - Join Room
- [ ] Create `/join/{code}` route (handles shareable links)
- [ ] Player name input form
- [ ] API call to join room
- [ ] Handle errors (room full, game started, room not found)
- [ ] Redirect to lobby on success

### 2.7 Frontend - Lobby Page
- [ ] Create `/lobby/{code}` route
- [ ] Display room code with copy-to-clipboard button
- [ ] Connect to RoomHub WebSocket
- [ ] Listen for player join/leave events
- [ ] Show "Waiting for players..." or "Ready to start"

---

## Phase 3: Complete Lobby Experience

### 3.1 Player Management
- [ ] Display connected players list with avatars/names
- [ ] Show host badge next to host player
- [ ] Show connection status (online/offline)
- [ ] Handle player disconnections (grace period before removing?)

### 3.2 Game Configuration UI
- [ ] Host can edit settings before game starts
- [ ] Max players slider/input (2-4 per NFR)
- [ ] Rounds input (1-10)
- [ ] Custom words textarea (comma-separated)
- [ ] Time limit per round (seconds)
- [ ] Validation: minimum 2 players, at least 3 custom words

### 3.3 Start Game Logic
- [ ] Host-only "Start Game" button
- [ ] Button disabled until minimum players (2) joined
- [ ] On click: validate settings, initialize game state
- [ ] Broadcast `GameStarted` event to all players
- [ ] Redirect all players to game page
- [ ] Lock room (prevent new joins)

### 3.4 State Management
- [ ] Create React Context for room state
- [ ] Create custom hook `useRoom()` for room data
- [ ] Create custom hook `usePlayer()` for current player
- [ ] Sync room state with WebSocket events

---

## Phase 4: Game Flow & Turn Management

### 4.1 Game State Domain
- [ ] Create `GameState` entity (RoomId, CurrentRound, TotalRounds, CurrentDrawer, Status)
- [ ] Create `Round` entity (RoundNumber, Word, DrawerId, StartTime, EndTime, Status)
- [ ] Create `Turn` entity (tracks who's drawing, time remaining)
- [ ] GameStatus enum (Waiting, Drawing, RoundEnded, GameEnded)

### 4.2 Game Service
- [ ] `StartGame(roomId)` - initializes game, selects first drawer
- [ ] `StartRound(roomId)` - begins new round, picks random word
- [ ] `EndRound(roomId)` - calculates scores, prepares next round
- [ ] `EndGame(roomId)` - final scores, cleanup
- [ ] `SelectDrawer(roomId)` - rotation logic (circular through players)

### 4.3 Word Selection
- [ ] Randomly select 3 words from custom words list
- [ ] Present options to current drawer
- [ ] Timer for word selection (15 seconds)
- [ ] Auto-pick if drawer doesn't choose
- [ ] Hide word from guessers (only drawer sees it)

### 4.4 Turn Management
- [ ] Track current drawer index
- [ ] Rotate to next player after each round
- [ ] Ensure everyone gets equal turns
- [ ] Handle disconnected drawer (skip or pause?)

### 4.5 Timer System
- [ ] Server-side countdown timer for drawing phase
- [ ] Broadcast time updates every second
- [ ] Handle timer expiration (end round)
- [ ] Pause/resume logic if needed

### 4.6 Frontend - Game Page
- [ ] Create `/game/{code}` route
- [ ] Game layout (sidebar: players/scores, main: canvas/chat)
- [ ] Different views for drawer vs guesser
- [ ] Word selection modal (drawer only)
- [ ] Round indicator (Round 1 of 5)
- [ ] Timer display

---

## Phase 5: Drawing & Canvas

### 5.1 Canvas Component
- [ ] HTML5 Canvas setup with responsive sizing
- [ ] Drawing events: mousedown, mousemove, mouseup
- [ ] Touch support for mobile devices
- [ ] Coordinate mapping (client to canvas)
- [ ] Canvas clearing functionality

### 5.2 Drawing Tools
- [ ] Single color picker (black default, maybe few basic colors)
- [ ] Brush size slider (2px - 20px)
- [ ] Clear canvas button (no undo/redo per requirements)

### 5.3 Drawing Data Protocol
- [ ] Define drawing action structure (type: start/move/end, x, y, color, size)
- [ ] Serialize drawing data efficiently
- [ ] Debounce/batch drawing events (don't flood network)
- [ ] Compression if needed (simple RLE for line data)

### 5.4 Server-Side Drawing Authorization
- [ ] **CRITICAL**: Validate drawer on server before broadcasting
- [ ] Check `connectionId` matches `currentDrawerId`
- [ ] Reject drawing events from non-drawers
- [ ] Log unauthorized attempts

### 5.5 Real-time Drawing Sync
- [ ] Drawer emits `DrawAction` events
- [ ] Server validates and broadcasts `DrawAction` to room
- [ ] All clients receive and render drawing actions
- [ ] Handle lag/buffering (small queue for smooth playback)

### 5.6 Canvas State Management
- [ ] Maintain drawing history for current round
- [ ] Clear canvas on new round
- [ ] Handle late joiners (send current canvas state?)
- [ ] Optimize re-renders (useRef for canvas, not React state)

---

## Phase 6: Chat & Guessing

### 6.1 Chat System
- [ ] Chat input component (bottom of screen)
- [ ] Chat message list (scrollable)
- [ ] Message types: chat, guess, system
- [ ] Message timestamps
- [ ] Chat history persistence (current round only)

### 6.2 Guess Validation
- [ ] Client sends `SubmitGuess` event
- [ ] Server validates guess against current word
- [ ] Case-insensitive comparison
- [ ] Trim whitespace, ignore punctuation

### 6.3 Guess Feedback
- [ ] Correct guess: broadcast "Player X guessed correctly!"
- [ ] Hide correct guess from chat (or show special styling)
- [ ] Wrong guess: show in chat normally
- [ ] Drawer sees guesses but can't guess themselves

### 6.4 Round End Conditions
- [ ] All players guessed correctly (except drawer)
- [ ] Timer expires
- [ ] Drawer disconnects (handle gracefully)
- [ ] Trigger round end, calculate scores

### 6.5 Word Display Logic
- [ ] Drawer sees: "Your word: APPLE" prominently
- [ ] Guessers see: "_ _ _ _ _" (blanks for each letter) or hidden
- [ ] After correct guess, reveal word to all
- [ ] After round ends, show word that was being drawn

---

## Phase 7: Scoring & Game End

### 7.1 Scoring System
- [ ] Define scoring rules:
  - Guesser: Fixed points (e.g., 100) for correct guess
  - Drawer: Fixed points (e.g., 50) when someone guesses correctly
- [ ] Track scores per player in `Player.Score`
- [ ] Real-time scoreboard updates

### 7.2 Scoreboard Component
- [ ] Sidebar player list with scores
- [ ] Sort by score (highest first)
- [ ] Highlight current player
- [ ] Show current drawer indicator
- [ ] Animate score changes

### 7.3 Round Summary
- [ ] Modal/overlay after each round
- [ ] Show word that was drawn
- [ ] List who guessed correctly and when
- [ ] Points awarded breakdown
- [ ] Countdown to next round (5-10 seconds)
- [ ] "Next Round" button for host (auto-starts after delay)

### 7.4 Game End
- [ ] Detect final round completion
- [ ] Calculate final scores
- [ ] Determine winner(s)
- [ ] Show game over screen with leaderboard
- [ ] Highlight top 3 players
- [ ] Stats: total guesses, fastest guess, etc.

### 7.5 Play Again
- [ ] "Play Again" button (host only)
- [ ] Reset game state (scores to 0, round to 1)
- [ ] Keep same players in room
- [ ] Return to lobby or directly restart
- [ ] Or: "Leave Room" button for players

---

## Phase 8: Polish & Edge Cases

### 8.1 Disconnection Handling
- [ ] Detect player disconnections (WebSocket close)
- [ ] Grace period (30 seconds) to reconnect
- [ ] If drawer disconnects:
  - Option A: End round early, no points
  - Option B: Pause game, wait for reconnection
- [ ] If guesser disconnects: Remove from game, adjust scoring
- [ ] If host disconnects: Transfer host to next player

### 8.2 Error Handling
- [ ] Global error boundary in React
- [ ] API error handling with user-friendly messages
- [ ] WebSocket reconnection logic
- [ ] Retry failed requests
- [ ] Toast notifications for errors/success

### 8.3 UI/UX Polish
- [ ] Loading states for all async operations
- [ ] Empty states (no players, no messages)
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Sound effects (optional): correct guess, timer tick, round end
- [ ] Animations: player join, score update, round transitions

### 8.4 Performance Optimizations
- [ ] Debounce drawing events (send every 50ms max)
- [ ] Virtualize chat list if many messages
- [ ] Optimize re-renders (React.memo, useMemo)
- [ ] Canvas optimization (requestAnimationFrame)
- [ ] Backend: efficient room cleanup

### 8.5 Security
- [ ] Input validation on all endpoints
- [ ] Sanitize custom words (no XSS)
- [ ] Rate limiting (prevent spam)
- [ ] Validate player tokens on every request
- [ ] CORS properly configured

---

## Phase 9: Testing & Deployment

### 9.1 Backend Testing
- [ ] Unit tests for GameService
- [ ] Unit tests for RoomRepository
- [ ] Integration tests for Hub events
- [ ] Load testing (20 concurrent rooms, 4 players each)

### 9.2 Frontend Testing
- [ ] Component tests with React Testing Library
- [ ] Hook tests for custom hooks
- [ ] E2E tests for complete game flow (Playwright/Cypress)

### 9.3 Deployment
- [ ] Backend: Docker container
- [ ] Frontend: Static hosting (Vercel/Netlify)
- [ ] Configure production WebSocket (wss://)
- [ ] Environment-specific configs
- [ ] Monitoring and logging

---

## Key Technical Decisions

### WebSocket Technology
- **Recommendation**: SignalR (native .NET, automatic reconnection, simpler)
- Alternative: Socket.io (more flexible, better React ecosystem)

### State Storage
- In-memory ConcurrentDictionary (simplest, meets 20 room requirement)
- Alternative: Redis (if you want persistence across server restarts)

### React State Management
- React Context + useReducer (sufficient for this scale)
- Alternative: Zustand/Redux (if you prefer)

### Room Code Generation
- Random 6-character alphanumeric (e.g., `A3B9K2`)
- Alternative: UUID (too long for sharing?)
- Alternative: Custom words (like "happy-dog-123")

---

## NFR Compliance Checklist

- [ ] Support 20 private rooms (not 300)
- [ ] Support 4 players per room (not 10)
- [ ] Handle drawer disconnection gracefully
- [ ] Backend controls drawing permissions
- [ ] Fixed scoring system (initial version)
- [ ] Only custom words, no on-the-fly word generation

---

## Open Questions Resolution

### Q: If a drawer gets disconnected in between what happens?
**Decision**: End round early, award no points for that round. Show message "Drawer disconnected - round cancelled". Rotate to next player.

### Q: When a drawer is drawing on canvas, other players should not be able to draw on the screen (This should be controlled from backend)?
**Decision**: Server validates every draw action. Only accepts and broadcasts drawing events from the current drawer's ConnectionId. All other drawing events are rejected with 403 Forbidden.

---

## Progress Tracking

| Phase | Status | Completion % |
|-------|--------|--------------|
| Phase 1: Foundation | Not Started | 0% |
| Phase 2: Room Core | Not Started | 0% |
| Phase 3: Lobby | Not Started | 0% |
| Phase 4: Game Flow | Not Started | 0% |
| Phase 5: Drawing | Not Started | 0% |
| Phase 6: Guessing | Not Started | 0% |
| Phase 7: Scoring | Not Started | 0% |
| Phase 8: Polish | Not Started | 0% |
| Phase 9: Testing | Not Started | 0% |

**Last Updated**: 2026-02-15
