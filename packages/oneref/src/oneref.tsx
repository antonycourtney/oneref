/*
 * Types and utilities for using the oneref pattern for state management 
 */

import * as React from 'react';
import { utils } from './utils';

export type StateTransformer<T> = (s: T) => T
export type StateSetter<T> = (st: StateTransformer<T>) => void
// type StateSetter<T> = React.Dispatch<React.SetStateAction<TodoAppState>>


export interface StateRefProps<S> {
    appState: S,
    setState: StateSetter<S>  
}

// ?? TODO: add optional cleanup handler:
// X<S> | [ X<S>, () => void]
export type InitialStateEffect<S> = (appState: S, setState: StateSetter<S>) => void | AsyncIterable<StateTransformer<S>>
export type StateChangeEffect<S> = (appState: S, setState: StateSetter<S>) => void

async function stStreamReader<AS>(setState: StateSetter<AS>, stream: AsyncIterable<StateTransformer<AS>>): Promise<void> {
    for await (const st of stream) {
        setState(st);
    }
}

function isAsyncIterable<S>(val: void | AsyncIterable<StateTransformer<S>>): val is AsyncIterable<StateTransformer<S>> {
    return (typeof val !== 'undefined');
}

/*
 * A higher-order component that holds the single mutable ref cell for top-level app state
 *
 */
export const appContainer = <AS extends {}, P extends {},B = {}>(
    s0: AS, 
    Comp: React.ComponentType<P & StateRefProps<AS>>,
    initEffect?: InitialStateEffect<AS>,
    onChangeEffect?: StateChangeEffect<AS>): React.FunctionComponent<P> => props => {

    const [appState, setState] = React.useState(s0);

    React.useEffect(() => {
        if (initEffect) {
            const v = initEffect(appState, setState);
            if (isAsyncIterable(v)) {
                stStreamReader(setState, v);
            }
        }   
    }, []);

    React.useEffect(() => {
        if (onChangeEffect) {
            onChangeEffect(appState, setState);
        }
    });

    return (
        <Comp {...props} appState={appState} setState={setState} />
    );
}

/*
 * Helper for state composition:
 *
 * Given an Outer Type (OT) and Inner Type (IT), and functional setters/getters for how to project and inject the
 * inner type from/to the outer type, return a function that can be used in a Hooks context to obtain the
 * [current state, updateState] functions for the inner type from the outer type and its update function.
 */
type ProjectFunc<OT, IT> = (o: OT) => IT
type InjectFunc<OT, IT> = (o: OT, i: IT) => OT  // i.e. functional update
type FocusFunc<OT, IT> = (o: OT, updateOuter: StateSetter<OT>) => [IT, StateSetter<IT>]
export const focus =
    <OT extends {},IT extends {}>(view: ProjectFunc<OT,IT>, inject: InjectFunc<OT,IT>): FocusFunc<OT, IT> => (o, updateOuter) => {
        const updInner = (itf: StateTransformer<IT>) => updateOuter(os => inject(os, itf(view(os))));
        return ([view(o), updInner]);
    }

export {utils as utils} from './utils';