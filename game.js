// Game state
let gameState = {
    score: 0,
    height: 0,
    lives: 3,
    gameOver: false,
    currentPiece: null,
    nextPiece: null,
    pieces: [],
    ground: null,
    walls: [],
    camera: {
        x: 0,
        y: 0,
        targetY: 0
    }
};

// Physics engine setup
let engine, world, render;
const canvas = document.getElementById('game-canvas');
const nextCanvas = document.getElementById('next-canvas');

// Game constants
const BLOCK_SIZE = 20;
const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 600;
const SPAWN_X = CANVAS_WIDTH / 2;
const SPAWN_Y = 50;
const GROUND_Y = CANVAS_HEIGHT - 50;
const PLATFORM_WIDTH = 200; // Smaller platform
const PLATFORM_CENTER_X = CANVAS_WIDTH / 2;
const CAMERA_TRIGGER_HEIGHT = 300; // Height at which camera starts following
const CAMERA_SPEED = 2; // How fast camera follows

// Tetromino shapes
const TETROMINOES = {
    I: {
        shape: [
            [1, 1, 1, 1]
        ],
        color: '#00f5ff'
    },
    O: {
        shape: [
            [1, 1],
            [1, 1]
        ],
        color: '#ffff00'
    },
    T: {
        shape: [
            [0, 1, 0],
            [1, 1, 1]
        ],
        color: '#a000f0'
    },
    S: {
        shape: [
            [0, 1, 1],
            [1, 1, 0]
        ],
        color: '#00f000'
    },
    Z: {
        shape: [
            [1, 1, 0],
            [0, 1, 1]
        ],
        color: '#f00000'
    },
    J: {
        shape: [
            [1, 0, 0],
            [1, 1, 1]
        ],
        color: '#0000f0'
    },
    L: {
        shape: [
            [0, 0, 1],
            [1, 1, 1]
        ],
        color: '#ff7f00'
    }
};

// Initialize the game
function initGame() {
    // Create physics engine
    engine = Matter.Engine.create();
    world = engine.world;
    
    // Set very slow, strategic falling rate
    engine.world.gravity.y = 0.1; // Very slow gravity for strategic gameplay
    engine.world.gravity.x = 0; // No horizontal gravity
    engine.world.gravity.scale = 0.0005; // Very low scale for maximum control
    
    // Balanced physics settings for natural movement
    engine.world.constraintIterations = 3;
    engine.world.positionIterations = 6;
    engine.world.velocityIterations = 4;
    
    // Create renderer
    render = Matter.Render.create({
        canvas: canvas,
        engine: engine,
        options: {
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
            wireframes: false,
            background: 'transparent',
            showVelocity: false,
            showAngleIndicator: false,
            showCollisions: false,
            showSeparations: false,
            showAxes: false,
            showPositions: false,
            showBroadphase: false,
            showBounds: false,
            showVelocity: false,
            showCollisions: false,
            showVertexNumbers: false,
            showConvexHulls: false,
            showInternalEdges: false,
            showMousePosition: false
        }
    });
    
    // Create smaller platform with gaps on the sides
    gameState.ground = Matter.Bodies.rectangle(
        PLATFORM_CENTER_X, 
        GROUND_Y + 25, 
        PLATFORM_WIDTH, 
        50, 
        { 
            isStatic: true,
            render: { fillStyle: '#8B4513' }
        }
    );
    
    // Create walls with gaps for pieces to fall through
    gameState.walls = [
        // Left wall (only top portion, leaving gap at bottom)
        Matter.Bodies.rectangle(-25, CANVAS_HEIGHT / 3, 50, CANVAS_HEIGHT * 2/3, { 
            isStatic: true,
            render: { fillStyle: '#654321' }
        }),
        // Right wall (only top portion, leaving gap at bottom)
        Matter.Bodies.rectangle(CANVAS_WIDTH + 25, CANVAS_HEIGHT / 3, 50, CANVAS_HEIGHT * 2/3, { 
            isStatic: true,
            render: { fillStyle: '#654321' }
        })
    ];
    
    // Add all bodies to world
    Matter.World.add(world, [gameState.ground, ...gameState.walls]);
    
    // Start the renderer
    Matter.Render.run(render);
    
    // Create game loop
    const runner = Matter.Runner.create();
    Matter.Runner.run(runner, engine);
    
    // Initialize camera
    updateCamera();
    
    // Generate first pieces
    gameState.nextPiece = generateRandomPiece();
    spawnNewPiece();
    
    // Set up event listeners
    setupControls();
    setupCollisionDetection();
    
    // Start game loop
    gameLoop();
}

