/**
 * Game Constants
 * All configuration values and constants used throughout the game
 */

// Canvas and display constants
export const BLOCK_SIZE = 20;
export const CANVAS_WIDTH = 400;
export const CANVAS_HEIGHT = 600;
export const SPAWN_X = CANVAS_WIDTH / 2;
export const SPAWN_Y = 50;
export const GROUND_Y = CANVAS_HEIGHT - 50;
export const PLATFORM_WIDTH = 200; // Smaller platform
export const PLATFORM_CENTER_X = CANVAS_WIDTH / 2;
export const CAMERA_TRIGGER_HEIGHT = 300; // Height at which camera starts following
export const CAMERA_SPEED = 2; // How fast camera follows

// Collision detection constants
export const VELOCITY_THRESHOLD = 0.2; // Velocity threshold for landing detection
export const GROUND_CONTACT_TOLERANCE = 15; // Pixels tolerance for ground contact
export const PIECE_CONTACT_TOLERANCE = 15; // Pixels tolerance for piece-to-piece contact
export const VERTICAL_OVERLAP_TOLERANCE = 8; // Vertical overlap tolerance
export const HORIZONTAL_OVERLAP_TOLERANCE = 5; // Horizontal overlap tolerance
export const SPAWN_DELAY = 300; // Delay before spawning next piece (ms)
export const LANDING_PARTICLE_COUNT = 8; // Number of particles on landing
export const MOVE_COOLDOWN = 100; // Cooldown between moves (ms)
export const ROTATE_COOLDOWN = 150; // Cooldown between rotations (ms)
export const MILESTONE_HEIGHTS = [10, 25, 50, 100, 150, 200, 250, 300]; // Height milestones

// Tetromino shapes
export const TETROMINOES = {
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

