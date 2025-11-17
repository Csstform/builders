/**
 * Physics Engine Module
 * Handles Matter.js physics engine setup, world creation, and rendering
 */

import { CANVAS_WIDTH, CANVAS_HEIGHT, PLATFORM_CENTER_X, GROUND_Y, PLATFORM_WIDTH } from './constants.js';
import { gameState } from './gameState.js';

// Physics engine setup
export let engine, world, render;
export let canvas, nextCanvas;

/**
 * Get canvas elements from DOM
 * Called after DOM is ready to ensure elements exist
 * @returns {boolean} True if both canvases are found
 */
function getCanvasElements() {
    canvas = document.getElementById('game-canvas');
    nextCanvas = document.getElementById('next-canvas');
    return canvas && nextCanvas;
}

/**
 * Initialize the physics engine and world
 * Creates Matter.js engine, renderer, ground platform, and walls
 * @throws {Error} If canvas elements or Matter.js are not available
 */
export function initPhysics() {
    // Ensure canvas elements are available
    if (!getCanvasElements()) {
        throw new Error('Canvas elements not found');
    }
    
    // Ensure Matter.js is loaded
    if (typeof Matter === 'undefined') {
        throw new Error('Matter.js is not loaded');
    }
    
    // Create physics engine
    engine = Matter.Engine.create();
    world = engine.world;
    
    // Set very slow, strategic falling rate
    engine.world.gravity.y = 0.1; // Very slow gravity for strategic gameplay
    engine.world.gravity.x = 0; // No horizontal gravity
    engine.world.gravity.scale = 0.0005; // Very low scale for maximum control
    
    // Enhanced physics settings for better accuracy and stability
    // Increased iterations for more accurate constraint solving
    engine.world.constraintIterations = 3; // Increased from 2 for better stability
    engine.world.positionIterations = 6; // Increased from 4 for more accurate positioning
    engine.world.velocityIterations = 4; // Increased from 2 for smoother motion
    
    // Enhanced timing for more accurate physics simulation
    engine.timing.timeScale = 1.0; // Normal time scale for accuracy
    engine.timing.timestamp = 0;
    
    // Enable sleep system for better performance and stability
    // Pieces that have settled will sleep, reducing calculations
    // Note: Sleep thresholds are set per-body (see createTetrominoBody)
    // Matter.js automatically handles sleeping based on body.sleepThreshold property
    Matter.Engine.update(engine, 16.666); // One frame worth of time
    
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
            label: 'ground'
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
}

/**
 * Enable low performance mode
 * Reduces particle count and physics iterations to improve FPS
 */
export function enableLowPerformanceMode() {
    // Reduce particle count
    gameState.particles = gameState.particles.slice(0, Math.floor(gameState.particles.length / 2));
    
    // Reduce physics iterations
    engine.world.constraintIterations = 1;
    engine.world.positionIterations = 2;
    engine.world.velocityIterations = 1;
}

/**
 * Disable low performance mode
 * Restores normal physics iterations when performance improves
 */
export function disableLowPerformanceMode() {
    // Restore enhanced physics iterations
    engine.world.constraintIterations = 3;
    engine.world.positionIterations = 6;
    engine.world.velocityIterations = 4;
}

/**
 * Helper function to set body sleep state
 * Works with Matter.js 0.19.0 API
 * @param {Matter.Body} body - Body to set sleep state
 * @param {boolean} isSleeping - Whether body should sleep
 */
function setBodySleep(body, isSleeping) {
    if (!body) return;
    
    // Try Matter.Sleeping API first (if available)
    if (Matter.Sleeping && typeof Matter.Sleeping.set === 'function') {
        Matter.Sleeping.set(body, isSleeping);
    } else {
        // Fallback to direct property access
        body.isSleeping = isSleeping;
    }
}

/**
 * Helper function to get body sleep state
 * Works with Matter.js 0.19.0 API
 * @param {Matter.Body} body - Body to check
 * @returns {boolean} Whether body is sleeping
 */
function getBodySleep(body) {
    if (!body) return false;
    
    // Try Matter.Sleeping API first (if available)
    if (Matter.Sleeping && typeof Matter.Sleeping.get === 'function') {
        return Matter.Sleeping.get(body);
    } else {
        // Fallback to direct property access
        return body.isSleeping === true;
    }
}

/**
 * Optimize physics for settled pieces
 * Puts pieces to sleep when they've settled to improve performance
 * @param {Matter.Body} body - Body to optimize
 */
export function optimizeSettledPiece(body) {
    if (!body || body.isStatic) return;
    
    // Check if piece has settled (low velocity and low angular velocity)
    const velocity = Math.abs(body.velocity.x) + Math.abs(body.velocity.y);
    const angularVelocity = Math.abs(body.angularVelocity);
    
    // If piece is nearly stationary, put it to sleep
    if (velocity < 0.1 && angularVelocity < 0.01) {
        setBodySleep(body, true);
    }
}

/**
 * Wake up a piece that needs to be active
 * @param {Matter.Body} body - Body to wake up
 */
export function wakePiece(body) {
    if (body && getBodySleep(body)) {
        setBodySleep(body, false);
    }
}

