export function useState( initialValue ) {
	let value = initialValue;

	const subscribers = new Set();
	const stream = most.from( {
		[Symbol.observable]() {
			return this;
		},
		subscribe( subscriber ) {
			subscribers.add( subscriber );
			return {
				closed: false,
				unsubscribe() {
					this.closed = true;
					subscribers.delete( subscriber );
				}
			};
		}
	} ).startWith( value );

	function setSignalValue( newValue ) {
		if( subscribers.size === 0 ) {
			throw new Error( "signal has no subscribed streams" );
		}
		if( newValue !== undefined && newValue.constructor === Function ) {
			newValue = newValue( value );
		}
		value = newValue;
		for( const subscriber of subscribers ) {
			subscriber.next( value );
		}
	}

	return [ stream, setSignalValue ];
}
