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
    },
    particles: [],
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
    
    // Optimized physics settings to reduce jittering
    engine.world.constraintIterations = 2;
    engine.world.positionIterations = 4;
    engine.world.velocityIterations = 2;
    
    // Reduce sleeping threshold to make pieces sleep faster
    Matter.Engine.update(engine, 16.666); // One frame worth of time
    engine.world.bodies.forEach(body => {
        if (body.sleepThreshold !== undefined) {
            body.sleepThreshold = 0.1; // Lower threshold for sleeping
        }
    });
    
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
            render: { fillStyle: '#8B4513' },
            label: 'ground' // Add label for debugging
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
                        friction: 0.8, // Higher friction to reduce sliding
                        restitution: 0, // No bouncing at all
                        density: 0.002, // Heavier blocks to reduce bouncing
                        frictionAir: 0.05, // More air resistance to dampen movement
                        frictionStatic: 1.0, // High static friction to prevent micro-movements
                        inertia: 2000, // Higher inertia to resist rotation
                        inverseInertia: 0.0005, // Lower inverse inertia for stability
                        sleepThreshold: 0.1 // Make pieces sleep faster
                    }
                );
                
                bodies.push(body);
            }
        }
    }
    
    // Create a compound body with stable properties
    const compound = Matter.Body.create({
        parts: bodies,
        render: { fillStyle: piece.color },
        friction: 0.8, // Higher friction to reduce sliding
        restitution: 0, // No bouncing at all
        density: 0.002, // Heavier blocks to reduce bouncing
        frictionAir: 0.05, // More air resistance to dampen movement
        frictionStatic: 1.0, // High static friction to prevent micro-movements
        inertia: 2000, // Higher inertia to resist rotation
        inverseInertia: 0.0005, // Lower inverse inertia for stability
        sleepThreshold: 0.1 // Make pieces sleep faster
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
    
    // Always use half-step movement for precise control
    const moveDistance = BLOCK_SIZE / 2;
    
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
    
    // Play movement sound
    playSound('move');
    
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
    
    // Screen shake on life loss
    triggerScreenShake();
    
    // Play sound effect
    playSound('lose');
    
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

// Calculate tower stability
function calculateStability() {
    if (gameState.pieces.length === 0) return 100;
    
    let totalStability = 0;
    let pieceCount = 0;
    
    gameState.pieces.forEach(piece => {
        if (piece === gameState.currentPiece) return; // Skip current piece
        
        const body = piece.body;
        const bounds = body.bounds;
        
        // Check how well supported this piece is
        let supportScore = 0;
        
        // Check if piece is on the ground
        if (bounds.max.y >= GROUND_Y - 5) {
            supportScore = 100; // Fully supported by ground
        } else {
            // Check support from other pieces
            const contacts = Matter.Query.region(engine.world.bodies, bounds);
            let supportCount = 0;
            
            contacts.forEach(contact => {
                if (contact === body) return;
                if (contact === gameState.ground || gameState.walls.includes(contact)) return;
                
                const contactBounds = contact.bounds;
                // Check if this contact is supporting the piece
                if (contactBounds.max.y >= bounds.min.y - 5 && 
                    contactBounds.min.y <= bounds.max.y + 5) {
                    supportCount++;
                }
            });
            
            supportScore = Math.min(100, supportCount * 25); // Each support adds 25%
        }
        
        totalStability += supportScore;
        pieceCount++;
    });
    
    return pieceCount > 0 ? Math.round(totalStability / pieceCount) : 100;
}

// Update UI elements
function updateUI() {
    document.getElementById('score').textContent = gameState.score;
    document.getElementById('height').textContent = gameState.height;
    document.getElementById('lives').textContent = gameState.lives;
    
    // Update stability indicator
    const stability = calculateStability();
    document.getElementById('stability').textContent = stability + '%';
    const stabilityFill = document.getElementById('stability-fill');
    stabilityFill.style.width = stability + '%';
    
    // Change color based on stability
    if (stability >= 80) {
        stabilityFill.style.background = 'linear-gradient(90deg, #32cd32, #228b22)';
    } else if (stability >= 50) {
        stabilityFill.style.background = 'linear-gradient(90deg, #ffa500, #ff8c00)';
    } else {
        stabilityFill.style.background = 'linear-gradient(90deg, #ff6b6b, #dc143c)';
    }
}

// Setup controls
function setupControls() {
    // Keyboard controls
    document.addEventListener('keydown', (e) => {
        if (gameState.gameOver) return;
        
        switch (e.code) {
            case 'ArrowLeft':
                e.preventDefault();
                movePiece('left'); // Half step left
                break;
            case 'ArrowRight':
                e.preventDefault();
                movePiece('right'); // Half step right
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
    
    // More lenient velocity check - allow some movement
    if (Math.abs(velocity.y) < 0.2 && Math.abs(velocity.x) < 0.2) {
        let hasLanded = false;
        
        // Method 1: Check collision with ground first (most important)
        const groundCollision = Matter.Collision.collides(body, gameState.ground);
        if (groundCollision && groundCollision.collided) {
            // For rotated pieces, check if any vertex of the piece is touching the ground
            if (isPieceTouchingGround(body, groundCollision)) {
                hasLanded = true;
                console.log('Piece landed on ground via direct collision!');
            }
        }
        
        // Method 2: Check collision with other pieces
        if (!hasLanded) {
            for (let piece of gameState.pieces) {
                if (piece === gameState.currentPiece) continue;
                
                const otherBody = piece.body;
                const collision = Matter.Collision.collides(body, otherBody);
                
                if (collision && collision.collided) {
                    // For rotated pieces, check if current piece is truly above the other piece
                    if (isPieceAboveOther(body, otherBody, collision)) {
                        hasLanded = true;
                        console.log('Piece landed on another piece via collision!');
                        break;
                    }
                }
            }
        }
        
        // Method 3: Fallback - check if piece is near the ground (bounds check)
        if (!hasLanded) {
            const currentBottom = body.bounds.max.y;
            const groundTop = gameState.ground.bounds.min.y;
            
            // Check if piece is very close to or touching the ground
            if (currentBottom >= groundTop - 10 && currentBottom <= groundTop + 15) {
                // Check if piece is horizontally over the platform
                const platformLeft = PLATFORM_CENTER_X - PLATFORM_WIDTH / 2;
                const platformRight = PLATFORM_CENTER_X + PLATFORM_WIDTH / 2;
                const currentLeft = body.bounds.min.x;
                const currentRight = body.bounds.max.x;
                
                if (currentRight >= platformLeft && currentLeft <= platformRight) {
                    hasLanded = true;
                    console.log('Piece landed on ground via bounds check!');
                }
            }
        }
        
        
        // If piece has landed, trigger next piece spawn
        if (hasLanded) {
            // Mark piece as landed to prevent multiple spawns
            gameState.currentPiece.hasLanded = true;
            
            // Create landing particles
            createLandingParticles(body.position.x, body.position.y, gameState.currentPiece.color);
            
            // Play landing sound
            playSound('land');
            
            
            // Spawn next piece immediately
            gameState.currentPiece = null;
            setTimeout(() => {
                spawnNewPiece();
            }, 300);
        }
    }
}

// Helper function to check if a rotated piece is truly touching the ground
function isPieceTouchingGround(body, collision) {
    if (!collision || !collision.collided) return false;
    
    // Get the vertices of the current piece
    const vertices = body.vertices;
    const groundTop = gameState.ground.bounds.min.y;
    
    // Check if any vertex is close to the ground level
    for (let vertex of vertices) {
        if (Math.abs(vertex.y - groundTop) <= 15) {
            // Check if this vertex is horizontally over the platform
            const platformLeft = PLATFORM_CENTER_X - PLATFORM_WIDTH / 2;
            const platformRight = PLATFORM_CENTER_X + PLATFORM_WIDTH / 2;
            
            if (vertex.x >= platformLeft && vertex.x <= platformRight) {
                return true;
            }
        }
    }
    
    return false;
}

// Helper function to check if current piece is touching another piece (any side)
function isPieceAboveOther(currentBody, otherBody, collision) {
    if (!collision || !collision.collided) return false;
    
    // Get vertices of both bodies
    const currentVertices = currentBody.vertices;
    const otherVertices = otherBody.vertices;
    
    // Check for contact from any direction (top, sides, or bottom)
    const contactTolerance = 15; // pixels
    
    // Find the extremes of both pieces
    let currentMinX = Infinity, currentMaxX = -Infinity;
    let currentMinY = Infinity, currentMaxY = -Infinity;
    let otherMinX = Infinity, otherMaxX = -Infinity;
    let otherMinY = Infinity, otherMaxY = -Infinity;
    
    for (let vertex of currentVertices) {
        currentMinX = Math.min(currentMinX, vertex.x);
        currentMaxX = Math.max(currentMaxX, vertex.x);
        currentMinY = Math.min(currentMinY, vertex.y);
        currentMaxY = Math.max(currentMaxY, vertex.y);
    }
    
    for (let vertex of otherVertices) {
        otherMinX = Math.min(otherMinX, vertex.x);
        otherMaxX = Math.max(otherMaxX, vertex.x);
        otherMinY = Math.min(otherMinY, vertex.y);
        otherMaxY = Math.max(otherMaxY, vertex.y);
    }
    
    // Check for contact from different directions
    let hasContact = false;
    
    // Check if current piece is landing on top of the other piece
    if (currentMinY >= otherMaxY - contactTolerance && currentMinY <= otherMaxY + contactTolerance) {
        // Check if there's horizontal overlap
        if (!(currentMaxX < otherMinX - contactTolerance || currentMinX > otherMaxX + contactTolerance)) {
            hasContact = true;
            console.log('Contact detected: landing on top');
        }
    }
    
    // Check if current piece is landing on the left side of the other piece
    if (!hasContact && currentMaxX >= otherMinX - contactTolerance && currentMaxX <= otherMinX + contactTolerance) {
        // Check if there's vertical overlap
        if (!(currentMaxY < otherMinY - contactTolerance || currentMinY > otherMaxY + contactTolerance)) {
            hasContact = true;
            console.log('Contact detected: landing on left side');
        }
    }
    
    // Check if current piece is landing on the right side of the other piece
    if (!hasContact && currentMinX >= otherMaxX - contactTolerance && currentMinX <= otherMaxX + contactTolerance) {
        // Check if there's vertical overlap
        if (!(currentMaxY < otherMinY - contactTolerance || currentMinY > otherMaxY + contactTolerance)) {
            hasContact = true;
            console.log('Contact detected: landing on right side');
        }
    }
    
    // Check if current piece is landing below the other piece (rare but possible)
    if (!hasContact && currentMaxY >= otherMinY - contactTolerance && currentMaxY <= otherMinY + contactTolerance) {
        // Check if there's horizontal overlap
        if (!(currentMaxX < otherMinX - contactTolerance || currentMinX > otherMaxX + contactTolerance)) {
            hasContact = true;
            console.log('Contact detected: landing below');
        }
    }
    
    return hasContact;
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

// Create landing particles
function createLandingParticles(x, y, color) {
    const particleCount = 8;
    for (let i = 0; i < particleCount; i++) {
        const angle = (Math.PI * 2 * i) / particleCount;
        const speed = 2 + Math.random() * 3;
        const life = 30 + Math.random() * 20;
        
        gameState.particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: life,
            maxLife: life,
            color: color,
            size: 3 + Math.random() * 2
        });
    }
}

// Update and render particles
function updateParticles() {
    const ctx = canvas.getContext('2d');
    
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
        const particle = gameState.particles[i];
        
        // Update particle
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.1; // Gravity
        particle.life--;
        
        // Remove dead particles
        if (particle.life <= 0) {
            gameState.particles.splice(i, 1);
            continue;
        }
        
        // Render particle
        const alpha = particle.life / particle.maxLife;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}


// Sound system
function playSound(type) {
    // Create audio context if it doesn't exist
    if (!window.audioContext) {
        window.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    const ctx = window.audioContext;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    // Different sounds for different actions
    switch (type) {
        case 'land':
            oscillator.frequency.setValueAtTime(440, ctx.currentTime); // A4
            oscillator.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 0.1);
            break;
            
        case 'lose':
            oscillator.frequency.setValueAtTime(200, ctx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3);
            gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 0.3);
            break;
            
        case 'achievement':
            // Play a pleasant chord
            const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5
            frequencies.forEach((freq, index) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.frequency.setValueAtTime(freq, ctx.currentTime + index * 0.1);
                gain.gain.setValueAtTime(0.1, ctx.currentTime + index * 0.1);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5 + index * 0.1);
                osc.start(ctx.currentTime + index * 0.1);
                osc.stop(ctx.currentTime + 0.5 + index * 0.1);
            });
            break;
            
        case 'move':
            oscillator.frequency.setValueAtTime(800, ctx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.05);
            gainNode.gain.setValueAtTime(0.05, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 0.05);
            break;
    }
}

// Screen shake effect
function triggerScreenShake() {
    const gameContainer = document.querySelector('.game-container');
    gameContainer.classList.add('shake');
    
    setTimeout(() => {
        gameContainer.classList.remove('shake');
    }, 500);
}

// Game loop
function gameLoop() {
    if (!gameState.gameOver) {
        // Update camera to follow tower height
        updateCamera();
        
        // Update particles
        updateParticles();
        
        // Update UI (including stability)
        updateUI();
        
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
        },
        particles: [],
        achievements: [],
        milestones: [10, 25, 50, 100, 150, 200, 300, 500]
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
window.addEventListener('load', () => {
    initGame();
    // Dispatch game ready event for splash screen
    setTimeout(() => {
        window.dispatchEvent(new CustomEvent('gameReady'));
    }, 1000); // Give game 1 second to fully initialize
});

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