// Generate a random tetromino
function generateRandomPiece() {
    const types = Object.keys(TETROMINOES);
    const type = types[Math.floor(Math.random() * types.length)];
    return {
        type: type,
        ...TETROMINOES[type]
    };
}

// Create physics body for a tetromino
function createTetrominoBody(piece, x, y) {
    const bodies = [];
    const shape = piece.shape;
    
    for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col]) {
                const blockX = x + col * BLOCK_SIZE;
                const blockY = y + row * BLOCK_SIZE;
                
                const body = Matter.Bodies.rectangle(
                    blockX, 
                    blockY, 
                    BLOCK_SIZE, 
                    BLOCK_SIZE,
                    {
                        render: { fillStyle: piece.color },
                        friction: 0.5, // Slightly reduced friction for smoother sliding
                        restitution: 0, // No bouncing at all
                        density: 0.001, // Heavy blocks
                        frictionAir: 0.03, // Slightly more air resistance for smoother settling
                        frictionStatic: 0.7, // Reduced static friction for easier sliding
                        inertia: 1000, // Allow some rotation but prevent excessive spinning
                        inverseInertia: 0.001 // Allow some rotation but prevent excessive spinning
                    }
                );
                
                bodies.push(body);
            }
        }
    }
    
    // Create a compound body with balanced properties
    const compound = Matter.Body.create({
        parts: bodies,
        render: { fillStyle: piece.color },
        friction: 0.5, // Slightly reduced friction for smoother sliding
        restitution: 0, // No bouncing at all
        density: 0.001,
        frictionAir: 0.03, // Slightly more air resistance for smoother settling
        frictionStatic: 0.7, // Reduced static friction for easier sliding
        inertia: 1000, // Allow some rotation but prevent excessive spinning
        inverseInertia: 0.001 // Allow some rotation but prevent excessive spinning
    });
    
    return compound;
}

// Spawn a new piece
function spawnNewPiece() {
    if (gameState.gameOver) return;
    
    const piece = gameState.nextPiece;
    
    // Find a safe spawn position
    const spawnPos = findSafeSpawnPosition();
    
    gameState.currentPiece = {
        body: createTetrominoBody(piece, spawnPos.x, spawnPos.y),
        type: piece.type,
        color: piece.color,
        hasLanded: false // Track if this piece has already triggered spawning
    };
    
    Matter.World.add(world, gameState.currentPiece.body);
    gameState.pieces.push(gameState.currentPiece);
    
    // Generate next piece
    gameState.nextPiece = generateRandomPiece();
    drawNextPiece();
}

// Find a safe spawn position that doesn't overlap with existing pieces
function findSafeSpawnPosition() {
    // Calculate spawn position relative to camera
    const cameraOffset = gameState.camera.y;
    let spawnY = SPAWN_Y + cameraOffset; // Adjust spawn Y with camera
    let spawnX = SPAWN_X;
    
    // Ensure spawn is always visible (above camera view)
    const minSpawnY = cameraOffset - 100; // Spawn above camera view
    spawnY = Math.min(spawnY, minSpawnY);
    
    // Check if default spawn position is clear
    const testBounds = {
        min: { x: spawnX - BLOCK_SIZE * 2, y: spawnY - BLOCK_SIZE },
        max: { x: spawnX + BLOCK_SIZE * 2, y: spawnY + BLOCK_SIZE }
    };
    
    // Check for collisions at spawn position
    const spawnArea = Matter.Query.region(engine.world.bodies, testBounds);
    const hasCollision = spawnArea.some(body => 
        body !== gameState.ground && 
        !gameState.walls.includes(body) &&
        gameState.pieces.some(piece => piece.body === body)
    );
    
    // If there's a collision, try moving up further
    if (hasCollision) {
        spawnY = cameraOffset - 150; // Move higher up relative to camera
    }
    
    return { x: spawnX, y: spawnY };
}

