import * as Immutable from 'immutable';
import { PlanetInfoProps, PlanetInfo, SithInfo, SithRow, INVALID_ID } from './dashboardTypes';

export const VIEWPORT_SIZE = 5;
export const SCROLL_ROWS = 2;

interface RowInfo {
  index: number;
  info: SithInfo;
}

/**
 * Dashboard application state as an Immutable record
 */
interface DashboardAppStateProps {
  obiWanLocation: PlanetInfo | null,      // null or PlanetInfo()
  sithList: Immutable.List<SithRow | null> // fixed size (VIEWPORT_SIZE)
}

const defaultDashboardAppStateProps : DashboardAppStateProps = {
  obiWanLocation: null,      
  sithList: Immutable.Repeat(null,VIEWPORT_SIZE).toList()
}

export default class DashboardAppState extends Immutable.Record(defaultDashboardAppStateProps) {

  /**
   * handle a response to a pending request update to sith status
   *
   * @return {DashboardAppState} -- app state with the status of the sith with 
   */
  updateSithStatus(pstat: any): DashboardAppState {
    const idx = this.sithList.findIndex((entry) => (entry !== null) && entry.id === pstat.id);
    if (idx === -1)
      return this; // id has been scrolled out of view
    const sithInfo = new SithInfo({
      id: pstat.id, name: pstat.name, homeworld: new PlanetInfo(pstat.homeworld),
      masterId: ((pstat.master!==null) && (pstat.master.id!==null)) ? pstat.master.id : INVALID_ID,
      apprenticeId: ((pstat.apprentice!==null) && (pstat.apprentice.id)) ? pstat.apprentice.id : INVALID_ID
    });
    const updRow = (this.sithList.get(idx) as SithRow).set('info', sithInfo).set('request', null);
    const updList = this.sithList.set(idx, updRow);
    return this.set('sithList', updList);
  }

  lastKnownSith(): RowInfo | null {
    const index = this.sithList.findLastIndex((v) => v !== null && v.info !== null);
    if (index===-1)
      return null;
    const lastRow = this.sithList.get(index) as SithRow;
    return { index, info: lastRow.info as SithInfo};
  }

  firstKnownSith() {
    const index = this.sithList.findIndex((v) => v !== null && v.info !== null);
    if (index===-1)
      return null;
    const firstRow = this.sithList.get(index) as SithRow;
    return { index, info: firstRow.info as SithInfo};
  }

  /**
   * Should we fetch apprentice information for the given sith row?
   *
   * @param {RowInfo} ri - row info as returned from lastKnownSith
   */
  needsApprentice(ri: RowInfo | null): boolean {
    if (!ri)
      return false;
    const apprenticeId = ri.info.apprenticeId;
    return ((apprenticeId !== INVALID_ID) && (ri.index+1 < 5) && this.emptyRow(ri.index+1));
  }

  needsMaster(ri: RowInfo | null) {
    if (!ri)
      return false;
    const masterId = ri.info.masterId;
    return ((masterId !== INVALID_ID) && (ri.index > 0) && this.emptyRow(ri.index-1));
  }

  canScrollDown() {
    const ri = this.lastKnownSith();
    return (ri && ri.info.apprenticeId !== null 
      && this.bottomEmptyCount() < (VIEWPORT_SIZE-SCROLL_ROWS) 
      && !(this.matchingSith()));
  }

  canScrollUp() {
    const ri = this.firstKnownSith();
    return (ri && ri.info.masterId !== null 
      && this.topEmptyCount() < (VIEWPORT_SIZE-SCROLL_ROWS)
      && !(this.matchingSith()));
  }


  /**
   * Update sithList to indicate pending request
   */
  addPendingRequest(append: boolean,sithId: number,xhr: XMLHttpRequest) {
    var pos;
    if (append) {
      pos = this.sithList.findLastIndex((r) => (r!==null) && (r.info!==null)) + 1;
    } else {
      pos = this.sithList.findIndex((r) => (r!==null) && (r.info!==null)) - 1;
      if (pos < 0) {
        // shouldn't happen
        console.error("addPendingRequest: request to prepend before index 0 -- dropping", sithId);
        return this;
      }      
    }
    const sithRow = new SithRow({id: sithId, request: xhr});
    const updSithList = this.sithList.set(pos,sithRow);
    return this.set('sithList',updSithList);
  }

  /**
   * returns true iff the slot at index idx is empty
   * Note: row with pending request will not be considered empty
   */
   emptyRow(idx: number): boolean {
    const entry = this.sithList.get(idx);
    return !entry;
  }

  topEmptyCount(): number {
    const empties = this.sithList.takeWhile((e) => e===null);
    return empties.count();  
  }

  bottomEmptyCount(): number {
    const empties = this.sithList.reverse().takeWhile((e) => e===null);
    return empties.count();  
  }

  // returns true if there is a sith in sithList whose home planet matches
  // obiWanLocation
  matchingSith(): boolean {
    return this.sithList.some((r) => (r!==null) && (r.info!==null) && r!.info!.homeworld!.id === this.obiWanLocation!.id);
  }

  /**
   * Clear any rows with pendings requests
   *
   * @return {{nextState: DashboardAppState, oldRequests: Immutable.List<XMLHttpRequest> }}
   */
  clearPendingRequests(): { nextState: DashboardAppState; oldRequests: Immutable.List<XMLHttpRequest>; } {
    const isPending = (r: SithRow | null) => r!==null && r.request!==null;
    const pendingRows = this.sithList.filter(isPending) as Immutable.List<SithRow>;
    const oldRequests = pendingRows.map((r) => r.request) as Immutable.List<XMLHttpRequest>;
    const nextList = this.sithList.map((r) => isPending(r) ? null : r);
    const nextState = this.set('sithList',nextList);
    return { nextState, oldRequests };
  }

  /** 
   * adjust scroll position by specified amount
   * returns: { nextState: AppState, oldRequests: List<XHR> }
   */
  scrollAdjust(delta: number) {
    const offset = -1 * delta;
    var updList, droppedRows;
    if (offset >= 0) {
      // scrolling up, just prepend offset nulls to head of list:
      const filler = Immutable.Repeat(null, offset).toList();
      droppedRows = this.sithList.takeLast(offset);
      updList = filler.concat(this.sithList).take(VIEWPORT_SIZE);
    } else {
      // just slice off the right number of elements to shift them up:
      droppedRows = this.sithList.take(delta);
      const headElems = this.sithList.slice(delta);
      // and pad out with nulls:
      updList = headElems.concat(Immutable.Repeat(null,delta).toList());
    }
    const oldRequests = droppedRows.filter((r) => r!==null && r.request!==null).map((r) => r!.request);
    const nextState = this.set('sithList',updList);
    return {nextState,oldRequests};
  }
};