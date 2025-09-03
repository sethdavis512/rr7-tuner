/**
 * @fileoverview Console output utilities
 * @description Consistent console output formatting and messaging
 */

/**
 * Print a step header with consistent formatting
 */
export function printStep(message: string): void {
    console.log(`📝 ${message}...`);
}

/**
 * Print a success message with checkmark
 */
export function printSuccess(message: string): void {
    console.log(`✅ ${message}`);
}

/**
 * Print an installation step
 */
export function printInstall(message: string): void {
    console.log(`📦 ${message}...`);
}

/**
 * Print a warning message
 */
export function printWarning(message: string): void {
    console.log(`⚠️  ${message}`);
}

/**
 * Print an error message
 */
export function printError(message: string): void {
    console.error(`❌ ${message}`);
}

/**
 * Print a section separator
 */
export function printSeparator(): void {
    console.log('\n' + '='.repeat(50) + '\n');
}

/**
 * Print the application header
 */
export function printHeader(): void {
    console.log('🎛️  React Router 7 Tuner');
    console.log(
        "Welcome! Let's enhance your React Router 7 app with production-ready features.\n"
    );
}

/**
 * Print next steps for a given integration
 */
export function printNextSteps(steps: string[]): void {
    console.log('\n📋 Next Steps:');
    steps.forEach((step, index) => {
        console.log(`${index + 1}. ${step}`);
    });
}