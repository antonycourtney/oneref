/*
 * A simulated service providing Todo list entries
 *
 */

type TodoListener = (entry: string) => void;

let entries = [
    "buy milk",
    "call the doctor",
    "pay rent",
    "get wedding present"
];

const INTERVAL = 2000;

const postEntry = (subState: string[], listener: TodoListener) => {
    const entry = subState.pop();
    if (entry) {
        listener(entry);
    }
    if (subState.length > 0) {
        setTimeout(() => postEntry(subState, listener), INTERVAL);
    }    
}

export const subscribe = (listener: TodoListener) => {
    // initialize subscription state from entries:
    const subState = entries.slice(0);
    setTimeout(() => postEntry(subState, listener), INTERVAL);
}


// Let's play with async iterators:
async function delay(waitTime: number): Promise<void> {
    const p = new Promise<void>((resolve, reject) => {
        setTimeout(resolve, waitTime);
    });
    return p;
}

export async function tryDelay(): Promise<void> {
    console.log('in tryDelay');
    await delay(5000);
    console.log('tryDelay: after delay 1');
    await delay(5000);
    console.log('tryDelay: done');
} 

async function* entryGenerator(genState: string[]): AsyncIterableIterator<string> {
    while (genState.length > 0) {
        await delay(2000);
        const entry = genState.pop();
        if (entry) {
            yield entry;
        }
    }
}

export async function genConsumer(): Promise<void> {
    console.log('genConsumer: entry');
    const gen: AsyncIterable<string> = entryGenerator(entries);
    for await (const s of gen) {
        console.log('genConsumer: ', s);
    }
    console.log('genConsumer: exit');
}