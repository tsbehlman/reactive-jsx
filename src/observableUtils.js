import { passthrough } from "./utils.js";

if( Symbol.observable === undefined ) {
	Symbol.observable = Symbol.for( "observable" );
}

export function isObservable( object ) {
	return object && object[ Symbol.observable ];
}

export class Observable {
	#observers = new Set();
	#setup;
	#value;
	#cleanup;

	#observerProxy = {
		next: ( newValue ) => {
			if( this.#value === newValue ) {
				return;
			}
			this.#value = newValue;
			for( const observer of this.#observers ) {
				observer.next( newValue );
			}
		},
		error: ( error ) => {
			for( const observer of this.#observers ) {
				observer.error( error );
			}
		},
		complete: () => {
			for( const observer of this.#observers ) {
				observer.complete();
			}
		}
	};

	constructor( setup ) {
		this.#setup = setup;
	}
	
	subscribe( observer ) {
		if( typeof observer === "function" ) {
			observer = { next: observer };
		}

		const subscription = new Subscription(() => {
			this.#observers.delete( observer );
			if( this.#observers.size === 0 && this.#cleanup ) {
				this.#cleanup();
			}
		});
		observer.error = observer.error || function defaultError( error ) {
			console.error( "Uncaught observable error", error );
		};
		observer.complete = observer.complete || function defaultComplete() {
			subscription.unsubscribe();
		};

		if( this.#observers.size === 0 && this.#setup ) {
			const setupReturnValue = this.#setup( this.#observerProxy );
			if( typeof setupReturnValue === "function" ) {
				this.#cleanup = setupReturnValue;
			}
		}
		this.#observers.add( observer );
		observer.next( this.#value );
		return subscription;
	}

	[Symbol.observable]() {
		return this;
	}
}

export class Signal {
	#observers = new Set();
	#value;
	#mapper;

	constructor( initialValue, mapper = passthrough ) {
		this.#value = initialValue;
		this.#mapper = mapper;
	}
	
	subscribe( observer ) {
		if( typeof observer === "function" ) {
			observer = { next: observer };
		}
		this.#observers.add( observer );
		observer.next( this.#value );
		return new Subscription(() => {
			this.#observers.delete( observer );
		});
	}
	
	get() {
		return this.#value;
	}
	
	set( newValue ) {
		if( typeof newValue === "function" ) {
			newValue = newValue( this.#value );
		}

		newValue = this.#mapper( newValue );

		if( this.#value === newValue ) {
			return;
		}
		this.#value = newValue;
		for( const observer of this.#observers ) {
			observer.next( newValue );
		}
	}

	[Symbol.observable]() {
		return this;
	}
	
	toJSON() {
		return this.#value;
	}
}

export class Just {
	constructor( value ) {
		this.value = value;
	}

	[Symbol.observable]() {
		return this;
	}

	subscribe( observer ) {
		if( typeof observer === "function" ) {
			observer( this.value );
		}
		else {
			observer.next( this.value );
			observer.complete();
		}
		const subscription = new Subscription();
		subscription.unsubscribe();
		return subscription;
	}

	toJSON() {
		return value;
	}
}

export class Subscription {
	closed = false;
	#cleanup = undefined;
	
	constructor(cleanup) {
		this.#cleanup = cleanup;
	}
	
	unsubscribe() {
		this.closed = true;
		if (this.#cleanup) {
			this.#cleanup();
			this.#cleanup = undefined;
		}
	}
}

export function wrapObservable( value ) {
	if( isObservable( value ) ) {
		return value;
	}
	else {
		return new Just( value );
	}
}
