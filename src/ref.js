export function createRef( initialValue ) {
	return {
		current: initialValue
	};
}

export function applyRef( element, ref ) {
	ref && ( ref.current = element );
}
