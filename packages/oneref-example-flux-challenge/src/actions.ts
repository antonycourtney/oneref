import * as Immutable from 'immutable';
import * as DT from './dashboardTypes';
import { StateSetter, StateTransformer } from 'oneref';
import DashboardAppState from './dashboardAppState';

const sithUrl = (id: string) => `http://localhost:3000/dark-jedis/${id}`

function invokeLater(f: TimerHandler) {
  window.setTimeout(f, 0);
}

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

export function requestSithInfo(append: boolean,sithId: number,updater: StateSetter<DashboardAppState>) {

  const controller = new AbortController();
  const signal = controller.signal;

  const req = fetch(sithUrl(sithId.toString()), {signal})
    .then(response => response.json())
    .then(parsedSithStatus => {
      console.log('got fetch response: ', parsedSithStatus);
      updater((prevState) => {
        const st = prevState.updateSithStatus(parsedSithStatus);
        // Need invokeLater since we're within updater
        invokeLater(() => fillView(st,updater));
        return st;
      });
    })
    .catch(err => {
      // request was aborted...ignore
      console.log('caught abort fetching sith status for id ', sithId, ' (ignored)');
    })
  // fill in entry at pos indicating request for the given sith id,
  // and adding request to pending requestsById
  updater((st) => st.addPendingRequest(append,sithId,controller));
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