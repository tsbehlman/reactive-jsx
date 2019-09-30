(function() {
	function factory( component, props, children = [] ) {
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
	
	function makeChildObserver( start, end ) {
		return function childObserver( streamValue ) {
			if( !Array.isArray( streamValue ) ) {
				streamValue = [ streamValue ];
			}
			
			const valueIterator = streamValue[ Symbol.iterator ]();
			let { done, value } = valueIterator.next();
			
			const parent = start.parentNode;
			let oldElement = start.nextSibling;
			
			while( !done && oldElement !== end ) {
				const nextElement = oldElement.nextSibling;
				replaceChildFactory( parent, value, oldElement );
				oldElement = nextElement;
				( { done, value } = valueIterator.next() );
			}
			
			while( !done ) {
				const newElement = childFactory( value );
				parent.insertBefore( newElement, end );
				( { done, value } = valueIterator.next() );
			}
			
			while( oldElement !== end ) {
				const nextElement = oldElement.nextSibling;
				parent.removeChild( oldElement );
				oldElement = nextElement;
			}
		};
	}
	
	function replaceChildFactory( parent, newChild, oldNode ) {
		if( newChild instanceof Node || newChild instanceof most.Stream || oldNode.nodeType !== Node.TEXT_NODE ) {
			parent.replaceChild( childFactory( newChild ), oldNode );
		}
		else {
			oldNode.nodeValue = newChild;
		}
	}
	
	function childFactory( child ) {
		if( child instanceof Node ) {
			return child;
		}
		else if( child instanceof most.Stream ) {
			const fragment = document.createDocumentFragment();
			const start = document.createComment( "/\\" );
			const end = document.createComment( "\\/" );
			fragment.appendChild( start );
			fragment.appendChild( end );
			child.observe( makeChildObserver( start, end ) );
			return fragment;
		}
		else {
			return document.createTextNode( child );
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
	
	function Element( tagName, props, children ) {
		const element = document.createElement( tagName );
		const { style, dataset, events, ...attributes } = props;
		
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
				element.addEventListener( eventName, listener, false );
			}
		}
		
		for( const child of children ) {
			element.appendChild( childFactory( child ) );
		}
		return element;
	}
	
	function Fragment( props, children ) {
		const fragment = document.createDocumentFragment();
		for( const child of children ) {
			fragment.appendChild( childFactory( child ) );
		}
		return fragment;
	}
	
	function Text( { nodeValue = "" }, children ) {
		if( nodeValue instanceof most.Stream ) {
			const node = document.createTextNode( "" );
			nodeValue.observe( value => node.nodeValue = value );
			return node;
		}
		else {
			return document.createTextNode( nodeValue );
		}
	}
	
	function useState( initialValue ) {
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
	
	window.Reactive = {
		factory,
		useState,
		Fragment,
		Text
	};
})();