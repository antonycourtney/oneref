/**
 * Generic AppContainer for unsing OneRef with React.
 *
 * usage:
 *
 *   import MyApp from './myApp';  // React class 
 *   <AppContainer appClass={MyApp} stateRef={...}  />,
 *
 * creates an instance of appClass, passing appState (current value of stateRef)
 * and stateRefUpdater as properties.
 *
 * Listens for changes on stateRef, setting local state (which will result in
 * re-rendering children) as needed.
 */ 

import React from 'react';
import * as OneRef from './oneRef';

function getAppState(stateRef) {
  return { appState: stateRef.getValue() }
}

export default class AppContainer extends React.Component {
  constructor(props) {
    super(props);
    this.state = getAppState(this.props.stateRef);
    this.state.stateRefUpdater = OneRef.refUpdater(this.props.stateRef);
    this.state.refListener = () => { this._onChange(); };
  }

  componentDidMount() {
    const stateRef=this.props.stateRef;
    stateRef.on("change",this.state.refListener);
  }

  componentWillUnmount() {
    const stateRef=this.props.stateRef;
    stateRef.removeListener("change",this.state.refListener);
  }

  /**
   * @return {object}
   */
  render() {
    const childProps = {appState: this.state.appState, stateRefUpdater: this.state.stateRefUpdater};
    const childElement=React.createElement(this.props.appClass,childProps);
    return childElement;
  }

  /**
   * Event handler for 'change' events coming from the TodoState
   */
  _onChange() {
    this.setState(getAppState(this.props.stateRef)); 
  }
}