import { defineConfig } from 'vitest/config';

// Only domain/ and application/ get automated tests — see docs/adr/0002-testing-strategy.md.
// infrastructure/ (Phaser, React) is hand-tested in the browser instead.
export default defineConfig({
    test: {
        environment: 'node',
        include: [
            'src/domain/**/*.test.ts',
            'src/application/**/*.test.ts',
            // Pure data validators: no Phaser, React or DOM involved
            'src/infrastructure/content/**/*.test.ts'
        ]
    }
});
