import * as Immutable from 'immutable';
import * as DT from './dashboardTypes';
import { StateSetter } from 'oneref';
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
      oldRequests.forEach((req) => (req !== null) ? req.abort() : null );
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
  const xhr = new XMLHttpRequest();
  xhr.onreadystatechange = () => {
    if (xhr.readyState===4 && xhr.status===200) {
      const parsedSithStatus = JSON.parse(xhr.response);
      console.log('parsed sith status: ', parsedSithStatus);
      updater((prevState) => {
        const st = prevState.updateSithStatus(parsedSithStatus);
        // Need invokeLater since we're within updater
        invokeLater(() => fillView(st,updater));
        return st;
      });
    }
  };
  xhr.open("GET",sithUrl(sithId.toString()),true);
  // fill in entry at pos indicating request for the given sith id,
  // and adding request to pending requestsById
  updater((st) => st.addPendingRequest(append,sithId,xhr));
  xhr.send();
}

/*
 * fill view by generating more requests if necessary
 */
function fillView(st: DashboardAppState, updater: StateSetter<DashboardAppState>) {
  const lastSith = st.lastKnownSith();
  if (st.needsApprentice(lastSith)) {
    console.log('needs apprentice: ', lastSith!.info.toJS());
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