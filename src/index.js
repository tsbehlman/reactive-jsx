import { createComponent } from "./render.js";

export function template( html, wrappedContent ) {
	const templateElement = document.createElement( "template" );
	templateElement.innerHTML = html;
	const node = templateElement.content.firstChild;
	return wrappedContent ? node.firstChild : node;
};

export function fragment( html, wrappedContent ) {
	const templateElement = document.createElement( "template" );
	templateElement.innerHTML = html;
	if( wrappedContent ) {
		const wrapperNode = templateElement.content.firstChild;
		while( wrapperNode.firstChild !== null ) {
			templateElement.content.appendChild( wrapperNode.firstChild );
		}
		templateElement.content.removeChild( wrapperNode );
	}
	return templateElement.content;
}

export function render( component, props, parentNode ) {
	const reactiveNode = createComponent( component, props );
	reactiveNode.render();
	reactiveNode.mount( parentNode );
	return () => reactiveNode.unmount();
}

export { withExtensions } from "./withExtensions.js";
export { onMount, onUnmount } from "./mount.js";
export * from "./components.js";
export * from "./render.js";
export { applyRef } from "./ref.js";
