/**
 * Collision Detection Module
 * Handles piece landing detection, fall detection, and life management
 */

import { VELOCITY_THRESHOLD, GROUND_CONTACT_TOLERANCE, PIECE_CONTACT_TOLERANCE, PLATFORM_CENTER_X, PLATFORM_WIDTH, GROUND_Y, SPAWN_DELAY } from './constants.js';
import { gameState } from './gameState.js';
import { engine, world } from './physics.js';
import { spawnNewPiece } from './pieces.js';
import { createLandingParticles } from './ui.js';
import { playSound } from './audio.js';

/**
 * Setup collision detection event listeners
 * Monitors piece landing and falling off platform
 * Uses enhanced collision detection methods
 */
export function setupCollisionDetection() {
    // Enhanced collision detection using collisionStart event for immediate detection
    Matter.Events.on(engine, 'collisionStart', (event) => {
        if (!gameState.currentPiece || gameState.currentPiece.hasLanded) return;
        
        const pairs = event.pairs;
        const currentBody = gameState.currentPiece.body;
        
        for (let pair of pairs) {
            const bodyA = pair.bodyA;
            const bodyB = pair.bodyB;
            
            // Check if current piece is involved in collision
            if (bodyA === currentBody || bodyB === currentBody) {
                const otherBody = (bodyA === currentBody) ? bodyB : bodyA;
                
                // Check collision with ground
                if (otherBody === gameState.ground) {
                    if (validateGroundCollision(currentBody, pair)) {
                        handlePieceLanded();
                        return;
                    }
                }
                // Check collision with other pieces
                else if (gameState.pieces.some(p => p !== gameState.currentPiece && p.body === otherBody)) {
                    if (validatePieceCollision(currentBody, otherBody, pair)) {
                        handlePieceLanded();
                        return;
                    }
                }
            }
        }
    });
    
    // Also check in afterUpdate for fallback detection
    Matter.Events.on(engine, 'afterUpdate', () => {
        if (gameState.currentPiece) {
            checkPieceFell();
            // Fallback landing detection if collisionStart didn't catch it
            if (!gameState.currentPiece.hasLanded) {
                checkPieceLanded();
            }
        }
        // Check all previously dropped pieces for falling off
        checkAllPiecesFell();
    });
}

/**
 * Check if the current piece has fallen off the platform
 * Triggers life loss if piece falls below ground or through sides
 */
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

/**
 * Check if any previously dropped pieces have fallen off
 * Removes fallen pieces and triggers life loss
 */
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

/**
 * Validate ground collision using contact points
 * More accurate than simple collision check
 * @param {Matter.Body} body - Current piece body
 * @param {Object} pair - Collision pair from Matter.js
 * @returns {boolean} True if valid ground collision
 */
function validateGroundCollision(body, pair) {
    if (!pair || !pair.collision) return false;
    
    const contacts = pair.collision.supports || [];
    const groundTop = gameState.ground.bounds.min.y;
    const platformLeft = PLATFORM_CENTER_X - PLATFORM_WIDTH / 2;
    const platformRight = PLATFORM_CENTER_X + PLATFORM_WIDTH / 2;
    
    // Check if any contact point is on the ground and over the platform
    for (let contact of contacts) {
        const contactY = contact.y;
        const contactX = contact.x;
        
        // Check if contact is near ground level
        if (Math.abs(contactY - groundTop) <= GROUND_CONTACT_TOLERANCE) {
            // Check if contact is over the platform
            if (contactX >= platformLeft && contactX <= platformRight) {
                // Additional check: piece should be moving down or stationary
                if (body.velocity.y >= -0.3) {
                    return true;
                }
            }
        }
    }
    
    // Fallback: check vertices
    return isPieceTouchingGround(body, { collided: true });
}

/**
 * Validate piece-to-piece collision using contact points
 * @param {Matter.Body} currentBody - Current piece body
 * @param {Matter.Body} otherBody - Other piece body
 * @param {Object} pair - Collision pair from Matter.js
 * @returns {boolean} True if valid piece collision
 */
