/**
 * Tutorial Module
 * Handles the interactive tutorial/onboarding system
 */

import { gameState } from './gameState.js';

// Tutorial system state
let tutorialStep = 1;
const totalTutorialSteps = 3;

/**
 * Show the tutorial overlay
 * Displays the first step of the tutorial
 */
export function showTutorial() {
    const tutorialOverlay = document.getElementById('tutorial-overlay');
    if (tutorialOverlay) {
        tutorialOverlay.style.display = 'flex';
        tutorialStep = 1;
        updateTutorialStep();
    }
}

/**
 * Update tutorial display to show current step
 * Hides all steps and shows only the current one
 */
function updateTutorialStep() {
    // Hide all steps
    for (let i = 1; i <= totalTutorialSteps; i++) {
        const step = document.getElementById(`tutorial-step-${i}`);
        if (step) step.style.display = 'none';
    }
    
    // Show current step
    const currentStep = document.getElementById(`tutorial-step-${tutorialStep}`);
    if (currentStep) currentStep.style.display = 'block';
    
    // Update buttons
    const prevBtn = document.getElementById('tutorial-prev');
    const nextBtn = document.getElementById('tutorial-next');
    
    if (prevBtn) prevBtn.style.display = tutorialStep === 1 ? 'none' : 'inline-block';
    if (nextBtn) nextBtn.textContent = tutorialStep === totalTutorialSteps ? 'Start Game' : 'Next';
}

/**
 * Move to the next tutorial step
 * Closes tutorial if on last step
 */
export function nextTutorialStep() {
    if (tutorialStep < totalTutorialSteps) {
        tutorialStep++;
        updateTutorialStep();
    } else {
        closeTutorial();
    }
}

/**
 * Move to the previous tutorial step
 */
export function prevTutorialStep() {
    if (tutorialStep > 1) {
        tutorialStep--;
        updateTutorialStep();
    }
}

/**
 * Close the tutorial and mark it as shown
 * Saves state to localStorage
 */
export function closeTutorial() {
    const tutorialOverlay = document.getElementById('tutorial-overlay');
    if (tutorialOverlay) {
        tutorialOverlay.style.display = 'none';
        gameState.tutorialShown = true;
        try {
            localStorage.setItem('tetroBuilders_tutorialShown', 'true');
        } catch (err) {
            // Silently fail if localStorage is not available
        }
    }
}

