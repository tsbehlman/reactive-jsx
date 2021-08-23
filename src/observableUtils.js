import { registerSubscription } from "./mount.js";

if( Symbol.observable === undefined ) {
	Symbol.observable = Symbol( "observable" );
}

export function isObservable( object ) {
	return object && object[ Symbol.observable ];
}

export function makeObservable( setup ) {
	const subscribers = new Set();
	let value;
	let cleanup;

	return [
		{
			[Symbol.observable]() {
				return this;
			},
			subscribe( subscriber ) {
				if( subscribers.size === 0 && setup ) {
					cleanup = setup();
				}
				subscribers.add( subscriber );
				subscriber.next( value );
				return {
					closed: false,
					unsubscribe() {
						this.closed = true;
						subscribers.delete( subscriber );
						if( subscribers.size === 0 && cleanup ) {
							cleanup();
						}
					}
				};
			}
		},
		function dispatch( newValue ) {
			if( value === newValue ) {
				return;
			}
			value = newValue;
			for( const subscriber of subscribers ) {
				subscriber.next( newValue );
			}
		},
		function getValue() {
			return value;
		}
	];
}

export function subscribe( next, observable ) {
	return observable[Symbol.observable]().subscribe( { next } );
}

export function subscribeForDOM( next, observable ) {
	const subscription = subscribe( next, observable );
	registerSubscription( subscription );
	return subscription;
}

export function mapStream( stream, setValueCallback ) {
	if( isObservable( stream ) ) {
		subscribeForDOM( setValueCallback, stream );
	}
	else {
		setValueCallback( stream );
	}
}

export function mapStreamObject( streamObj, setValueCallback ) {
	for( const [ key, value ] of Object.entries( streamObj ) ) {
		if( isObservable( value ) ) {
			subscribeForDOM( v => setValueCallback( key, v ), value );
		}
		else {
			setValueCallback( key, value );
		}
	}
}

export function mapStreamObjectToTarget( streamObj, target ) {
	mapStreamObject( streamObj, ( key, value ) => target[ key ] = value );
}