function validatePieceCollision(currentBody, otherBody, pair) {
    if (!pair || !pair.collision) return false;
    
    const contacts = pair.collision.supports || [];
    const currentBounds = currentBody.bounds;
    const otherBounds = otherBody.bounds;
    
    // Check contact points for valid landing
    for (let contact of contacts) {
        const contactY = contact.y;
        
        // Check if contact is near the top of the other piece (landing on top)
        if (Math.abs(contactY - otherBounds.max.y) <= PIECE_CONTACT_TOLERANCE) {
            // Check if current piece is above the other piece
            if (currentBounds.min.y >= otherBounds.max.y - PIECE_CONTACT_TOLERANCE) {
                // Check horizontal overlap
                if (!(currentBounds.max.x < otherBounds.min.x || currentBounds.min.x > otherBounds.max.x)) {
                    // Additional check: piece should be moving down or stationary
                    if (currentBody.velocity.y >= -0.3) {
                        return true;
                    }
                }
            }
        }
        
        // Check side collisions (for side landing)
        const contactX = contact.x;
        if (Math.abs(contactX - otherBounds.min.x) <= PIECE_CONTACT_TOLERANCE ||
            Math.abs(contactX - otherBounds.max.x) <= PIECE_CONTACT_TOLERANCE) {
            // Check vertical overlap
            if (!(currentBounds.max.y < otherBounds.min.y || currentBounds.min.y > otherBounds.max.y)) {
                if (currentBody.velocity.y >= -0.3) {
                    return true;
                }
            }
        }
    }
    
    // Fallback: use existing detection method
    return isPieceAboveOther(currentBody, otherBody, { collided: true });
}

/**
 * Handle piece landing - centralized landing handler
 */
function handlePieceLanded() {
    if (!gameState.currentPiece || gameState.currentPiece.hasLanded) return;
    
    const body = gameState.currentPiece.body;
    
    // Mark piece as landed to prevent multiple spawns
    gameState.currentPiece.hasLanded = true;
    
    // Optimize the settled piece (put to sleep for performance)
    setTimeout(() => {
        if (body && !body.isStatic) {
            // Use compatible sleep API
            if (Matter.Sleeping && typeof Matter.Sleeping.set === 'function') {
                Matter.Sleeping.set(body, true);
            } else {
                body.isSleeping = true;
            }
        }
    }, 500); // Wait a bit before sleeping to ensure it's settled
    
    // Create landing particles
    createLandingParticles(body.position.x, body.position.y, gameState.currentPiece.color);
    
    // Play landing sound
    playSound('land');
    
    // Spawn next piece
    gameState.currentPiece = null;
    setTimeout(() => {
        spawnNewPiece();
    }, SPAWN_DELAY);
}

/**
 * Check if the current piece has landed on ground or another piece
 * Enhanced fallback detection method
 * Uses multiple detection methods for reliability
 */
