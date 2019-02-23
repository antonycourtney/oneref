import React from 'react';
import {appContainer, StateSetter, InitialStateEffect, utils as onerefUtils} from 'oneref';
import ReactDOM from 'react-dom';
import TodoListEditor from './components/TodoListEditor';
import TodoAppState from './todoAppState';
import * as todoServer from './mockTodoServer';
import * as actions from './actions';

import 'todomvc-common/base.css'
import 'todomvc-app-css/index.css'

const initEffect: InitialStateEffect<TodoAppState> = (appState: TodoAppState) => {
    const serviceIter = onerefUtils.publisherAsyncIterable(todoServer.subscribe);
    const stIter = onerefUtils.aiMap(serviceIter, (item: string) => actions.create(item));
    return stIter;
}

/*
 * Not needed, but emits a few console logging messages
 * when called to show how this works.
 */
const changeEffect = (appState: TodoAppState, setState: StateSetter<TodoAppState>) => {
    console.log('changeEffect: ', appState.toJS());
    return () => {
        console.log('changeEffect: unsubscribe!');
    }
}

const initialAppState = new TodoAppState();

const TodoApp = appContainer<TodoAppState, {}>(initialAppState, TodoListEditor, [initEffect]); // , [initEffect], [changeEffect]);

ReactDOM.render(<TodoApp />, document.getElementsByClassName('todoapp')[0]);

// todoServer.tryDelay();
// todoServer.genConsumer();

async function testReader(): Promise<void> {
    console.log('testReader: enter');
    const iter = onerefUtils.publisherAsyncIterable(todoServer.subscribe);
    for await (const s of iter) {
        console.log('testReader: ', s);
    }
    console.log('testReader: exit');
}

// testReader();