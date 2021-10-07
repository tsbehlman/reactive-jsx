if( Symbol.observable === undefined ) {
	Symbol.observable = Symbol.for( "observable" );
}

export function isObservable( object ) {
	return object && object[ Symbol.observable ];
}