// Draw next piece preview
function drawNextPiece() {
    const ctx = nextCanvas.getContext('2d');
    ctx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    
    if (!gameState.nextPiece) return;
    
    const piece = gameState.nextPiece;
    const shape = piece.shape;
    const blockSize = 15;
    const offsetX = (nextCanvas.width - shape[0].length * blockSize) / 2;
    const offsetY = (nextCanvas.height - shape.length * blockSize) / 2;
    
    ctx.fillStyle = piece.color;
    for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col]) {
                ctx.fillRect(
                    offsetX + col * blockSize,
                    offsetY + row * blockSize,
                    blockSize - 1,
                    blockSize - 1
                );
            }
        }
    }
}

// Move current piece with strategic precision
function movePiece(direction, isHalfStep = false) {
    if (!gameState.currentPiece || gameState.gameOver) return;
    
    const body = gameState.currentPiece.body;
    const currentPos = body.position;
    let newX = currentPos.x;
    
    // Calculate movement distance (half block size for half steps)
    const moveDistance = isHalfStep ? BLOCK_SIZE / 2 : BLOCK_SIZE;
    
    switch (direction) {
        case 'left':
            newX = Math.max(BLOCK_SIZE / 2 + 25, currentPos.x - moveDistance);
            break;
        case 'right':
            newX = Math.min(CANVAS_WIDTH - BLOCK_SIZE / 2 - 25, currentPos.x + moveDistance);
            break;
    }
    
    // Smooth, precise movement with velocity damping
    Matter.Body.setPosition(body, { x: newX, y: currentPos.y });
    
    // Dampen any unwanted velocity from movement
    Matter.Body.setVelocity(body, { x: 0, y: body.velocity.y });
    
    // Add slight delay to prevent rapid movement
    if (!body.userData || !body.userData.moveCooldown) {
        body.userData = { moveCooldown: true };
        setTimeout(() => {
            if (body.userData) body.userData.moveCooldown = false;
        }, 100);
    }
}

// Rotate current piece with strategic precision
function rotatePiece() {
    if (!gameState.currentPiece || gameState.gameOver) return;
    
    const body = gameState.currentPiece.body;
    
    // Add rotation cooldown to prevent rapid spinning
    if (!body.userData || !body.userData.rotateCooldown) {
        body.userData = { ...body.userData, rotateCooldown: true };
        Matter.Body.rotate(body, Math.PI / 2);
        
        setTimeout(() => {
            if (body.userData) body.userData.rotateCooldown = false;
        }, 150);
    }
}

// Drop current piece faster
function dropPiece() {
    if (!gameState.currentPiece || gameState.gameOver) return;
    
    const body = gameState.currentPiece.body;
    // Apply moderate downward velocity for strategic dropping
    Matter.Body.setVelocity(body, { x: body.velocity.x, y: 2 });
}

// Check if piece fell off the platform
function checkPieceFell() {
    if (!gameState.currentPiece) return;
    
    const body = gameState.currentPiece.body;
    const bounds = body.bounds;
    
    // Check if any part of the piece is below the ground or outside the platform
    if (bounds.min.y > GROUND_Y + 50) {
        loseLife();
        gameState.currentPiece = null;
    }
    
    // Check if piece fell through the sides (outside the platform width)
    const platformLeft = PLATFORM_CENTER_X - PLATFORM_WIDTH / 2;
    const platformRight = PLATFORM_CENTER_X + PLATFORM_WIDTH / 2;
    
    if (bounds.min.x < platformLeft || bounds.max.x > platformRight) {
        // Only lose life if piece is also falling (below platform level)
        if (bounds.min.y > GROUND_Y - 20) {
            loseLife();
            gameState.currentPiece = null;
        }
    }
}

