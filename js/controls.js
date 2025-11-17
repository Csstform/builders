/**
 * Controls Module
 * Handles all user input: keyboard, touch, and button controls
 */

import { gameState } from './gameState.js';
import { canvas } from './physics.js';
import { movePiece, rotatePiece, dropPiece } from './pieces.js';
import { togglePause } from './game.js';
import { updateUI } from './ui.js';
import { nextTutorialStep, prevTutorialStep, closeTutorial } from './tutorial.js';
import { restartGame } from './game.js';

/**
 * Get canvas element for touch events
 * @returns {HTMLCanvasElement|null} Canvas element or null if not available
 */
function getCanvas() {
    return canvas || document.getElementById('game-canvas');
}

/**
 * Setup all game controls
 * Registers keyboard, touch, and button event listeners
 */
export function setupControls() {
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
            case 'ArrowUp':
                e.preventDefault();
                rotatePiece();
                break;
            case 'KeyR':
                e.preventDefault();
                rotatePiece();
                break;
            case 'KeyP':
            case 'Escape':
                e.preventDefault();
                togglePause();
                break;
            case 'ArrowDown':
            case 'Space':
                e.preventDefault();
                dropPiece();
                break;
        }
    });
    
    // Button controls with error handling
    const leftBtn = document.getElementById('left-btn');
    const rightBtn = document.getElementById('right-btn');
    const rotateBtn = document.getElementById('rotate-btn');
    const dropBtn = document.getElementById('drop-btn');
    const restartBtn = document.getElementById('restart-btn');
    const resumeBtn = document.getElementById('resume-btn');
    const tutorialNext = document.getElementById('tutorial-next');
    const tutorialPrev = document.getElementById('tutorial-prev');
    const tutorialSkip = document.getElementById('tutorial-skip');
    
    if (leftBtn) leftBtn.addEventListener('click', () => movePiece('left'));
    if (rightBtn) rightBtn.addEventListener('click', () => movePiece('right'));
    if (rotateBtn) rotateBtn.addEventListener('click', rotatePiece);
    if (dropBtn) dropBtn.addEventListener('click', dropPiece);
    if (restartBtn) restartBtn.addEventListener('click', restartGame);
    if (resumeBtn) resumeBtn.addEventListener('click', togglePause);
    if (tutorialNext) tutorialNext.addEventListener('click', nextTutorialStep);
    if (tutorialPrev) tutorialPrev.addEventListener('click', prevTutorialStep);
    if (tutorialSkip) tutorialSkip.addEventListener('click', closeTutorial);
    
    // Volume control
    const volumeSlider = document.getElementById('volume-slider');
    if (volumeSlider) {
        volumeSlider.addEventListener('input', (e) => {
            gameState.volume = e.target.value / 100;
            updateUI();
            // Save to localStorage
            try {
                localStorage.setItem('tetroBuilders_volume', gameState.volume);
            } catch (err) {
                // Silently fail if localStorage is not available
            }
        });
    }
    
    // Enhanced touch controls for mobile
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    let isTouchActive = false;
    
    const gameCanvas = getCanvas();
    if (!gameCanvas) return; // Canvas not available yet
    
    gameCanvas.addEventListener('touchstart', (e) => {
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
    
    gameCanvas.addEventListener('touchend', (e) => {
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
    
    gameCanvas.addEventListener('touchcancel', (e) => {
        e.preventDefault();
        isTouchActive = false;
    });
}

