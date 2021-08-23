import babel from "rollup-plugin-babel";
import resolve from "@rollup/plugin-node-resolve";
const reactive = require( "./makeBabelPlugin" );

module.exports = [
	{
		input: "src/index.js",
		output: {
			file: "example/bundle.js",
			format: "iife",
			name: "Reactive",
			sourcemap: true
		}
	},
	{
		input: "./example/test.jsx",
		output: {
			file: "./example/test.js",
			format: "iife",
			name: "TestComponent",
			sourcemap: false
		},
		plugins: [
			resolve(),
			babel( {
				plugins: [
					reactive( {
						moduleName: "../src/index.js",
					} )
				]
			} )
		]
	}
];
