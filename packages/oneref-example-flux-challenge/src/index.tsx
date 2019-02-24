import React from 'react';
import {appContainer, StateSetter, StateChangeEffect} from 'oneref';
import ReactDOM from 'react-dom';
import Dashboard from './components/Dashboard';
import DashboardAppState from './dashboardAppState';
import { PlanetInfo } from './dashboardTypes';
import * as actions from './actions';

let subscribed = false;
const onStateChange: StateChangeEffect<DashboardAppState> = (appState: DashboardAppState, setState: StateSetter<DashboardAppState>) => {
    if (!subscribed) {
        const ws = new WebSocket('ws://localhost:4000');
        ws.onmessage = function (event) {
            // console.log('got update message: ', event.data);
            const parsedUpdate = JSON.parse(event.data);
            actions.updateObiWan(parsedUpdate, setState);
        };
        // start things off
        actions.requestSithInfo(true,3616, setState);
        console.log('requested sith info...');
        subscribed = true;
    }
}

const initialAppState = new DashboardAppState;

const DashboardApp = appContainer<DashboardAppState, {}>(initialAppState, Dashboard, undefined, onStateChange);

ReactDOM.render(<DashboardApp />,   document.getElementById('app'));
