# Tetro Builders - Physics Stacking Game

A strategic physics-based Tetris game where you stack tetrominoes to build the tallest tower possible. Lose a life when pieces fall off the platform, and aim for the highest score based on your tower's height!

## 🎮 How to Play

### Objective
Build the tallest tower possible by stacking tetrominoes on a small platform. You have 3 lives - lose one each time a piece falls off the platform.

### Controls

#### Desktop Controls
- **Arrow Keys**: Move pieces left/right (full steps)
- **A/D Keys**: Move pieces left/right (half steps for precision)
- **R or ↑**: Rotate pieces
- **Space**: Drop pieces faster

#### Mobile Controls
- **Tap**: Rotate piece
- **Swipe ←/→**: Move left/right
- **Swipe ↓**: Drop piece
- **Swipe ↑**: Rotate piece
- **Touch Buttons**: On-screen control buttons
- **Haptic Feedback**: Vibration on touch actions

### Scoring
- **Base Score**: 100 points per block height
- **Milestone Bonuses**: Extra points at height milestones (height × 10 bonus)
- **Height Tracking**: Real-time display of current tower height
- **Stability Meter**: Visual indicator of tower stability
- **Life System**: 3 lives - game ends when all are lost

## 🚀 Features

### Current Features
- **Physics-Based Gameplay**: Realistic physics using Matter.js engine
- **7 Tetromino Types**: I, O, T, S, Z, J, L pieces with unique colors
- **Strategic Controls**: Full and half-step movement for precision
- **Dynamic Camera**: Automatically follows tower height for infinite building
- **Smart Spawning**: Collision detection prevents overlapping pieces
- **Stable Physics**: Balanced friction and damping for natural tower building
- **Responsive Design**: Works on both desktop and mobile devices
- **Visual Polish**: Modern UI with glassmorphism effects

### Enhanced Features
- **Particle Effects**: Beautiful particle explosions when pieces land
- **Sound System**: Audio feedback for all actions (landing, movement, achievements)
- **Height Milestones**: Celebrations and bonus points at 10, 25, 50, 100, 150, 200, 300, 500 blocks
- **Achievement System**: Pop-up notifications with bonus scoring
- **Stability Indicator**: Real-time tower stability meter with color-coded feedback
- **Screen Shake**: Dramatic effects when pieces fall off
- **Mobile Optimized**: Touch controls, haptic feedback, and responsive layouts
- **Gesture Controls**: Swipe and tap controls for mobile devices
- **Auto-Rotate Support**: Seamless landscape/portrait mode switching
- **Smart Spawn System**: Pieces spawn relative to camera position for infinite building
- **Graceful Physics**: Smooth piece sliding with optimized friction and damping
- **Comprehensive Fall Detection**: All pieces monitored continuously for platform falls

### Game Mechanics
- **Small Platform**: 200px wide platform with side gaps for challenge
- **No Bouncing**: Pieces stick immediately upon landing
- **Smart Collision Detection**: Multi-method detection for reliable piece landing
- **Fall Detection**: All pieces (current and previous) count towards life loss
- **Camera Following**: Smooth camera movement when tower reaches 300px height
- **Graceful Placement**: 8px tolerance for smooth piece sliding into position
- **Particle Effects**: Visual feedback when pieces land
- **Audio Feedback**: Sound effects for all game actions
- **Smart Spawning**: Camera-relative spawn positions prevent off-screen spawning
- **Smooth Physics**: Optimized friction and damping for natural piece movement
- **Continuous Monitoring**: All placed pieces monitored for falling off platform

## 🛠️ Technical Details

### Built With
- **HTML5 Canvas**: For game rendering
- **Matter.js**: Physics engine for realistic interactions
- **Vanilla JavaScript**: No frameworks, pure JS implementation
- **CSS3**: Modern styling with glassmorphism and responsive design

## 🚀 Getting Started

### Running Locally

**Important:** This game uses ES6 modules, which require a web server. You cannot open `index.html` directly from the file system.

#### Option 1: Use the provided server scripts

**Windows:**
```bash
server.bat
```

**Mac/Linux:**
```bash
chmod +x server.sh
./server.sh
```

