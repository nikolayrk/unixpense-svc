const tsNode = require('ts-node');
const path = require('path');

tsNode.register({
    project: path.resolve(__dirname, './tsconfig.json'),
    transpileOnly: true,
    require: ['tsconfig-paths/register'],
    compilerOptions: {
        module: 'commonjs'
    }
});

process.env.NODE_ENV="test_coverage";
