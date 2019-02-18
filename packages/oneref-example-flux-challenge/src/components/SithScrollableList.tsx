import React from 'react';
import { PlanetInfo, SithRow } from '../dashboardTypes';
import DashboardAppState from '../dashboardAppState';
import { StateSetter } from 'oneref';
import SithRowViewer from './SithRowViewer';
import * as actions from '../actions';
import classNames from 'classnames';

interface SithScrollableListProps {
    appState: DashboardAppState;
    setState: StateSetter<DashboardAppState>;
}

const SithScrollableList = ({appState, setState}: SithScrollableListProps) => {
    const handleScrollUp = (event: React.MouseEvent) => {
        event.preventDefault();
        actions.scroll(-2, setState);
    }
    const handleScrollDown = (event: React.MouseEvent) => {
        event.preventDefault();
        actions.scroll(2, setState);
    }
    
    const siths = appState.sithList.take(5);
    const currentPlanet = appState.obiWanLocation;
    const sithRows = siths.map((sr,k) => <SithRowViewer sithRow={sr} currentPlanet={currentPlanet} key={k} /> );
    const upDisabled = !(appState.canScrollUp());
    const downDisabled = !(appState.canScrollDown());
    const upClassName = classNames('css-button-up', {"css-button-disabled": upDisabled});
    const downClassName = classNames('css-button-down', {"css-button-disabled": downDisabled});
    return (
      <section className="css-scrollable-list">
        <ul className="css-slots">
          {sithRows}
        </ul>
        <div className="css-scroll-buttons">
          <button className={upClassName} disabled={upDisabled} onClick={handleScrollUp}></button>
          <button className={downClassName} disabled={downDisabled} onClick={handleScrollDown}></button>
        </div>      
      </section>
    );
}

export default SithScrollableList;
