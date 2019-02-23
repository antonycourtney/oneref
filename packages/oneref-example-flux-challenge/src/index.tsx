import React from 'react';
import {appContainer, StateSetter} from 'oneref';
import ReactDOM from 'react-dom';
import Dashboard from './components/Dashboard';
import DashboardAppState from './dashboardAppState';
import { PlanetInfo } from './dashboardTypes';
import * as actions from './actions';

const init = (appState: DashboardAppState, setState: StateSetter<DashboardAppState>) => {
    const ws = new WebSocket('ws://localhost:4000');
    ws.onmessage = function (event) {
        setState(actions.updateObiWan(event.data));
    };
    // start things off
    actions.requestSithInfo(true,3616, setState);
}

const initialAppState = new DashboardAppState;

const DashboardApp = appContainer<DashboardAppState, {}>(initialAppState, Dashboard, [init]);

ReactDOM.render(<DashboardApp />,   document.getElementById('app'));
