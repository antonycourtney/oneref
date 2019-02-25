import * as Immutable from 'immutable';
import * as DT from './dashboardTypes';
import { StateSetter, StateTransformer } from 'oneref';
import DashboardAppState from './dashboardAppState';

const sithUrl = (id: string) => `http://localhost:3000/dark-jedis/${id}`

export const updateObiWan = (parsedLocation: any): StateTransformer<DashboardAppState> =>
  state => {
    const obiWanLocation = new DT.PlanetInfo(parsedLocation);
    const locState = state.set('obiWanLocation',obiWanLocation);
    // Requirement: clear all pending if matching sith:
    const nextState = locState.matchingSith() ? locState.clearPendingRequests() : locState;
    return nextState;
  }

// Perform the actual fetch operation, await the results, and update state:
async function fetchSithInfo(sithId: number, signal: AbortSignal, updater: StateSetter<DashboardAppState>): Promise<void> {
  try {
    const response = await fetch(sithUrl(sithId.toString()), {signal});
    const parsedSithStatus = await response.json();
    console.log('got fetch response: ', parsedSithStatus);
    updater((prevState) => {
      const st = prevState.updateSithStatus(parsedSithStatus);
      return st;
    });
  } catch (err) {
      // request was aborted...ignore
      console.log('caught abort fetching sith status for id ', sithId, ' (ignored)');
  }
}

export function requestSithInfo(append: boolean, sithId: number, updater: StateSetter<DashboardAppState>): void {
  const controller = new AbortController();
  const signal = controller.signal;

  // fill in entry at pos indicating request for the given sith id,
  // and adding request to pending requestsById
  updater((st) => st.addPendingRequest(append, sithId, controller));
  // And spawn the async fetch request; note that we don't await the result
  fetchSithInfo(sithId, signal, updater);
}

/*
 * fill view by generating more requests if necessary
 */
export function fillView(st: DashboardAppState, updater: StateSetter<DashboardAppState>) {
  const lastSith = st.lastKnownSith();
  if (st.needsApprentice(lastSith)) {
    requestSithInfo(true,lastSith!.info.apprenticeId,updater);
  } else {
    const firstSith = st.firstKnownSith();
    if (st.needsMaster(firstSith)) {
       requestSithInfo(false,firstSith!.info.masterId,updater);
     }    
  }
}

export const scroll = (scrollAmount: number): StateTransformer<DashboardAppState> =>
  st => st.scrollAdjust(scrollAmount);
