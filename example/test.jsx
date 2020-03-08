const { Text, useSignal } = Reactive;

export default function TestComponent() {
	const counter = useSignal( 1 )
		.extend( stream => stream.map( i => Math.max( 1, i ) ) );
	
	const bold = useSignal( false );
	const italic = useSignal( false );
	
	return (
		<>
			<button events={{ click: e => counter.set( i => i - 1 ) }}>-</button>
			<code className="counter-label" classes={{ bold, italic }} dataset={{ content: counter }}>
				<Text nodeValue={ counter }/>
			</code>
			<button events={{ click: e => counter.set( i => i + 1 ) }}>+</button>
			<button events={{ click: e => counter.set( i => 1 ) }}>Reset</button>
			<hr/>
			<label>
				<input type="checkbox" events={{ change: toggle( bold ) }} checked={ bold }/> bold
			</label>
			<label>
				<input type="checkbox" events={{ change: toggle( italic ) }} checked={ italic }/> italic
			</label>
			<hr/>
			<code style={{ opacity: counter.map( pulse( 10 ) ) }}>
				{ counter.map( repeater( randomCharacter ) ) }
			</code>
			<hr/>
			<ul>
				{ counter.map( randomRepeater( value => (
					<li>{ value + 1 }</li>
				) ) ) }
			</ul>
		</>
	);
}

function repeater( callback ) {
	return n => ( new Array( n ) ).fill( undefined ).map( ( v, i ) => callback( i ) );
}

function randomRepeater( callback ) {
	const repeaterForCallback = repeater( callback );
	return n => repeaterForCallback( Math.round( Math.random() * n ) );
}

function randomCharacter() {
	return String.fromCharCode( Math.round( Math.random() * ( 127 - 33 ) + 33 ) );
}

function pulse( period ) {
	return t => ( Math.cos( t * 2 * Math.PI / period ) + 1 ) / 2;
}

function toggle( signal ) {
	return () => signal.set( value => !value );
}
