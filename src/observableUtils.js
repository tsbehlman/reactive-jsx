import { cleanupSubscription } from "./cleanup.js";

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

let recordedSubscriptions;

export function subscribe( next, observable ) {
	return observable[Symbol.observable]().subscribe( { next } );
}

export function subscribeForDOM( next, observable ) {
	const subscription = subscribe( next, observable );
	cleanupSubscription( subscription );
	return subscription;
}
