import makeChildNode from "./make-child-node.js";
import { getExtensions } from "./extensions.js";

export function factory( component, props, ...children ) {
	if( props == null ) {
		props = {};
	}
	if( component.constructor === String ) {
		return Element( component, props, children );
	}
	else {
		return component( props, children );
	}
}

function mapStreamObjectToTarget( streamObj, target ) {
	for( const [ key, value ] of Object.entries( streamObj ) ) {
		if( value instanceof most.Stream ) {
			value.observe( v => target[ key ] = v );
		}
		else {
			target[ key ] = value;
		}
	}
}

function mapClassesToClassList( classes, classList ) {
	for( const [ key, value ] of Object.entries( classes ) ) {
		if( value instanceof most.Stream ) {
			value.observe( v => {
				if( !!v ) {
					classList.add( key );
				}
				else {
					classList.remove( key );
				}
			} );
		}
		else if( !!value ) {
			classList.add( key );
		}
	}
}

function Element( tagName, props, children ) {
	const element = document.createElement( tagName );
	
	for( const extension of getExtensions() ) {
		props = extension( props );
	}
	
	const { style, dataset, events, classes, ref, ...attributes } = props;

	mapStreamObjectToTarget( attributes, element );
	if( style !== undefined ) {
		if( style.constructor === String ) {
			element.style.cssText = style;
		}
		else {
			mapStreamObjectToTarget( style, element.style );
		}
	}

	if( dataset !== undefined ) {
		mapStreamObjectToTarget( dataset, element.dataset );
	}

	if( events !== undefined ) {
		for( const [ eventName, listener ] of Object.entries( events ) ) {
			listener && element.addEventListener( eventName, listener, false );
		}
	}
	
	if( classes !== undefined ) {
		mapClassesToClassList( classes, element.classList );
	}
	
	if( ref !== undefined ) {
		ref.current = element;
	}

	for( const child of children ) {
		element.appendChild( makeChildNode( child ) );
	}
	return element;
}

export { withExtensions } from "./extensions.js";
export * from "./state.js";
export * from "./ref.js";
export * from "./components.js";
