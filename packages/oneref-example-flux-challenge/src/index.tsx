import React from 'react';
import {appContainer, StateSetter, StateChangeEffect, utils as onerefUtils, InitialStateEffect} from 'oneref';
import ReactDOM from 'react-dom';
import Dashboard from './components/Dashboard';
import DashboardAppState from './dashboardAppState';
import { PlanetInfo } from './dashboardTypes';
import * as actions from './actions';


type ObiWanListener = (event: any) => void;

const obiWanSubscribe = (listener: ObiWanListener) => {
    const ws = new WebSocket('ws://localhost:4000');
    ws.onmessage = function (event) {
        const parsedUpdate = JSON.parse(event.data);
        listener(parsedUpdate);
    }
} 

const init: InitialStateEffect<DashboardAppState> = (appState: DashboardAppState, setState: StateSetter<DashboardAppState>) => {
    const serviceIter = onerefUtils.publisherAsyncIterable(obiWanSubscribe);
    const stIter = onerefUtils.aiMap(serviceIter, actions.updateObiWan);
    // start things off
    actions.requestSithInfo(true,3616, setState);
    return stIter;
}

const onStateChange: StateChangeEffect<DashboardAppState> = (appState: DashboardAppState, setState: StateSetter<DashboardAppState>) => {
}

const initialAppState = new DashboardAppState;

const DashboardApp = appContainer<DashboardAppState, {}>(initialAppState, Dashboard, onStateChange);

ReactDOM.render(<DashboardApp />,   document.getElementById('app'));
