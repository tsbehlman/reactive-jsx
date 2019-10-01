module.exports = {
	input: "src/index.js",
	output: {
		file: "example/bundle.js",
		format: "iife",
		name: "Reactive",
		sourcemap: true,
		sourcemapExcludeSources: true
	}
};
