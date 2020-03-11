export function useSignal( initialValue ) {
	let value = initialValue;

	const subscribers = new Set();
	
	let stream = most.from( {
		[Symbol.observable]() {
			return this;
		},
		subscribe( subscriber ) {
			subscribers.add( subscriber );
			subscriber.next( value );
			return {
				closed: false,
				unsubscribe() {
					this.closed = true;
					subscribers.delete( subscriber );
				}
			};
		}
	} );
	
	let signal = stream.tap( newValue => {
		value = newValue;
	} );
	
	signal.get = function getSignalValue() {
		return value;
	};
	
	signal.set = function setSignalValue( newValue ) {
		if( subscribers.size === 0 ) {
			throw new Error( "signal has no subscribed streams" );
		}
		if( newValue !== undefined && newValue.constructor === Function ) {
			newValue = newValue( value );
		}
		for( const subscriber of subscribers ) {
			subscriber.next( newValue );
		}
	};
	
	signal.extend = function( extender ) {
		const newStream = extender( signal );
		const newSignal = newStream.tap( newValue => {
			value = newValue;
		} );
		newSignal.get = signal.get;
		newSignal.set = signal.set;
		newSignal.extend = signal.extend;
		stream = newStream;
		signal = newSignal;
		return newSignal;
	};

	return signal;
}
