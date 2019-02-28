/*
 * Types and utilities for using the oneref pattern for state management 
 */

import * as React from 'react';
import { utils } from './utils';

export type StateTransformer<T> = (s: T) => T
// A StateTransformer with an additional calculated value:
export type StateTransformerAux<T, A> = (s: T) => [T, A]

export type StateUpdater<T> = (st: StateTransformer<T>) => void
// This would also work:
//   type StateUpdater<T> = React.Dispatch<React.SetStateAction<T>>
// and is the type of setState returned from React's useState hook.
// But this also allows the dangerous form that just takes a new
// state; here we only accept a StateTransformer.

// a Promise resolution function for Promise<T>:
type Resolver<T> = (t: T) => void;

// internal state representation used by oneRef:
interface StateRep<T> {
    appState: T,
    resolvers: Resolver<T>[];
} 

// TODO: make this an opaque type
export type StateRef<T> = StateUpdater<StateRep<T>>

export interface StateRefProps<T> {
    appState: T,
    stateRef: StateRef<T>
}

export function updateState<T>(ref: StateRef<T>, tf: StateTransformer<T>) {
    ref(sr => ({ appState: tf(sr.appState), resolvers: sr.resolvers }))    
}

export async function updateStateAsync<T, A>(ref: StateRef<T>, tf: StateTransformerAux<T, A>): Promise<[T, A]> {
    return new Promise((resolve, reject) => {
        ref(sr => {
            const [appState, aux] = tf(sr.appState);
            const auxResolver = (s: T) => resolve([s, aux]);
            const resolvers = sr.resolvers;
            resolvers.push(auxResolver);
            return { appState, resolvers };
        })
    })
}

// ?? TODO: add optional cleanup handler:
// X<S> | [ X<S>, () => void]
export type InitialStateEffect<T> = (appState: T, stateRef: StateRef<T>) => void | AsyncIterable<StateTransformer<T>>
export type StateChangeEffect<T> = (appState: T, stateRef: StateRef<T>) => void

async function stStreamReader<AS>(setState: StateUpdater<AS>, stream: AsyncIterable<StateTransformer<AS>>): Promise<void> {
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
    as0: AS, 
    Comp: React.ComponentType<P & StateRefProps<AS>>,
    initEffect?: InitialStateEffect<AS>,
    onChangeEffect?: StateChangeEffect<AS>): React.FunctionComponent<P> => props => {

    const [containerState, stateRef] = React.useState({ appState: as0, resolvers: [] as Resolver<AS>[] });

    React.useEffect(() => {
        if (initEffect) {
            const v = initEffect(containerState.appState, stateRef);
            if (isAsyncIterable(v)) {
                stStreamReader(tf => updateState(stateRef, tf), v);
            }
        }   
    }, []);

    React.useEffect(() => {
        if (onChangeEffect) {
            onChangeEffect(containerState.appState, stateRef);
        }
        let resolver: Resolver<AS> | undefined;
        while ((resolver = containerState.resolvers.shift()) !== undefined) {
            resolver(containerState.appState);
        }
    });

    return (
        <Comp {...props} appState={containerState.appState} stateRef={stateRef} />
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
type FocusFunc<OT, IT> = (o: OT, updateOuter: StateUpdater<OT>) => [IT, StateUpdater<IT>]
export const focus =
    <OT extends {},IT extends {}>(view: ProjectFunc<OT,IT>, inject: InjectFunc<OT,IT>): FocusFunc<OT, IT> => (o, updateOuter) => {
        const updInner = (itf: StateTransformer<IT>) => updateOuter(os => inject(os, itf(view(os))));
        return ([view(o), updInner]);
    }

export {utils as utils} from './utils';