**Python (any OS):**
```bash
python server.py
```

#### Option 2: Use Node.js
```bash
npx http-server -p 8000 -o
```

#### Option 3: Use PHP
```bash
php -S localhost:8000
```

#### Option 4: Use Python's built-in server
```bash
python -m http.server 8000
```

Then open `http://localhost:8000` in your browser.

### File Structure
```
builders/
├── index.html          # Main HTML file
├── style.css           # Game styling and responsive design
├── js/                 # JavaScript modules
│   ├── game.js         # Main game orchestration
│   ├── constants.js    # Game constants
│   ├── gameState.js    # State management
│   ├── physics.js      # Physics engine setup
│   ├── pieces.js       # Piece management
│   ├── collision.js    # Collision detection
│   ├── controls.js     # Input handling
│   ├── ui.js           # UI and rendering
│   ├── tutorial.js     # Tutorial system
│   └── audio.js        # Sound system
├── server.py           # Python server script
├── server.bat          # Windows server script
├── server.sh           # Unix server script
├── sw.js               # Service worker
├── manifest.json       # PWA manifest
└── README.md           # This file
```

### Key Constants
- **Platform Width**: 200px (centered on 400px canvas)
- **Block Size**: 20px
- **Camera Trigger**: 300px height
- **Gravity**: 0.1 (slow, strategic falling)
- **Lives**: 3
- **Collision Tolerance**: 8px vertical, 5px horizontal
- **Milestone Heights**: 10, 25, 50, 100, 150, 200, 300, 500 blocks
- **Physics Settings**: Friction 0.5, Static Friction 0.7, Air Resistance 0.03
- **Spawn Safety**: 100px above camera view, 150px if blocked

## 🎯 Future Enhancement Ideas

### 🎯 Core Gameplay Enhancements
- [ ] **Power-ups & Special Blocks**
  - [ ] Sticky blocks - stick to other pieces more easily
  - [ ] Heavy blocks - more stable, less likely to fall
  - [ ] Light blocks - easier to place but more fragile
  - [ ] Explosive blocks - clear nearby blocks when placed
  - [ ] Magnetic blocks - attract nearby pieces

- [ ] **Scoring System Improvements**
  - [ ] Combo multipliers - consecutive perfect placements
  - [ ] Bonus points for specific shapes or patterns
  - [ ] Time bonuses - faster completion rewards
  - [ ] Height milestones - extra points at certain heights
  - [ ] Stability bonuses - rewards for well-balanced towers

- [ ] **Game Modes**
  - [ ] Time Attack - build as high as possible in limited time
  - [ ] Survival Mode - endless pieces with increasing difficulty
  - [ ] Challenge Mode - specific objectives (build X height, use only certain shapes)
  - [ ] Speed Mode - pieces fall faster as you progress
  - [ ] Zen Mode - no lives, just pure tower building

### 🎮 Visual & Audio Enhancements
- [ ] **Visual Polish**
  - [ ] Particle effects when pieces land
  - [ ] Screen shake for dramatic moments
  - [ ] Glow effects for perfect placements
  - [ ] Trail effects following falling pieces
  - [ ] Background parallax that moves with camera
  - [ ] Dynamic lighting based on tower height

- [ ] **Audio System**
  - [ ] Music that changes based on tower height
  - [ ] Sound effects for placements, falls, and achievements
  - [ ] Audio cues for when pieces are about to fall
  - [ ] Ambient sounds that build tension

### 🏗️ Building & Physics Features
- [ ] **Advanced Building Tools**
  - [ ] Undo button - remove last placed piece (costs points)
  - [ ] Preview mode - see where piece will land before dropping
  - [ ] Ghost piece - translucent preview of placement
  - [ ] Rotation preview - see all rotation states
  - [ ] Placement hints - suggest optimal positions

- [ ] **Physics Enhancements**
  - [ ] Wind effects - occasional gusts that affect falling pieces
  - [ ] Earthquake events - shake existing pieces
  - [ ] Ice blocks - slippery surfaces
  - [ ] Spring blocks - bounce pieces higher
  - [ ] Teleporter blocks - move pieces to different positions

