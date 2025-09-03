/**
 * @fileoverview Console output utilities
 * @description Consistent console output formatting and messaging
 */

/**
 * Print a step header with consistent formatting
 * @param {string} message - Step message
 */
export function printStep(message) {
    console.log(`📝 ${message}...`);
}

/**
 * Print a success message with checkmark
 * @param {string} message - Success message
 */
export function printSuccess(message) {
    console.log(`✅ ${message}`);
}

/**
 * Print an installation step
 * @param {string} message - Installation message
 */
export function printInstall(message) {
    console.log(`📦 ${message}...`);
}

/**
 * Print a warning message
 * @param {string} message - Warning message
 */
export function printWarning(message) {
    console.log(`⚠️  ${message}`);
}

/**
 * Print an error message
 * @param {string} message - Error message
 */
export function printError(message) {
    console.error(`❌ ${message}`);
}

/**
 * Print a section separator
 */
export function printSeparator() {
    console.log('\n' + '='.repeat(50) + '\n');
}

/**
 * Print the application header
 */
export function printHeader() {
    console.log('🎛️  React Router 7 Tuner');
    console.log(
        "Welcome! Let's enhance your React Router 7 app with production-ready features.\n"
    );
}

/**
 * Print next steps for a given integration
 * @param {string[]} steps - Array of step descriptions
 */
export function printNextSteps(steps) {
    console.log('\n📋 Next Steps:');
    steps.forEach((step, index) => {
        console.log(`${index + 1}. ${step}`);
    });
}