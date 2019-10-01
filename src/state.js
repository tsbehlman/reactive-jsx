export function useState( initialValue ) {
	let value = initialValue;

	let subscriber = undefined;
	const stream = most.from( {
		[Symbol.observable]() {
			return this;
		},
		subscribe( newSubscriber ) {
			if( subscriber !== undefined ) {
				throw new Error( "signal only supports one subscriber at a time" );
			}
			subscriber = newSubscriber;
			return {
				closed: false,
				unsubscribe() {
					this.closed = true;
					subscriber = undefined;
				}
			};
		}
	} ).startWith( value );

	function setSignalValue( newValue ) {
		if( subscriber === undefined ) {
			throw new Error( "signal has no subscribed streams" );
		}
		if( newValue !== undefined && newValue.constructor === Function ) {
			newValue = newValue( value );
		}
		value = newValue;
		subscriber.next( value );
	}

	return [ stream, setSignalValue ];
}