function checkPieceLanded() {
    if (!gameState.currentPiece || gameState.currentPiece.hasLanded) return;
    
    const body = gameState.currentPiece.body;
    const velocity = body.velocity;
    
    // Enhanced velocity check - more lenient for slow strategic gameplay
    const velocityMagnitude = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
    if (velocityMagnitude < VELOCITY_THRESHOLD) {
        let hasLanded = false;
        
        // Method 1: Enhanced collision check with ground
        const groundCollision = Matter.Collision.collides(body, gameState.ground);
        if (groundCollision && groundCollision.collided) {
            if (isPieceTouchingGround(body, groundCollision)) {
                hasLanded = true;
            }
        }
        
        // Method 2: Enhanced collision check with other pieces
        if (!hasLanded) {
            for (let piece of gameState.pieces) {
                if (piece === gameState.currentPiece) continue;
                
                const otherBody = piece.body;
                const collision = Matter.Collision.collides(body, otherBody);
                
                if (collision && collision.collided) {
                    if (isPieceAboveOther(body, otherBody, collision)) {
                        hasLanded = true;
                        break;
                    }
                }
            }
        }
        
        // Method 3: Enhanced bounds check with better tolerance
        if (!hasLanded) {
            const currentBottom = body.bounds.max.y;
            const groundTop = gameState.ground.bounds.min.y;
            
            // More accurate bounds check
            if (currentBottom >= groundTop - 5 && currentBottom <= groundTop + GROUND_CONTACT_TOLERANCE) {
                const platformLeft = PLATFORM_CENTER_X - PLATFORM_WIDTH / 2;
                const platformRight = PLATFORM_CENTER_X + PLATFORM_WIDTH / 2;
                const currentLeft = body.bounds.min.x;
                const currentRight = body.bounds.max.x;
                
                // Check horizontal overlap with better tolerance
                if (currentRight >= platformLeft - 5 && currentLeft <= platformRight + 5) {
                    // Additional check: piece should be relatively stationary
                    if (velocityMagnitude < VELOCITY_THRESHOLD * 0.7) {
                        hasLanded = true;
                    }
                }
            }
        }
        
        // If piece has landed, trigger next piece spawn
        if (hasLanded) {
            handlePieceLanded();
        }
    }
}

/**
 * Check if a rotated piece is truly touching the ground
 * Enhanced vertex-based detection for rotated pieces
 * @param {Matter.Body} body - The piece body to check
 * @param {Object} collision - Collision data from Matter.js
 * @returns {boolean} True if piece is touching ground
 */
function isPieceTouchingGround(body, collision) {
    if (!collision || !collision.collided) return false;
    
    // Get the vertices of the current piece
    const vertices = body.vertices;
    const groundTop = gameState.ground.bounds.min.y;
    const platformLeft = PLATFORM_CENTER_X - PLATFORM_WIDTH / 2;
    const platformRight = PLATFORM_CENTER_X + PLATFORM_WIDTH / 2;
    
    // Count vertices touching the ground
    let touchingVertices = 0;
    let totalVertices = 0;
    
    for (let vertex of vertices) {
        totalVertices++;
        const distanceToGround = Math.abs(vertex.y - groundTop);
        
        // Check if vertex is close to ground level
        if (distanceToGround <= GROUND_CONTACT_TOLERANCE) {
            // Check if this vertex is horizontally over the platform
            if (vertex.x >= platformLeft && vertex.x <= platformRight) {
                touchingVertices++;
            }
        }
    }
    
    // Require at least one vertex touching, or if piece is very close
    if (touchingVertices > 0) return true;
    
    // Fallback: check if bottom of piece is very close to ground
    const bodyBottom = body.bounds.max.y;
    if (bodyBottom >= groundTop - 3 && bodyBottom <= groundTop + GROUND_CONTACT_TOLERANCE) {
        const bodyLeft = body.bounds.min.x;
        const bodyRight = body.bounds.max.x;
        if (bodyRight >= platformLeft && bodyLeft <= platformRight) {
            return true;
        }
    }
    
    return false;
}

/**
 * Check if current piece is touching another piece from any direction
 * Enhanced detection with better contact point analysis
 * @param {Matter.Body} currentBody - Current piece body
 * @param {Matter.Body} otherBody - Other piece body
 * @param {Object} collision - Collision data from Matter.js
 * @returns {boolean} True if pieces are in contact
 */
