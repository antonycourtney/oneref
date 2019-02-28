import React from 'react';
import {appContainer, StateRef, StateChangeEffect, utils as onerefUtils, InitialStateEffect, updateState} from 'oneref';
import ReactDOM from 'react-dom';
import Dashboard from './components/Dashboard';
import DashboardAppState from './dashboardAppState';
import { PlanetInfo } from './dashboardTypes';
import * as actions from './actions';
import * as Immutable from 'immutable';

type ObiWanListener = (event: any) => void;

const obiWanSubscribe = (listener: ObiWanListener) => {
    const ws = new WebSocket('ws://localhost:4000');
    ws.onmessage = function (event) {
        const parsedUpdate = JSON.parse(event.data);
        listener(parsedUpdate);
    }
} 

const init: InitialStateEffect<DashboardAppState> = (appState: DashboardAppState, stateRef: StateRef<DashboardAppState>) => {
    const serviceIter = onerefUtils.publisherAsyncIterable(obiWanSubscribe);
    const stIter = onerefUtils.aiMap(serviceIter, actions.updateObiWan);
    // start things off
    actions.requestSithInfo(true,3616, stateRef);
    return stIter;
}

const onStateChange: StateChangeEffect<DashboardAppState> = (appState: DashboardAppState, stateRef: StateRef<DashboardAppState>) => {
    console.log('onStateChange: pending requests: ', appState.pendingRows().count(), ', oldRequests: ', appState.oldRequests.count());

    const oldRequests = appState.oldRequests;
    if (oldRequests.count() > 0) {
        oldRequests.forEach((req) => req ? req.abort() : null);  // cancel old requests
        updateState(stateRef, st => st.set('oldRequests', Immutable.List()));
    }
    // fill in any needed parts of view:
    actions.fillView(appState, stateRef);
}

const initialAppState = new DashboardAppState;

const DashboardApp = appContainer<DashboardAppState, {}>(initialAppState, Dashboard, init, onStateChange);

ReactDOM.render(<DashboardApp />,   document.getElementById('app'));
