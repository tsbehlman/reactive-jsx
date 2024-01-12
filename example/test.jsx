import { render, onMount } from "reactive";
//import { createRef } from "reactive/ref";
import { Observable, Signal, map, combineArray, combine, switchLatest, fromPromise, mapError } from "reactive/observable";

const animationFrame = new Observable(({ next }) => {
    let currentFrame = -1;

    function frame() {
        next(Date.now());
        currentFrame = requestAnimationFrame(frame);
    }

    frame();

    return () => cancelAnimationFrame(currentFrame);
});

export default function TestComponent() {
    const counter = new Signal(1);

    function updateCounter(updater) {
        counter.set(value => Math.max(1, updater(value)));
    }

    return (
        <>
            <button onclick={e => updateCounter(i => i - 1)}>-</button>
            <code className="counter-label" dataset={{ content: counter }}>
                <Text nodeValue={counter} />
            </code>
            <button onclick={e => updateCounter(i => i + 1)}>+</button>
            <button onclick={e => updateCounter(i => 1)}>Reset</button>
            <hr />
            <Timer />
            <hr />
            <Moons phase={map(value => ((value - 1) / 6) % (2 * Math.PI), counter)} />
            <hr />
            <code style={{ opacity: map(pulse(10), counter) }}>{map(repeater(randomCharacter), counter)}</code>
            <hr />
            <Futurama count={counter} />
            <ul>
                {map(
                    randomRepeater(value => <li>{value + 1}</li>),
                    counter,
                )}
            </ul>
        </>
    );
}

function Moons({ phase }) {
    return (
        <svg width="96px" height="48px" viewBox="0 0 2 1">
            <Moon phase={phase} position="0.5 0" />
            <Moon phase={map(phase => Math.PI - phase, phase)} position="1.5 0" />
        </svg>
    );
}

function Moon({ phase, position }) {
    const leftRadius = map(phase => Math.cos(Math.min(phase, Math.PI)) / 2, phase);
    const rightRadius = map(phase => Math.cos(Math.max(phase, Math.PI)) / 2, phase);

    const leftSweepFlag = map(leftRadius => Number(leftRadius > 0), leftRadius);
    const rightSweepFlag = map(rightRadius => Number(rightRadius > 0), rightRadius);

    onMount(() => {
        console.log(`moon path mounted at position ${position}`);
    });

    const path = combineArray((leftRadius, leftSweepFlag, rightRadius, rightSweepFlag) => `M${position}` + `a${leftRadius} 0.5,0 0 ${leftSweepFlag},0 1` + `a${rightRadius} 0.5,0 0 ${rightSweepFlag},0-1`, [leftRadius, leftSweepFlag, rightRadius, rightSweepFlag]);

    return <path style="fill:#000" d={path} />;
}

function Timer() {
    const showTimer = new Signal(false);

    return (
        <>
            <label>
                <input type="checkbox" events={{ change: toggle(showTimer) }} checked={showTimer.get()} /> show timer
            </label>
            {map(showTimer => showTimer && <TimerContent />, showTimer)}
        </>
    );
}

function TimerContent() {
    const bold = new Signal(false);
    const italic = new Signal(true);

    //const timerRef = createRef();

    const time = map(timestamp => formatTime(new Date(timestamp)), animationFrame);

    onMount(() => {
        console.log("timer mounted");
        return () => {
            console.log("timer unmounted");
        };
    });

    return (
        <>
            <p classList={{ bold, italic }}>
                <Text nodeValue={time} />
            </p>
            <label>
                <input type="checkbox" onchange={toggle(bold)} checked={bold.get()} /> bold
            </label>
            <label>
                <input type="checkbox" onchange={toggle(italic)} checked={italic.get()} /> italic
            </label>
        </>
    );
}

function Futurama({ count }) {
    const character = new Signal("none");
    const quotes = switchLatest(combine((character, count) => fromPromise(character !== "none" ? fetch(`http://futuramaapi.herokuapp.com/api/characters/${character}/${count}`).then(response => response.json()) : Promise.reject(), []), character, count));

    return (
        <>
            <select events={{ change: e => character.set(e.target.value) }} value={character.get()}>
                <option value="none" selected>
                    Select a character
                </option>
                <option value="fry">Fry</option>
                <option value="bender">Bender</option>
            </select>
            <ul style="min-height: 1em">
                {mapError(
                    error => (
                        <div>Something went wrong! Try selecting a character?</div>
                    ),
                    map(
                        quotes =>
                            quotes.map(({ quote }) => (
                                <li>
                                    <Text nodeValue={quote} />
                                </li>
                            )),
                        quotes,
                    ),
                )}
            </ul>
        </>
    );
}

function leftPad(padding, value) {
    return (padding + String(value)).slice(-padding.length);
}

function formatTime(date) {
    const n = value => leftPad("00", value);
    return `${leftPad("00", date.getHours())}:${leftPad("00", date.getMinutes())}:${leftPad("00", date.getSeconds())}.${leftPad("000", date.getMilliseconds())}`;
}

render(TestComponent, {}, document.body);

function repeater(callback) {
    return n => new Array(n).fill(undefined).map((v, i) => callback(i));
}

function randomRepeater(callback) {
    const repeaterForCallback = repeater(callback);
    return n => repeaterForCallback(Math.round(Math.random() * n));
}

function randomCharacter() {
    return String.fromCharCode(Math.round(Math.random() * (127 - 33) + 33));
}

function pulse(period) {
    return t => (Math.cos((t * 2 * Math.PI) / period) + 1) / 2;
}

function toggle(signal) {
    return () => signal.set(value => !value);
}
