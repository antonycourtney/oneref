import React from 'react';
import {appContainer, StateSetter} from 'oneref';
import ReactDOM from 'react-dom';
import Dashboard from './components/Dashboard';
import DashboardAppState from './dashboardAppState';
import { PlanetInfo } from './dashboardTypes';
import * as actions from './actions';

const initEffect = (appState: DashboardAppState, setState: StateSetter<DashboardAppState>) => {
    const ws = new WebSocket('ws://localhost:4000');
    ws.onmessage = function (event) {
        // console.log('got update message: ', event.data);
        const parsedUpdate = JSON.parse(event.data);
        actions.updateObiWan(parsedUpdate, setState);
    };
}

const sithUrl = (id: string) => `http://localhost:3000/dark-jedis/${id}`

const requestSithInfo = (sithId: number) => {
    const xhr = new XMLHttpRequest();
    xhr.onreadystatechange = () => {
        if (xhr.readyState===4 && xhr.status===200) {
        console.log('got XHR response: ', xhr.response);
        }
    };
    xhr.open("GET",sithUrl(sithId.toString()),true);
    xhr.send();
}
 
// start things off:
requestSithInfo(3616);
console.log('requested sith info...');


const initialAppState = new DashboardAppState;

const DashboardApp = appContainer<DashboardAppState, {}>(initialAppState, Dashboard);

ReactDOM.render(<DashboardApp />,   document.getElementById('app'));
