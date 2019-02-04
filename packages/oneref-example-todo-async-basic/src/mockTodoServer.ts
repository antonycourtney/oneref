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

const postEntry = (listener: TodoListener) => {
    const entry = entries.pop();
    if (entry) {
        listener(entry);
    }
    if (entries.length > 0) {
        setTimeout(() => postEntry(listener), INTERVAL);
    }    
}

export const subscribe = (listener: TodoListener) => {
    setTimeout(() => postEntry(listener), INTERVAL);
}