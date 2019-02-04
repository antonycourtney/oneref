import React from 'react';
import {appContainer, StateSetter} from 'oneref';
import ReactDOM from 'react-dom';
import TodoListEditor from './components/TodoListEditor';
import TodoAppState from './todoAppState';
import * as todoServer from './mockTodoServer';
import * as actions from './actions';

import 'todomvc-common/base.css'
import 'todomvc-app-css/index.css'

console.log('hello async!');

const initEffect = (appState: TodoAppState, setState: StateSetter<TodoAppState>) => {
    todoServer.subscribe((item: string) => {
        console.log('subscribe: got new item from server: ', item);
        setState(actions.create(item));
    })
    console.log('initEffect: subscribed to server updates');
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

const TodoApp = appContainer<TodoAppState, {}>(initialAppState, TodoListEditor, [initEffect], [changeEffect]);

ReactDOM.render(<TodoApp />, document.getElementsByClassName('todoapp')[0]);
