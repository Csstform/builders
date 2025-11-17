/**
 * Audio Module
 * Handles all sound effects using Web Audio API
 */

import { gameState } from './gameState.js';

/**
 * Play a sound effect
 * @param {string} type - Sound type: 'land', 'lose', 'achievement', or 'move'
 */
export function playSound(type) {
    // Don't play sounds if volume is 0 or game is paused
    if (gameState.volume === 0 || gameState.isPaused) return;
    
    try {
        // Create audio context if it doesn't exist
        if (!window.audioContext) {
            window.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        const ctx = window.audioContext;
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        // Apply volume
        const baseGain = gameState.volume;
        
        // Different sounds for different actions
        switch (type) {
        case 'land':
            oscillator.frequency.setValueAtTime(440, ctx.currentTime); // A4
            oscillator.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0.1 * baseGain, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01 * baseGain, ctx.currentTime + 0.1);
            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 0.1);
            break;
            
        case 'lose':
            oscillator.frequency.setValueAtTime(200, ctx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3);
            gainNode.gain.setValueAtTime(0.2 * baseGain, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01 * baseGain, ctx.currentTime + 0.3);
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
                gain.gain.setValueAtTime(0.1 * baseGain, ctx.currentTime + index * 0.1);
                gain.gain.exponentialRampToValueAtTime(0.01 * baseGain, ctx.currentTime + 0.5 + index * 0.1);
                osc.start(ctx.currentTime + index * 0.1);
                osc.stop(ctx.currentTime + 0.5 + index * 0.1);
            });
            break;
            
        case 'move':
            oscillator.frequency.setValueAtTime(800, ctx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.05);
            gainNode.gain.setValueAtTime(0.05 * baseGain, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01 * baseGain, ctx.currentTime + 0.05);
            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 0.05);
            break;
        }
    } catch (error) {
        // Silently fail if audio context is not available
        console.error('Audio error:', error);
    }
}

