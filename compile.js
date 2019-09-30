const fs = require( "fs" ).promises;
const path = require( "path" );
const jsxTransform = require( "jsx-transform" );

let [ , , inputFile, outputFile ] = process.argv;

inputFile = path.resolve( inputFile );
outputFile = outputFile === undefined ? path.dirname( inputFile ) : path.resolve( outputFile );

( async function() {
	const [ inputStats, outputStats ] = await Promise.all( [
		fs.stat( inputFile ),
		fs.stat( outputFile )
	] );
	
	if( inputStats.isDirectory() ) {
		throw new Error( "Compiling a directory is not supported" );
	}
	
	if( outputStats.isDirectory() ) {
		const extension = path.extname( inputFile );
		outputFile = path.resolve( outputFile, path.basename( inputFile, extension ) + ".js" );
	}
	
	const fileContent = await fs.readFile( inputFile, { encoding: "utf8" } );
	
	const transpiledSource = jsxTransform.fromString( fileContent, {
		factory: "Reactive.factory"
	} );
	
	await fs.writeFile( outputFile, transpiledSource, { encoding: "utf8" } )
} )();