import * as Immutable from 'immutable';
import * as DT from './dashboardTypes';
import { StateSetter, StateTransformer } from 'oneref';
import DashboardAppState from './dashboardAppState';

const sithUrl = (id: string) => `http://localhost:3000/dark-jedis/${id}`

function invokeLater(f: TimerHandler) {
  window.setTimeout(f, 0);
}

export const updateObiWan = (parsedLocation: any): StateTransformer<DashboardAppState> =>
  state => {
    const obiWanLocation = new DT.PlanetInfo(parsedLocation);
    return state.set('obiWanLocation',obiWanLocation);
  }


/*
 * most of the rest of this logic needs to go into a state change effect:
 *
export function updateObiWan(parsedLocation: any,updater: StateSetter<DashboardAppState>) {
  const obiWanLocation = new DT.PlanetInfo(parsedLocation);
  updater((prevState) => {
    const locState = prevState.set('obiWanLocation',obiWanLocation);
    if (locState.matchingSith()) {
      const { nextState, oldRequests } = locState.clearPendingRequests();
      oldRequests.forEach((req) => {
        if (req !== null) {
          console.log('aborting request!'); 
          req.abort(); 
        }
      });
      return nextState;
    } else {
      // may need to restart filling the view:
      // Need invokeLater since we're within updater
      invokeLater(() => fillView(locState,updater));
      return locState;
    }
  });
}
*/

// Perform the actual fetch operation, await the results, and update state:
async function fetchSithInfo(sithId: number, signal: AbortSignal, updater: StateSetter<DashboardAppState>): Promise<void> {
  try {
    const response = await fetch(sithUrl(sithId.toString()), {signal});
    const parsedSithStatus = await response.json();
    console.log('got fetch response: ', parsedSithStatus);
    updater((prevState) => {
      const st = prevState.updateSithStatus(parsedSithStatus);
      // Need invokeLater since we're within updater
      invokeLater(() => fillView(st,updater));
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
function fillView(st: DashboardAppState, updater: StateSetter<DashboardAppState>) {
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

export function scroll(scrollAmount: number, updater: StateSetter<DashboardAppState>) {
  updater((prevState) => {
    const {nextState, oldRequests} = prevState.scrollAdjust(scrollAmount);
    oldRequests.forEach((req) => req ? req.abort() : null);  // cancel old requests
    // Need invokeLater since we're within updater
    invokeLater(() => fillView(nextState,updater));
    return nextState;
  });
}