const { build } = require('esbuild');
const { nodeExternalsPlugin } = require('esbuild-node-externals');
const { exec } = require('child_process');

// Function to run a shell command and return it as a promise
function runCommand(command) {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(stderr);
            } else {
                resolve(stdout);
            }
        });
    });
}

// Run TypeScript compiler to generate type definitions
runCommand('tsc')
    .then(() => {
        // Build with esbuild
        return build({
            entryPoints: ['./src/index.ts'],
            bundle: true,
            platform: 'node',
            target: 'node14',
            outfile: './dist/index.js',
            plugins: [nodeExternalsPlugin()],
        });
    })
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
