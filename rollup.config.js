import babel from 'rollup-plugin-babel';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import pkg from './package.json';
import builtins from 'rollup-plugin-node-builtins';
import globals from 'rollup-plugin-node-globals';
import minify from 'rollup-plugin-minify-es';
import progress from 'rollup-plugin-progress';
const path = require('path');
export default [
  // cognos-friendly AMD build
  {
    input: path.resolve(__dirname, 'src') + '/index.js',
    output: {
      name: 'Main',
      file: 'renderer/Main.js',
      format: 'amd'
    },
    plugins: [
      progress({
        clearLine: false // default: true
      }),
      globals(),
      builtins(),
      babel({
        presets: [
          '@babel/env'
          /*
          // Stage 0
          "module:@babel/plugin-proposal-function-bind",

          // Stage 1
          "module:@babel/plugin-proposal-export-default-from",
          "module:@babel/plugin-proposal-logical-assignment-operators",
          ["module:@babel/plugin-proposal-optional-chaining", { loose: false }],
          [
            "module:@babel/plugin-proposal-pipeline-operator",
            { proposal: "minimal" }
          ],
          [
            "module:@babel/plugin-proposal-nullish-coalescing-operator",
            { loose: false }
          ],
          "module:@babel/plugin-proposal-do-expressions"

          // Stage 2
            ["@babel/plugin-proposal-decorators", { legacy: true }],
          "@babel/plugin-proposal-function-sent",
          "@babel/plugin-proposal-export-namespace-from",
          "@babel/plugin-proposal-numeric-separator",
          "@babel/plugin-proposal-throw-expressions",

          // Stage 3
          "@babel/plugin-syntax-dynamic-import",
          "@babel/plugin-syntax-import-meta",
          ["@babel/plugin-proposal-class-properties", { loose: false }],
          "@babel/plugin-proposal-json-strings"*/
        ] /*,

        exclude: "node_modules/entities/**"*/
      }),
      resolve({
        exclude: 'node_modules/entities/**'
      }),
      commonjs({
        exclude: 'node_modules/entities/**',
        namedExports: {
          // left-hand side can be an absolute path, a path
          // relative to the current directory, or the name
          // of a module in node_modules
          //      "rss-parser/dist/rss-parser": ["RSSParser"],
          //      "node_modules/sax/lib/sax.js": ["sax"],
          //      sax: ["sax"]
        }
      }),
      minify()
    ]
  }
];
