import babel from "rollup-plugin-babel";
import resolve from "@rollup/plugin-node-resolve";
const reactive = require( "./makeBabelPlugin" );

module.exports = {
	input: "./example/test.jsx",
	output: {
		file: "./example/test.js",
		format: "iife",
		name: "TestComponent",
		sourcemap: false
	},
	plugins: [
		babel( {
			plugins: [
				[ "babel-plugin-transform-rename-import", {
					replacements: [
						{
							original: "reactive(/?.*)",
							replacement: "../src$1"
						}
					]
				} ],
				reactive()
			]
		} ),
		resolve()
	]
};