function isPieceAboveOther(currentBody, otherBody, collision) {
    if (!collision || !collision.collided) return false;
    
    // Enhanced detection using collision supports if available
    if (collision.supports && collision.supports.length > 0) {
        const supports = collision.supports;
        const currentBounds = currentBody.bounds;
        const otherBounds = otherBody.bounds;
        
        // Analyze contact points
        for (let support of supports) {
            const supportY = support.y;
            const supportX = support.x;
            
            // Check if contact is on top of other piece
            if (Math.abs(supportY - otherBounds.max.y) <= PIECE_CONTACT_TOLERANCE) {
                if (currentBounds.min.y <= otherBounds.max.y + PIECE_CONTACT_TOLERANCE) {
                    return true;
                }
            }
            
            // Check side contacts
            if (Math.abs(supportX - otherBounds.min.x) <= PIECE_CONTACT_TOLERANCE ||
                Math.abs(supportX - otherBounds.max.x) <= PIECE_CONTACT_TOLERANCE) {
                // Check vertical overlap for side contact
                if (!(currentBounds.max.y < otherBounds.min.y || currentBounds.min.y > otherBounds.max.y)) {
                    return true;
                }
            }
        }
    }
    
    // Fallback to vertex-based detection
    const currentVertices = currentBody.vertices;
    const otherVertices = otherBody.vertices;
    const contactTolerance = PIECE_CONTACT_TOLERANCE;
    
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
    
    // Enhanced contact detection with better overlap calculation
    let hasContact = false;
    
    // Check if current piece is landing on top of the other piece (most common)
    const verticalGap = currentMinY - otherMaxY;
    if (verticalGap >= -contactTolerance && verticalGap <= contactTolerance) {
        // Calculate horizontal overlap percentage
        const overlapLeft = Math.max(currentMinX, otherMinX);
        const overlapRight = Math.min(currentMaxX, otherMaxX);
        const overlapWidth = Math.max(0, overlapRight - overlapLeft);
        const currentWidth = currentMaxX - currentMinX;
        
        // Require at least 20% horizontal overlap for valid contact
        if (overlapWidth > 0 && (overlapWidth / currentWidth) > 0.2) {
            hasContact = true;
        }
    }
    
    // Check side contacts with improved detection
    if (!hasContact) {
        // Left side contact
        const leftGap = currentMaxX - otherMinX;
        if (leftGap >= -contactTolerance && leftGap <= contactTolerance) {
            const overlapTop = Math.max(currentMinY, otherMinY);
            const overlapBottom = Math.min(currentMaxY, otherMaxY);
            const overlapHeight = Math.max(0, overlapBottom - overlapTop);
            const currentHeight = currentMaxY - currentMinY;
            
            if (overlapHeight > 0 && (overlapHeight / currentHeight) > 0.2) {
                hasContact = true;
            }
        }
        
        // Right side contact
        if (!hasContact) {
            const rightGap = currentMinX - otherMaxX;
            if (rightGap >= -contactTolerance && rightGap <= contactTolerance) {
                const overlapTop = Math.max(currentMinY, otherMinY);
                const overlapBottom = Math.min(currentMaxY, otherMaxY);
                const overlapHeight = Math.max(0, overlapBottom - overlapTop);
                const currentHeight = currentMaxY - currentMinY;
                
                if (overlapHeight > 0 && (overlapHeight / currentHeight) > 0.2) {
                    hasContact = true;
                }
            }
        }
    }
    
    return hasContact;
}


/**
 * Dependency injection to avoid circular dependencies
 * Functions from game.js are injected here
 */
let gameOverFn, triggerScreenShakeFn, updateUIFn;

/**
 * Set game functions for collision module
 * @param {Object} fns - Object containing game functions
 * @param {Function} fns.gameOver - Game over handler
 * @param {Function} fns.triggerScreenShake - Screen shake handler
 * @param {Function} fns.updateUI - UI update handler
 */
export function setGameFunctions(fns) {
    gameOverFn = fns.gameOver;
    triggerScreenShakeFn = fns.triggerScreenShake;
    updateUIFn = fns.updateUI;
}

/**
 * Handle life loss
 * Decrements lives, plays sound, and triggers game over if no lives remain
 */
function loseLife() {
    gameState.lives--;
    
    // Screen shake on life loss
    if (triggerScreenShakeFn) triggerScreenShakeFn();
    
    // Play sound effect
    playSound('lose');
    
    if (gameState.lives <= 0) {
        if (gameOverFn) gameOverFn();
    } else {
        // Spawn new piece after a longer delay for strategic planning
        setTimeout(() => {
            spawnNewPiece();
        }, 2000);
    }
}

