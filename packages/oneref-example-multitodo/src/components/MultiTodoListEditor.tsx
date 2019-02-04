import React from 'react';
import TodoAppState from '../todoAppState';
import MultiTodoAppState from '../multiTodoAppState';
import * as oneref from 'oneref';
import TodoListEditor from './TodoListEditor';

type MultiTodoListEditorProps = {} & oneref.StateRefProps<MultiTodoAppState>;

const workFocus = oneref.mkFocus<MultiTodoAppState, TodoAppState>(as => as.work, (as, w) => as.set('work', w));
const personalFocus = oneref.mkFocus<MultiTodoAppState, TodoAppState>(as => as.personal, (as, p) => as.set('personal', p));


const MultiTodoListEditor: React.FunctionComponent<MultiTodoListEditorProps> = ({appState, setState}: MultiTodoListEditorProps) => {
    const [workTodos, updateWorkTodos] = workFocus(appState, setState);
    const [personalTodos, updatePersonalTodos] = personalFocus(appState, setState);
    
    return (
      <>
        <TodoListEditor label='work' appState={workTodos} setState={updateWorkTodos} />
        <TodoListEditor label='personal' appState={personalTodos} setState={updatePersonalTodos} />
      </>  
    )
}

export default MultiTodoListEditor;