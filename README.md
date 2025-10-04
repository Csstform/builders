# Tower Tetris - Physics Stacking Game

A strategic physics-based Tetris game where you stack tetrominoes to build the tallest tower possible. Lose a life when pieces fall off the platform, and aim for the highest score based on your tower's height!

## 🎮 How to Play

### Objective
Build the tallest tower possible by stacking tetrominoes on a small platform. You have 3 lives - lose one each time a piece falls off the platform.

### Controls
- **Arrow Keys**: Move pieces left/right (full steps)
- **A/D Keys**: Move pieces left/right (half steps for precision)
- **R or ↑**: Rotate pieces
- **Space**: Drop pieces faster
- **Touch Controls**: Use on-screen buttons or swipe gestures on mobile

### Scoring
- **Final Score**: Based on tower height (100 points per block height)
- **Height Tracking**: Real-time display of current tower height
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

### Game Mechanics
- **Small Platform**: 200px wide platform with side gaps for challenge
- **No Bouncing**: Pieces stick immediately upon landing
- **Collision Detection**: Immediate next piece spawning when pieces land
- **Fall Detection**: All pieces (current and previous) count towards life loss
- **Camera Following**: Smooth camera movement when tower reaches 300px height

## 🛠️ Technical Details

### Built With
- **HTML5 Canvas**: For game rendering
- **Matter.js**: Physics engine for realistic interactions
- **Vanilla JavaScript**: No frameworks, pure JS implementation
- **CSS3**: Modern styling with glassmorphism and responsive design

### File Structure
```
builders/
├── index.html          # Main HTML file
├── style.css           # Game styling and responsive design
├── game.js             # Core game logic and physics
└── README.md           # This file
```

### Key Constants
- **Platform Width**: 200px (centered on 400px canvas)
- **Block Size**: 20px
- **Camera Trigger**: 300px height
- **Gravity**: 0.1 (slow, strategic falling)
- **Lives**: 3

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
- [ ] Particle effects on piece landing
- [ ] Sound effects for key actions
- [ ] Height milestone celebrations
- [ ] Stability indicator in UI
- [ ] Next 3 pieces preview
- [ ] Achievement pop-ups
- [ ] Screen shake on dramatic falls
- [ ] Better visual feedback for perfect placements

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

## 📝 Version History

### Current Version Features
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
