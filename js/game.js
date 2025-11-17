/**
 * Main Game Module
 * Orchestrates all game modules and manages the game loop
 */

import { gameState, loadGameState, resetGameState } from './gameState.js';
import { initPhysics, engine, enableLowPerformanceMode, disableLowPerformanceMode } from './physics.js';
import { generateRandomPiece, spawnNewPiece, drawNextPiece } from './pieces.js';
import { setupCollisionDetection, setGameFunctions } from './collision.js';
import { setupControls } from './controls.js';
import { updateUI, updateCamera, updateParticles, triggerScreenShake } from './ui.js';
import { showTutorial } from './tutorial.js';
import { playSound } from './audio.js';
import { BLOCK_SIZE, GROUND_Y } from './constants.js';

/**
 * Toggle game pause state
 * Stops/starts physics engine and shows/hides pause overlay
 */
export function togglePause() {
    gameState.isPaused = !gameState.isPaused;
    
    const pauseOverlay = document.getElementById('pause-overlay');
    
    if (gameState.isPaused) {
        Matter.Engine.stop(engine);
        if (pauseOverlay) pauseOverlay.style.display = 'flex';
    } else {
        Matter.Engine.run(engine);
        if (pauseOverlay) pauseOverlay.style.display = 'none';
    }
    
    updateUI();
}

/**
 * Update performance metrics and adjust quality settings
 * Monitors FPS and enables/disables low performance mode
 */
function updatePerformance() {
    const now = performance.now();
    const delta = now - gameState.performance.lastTime;
    
    gameState.performance.frameCount++;
    
    // Calculate FPS every second
    if (delta >= 1000) {
        gameState.performance.fps = Math.round((gameState.performance.frameCount * 1000) / delta);
        gameState.performance.frameCount = 0;
        gameState.performance.lastTime = now;
        
        // Enable low performance mode if FPS drops below 30
        if (gameState.performance.fps < 30 && !gameState.performance.lowPerformanceMode) {
            gameState.performance.lowPerformanceMode = true;
            enableLowPerformanceMode();
        } else if (gameState.performance.fps >= 45 && gameState.performance.lowPerformanceMode) {
            gameState.performance.lowPerformanceMode = false;
            disableLowPerformanceMode();
        }
    }
}

/**
 * Main game loop
 * Updates performance, camera, particles, and UI every frame
 */
function gameLoop() {
    if (!gameState.gameOver && !gameState.isPaused) {
        // Update performance metrics
        updatePerformance();
        
        // Update camera to follow tower height
        updateCamera();
        
        // Update particles
        updateParticles();
        
        // Update UI (including stability)
        updateUI();
    }
    
    requestAnimationFrame(gameLoop);
}

/**
 * Calculate final score based on tower height
 * Saves high scores to localStorage
 */
function calculateFinalScore() {
    let maxHeight = 0;
    
    gameState.pieces.forEach(piece => {
        const bounds = piece.body.bounds;
        const height = GROUND_Y - bounds.min.y;
        maxHeight = Math.max(maxHeight, height);
    });
    
    gameState.height = Math.floor(maxHeight / BLOCK_SIZE);
    gameState.score = gameState.height * 100; // 100 points per block height
    
    // Check and save high scores
    try {
        const savedHighScore = localStorage.getItem('tetroBuilders_highScore');
        const savedHighHeight = localStorage.getItem('tetroBuilders_highHeight');
        
        if (savedHighScore === null || gameState.score > parseInt(savedHighScore)) {
            gameState.highScore = gameState.score;
            localStorage.setItem('tetroBuilders_highScore', gameState.score.toString());
        } else {
            gameState.highScore = parseInt(savedHighScore);
        }
        
        if (savedHighHeight === null || gameState.height > parseInt(savedHighHeight)) {
            gameState.highHeight = gameState.height;
            localStorage.setItem('tetroBuilders_highHeight', gameState.height.toString());
        } else {
            gameState.highHeight = parseInt(savedHighHeight);
        }
    } catch (err) {
        // Silently fail if localStorage is not available
    }
    
    updateUI();
}

/**
 * Display the game over screen
 * Shows final score and high scores
 */
