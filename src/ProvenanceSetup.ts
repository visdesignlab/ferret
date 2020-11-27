import { initProvenance, NodeID, createAction } from '@visdesignlab/trrack';
import { ProvVisCreator } from '@visdesignlab/trrack-vis';
import { TableDisplay } from './TableDisplay';
import { Filter } from './Filter';

/**
 * interface representing the state of the application
 */
export interface NodeState {
  hoveredNode: string;
  appliedFilter: Filter | null;
  removedFilter: Filter | null;
}

/**
 * Initial state
 */

const initialState: NodeState = {
  hoveredNode: 'none',
  appliedFilter: null,
  removedFilter: null,
};

type EventTypes = 'Hover Node' | 'Applied Filter' | 'Removed Filter';

// initialize provenance with the first state
const prov = initProvenance<NodeState, EventTypes, string>(initialState, {
  loadFromUrl: false,
});

/**
 * Function called when a node is hovered. Applies an action to provenance.
 */

const hoverAction = createAction<NodeState, any, EventTypes>(
  (state: NodeState, newHover: string) => {
    state.hoveredNode = newHover;
    return state;
  },
);

export const hoverNodeUpdate = function (newHover: string) {
  hoverAction
    .setLabel(newHover === '' ? 'Hover Removed' : `${newHover} Hovered`)
    .setEventType('Hover Node');
    prov.apply(hoverAction(newHover));
};


const applyFilterAction = createAction<NodeState, any, EventTypes>(
  (state: NodeState, newFilter: Filter) => {
    state.appliedFilter = newFilter;
    return state;
  },
);

export const applyFilterUpdate = function (newFilter: Filter) {
  applyFilterAction
    .setLabel(newFilter === null ? 'None' : `${newFilter.column.id} filtered`)
    .setEventType('Applied Filter');

  prov.apply(applyFilterAction(newFilter));
};

const removedFilterAction = createAction<NodeState, any, EventTypes>(
  (state: NodeState, newFilter: Filter) => {
    state.removedFilter = newFilter;
    return state;
  },
);

export const removedFilterUpdate = function (removedFilter: Filter) {
  removedFilterAction
    .setLabel(removedFilter === null ? 'None' : `${removedFilter.column.id} filter removed`)
    .setEventType('Applied Filter');

  prov.apply(removedFilterAction(removedFilter));
};

// Create function to pass to the ProvVis library for when a node is selected in the graph.
// For our purposes, were simply going to jump to the selected node.
const visCallback = function (newNode: NodeID) {
  prov.goToNode(newNode);
};

// Set up observers for the three keys in state. These observers will get called either when
// an applyAction function changes the associated keys value.

// Also will be called when an internal graph change such as goBackNSteps, goBackOneStep or goToNode
// change the keys value.

/**
 * Observer for when the hovered node state is changed. Calls hoverNode in scatterplot to update vis.
 */
prov.addObserver(
  (state) => state.hoveredNode,
  () => {
    let tableDisplay = new TableDisplay();
    tableDisplay.hoverNode(prov.getState(prov.current).hoveredNode);
  },
);

prov.done();

// Setup ProvVis once initially
ProvVisCreator<NodeState, EventTypes, string>(document.getElementById('provDiv')!, prov, visCallback);

// Undo function which simply goes one step backwards in the graph.
function undo() {
  prov.goBackOneStep();
}

// Redo function which traverses down the tree one step.
function redo() {
  if (prov.current.children.length === 0) {
    return;
  }
  prov.goForwardOneStep();
}

// Setting up undo/redo hotkey to typical buttons
document.onkeydown = function (e) {
  const mac = /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform);

  if (!e.shiftKey && (mac ? e.metaKey : e.ctrlKey) && e.which === 90) {
    undo();
  } else if (e.shiftKey && (mac ? e.metaKey : e.ctrlKey) && e.which === 90) {
    redo();
  }
};