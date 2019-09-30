const { Fragment, Text } = Reactive;

function repeater( callback ) {
	return n => ( new Array( n ) ).fill( undefined ).map( ( v, i ) => callback( i ) );
}

function randomRepeater( callback ) {
	return n => repeater( callback )( Math.round( Math.random() * n ) );
}

function randomCharacter() {
	return String.fromCharCode( Math.round( Math.random() * ( 127 - 33 ) ) + 33 );
}

function pulse( period ) {
	return t => ( Math.cos( t * 2 * Math.PI / period ) + 1 ) / 2;
}

function TestComponent() {
	let [ counter, setCounter ] = Reactive.useState( 1 );
	counter = counter.map( i => Math.max( 1, i ) ).multicast();
	
	return (
		<Fragment>
			<button events={{ click: e => setCounter( i => i - 1 ) }}>-</button>
			<code className="counter-label" dataset={{ content: counter }}>
				<Text nodeValue={ counter }/>
			</code>
			<button events={{ click: e => setCounter( i => i + 1 ) }}>+</button>
			<button events={{ click: e => setCounter( i => 1 ) }}>Reset</button>
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
		</Fragment>
	);
}