### 📊 Progression & Meta Systems
- [ ] **Unlockables**
  - [ ] New block types unlock as you progress
  - [ ] Custom themes - different visual styles
  - [ ] Special platforms - different base shapes
  - [ ] Achievement system - badges for various accomplishments
  - [ ] Statistics tracking - personal bests and records

- [ ] **Difficulty Scaling**
  - [ ] Adaptive difficulty - adjusts based on player skill
  - [ ] Progressive challenges - unlock harder modes
  - [ ] Leaderboards - compete with other players
  - [ ] Daily challenges - special objectives each day

### 🎨 UI/UX Improvements
- [ ] **Better Interface**
  - [ ] Mini-map showing tower from above
  - [ ] Height indicator with milestone markers
  - [ ] Stability meter - shows how stable your tower is
  - [ ] Next 3 pieces preview instead of just 1
  - [ ] Piece counter - how many pieces you've used
  - [ ] Efficiency rating - how well you're using space

- [ ] **Mobile Enhancements**
  - [ ] Gesture controls - swipe patterns for movement
  - [ ] Haptic feedback - vibration for placements
  - [ ] Touch zones - larger touch areas for mobile
  - [ ] Auto-rotate - landscape/portrait modes

### 🎪 Special Features
- [ ] **Social Elements**
  - [ ] Share screenshots of impressive towers
  - [ ] Ghost replays - watch your best runs
  - [ ] Challenge friends - send specific challenges
  - [ ] Community towers - collaborative building

- [ ] **Creative Mode**
  - [ ] Free building - no lives, unlimited pieces
  - [ ] Custom shapes - create your own tetrominoes
  - [ ] Save/load - save your creations
  - [ ] Blueprint mode - plan towers before building

### 🔥 High Priority Quick Wins
- [x] Particle effects on piece landing
- [x] Sound effects for key actions
- [x] Height milestone celebrations
- [x] Stability indicator in UI
- [ ] Next 3 pieces preview
- [x] Achievement pop-ups
- [x] Screen shake on dramatic falls
- [x] Better visual feedback for perfect placements

## 🚀 Getting Started

### Prerequisites
- A modern web browser with HTML5 Canvas support
- No additional dependencies required

### Installation
1. Clone or download the repository
2. Open `index.html` in your web browser
3. Start building your tower!

### Development
To modify the game:
1. Edit `game.js` for game logic changes
2. Edit `style.css` for visual modifications
3. Edit `index.html` for UI structure changes

## 🎯 Game Strategy Tips

1. **Build Wide Before Tall**: Create a stable base before going high
2. **Use Half-Steps**: Precise positioning is crucial for stability
3. **Plan Ahead**: Look at the next piece to plan your current placement
4. **Balance is Key**: Keep your tower centered on the platform
5. **Manage Risk**: Higher towers are riskier but give better scores
6. **Watch Your Stability**: Use the stability meter to gauge tower health
7. **Aim for Milestones**: Height milestones give significant bonus points
8. **Mobile Players**: Use swipe gestures for quick, precise movements

## 📝 Version History

### Version 2.0 - Enhanced Edition
- **Particle Effects**: Visual feedback when pieces land
- **Sound System**: Audio feedback for all actions
- **Achievement System**: Height milestones with bonus points
- **Stability Indicator**: Real-time tower stability meter
- **Mobile Optimization**: Touch controls, haptic feedback, gesture support
- **Screen Effects**: Shake effects for dramatic moments
- **Enhanced UI**: Better visual feedback and responsive design
- **Smart Spawn System**: Camera-relative spawning for infinite building
- **Graceful Physics**: Optimized friction and smooth piece sliding
- **Comprehensive Monitoring**: All pieces tracked for fall detection
- **Improved Collision**: Multi-method detection with graceful placement

### Version 1.0 - Core Features
- Physics-based tetromino stacking
- 3-life system with fall detection
- Dynamic camera following
- Responsive mobile/desktop design
- Strategic movement controls
- Smart collision detection

## 🤝 Contributing

Feel free to fork this project and submit pull requests for any of the enhancement ideas listed above!

## 📄 License

This project is open source and available under the MIT License.

---

**Have fun building the tallest tower possible!** 🏗️✨
