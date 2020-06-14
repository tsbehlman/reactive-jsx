import { getExtensions } from "./withExtensions.js";
import { mapStreamObjectToTarget, mapStreamObject } from "./extensionUtils.js";
import { subscribeForDOM, isObservable } from "./observableUtils.js";
import { withCurrentCleanupContext, withNewCleanupContext, cleanupElement } from "./cleanup.js";

export class Element {
	constructor( component, props, children ) {
		this.component = component;
		this.props = props;
		this.children = children;
		this.extensions = getExtensions();
		this.node = undefined;
	}

	render() {
		if( this.node === undefined ) {
			if( this.component.constructor === String ) {
				this.node = renderNode( this.component, this.props, this.children, this.extensions );
			}
			else {
				this.node = renderChild( this.component( this.props, this.children ) );
			}
		}
		
		return this.node;
	}
}

function renderNode( tagName, props, children, extensions ) {
	const element = document.createElement( tagName );
	
	for( const extension of extensions ) {
		props = extension( props, element );
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
		mapStreamObject( classes, function toggleClassName( className, shouldAdd ) {
			if( !!shouldAdd ) {
				element.classList.add( className );
			}
			else {
				element.classList.remove( className );
			}
		} );
	}
	
	if( ref !== undefined ) {
		ref.current = element;
	}
	
	for( const child of children ) {
		element.appendChild( renderChild( child ) );
	}
	return element;
}

function makeChildObserver( start, end ) {
	return withCurrentCleanupContext( function childObserver( streamValue ) {
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
			if( newElement !== oldElement ) {
				parent.replaceChild( newElement, oldElement );
				// move the replaced element to the end where it will be
				// considered for removal and cleanup
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
			parent.insertBefore( newElement, end );
			( { done, value } = valueIterator.next() );
		}

		// remove remaining old elements
		while( oldElement !== end ) {
			const nextElement = oldElement.nextSibling;
			cleanupElement( oldElement );
			parent.removeChild( oldElement );
			oldElement = nextElement;
		}
	} );
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
	return withNewCleanupContext( renderChild )( child );
}

function renderChild( value ) {
	if( value instanceof Node ) {
		return value;
	}
	else if( value instanceof Element ) {
		return value.render();
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
		const fragment = document.createDocumentFragment();
		for( const child of value ) {
			fragment.appendChild( renderChild( child ) );
		}
		return fragment;
	}
	else {
		return document.createTextNode( value );
	}
}
