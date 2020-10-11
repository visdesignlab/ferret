import * as d3 from 'd3';
import { UploadFileButton } from './lib/UploadFileButton';
import { TabularData } from './TabularData';
import { TableDisplay } from './TableDisplay';
import { ControlsDisplay } from './ControlsDisplay';

let tableContainer = document.getElementById('tableContainer');
let tableDisplay = new TableDisplay();
tableDisplay.SetContainer(tableContainer);
let toolbarContainer = document.getElementById('toolbar');
let controlsContainer = document.getElementById('controlsContainer');
let controlsDisplay = new ControlsDisplay(toolbarContainer, controlsContainer, tableContainer);
let fileLoadButton = new UploadFileButton(toolbarContainer, (data: string, filename: string) =>
{
	let tabularData: TabularData = TabularData.FromString(data);
	controlsDisplay.drawControls(tabularData);
	controlsDisplay.SetData(tabularData);
	tableDisplay.SetData(tabularData);
	document.title = filename;
});