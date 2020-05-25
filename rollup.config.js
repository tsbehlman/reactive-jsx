import babel from "rollup-plugin-babel";
import resolve from "@rollup/plugin-node-resolve";

module.exports = [
	{
		input: "src/index.js",
		output: {
			file: "example/bundle.js",
			format: "iife",
			name: "Reactive",
			sourcemap: false
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
					[ "@babel/plugin-transform-react-jsx", {
						pragma: "Reactive.factory",
						pragmaFrag: "Reactive.Fragment",
					} ]
				]
			} )
		]
	}
];
