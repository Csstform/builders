/**
 * Game State Management
 * Handles the global game state, including scores, pieces, and settings
 */

/**
 * Global game state object
 * @type {Object}
 */
export let gameState = {
    score: 0,
    height: 0,
    lives: 3,
    gameOver: false,
    highScore: 0,
    highHeight: 0,
    milestonesReached: new Set(), // Track which milestones have been reached
    tutorialShown: false, // Track if tutorial has been shown
    performance: {
        fps: 60,
        frameCount: 0,
        lastTime: performance.now(),
        lowPerformanceMode: false
    },
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
    isPaused: false,
    volume: 1.0, // Volume level 0.0 to 1.0
};

/**
 * Load game state from localStorage
 * Restores saved volume, high scores, and tutorial status
 */
export function loadGameState() {
    try {
        // Load saved volume from localStorage
        const savedVolume = localStorage.getItem('tetroBuilders_volume');
        if (savedVolume !== null) {
            gameState.volume = parseFloat(savedVolume);
        }
        
        // Load high scores
        const savedHighScore = localStorage.getItem('tetroBuilders_highScore');
        const savedHighHeight = localStorage.getItem('tetroBuilders_highHeight');
        if (savedHighScore !== null) {
            gameState.highScore = parseInt(savedHighScore);
        }
        if (savedHighHeight !== null) {
            gameState.highHeight = parseInt(savedHighHeight);
        }
        
        // Check if tutorial has been shown
        const tutorialShown = localStorage.getItem('tetroBuilders_tutorialShown');
        gameState.tutorialShown = tutorialShown === 'true';
    } catch (err) {
        // Silently fail if localStorage is not available
    }
}

/**
 * Reset game state (preserving high scores and settings)
 * Called when restarting the game
 */
export function resetGameState() {
    gameState = {
        score: 0,
        height: 0,
        lives: 3,
        gameOver: false,
        highScore: gameState.highScore, // Preserve high scores
        highHeight: gameState.highHeight,
        milestonesReached: new Set(),
        tutorialShown: gameState.tutorialShown, // Preserve tutorial state
        performance: {
            fps: 60,
            frameCount: 0,
            lastTime: performance.now(),
            lowPerformanceMode: false
        },
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
        isPaused: false,
        volume: gameState.volume, // Preserve volume
    };
}

