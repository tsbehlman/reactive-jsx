import babel from "rollup-plugin-babel";

module.exports = [
	{
		input: "src/index.js",
		output: {
			file: "example/bundle.js",
			format: "iife",
			name: "Reactive",
			sourcemap: true,
			sourcemapExcludeSources: true
		}
	},
	{
		input: "./example/test.jsx",
		output: {
			file: "./example/test.js",
			format: "iife",
			name: "TestComponent",
			sourcemap: true,
			sourcemapExcludeSources: true
		},
		plugins: [
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
