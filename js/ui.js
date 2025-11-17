/**
 * UI Module
 * Handles user interface updates, camera movement, particles, and visual feedback
 */

import { BLOCK_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT, CAMERA_TRIGGER_HEIGHT, CAMERA_SPEED, GROUND_Y, LANDING_PARTICLE_COUNT, MILESTONE_HEIGHTS } from './constants.js';
import { gameState } from './gameState.js';
import { engine, render, canvas } from './physics.js';
import { playSound } from './audio.js';

/**
 * Update camera position to follow the tower
 * Smoothly moves camera up as tower grows
 */
export function updateCamera() {
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

/**
 * Create particle effects when a piece lands
 * @param {number} x - X position for particles
 * @param {number} y - Y position for particles
 * @param {string} color - Color of the particles
 */
export function createLandingParticles(x, y, color) {
    // Reduce particle count in low performance mode
    const particleCount = gameState.performance.lowPerformanceMode 
        ? Math.floor(LANDING_PARTICLE_COUNT / 2) 
        : LANDING_PARTICLE_COUNT;
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

/**
 * Update and render all active particles
 * Applies gravity and removes dead particles
 */
export function updateParticles() {
    if (!canvas) return; // Canvas not available yet
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

/**
 * Trigger screen shake effect
 * Adds CSS class for visual feedback
 */
export function triggerScreenShake() {
    const gameContainer = document.querySelector('.game-container');
    if (!gameContainer) return;
    
    gameContainer.classList.add('shake');
    
    setTimeout(() => {
        if (gameContainer) {
            gameContainer.classList.remove('shake');
        }
    }, 500);
}

/**
 * Calculate tower stability percentage
 * Based on how well pieces are supported
 * @returns {number} Stability percentage (0-100)
 */
export function calculateStability() {
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
            
            // Calculate stability based on support
            supportScore = Math.min(100, supportCount * 30);
        }
        
        totalStability += supportScore;
        pieceCount++;
    });
    
    return pieceCount > 0 ? Math.round(totalStability / pieceCount) : 100;
}

/**
 * Calculate current tower height
 * Updates gameState.height based on highest piece
 * @returns {number} Current tower height in blocks
 */
function calculateTowerHeight() {
    if (gameState.pieces.length === 0) {
        gameState.height = 0;
        return 0;
    }
    
    let maxHeight = 0;
    gameState.pieces.forEach(piece => {
        if (piece !== gameState.currentPiece && piece.body) {
            const bounds = piece.body.bounds;
            const height = GROUND_Y - bounds.min.y;
            maxHeight = Math.max(maxHeight, height);
        }
    });
    
    gameState.height = Math.floor(maxHeight / BLOCK_SIZE);
    gameState.score = gameState.height * 100; // Update score based on height
    
    return gameState.height;
}

/**
 * Update all UI elements
 * Updates score, height, lives, stability, volume, and high scores
 */
export function updateUI() {
    // Calculate current tower height
    calculateTowerHeight();
    
    const scoreEl = document.getElementById('score');
    const heightEl = document.getElementById('height');
    const livesEl = document.getElementById('lives');
    const stabilityEl = document.getElementById('stability');
    const stabilityFill = document.getElementById('stability-fill');
    
    if (scoreEl) scoreEl.textContent = gameState.score;
    if (heightEl) heightEl.textContent = gameState.height;
    if (livesEl) livesEl.textContent = gameState.lives;
    
    // Update stability indicator
    const stability = calculateStability();
    if (stabilityEl) stabilityEl.textContent = stability + '%';
    if (stabilityFill) {
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
    
    // Update volume control
    const volumeSlider = document.getElementById('volume-slider');
    if (volumeSlider) {
        volumeSlider.value = gameState.volume * 100;
    }
    const volumeIcon = document.getElementById('volume-icon');
    if (volumeIcon) {
        volumeIcon.textContent = gameState.volume === 0 ? '🔇' : (gameState.volume < 0.5 ? '🔉' : '🔊');
    }
    
    // Update high score display
    updateHighScoreDisplay();
    
    // Check for milestones
    checkMilestones();
}

/**
 * Update high score display elements
 */
export function updateHighScoreDisplay() {
    const highScoreElement = document.getElementById('high-score');
    const highHeightElement = document.getElementById('high-height');
    
    if (highScoreElement) {
        highScoreElement.textContent = gameState.highScore;
    }
    if (highHeightElement) {
        highHeightElement.textContent = gameState.highHeight;
    }
}

/**
 * Check if any height milestones have been reached
 * Triggers milestone feedback when reached
 */
function checkMilestones() {
    const currentHeight = gameState.height;
    
    for (const milestone of MILESTONE_HEIGHTS) {
        if (currentHeight >= milestone && !gameState.milestonesReached.has(milestone)) {
            gameState.milestonesReached.add(milestone);
            showMilestoneFeedback(milestone);
        }
    }
}

/**
 * Show milestone achievement popup
 * @param {number} height - Height milestone reached
 */
function showMilestoneFeedback(height) {
    // Create milestone popup
    const popup = document.createElement('div');
    popup.className = 'milestone-popup';
    popup.innerHTML = `
        <div class="milestone-content">
            <h2>🎉 Milestone Reached!</h2>
            <p>${height} Blocks High</p>
        </div>
    `;
    
    document.body.appendChild(popup);
    
    // Trigger screen shake
    triggerScreenShake();
    
    // Play achievement sound
    playSound('achievement');
    
    // Remove popup after animation
    setTimeout(() => {
        popup.classList.add('fade-out');
        setTimeout(() => {
            if (popup.parentNode) {
                popup.parentNode.removeChild(popup);
            }
        }, 500);
    }, 2000);
}

