import { subscribeForDOM, isObservable } from "./observableUtils.js";

export function mapStreamObjectToTarget( streamObj, target ) {
	for( const [ key, value ] of Object.entries( streamObj ) ) {
		if( isObservable( value ) ) {
			subscribeForDOM( v => target[ key ] = v, value );
		}
		else {
			target[ key ] = value;
		}
	}
}
