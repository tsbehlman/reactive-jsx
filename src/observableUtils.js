if( Symbol.observable === undefined ) {
	Symbol.observable = Symbol( "observable" );
}

export function isObservable( object ) {
	return object && object[ Symbol.observable ];
}
