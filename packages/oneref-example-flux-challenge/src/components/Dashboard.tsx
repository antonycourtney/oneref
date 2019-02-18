import React from 'react';
import * as oneref from 'oneref';
import DashboardAppState from '../dashboardAppState';
import PlanetMonitor from './PlanetMonitor';
import SithScrollableList from './SithScrollableList';

type DashboardProps = {} & oneref.StateRefProps<DashboardAppState>;

const Dashboard: React.FunctionComponent<DashboardProps> = ({appState, setState}: DashboardProps) => {
    return (
        <div className="app-container">
        <div className="css-root">
          <PlanetMonitor currentPlanet={appState.obiWanLocation} />
          <SithScrollableList appState={appState} setState={setState} />
        </div>
      </div>
    )
}

export default Dashboard;