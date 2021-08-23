import { subscribeForDOM, isObservable, mapStream, mapStreamObjectToTarget, mapStreamObject } from "./observableUtils.js";
import { wrapNewMountedContext, mountElement, unmountElement } from "./mount.js";
import { applyRef } from "./ref.js";

export function createComponent( component, props, children ) {
	return wrapNewMountedContext( () => renderChild( component( props, children ) ) )();
}

export function insert( parentNode, child, markerNode ) {
	const childNode = renderChild( child );
	if( childNode === undefined ) {
		return;
	}
	mountElement( parentNode, childNode, markerNode );
}

export function assignToElement( value, setter ) {
	if( isObservable( value ) ) {
		subscribeForDOM( setter, value );
	}
	else {
		setter( value );
	}
}

export function spread( element, props, isSVG ) {
	const { style, dataset, events, classList, ref, ...attributes } = props;
	
	if( isSVG ) {
		mapStreamObject( attributes, ( key, value ) => element.setAttribute( key, value ) );
	}
	else {
		mapStreamObjectToTarget( attributes, element );
	}
	
	style && applyStyle( element, style );
	
	dataset && applyDataset( element, dataset );
	
	events && applyEvents( element, events );
	
	classList && applyClassList( element, classList );
	
	ref && applyRef( element, ref );
}

export function applyClassList( element, classList ) {
	mapStreamObject( classList, function toggleClassName( className, shouldAdd ) {
		if( !!shouldAdd ) {
			element.classList.add( className );
		}
		else {
			element.classList.remove( className );
		}
	} );
}

export function applyStyle( element, style ) {
	if( style.constructor === String ) {
		element.style.cssText = style;
	}
	else {
		mapStreamObjectToTarget( style, element.style );
	}
}

export function applyDataset( element, dataset ) {
	mapStreamObjectToTarget( dataset, element.dataset );
}

export function applyEvents( element, events ) {
	for( const [ eventName, listener ] of Object.entries( events ) ) {
		listener && element.addEventListener( eventName, listener, false );
	}
}

function makeChildObserver( start, end ) {
	return function childObserver( streamValue ) {
		if( !Array.isArray( streamValue ) ) {
			streamValue = [ streamValue ];
		}
		
		const parent = start.parentNode;
		let oldElement = start.nextSibling;

		const valueIterator = streamValue[ Symbol.iterator ]();
		let { done, value } = valueIterator.next();

		// swap existing elements for the new ones
		while( !done && oldElement !== end ) {
			const newElement = makeOptionalChildNode( value );
			if( newElement === undefined ) {
				// ignore
			}
			else if( newElement !== oldElement ) {
				mountElement( parent, newElement, oldElement );
				//parent.replaceChild( newElement, oldElement );
				// move the replaced element to the end where it will be
				// considered for removal and unmount
				parent.insertBefore( oldElement, end );
				oldElement = newElement.nextSibling;
			}
			else {
				oldElement = oldElement.nextSibling;
			}
			( { done, value } = valueIterator.next() );
		}

		// add remaining new elements
		while( !done ) {
			const newElement = makeOptionalChildNode( value );
			if( newElement !== undefined ) {
				mountElement( parent, newElement, end );
			}
			( { done, value } = valueIterator.next() );
		}

		// remove remaining old elements
		while( oldElement !== end ) {
			const nextElement = oldElement.nextSibling;
			unmountElement( oldElement );
			parent.removeChild( oldElement );
			oldElement = nextElement;
		}
	};
}

function replaceNodeWithChild( parent, newChild, oldNode ) {
	let newNode = oldNode;
	if( newChild !== oldNode ) {
		newNode = makeOptionalChildNode( newChild );
		parent.replaceChild( newNode, oldNode );
	}
	return newNode;
}

function makeOptionalChildNode( child ) {
	return renderChild( child );
}

function renderChild( value ) {
	if( value === undefined || value === false || value === null ) {
		return undefined;
	}
	
	if( value instanceof Node ) {
		return value;
	}
	else if( isObservable( value ) ) {
		const fragment = document.createDocumentFragment();
		const start = document.createComment( "" );
		const end = document.createComment( "" );
		fragment.appendChild( start );
		fragment.appendChild( end );
		subscribeForDOM( makeChildObserver( start, end ), value );
		return fragment;
	}
	else if( Array.isArray( value ) ) {
		console.error("rendering array child");
		return undefined;
		/*const fragment = document.createDocumentFragment();
		for( const child of value ) {
			const childNode = renderChild( child );
			if( childNode !== undefined ) {
				fragment.appendChild( childNode );
				//mountElement( childNode );
			}
		}
		return fragment;*/
	}
	else {
		return document.createTextNode( value );
	}
}
