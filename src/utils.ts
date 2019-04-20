import { StateRef, StateTransformer, update } from './core';
/*
 * some generic utilities that are useful in conjunction with oneref
 */
namespace utils {
    // A generic routine to turn a publisher type interface into an async iterator:
    export type Listener<T> = (v: T) => void;
    export type Publisher<T> = (l: Listener<T>) => void;

    // Type of a resolve function for a promise:
    type Resolver<T> = (v?: T) => void;

    export async function* publisherAsyncIterable<T>(
        subscribe: Publisher<T>
    ): AsyncIterable<T> {
        // We'll maintain a queue of promises that always has at least one entry.
        // The iterator will pop the next promise off the queue, await the result and yield that value.
        // The listener will resolve the last promise in the queue and append a Promise to be used
        // for the next item.
        let nextResolver: Resolver<T> | null = null;
        let queue: Promise<T>[] = [];
        const pushNext = () => {
            queue.push(
                new Promise((resolve, reject) => {
                    nextResolver = resolve;
                })
            );
        };

        pushNext();
        subscribe(v => {
            nextResolver!(v); // should never be null
            pushNext();
        });

        // And now the iterator logic:
        while (true) {
            const v = await queue.shift()!;
            yield v;
        }
    }

    // 'map' over an async iterable:
    export async function* aiMap<A, B>(
        src: AsyncIterable<A>,
        f: (a: A) => B
    ): AsyncIterable<B> {
        for await (const a of src) {
            yield f(a);
        }
    }

    export async function delay(waitTime: number): Promise<void> {
        const p = new Promise<void>((resolve, reject) => {
            setTimeout(resolve, waitTime);
        });
        return p;
    }

    export async function updateFromIterable<AS>(
        ref: StateRef<AS>,
        stream: AsyncIterable<StateTransformer<AS>>
    ): Promise<void> {
        for await (const st of stream) {
            update(ref, st);
        }
    }
} // namespace

export { utils };