function showGameOverScreen() {
    const gameOverEl = document.getElementById('game-over');
    const finalScoreEl = document.getElementById('final-score');
    const finalHeightEl = document.getElementById('final-height');
    
    if (gameOverEl) gameOverEl.style.display = 'block';
    if (finalScoreEl) finalScoreEl.textContent = gameState.score;
    if (finalHeightEl) finalHeightEl.textContent = gameState.height;
    
    // Update high score display in game over screen
    const highScoreGameOver = document.getElementById('high-score-game-over');
    const highHeightGameOver = document.getElementById('high-height-game-over');
    if (highScoreGameOver) highScoreGameOver.textContent = gameState.highScore;
    if (highHeightGameOver) highHeightGameOver.textContent = gameState.highHeight;
    
    // Play lose sound
    playSound('lose');
    
    // Trigger screen shake
    triggerScreenShake();
}

/**
 * Handle game over
 * Stops engine, calculates score, and shows game over screen
 */
export function gameOver() {
    gameState.gameOver = true;
    Matter.Engine.stop(engine);
    calculateFinalScore();
    showGameOverScreen();
}

// Set up collision detection with game functions (dependency injection)
setGameFunctions({ gameOver, triggerScreenShake, updateUI });

/**
 * Initialize the game
 * Sets up physics, spawns first piece, and starts game loop
 * @throws {Error} If initialization fails
 */
export function initGame() {
    try {
        // Load saved state
        loadGameState();
        
        // Initialize physics
        initPhysics();
        
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
        
        // Show tutorial if not shown before
        if (!gameState.tutorialShown) {
            showTutorial();
        }
    } catch (error) {
        console.error('Error initializing game:', error);
        alert('Failed to initialize game. Please refresh the page.');
    }
}

/**
 * Restart the game
 * Clears world, resets state, and reinitializes
 */
export function restartGame() {
    // Clear the world
    Matter.World.clear(engine.world, false);
    
    // Reset game state
    resetGameState();
    
    // Hide game over screen
    const gameOverEl = document.getElementById('game-over');
    if (gameOverEl) gameOverEl.style.display = 'none';
    
    // Reinitialize game
    initGame();
}

/**
 * Detect if the device is mobile
 * @returns {boolean} True if device is mobile
 */
export function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
           ('ontouchstart' in window) || 
           (navigator.maxTouchPoints > 0);
}

// Make it available globally for HTML scripts
window.isMobileDevice = isMobileDevice;

/**
 * Handle device orientation changes
 * Adjusts canvas size for mobile devices
 */
function handleOrientationChange() {
    if (isMobileDevice()) {
        // Force a small delay to let CSS media queries apply
        setTimeout(() => {
            // Resize canvas if needed
            const canvas = document.getElementById('game-canvas');
            if (canvas) {
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

// Dispatch gameReady event helper
function dispatchGameReady() {
    console.log('Dispatching gameReady event');
    window.dispatchEvent(new CustomEvent('gameReady'));
}

// Start the game when page loads
window.addEventListener('load', () => {
    try {
        // Ensure Matter.js is loaded before initializing
        if (typeof Matter === 'undefined') {
            console.error('Matter.js not loaded');
            // Still hide splash screen
            dispatchGameReady();
            return;
        }
        
        // Try to initialize game
        try {
            initGame();
            // Dispatch game ready event after initialization
            // Use a shorter timeout since initialization should be quick
            setTimeout(() => {
                dispatchGameReady();
            }, 500); // Reduced from 1000ms to 500ms
        } catch (initError) {
            console.error('Error in initGame:', initError);
            // Still dispatch event to hide splash screen even if init fails
            dispatchGameReady();
        }
    } catch (error) {
        console.error('Failed to start game:', error);
        // Always dispatch event to hide splash screen
        dispatchGameReady();
    }
});

// Also try to dispatch on DOMContentLoaded as a backup
// This ensures the splash screen hides even if the window.load event doesn't fire
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Wait a bit to see if game loads, then dispatch as backup
        setTimeout(() => {
            console.log('DOMContentLoaded: Dispatching gameReady as backup');
            dispatchGameReady();
        }, 2500);
    });
} else {
    // DOM already loaded, dispatch after a short delay as backup
    setTimeout(() => {
        console.log('DOM already loaded: Dispatching gameReady as backup');
        dispatchGameReady();
    }, 2500);
}

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

