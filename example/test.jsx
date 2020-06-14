import * as Reactive from "../";
import { Text } from "../";
import { useSignal } from "../src/state";
import { map } from "../src/observable";

export default function TestComponent() {
	const counter = useSignal( 1 ).extend( i => Math.max( 1, i ) );
	
	const bold = useSignal( false );
	const italic = useSignal( false );
	
	return (
		<>
			<button events={{ click: e => counter.set( i => i - 1 ) }}>-</button>
			<code className="counter-label"  classes={{ bold, italic }} dataset={{ content: counter }}>
				<Text nodeValue={ counter }/>
			</code>
			<button events={{ click: e => counter.set( i => i + 1 ) }}>+</button>
			<button events={{ click: e => counter.set( i => 1 ) }}>Reset</button>
			<hr/>
			<label>
				<input type="checkbox" events={{ change: toggle( bold ) }} checked={ bold.get() }/> bold
			</label>
			<label>
				<input type="checkbox" events={{ change: toggle( italic ) }} checked={ italic.get() }/> italic
			</label>
			<hr/>
			<code style={{ opacity: map( pulse( 10 ), counter ) }}>
				{ map( repeater( randomCharacter ), counter ) }
			</code>
			<hr/>
			<ul>
				{ map( randomRepeater( value => (
					<li>{ value + 1 }</li>
				) ), counter ) }
			</ul>
		</>
	);
}

Reactive.render( <TestComponent />, document.body );

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
