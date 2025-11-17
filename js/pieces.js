/**
 * Pieces Module
 * Handles tetromino generation, creation, movement, and rendering
 */

import { TETROMINOES, BLOCK_SIZE, CANVAS_WIDTH, SPAWN_X, SPAWN_Y, MOVE_COOLDOWN, ROTATE_COOLDOWN } from './constants.js';
import { gameState } from './gameState.js';
import { world, engine, nextCanvas } from './physics.js';
import { playSound } from './audio.js';

/**
 * Generate a random tetromino piece
 * @returns {Object} Piece object with type, shape, and color
 */
export function generateRandomPiece() {
    const types = Object.keys(TETROMINOES);
    const type = types[Math.floor(Math.random() * types.length)];
    return {
        type: type,
        ...TETROMINOES[type]
    };
}

/**
 * Create a Matter.js physics body for a tetromino
 * @param {Object} piece - Piece object with shape and color
 * @param {number} x - X position
 * @param {number} y - Y position
 * @returns {Matter.Body} Compound body representing the tetromino
 */
export function createTetrominoBody(piece, x, y) {
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
                        friction: 0.8, // High friction for stability
                        restitution: 0, // No bouncing
                        density: 0.002, // Heavier blocks for stability
                        frictionAir: 0.05, // Air resistance
                        frictionStatic: 1.0, // High static friction
                        inertia: 2000, // High inertia to resist rotation
                        inverseInertia: 0.0005, // Low inverse inertia
                        sleepThreshold: 0.15, // Sleep when settled
                        slop: 0.05, // Collision slop for better stability
                        chamfer: { radius: 0 } // No chamfering for precise collisions
                    }
                );
                
                bodies.push(body);
            }
        }
    }
    
    // Create a compound body with enhanced stable properties
    const compound = Matter.Body.create({
        parts: bodies,
        render: { fillStyle: piece.color },
        friction: 0.8, // High friction for stability
        restitution: 0, // No bouncing
        density: 0.002, // Consistent density
        frictionAir: 0.05, // Air resistance
        frictionStatic: 1.0, // High static friction
        inertia: 2000, // High inertia to resist unwanted rotation
        inverseInertia: 0.0005, // Low inverse inertia
        sleepThreshold: 0.15, // Sleep when settled
        slop: 0.05, // Collision slop for stability
        chamfer: { radius: 0 }, // No chamfering
        // Enhanced collision properties
        collisionFilter: {
            group: 0, // Default group
            category: 0x0001, // Piece category
            mask: 0xFFFF // Collide with everything
        }
    });
    
    // Ensure compound body is initially awake
    // Use direct property access for compatibility
    if (Matter.Sleeping && typeof Matter.Sleeping.set === 'function') {
        Matter.Sleeping.set(compound, false);
    } else {
        compound.isSleeping = false;
    }
    
    return compound;
}

/**
 * Find a safe spawn position that doesn't overlap with existing pieces
 * Adjusts spawn position based on camera offset
 * @returns {{x: number, y: number}} Safe spawn coordinates
 */