// Check if any previously dropped pieces have fallen off
function checkAllPiecesFell() {
    if (gameState.gameOver) return;
    
    const platformLeft = PLATFORM_CENTER_X - PLATFORM_WIDTH / 2;
    const platformRight = PLATFORM_CENTER_X + PLATFORM_WIDTH / 2;
    
    // Check all pieces except the current one
    for (let i = gameState.pieces.length - 1; i >= 0; i--) {
        const piece = gameState.pieces[i];
        
        // Skip current piece (it's handled separately)
        if (piece === gameState.currentPiece) continue;
        
        const bounds = piece.body.bounds;
        
        // Check if piece fell below the ground
        if (bounds.min.y > GROUND_Y + 50) {
            // Remove the piece and lose a life
            Matter.World.remove(world, piece.body);
            gameState.pieces.splice(i, 1);
            loseLife();
            continue;
        }
        
        // Check if piece fell through the sides
        if (bounds.min.x < platformLeft || bounds.max.x > platformRight) {
            // Only lose life if piece is also falling (below platform level)
            if (bounds.min.y > GROUND_Y - 20) {
                // Remove the piece and lose a life
                Matter.World.remove(world, piece.body);
                gameState.pieces.splice(i, 1);
                loseLife();
            }
        }
    }
}

// Lose a life
function loseLife() {
    gameState.lives--;
    updateUI();
    
    if (gameState.lives <= 0) {
        gameOver();
    } else {
        // Spawn new piece after a longer delay for strategic planning
        setTimeout(() => {
            spawnNewPiece();
        }, 2000);
    }
}

// Game over
function gameOver() {
    gameState.gameOver = true;
    calculateFinalScore();
    showGameOverScreen();
}

// Calculate final score based on tower height
function calculateFinalScore() {
    let maxHeight = 0;
    
    gameState.pieces.forEach(piece => {
        const bounds = piece.body.bounds;
        const height = GROUND_Y - bounds.min.y;
        maxHeight = Math.max(maxHeight, height);
    });
    
    gameState.height = Math.floor(maxHeight / BLOCK_SIZE);
    gameState.score = gameState.height * 100; // 100 points per block height
    
    updateUI();
}

// Show game over screen
function showGameOverScreen() {
    document.getElementById('game-over').style.display = 'block';
    document.getElementById('final-score').textContent = gameState.score;
    document.getElementById('final-height').textContent = gameState.height;
}

// Update UI elements
function updateUI() {
    document.getElementById('score').textContent = gameState.score;
    document.getElementById('height').textContent = gameState.height;
    document.getElementById('lives').textContent = gameState.lives;
}

