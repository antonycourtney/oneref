import React from 'react';
import * as oneref from 'oneref';
import DashboardAppState from '../dashboardAppState';

type DashboardProps = {} & oneref.StateRefProps<DashboardAppState>;

const Dashboard: React.FunctionComponent<DashboardProps> = ({appState, setState}: DashboardProps) => {

    return (
        <>
            <h1>Dashboard!</h1>
        </>
    )
}

export default Dashboard;