export function findSafeSpawnPosition() {
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

/**
 * Spawn a new piece into the game
 * Creates physics body and adds it to the world
 */
export function spawnNewPiece() {
    if (gameState.gameOver) return;
    
    try {
        const piece = gameState.nextPiece;
        
        // Find a safe spawn position
        const spawnPos = findSafeSpawnPosition();
        
        gameState.currentPiece = {
            body: createTetrominoBody(piece, spawnPos.x, spawnPos.y),
            type: piece.type,
            color: piece.color,
            hasLanded: false
        };
        
        Matter.World.add(world, gameState.currentPiece.body);
        gameState.pieces.push(gameState.currentPiece);
        
        // Generate next piece
        gameState.nextPiece = generateRandomPiece();
        drawNextPiece();
    } catch (error) {
        console.error('Error spawning piece:', error);
        gameState.currentPiece = null;
    }
}

/**
 * Draw the next piece preview on the next piece canvas
 */
export function drawNextPiece() {
    if (!nextCanvas) return; // Canvas not available yet
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

/**
 * Move the current piece left or right
 * Uses half-step movement for precise control
 * @param {string} direction - 'left' or 'right'
 */
export function movePiece(direction) {
    if (!gameState.currentPiece || gameState.gameOver) return;
    
    const body = gameState.currentPiece.body;
    
    // Wake up piece if it's sleeping
    const isSleeping = (Matter.Sleeping && typeof Matter.Sleeping.get === 'function') 
        ? Matter.Sleeping.get(body) 
        : body.isSleeping === true;
    
    if (isSleeping) {
        if (Matter.Sleeping && typeof Matter.Sleeping.set === 'function') {
            Matter.Sleeping.set(body, false);
        } else {
            body.isSleeping = false;
        }
    }
    
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
    
    // Enhanced movement with better physics integration
    // Use translate for smoother movement that respects physics
    const deltaX = newX - currentPos.x;
    Matter.Body.translate(body, { x: deltaX, y: 0 });
    
    // Dampen any unwanted velocity from movement while preserving vertical velocity
    Matter.Body.setVelocity(body, { 
        x: body.velocity.x * 0.3, // Dampen horizontal velocity
        y: body.velocity.y // Preserve vertical velocity
    });
    
    // Clear angular velocity to prevent unwanted rotation
    Matter.Body.setAngularVelocity(body, 0);
    
    // Play movement sound
    playSound('move');
    
    // Add slight delay to prevent rapid movement
    if (!body.userData || !body.userData.moveCooldown) {
        body.userData = { moveCooldown: true };
        setTimeout(() => {
            if (body.userData) body.userData.moveCooldown = false;
        }, MOVE_COOLDOWN);
    }
}

/**
 * Rotate the current piece 90 degrees clockwise
 * Includes cooldown to prevent rapid spinning
 */
export function rotatePiece() {
    if (!gameState.currentPiece || gameState.gameOver) return;
    
    const body = gameState.currentPiece.body;
    
    // Wake up piece if it's sleeping
    const isSleeping = (Matter.Sleeping && typeof Matter.Sleeping.get === 'function') 
        ? Matter.Sleeping.get(body) 
        : body.isSleeping === true;
    
    if (isSleeping) {
        if (Matter.Sleeping && typeof Matter.Sleeping.set === 'function') {
            Matter.Sleeping.set(body, false);
        } else {
            body.isSleeping = false;
        }
    }
    
    // Add rotation cooldown to prevent rapid spinning
    if (!body.userData || !body.userData.rotateCooldown) {
        body.userData = { ...body.userData, rotateCooldown: true };
        
        // Enhanced rotation - rotate around center of mass
        Matter.Body.rotate(body, Math.PI / 2);
        
        // Dampen any velocity changes from rotation
        Matter.Body.setVelocity(body, {
            x: body.velocity.x * 0.8,
            y: body.velocity.y
        });
        
        // Clear angular velocity after rotation
        Matter.Body.setAngularVelocity(body, 0);
        
        setTimeout(() => {
            if (body.userData) body.userData.rotateCooldown = false;
        }, ROTATE_COOLDOWN);
    }
}

/**
 * Drop the current piece faster by applying downward velocity
 */
export function dropPiece() {
    if (!gameState.currentPiece || gameState.gameOver) return;
    
    const body = gameState.currentPiece.body;
    
    // Wake up piece if it's sleeping
    const isSleeping = (Matter.Sleeping && typeof Matter.Sleeping.get === 'function') 
        ? Matter.Sleeping.get(body) 
        : body.isSleeping === true;
    
    if (isSleeping) {
        if (Matter.Sleeping && typeof Matter.Sleeping.set === 'function') {
            Matter.Sleeping.set(body, false);
        } else {
            body.isSleeping = false;
        }
    }
    
    // Apply moderate downward velocity for strategic dropping
    // Preserve horizontal velocity but increase downward velocity
    Matter.Body.setVelocity(body, { 
        x: body.velocity.x * 0.9, // Slight horizontal damping
        y: Math.max(body.velocity.y, 2) // Ensure minimum drop speed
    });
}