// Setup controls
function setupControls() {
    // Keyboard controls
    document.addEventListener('keydown', (e) => {
        if (gameState.gameOver) return;
        
        switch (e.code) {
            case 'ArrowLeft':
                e.preventDefault();
                movePiece('left');
                break;
            case 'ArrowRight':
                e.preventDefault();
                movePiece('right');
                break;
            case 'KeyA':
                e.preventDefault();
                movePiece('left', true); // Half step left
                break;
            case 'KeyD':
                e.preventDefault();
                movePiece('right', true); // Half step right
                break;
            case 'ArrowUp':
                e.preventDefault();
                rotatePiece();
                break;
            case 'KeyR':
                e.preventDefault();
                rotatePiece();
                break;
            case 'ArrowDown':
            case 'Space':
                e.preventDefault();
                dropPiece();
                break;
        }
    });
    
    // Button controls
    document.getElementById('left-btn').addEventListener('click', () => movePiece('left'));
    document.getElementById('right-btn').addEventListener('click', () => movePiece('right'));
    document.getElementById('rotate-btn').addEventListener('click', rotatePiece);
    document.getElementById('drop-btn').addEventListener('click', dropPiece);
    
    // Restart button
    document.getElementById('restart-btn').addEventListener('click', restartGame);
    
    // Enhanced touch controls for mobile
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    let isTouchActive = false;
    
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
        touchStartTime = Date.now();
        isTouchActive = true;
        
        // Haptic feedback on touch start
        if (navigator.vibrate) {
            navigator.vibrate(10); // Short vibration
        }
    });
    
    canvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        if (gameState.gameOver || !isTouchActive) return;
        
        const touch = e.changedTouches[0];
        const deltaX = touch.clientX - touchStartX;
        const deltaY = touch.clientY - touchStartY;
        const touchDuration = Date.now() - touchStartTime;
        
        // Minimum swipe distance
        const minSwipeDistance = 40;
        
        // Tap detection (short touch, small movement)
        if (touchDuration < 200 && Math.abs(deltaX) < 20 && Math.abs(deltaY) < 20) {
            // Tap to rotate
            rotatePiece();
            if (navigator.vibrate) {
                navigator.vibrate(20); // Medium vibration for rotation
            }
            isTouchActive = false;
            return;
        }
        
        // Swipe detection
        if (Math.abs(deltaX) > minSwipeDistance || Math.abs(deltaY) > minSwipeDistance) {
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                // Horizontal swipe
                if (deltaX > minSwipeDistance) {
                    movePiece('right');
                } else if (deltaX < -minSwipeDistance) {
                    movePiece('left');
                }
            } else {
                // Vertical swipe
                if (deltaY > minSwipeDistance) {
                    dropPiece();
                    if (navigator.vibrate) {
                        navigator.vibrate(30); // Strong vibration for drop
                    }
                } else if (deltaY < -minSwipeDistance) {
                    rotatePiece();
                    if (navigator.vibrate) {
                        navigator.vibrate(20); // Medium vibration for rotation
                    }
                }
            }
        }
        
        isTouchActive = false;
    });
    
    canvas.addEventListener('touchcancel', (e) => {
        e.preventDefault();
        isTouchActive = false;
    });
}

// Setup collision detection
function setupCollisionDetection() {
    Matter.Events.on(engine, 'afterUpdate', () => {
        if (gameState.currentPiece) {
            checkPieceFell();
            checkPieceLanded();
        }
        // Check all previously dropped pieces for falling off
        checkAllPiecesFell();
    });
}

// Check if current piece has landed on something
function checkPieceLanded() {
    if (!gameState.currentPiece || gameState.currentPiece.hasLanded) return;
    
    const body = gameState.currentPiece.body;
    const velocity = body.velocity;
    
    // More lenient velocity check for smoother sliding
    if (velocity.y > -0.2 && Math.abs(velocity.x) < 0.3) {
        // Check if piece is actually touching something
        const contacts = Matter.Query.region(engine.world.bodies, body.bounds);
        
        for (let contact of contacts) {
            if (contact === body) continue; // Skip self
            
            // Check if it's touching ground, walls, or other pieces
            if (contact === gameState.ground || 
                gameState.walls.includes(contact) || 
                gameState.pieces.some(piece => piece.body === contact)) {
                
                // More generous positioning check for smoother placement
                const currentBottom = body.bounds.max.y;
                const contactTop = contact.bounds.min.y;
                const currentLeft = body.bounds.min.x;
                const currentRight = body.bounds.max.x;
                const contactLeft = contact.bounds.min.x;
                const contactRight = contact.bounds.max.x;
                
                // Check if piece is on top with more tolerance
                const verticalOverlap = currentBottom >= contactTop - 8; // Increased from 5px to 8px
                
                // Check if pieces are horizontally aligned (allowing some sliding)
                const horizontalOverlap = !(currentRight < contactLeft - 10 || currentLeft > contactRight + 10);
                
                // Only spawn next piece if piece is on top and horizontally aligned
                if (verticalOverlap && horizontalOverlap) {
                    // Mark piece as landed to prevent multiple spawns
                    gameState.currentPiece.hasLanded = true;
                    
                    // Spawn next piece immediately
                    gameState.currentPiece = null;
                    setTimeout(() => {
                        spawnNewPiece();
                    }, 300);
                    break;
                }
            }
        }
    }
}

