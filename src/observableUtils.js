import { passthrough } from "./utils.js";

if( Symbol.observable === undefined ) {
	Symbol.observable = Symbol( "observable" );
}

export function isObservable( object ) {
	return object && object[ Symbol.observable ];
}

export function makeObservable( setup ) {
	const observers = new Set();
	let value;
	let cleanup;
	
	function next( newValue ) {
		if( value === newValue ) {
			return;
		}
		value = newValue;
		for( const observer of observers ) {
			observer.next( newValue );
		}
	}

	return {
		[Symbol.observable]() {
			return this;
		},
		subscribe( observer ) {
			if( observers.size === 0 && setup ) {
				cleanup = setup( next );
			}
			observers.add( observer );
			observer.next( value );
			return {
				closed: false,
				unsubscribe() {
					this.closed = true;
					observers.delete( observer );
					if( observers.size === 0 && cleanup ) {
						cleanup();
					}
				}
			};
		}
	};
}

export function makeSignal( initialValue, mapper = passthrough ) {
	const observers = new Set();
	let value = initialValue;

	return {
		[Symbol.observable]() {
			return this;
		},
		subscribe( observer ) {
			observers.add( observer );
			observer.next( value );
			return {
				closed: false,
				unsubscribe() {
					this.closed = true;
					observers.delete( observer );
				}
			};
		},
		get() {
			return value;
		},
		set( newValue ) {
			if( typeof newValue === "function" ) {
				newValue = newValue( value );
			}

			newValue = mapper( newValue );

			if( value === newValue ) {
				return;
			}
			value = newValue;
			for( const observer of observers ) {
				observer.next( newValue );
			}
		},
		toJSON() {
			return value;
		}
	};
}

export function subscribe( next, observable ) {
	return observable[Symbol.observable]().subscribe( { next } );
}
