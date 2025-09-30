# 🎪 Circus Dash: Street Rush - Solo Mode

A circus-themed racing game built with Next.js 14+, Phaser 3, and PostgreSQL. Players compete for the fastest completion times across three unique circus arenas!

## 🎮 Features

### Core Gameplay
- **3 Unique Arenas**: Tightrope Walkway (Easy), Clown Alley (Medium), Juggling Tunnel (Hard)
- **Progressive Unlocking**: Complete arenas to unlock the next challenge
- **Precision Platforming**: Jump across platforms, avoid obstacles, and race to the finish
- **Real-time Timer**: Millisecond-accurate timing system

### Competitive Features
- **Global Leaderboards**: See how you rank against other players
- **Personal Bests**: Track your improvement over time
- **World Record Celebrations**: Special fireworks and animations for beating world records
- **Top 10 Rankings**: Gold, silver, and bronze medals for top performers

### Technical Features
- **JWT Authentication**: Secure player accounts with httpOnly cookies
- **Phaser 3 Game Engine**: Smooth 60fps gameplay with arcade physics
- **Server-Side Rendering**: Next.js 14 App Router with React Server Components
- **PostgreSQL Database**: Robust data persistence with Prisma ORM
- **Responsive Design**: Tailwind CSS for beautiful, mobile-friendly UI

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL database
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   cd ringmaster_race
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   The `.env` file is already configured. Update if needed:
   ```env
   DATABASE_URL="your-postgresql-connection-string"
   JWT_SECRET="your-secret-key"
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```

4. **Run database migrations**
   ```bash
   npx prisma migrate dev
   ```

5. **Seed the database**
   ```bash
   npx prisma db seed
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

7. **Open the game**

   Navigate to `http://localhost:3000`

## 📁 Project Structure

```
ringmaster_race/
├── app/
│   ├── api/              # API routes
│   │   ├── auth/         # Authentication endpoints
│   │   ├── arenas/       # Arena data endpoints
│   │   ├── solo/         # Game completion & leaderboards
│   │   └── player/       # Player statistics
│   ├── game/[arenaId]/   # Game page
│   ├── leaderboard/      # Leaderboard page
│   ├── menu/             # Arena selection page
│   ├── profile/          # Player profile page
│   └── page.tsx          # Landing/login page
├── components/
│   ├── AuthForm.tsx      # Login/Register form
│   ├── FestivalMap.tsx   # Arena selection component
│   ├── GameCanvas.tsx    # Phaser game wrapper
│   ├── Leaderboard.tsx   # Leaderboard display
│   └── StatsDisplay.tsx  # Player statistics
├── game/
│   ├── scenes/           # Phaser game scenes
│   │   ├── BootScene.ts
│   │   ├── GameScene.ts
│   │   └── ResultScene.ts
│   ├── levels/           # Level data (JSON)
│   │   ├── arena1.json
│   │   ├── arena2.json
│   │   └── arena3.json
│   └── config.ts         # Game configuration
├── lib/
│   └── auth.ts           # Authentication utilities
├── types/
│   ├── api.ts            # API type definitions
│   └── game.ts           # Game type definitions
└── prisma/
    ├── schema.prisma     # Database schema
    └── seed.ts           # Database seed data
```

## 🎯 How to Play

1. **Register/Login**: Create an account or log in
2. **Choose an Arena**: Select from the Festival Map
3. **Race**: Use arrow keys, WASD, or spacebar to jump
4. **Complete**: Reach the finish line as fast as possible
5. **Compete**: Beat your personal best and climb the leaderboards!

### Controls
- **Move**: Arrow Keys ← →  OR  A D
- **Jump**: Arrow Up ↑  OR  W  OR  Spacebar
- **Pause**: ESC

## 🏗️ Tech Stack

- **Framework**: Next.js 15.5.4 (App Router)
- **Game Engine**: Phaser 3.90.0
- **Database**: PostgreSQL + Prisma ORM 6.16.3
- **Authentication**: JWT with jose + bcryptjs
- **Styling**: Tailwind CSS 4
- **Language**: TypeScript 5

## 🎨 Game Mechanics

### Player Physics
- Speed: 200 pixels/second
- Jump velocity: -500
- Gravity: 800 y-axis
- Single jump (no double jump)

### Arena Difficulty
1. **Tightrope Walkway**: Simple platforming, few gaps
2. **Clown Alley**: Moving platforms, obstacles, complex jumps
3. **Juggling Tunnel**: Precise timing, narrow passages, multiple moving platforms

### Scoring System
- Time is measured in milliseconds
- Rank calculated based on best time per player
- Leaderboards show top 10 for each arena

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/register` - Create new player
- `POST /api/auth/login` - Login with credentials
- `GET /api/auth/me` - Get current player info

### Game
- `GET /api/arenas` - Get all arenas with unlock status
- `GET /api/arenas/[arenaId]` - Get specific arena details
- `POST /api/solo/complete` - Submit run completion
- `GET /api/solo/leaderboard/[arenaId]` - Get top 10 times
- `GET /api/player/stats` - Get player statistics

## 📊 Database Schema

### Player
- id (String, CUID)
- username (String, unique)
- password (String, bcrypt hashed)
- createdAt (DateTime)

### Arena
- id (String, CUID)
- name (String, unique)
- difficulty (Int: 1-3)
- description (String, optional)
- unlockAfter (String, optional)

### SoloRun
- id (String, CUID)
- playerId (String, foreign key)
- arenaId (String, foreign key)
- timeMs (Int)
- completedAt (DateTime)

## 🎉 Special Features

### World Record Celebration
When a player beats the world record:
- Confetti particle effects
- Screen flash with gold color
- Large "NEW WORLD RECORD!" text
- Animated celebration lasting 3-5 seconds
- Fanfare sound effect (placeholder)

### Arena Progression
- Arenas unlock sequentially
- Lock icons on locked arenas
- Trophy icons on completed arenas
- Crown badge for world record holders

## 🛠️ Development

### Run in development mode
```bash
npm run dev
```

### Build for production
```bash
npm run build
```

### Start production server
```bash
npm start
```

### Run Prisma Studio (database GUI)
```bash
npx prisma studio
```

## 🐛 Known Issues / Future Enhancements

### Placeholder Assets
Currently using colored rectangles and shapes. Replace with:
- Player sprites with animations
- Platform textures
- Background images
- Obstacle sprites
- Sound effects and music

### Potential Improvements
- Add sound effects and background music
- Implement ghost racing (race against your best time)
- Add power-ups and collectibles
- Create level editor for custom arenas
- Add multiplayer race mode
- Implement replay system
- Add achievements and badges
- Social sharing features

## 📝 License

This project is for educational purposes.

## 🙏 Acknowledgments

- Built with Next.js and Phaser 3
- Inspired by classic platformer racing games
- Circus theme for fun and vibrant aesthetics

---

**Ready to race? Create an account and start competing! 🏁**