// Update camera position to follow the tower
function updateCamera() {
    if (!gameState.pieces || gameState.pieces.length === 0) return;
    
    // Find the highest piece in the tower
    let maxHeight = GROUND_Y;
    gameState.pieces.forEach(piece => {
        if (piece !== gameState.currentPiece) {
            const bounds = piece.body.bounds;
            const height = GROUND_Y - bounds.min.y;
            maxHeight = Math.min(maxHeight, GROUND_Y - height);
        }
    });
    
    // Calculate target camera position
    const towerHeight = GROUND_Y - maxHeight;
    if (towerHeight > CAMERA_TRIGGER_HEIGHT) {
        // Start following the tower when it reaches trigger height
        gameState.camera.targetY = -(towerHeight - CAMERA_TRIGGER_HEIGHT);
    } else {
        gameState.camera.targetY = 0;
    }
    
    // Smoothly move camera towards target
    const diff = gameState.camera.targetY - gameState.camera.y;
    gameState.camera.y += diff * 0.05; // Smooth interpolation
    
    // Apply camera transform to renderer
    Matter.Render.lookAt(render, {
        min: { x: gameState.camera.x, y: gameState.camera.y },
        max: { x: CANVAS_WIDTH + gameState.camera.x, y: CANVAS_HEIGHT + gameState.camera.y }
    });
}

// Game loop
function gameLoop() {
    if (!gameState.gameOver) {
        // Update camera to follow tower height
        updateCamera();
        
        // The collision detection now handles spawning the next piece
        // This loop is kept for any other game logic that might be needed
    }
    
    requestAnimationFrame(gameLoop);
}

// Restart game
function restartGame() {
    // Clear the world
    Matter.World.clear(world, false);
    
    // Reset game state
    gameState = {
        score: 0,
        height: 0,
        lives: 3,
        gameOver: false,
        currentPiece: null,
        nextPiece: null,
        pieces: [],
        ground: null,
        walls: [],
        camera: {
            x: 0,
            y: 0,
            targetY: 0
        }
    };
    
    // Hide game over screen
    document.getElementById('game-over').style.display = 'none';
    
    // Reinitialize game
    initGame();
}

// Mobile detection and orientation handling
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
           ('ontouchstart' in window) || 
           (navigator.maxTouchPoints > 0);
}

// Handle orientation changes
function handleOrientationChange() {
    if (isMobileDevice()) {
        // Force a small delay to let CSS media queries apply
        setTimeout(() => {
            // Resize canvas if needed
            if (render && render.canvas) {
                const canvas = render.canvas;
                const container = canvas.parentElement;
                const containerRect = container.getBoundingClientRect();
                
                // Adjust canvas size based on container
                if (containerRect.width > 0 && containerRect.height > 0) {
                    canvas.style.width = Math.min(containerRect.width, 400) + 'px';
                    canvas.style.height = Math.min(containerRect.height * 0.6, 600) + 'px';
                }
            }
        }, 100);
    }
}

// Start the game when page loads
window.addEventListener('load', initGame);

// Handle orientation changes
window.addEventListener('orientationchange', handleOrientationChange);
window.addEventListener('resize', handleOrientationChange);

// Prevent zoom on double tap (mobile)
document.addEventListener('touchstart', function(event) {
    if (event.touches.length > 1) {
        event.preventDefault();
    }
});

let lastTouchEnd = 0;
document.addEventListener('touchend', function(event) {
    const now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
        event.preventDefault();
    }
    lastTouchEnd = now;
}, false);
