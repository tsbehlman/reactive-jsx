export function createRef(initialValue) {
    return {
        current: initialValue,
    };
}

export function applyRef(element, ref) {
    if (ref) {
        ref.current = element;
    }
}
