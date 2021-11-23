import * as d3 from "d3";
import { UploadFileButton } from './lib/UploadFileButton';
import { TabularData } from './TabularData';
import { TableDisplay } from './TableDisplay';
import { ControlsDisplay } from './ControlsDisplay';
import { IgnoreSelection } from './IgnoreSelection';
import { HighlightSelection } from './HighlightSelection';

// let tableContainer = document.getElementById('tableContainer');
let vizTableContainer = document.getElementById('tableContainer');
let dataTableContainer = document.getElementById('lineupContainerOuter');
let tableDisplay = new TableDisplay();

tableDisplay.SetContainer(vizTableContainer);
let outerContainer = document.getElementById('outerContainer');
let uploadOnlyContainerOuter = document.getElementById('uploadOnlyContainerOuter');
let uploadOnlyContainerInner = document.getElementById('uploadOnlyContainerInner');
let toolbarContainer = document.getElementById('toolbar');
let controlsContainer = document.getElementById('controlsContainer');
let descriptionContainer = document.getElementById('description');
let controlsDisplay = new ControlsDisplay(toolbarContainer, controlsContainer, descriptionContainer, vizTableContainer, dataTableContainer);
// ignoreDropdown.Init(toolbarContainer);
// highlightDropdown.Init(toolbarContainer);

let ignoreDropdown = new IgnoreSelection(toolbarContainer);
let highlightDropdown = new HighlightSelection(toolbarContainer);



let clear = () : void =>
{
	toolbarContainer.innerHTML = '';
}



let init = (data: string, filename: string) =>
{
	clear();		// clearing all the existing elements.
	const bigStyle = false;

	let navigateHomeDiv = document.createElement('div');
	navigateHomeDiv.classList.add('customButton');
	let navigateHomeLink = document.createElement('a');
	navigateHomeLink.href = './';
	navigateHomeLink.innerHTML = '<i class="fas fa-home"></i> Home'
	navigateHomeDiv.appendChild(navigateHomeLink);
	toolbarContainer.appendChild(navigateHomeDiv);

	let fileLoadButton = new UploadFileButton(toolbarContainer, init, bigStyle);
	let tabularData: TabularData = TabularData.FromString(data);
	controlsDisplay.drawControls(tabularData);
	const defaultVizShown = [true, false, false, false, false];
	controlsDisplay.SetData(tabularData, defaultVizShown);
	tableDisplay.SetData(tabularData, defaultVizShown);
	ignoreDropdown.SetData(tableDisplay.lineup);
	highlightDropdown.SetData(tableDisplay.lineup);

	// controlsDisplay.updateChartVisibility();
	// controlsDisplay. // todo show correct viz rows at the beginning correctly
	ignoreDropdown.drawSetup();
	highlightDropdown.drawSetup();
	document.title = filename;
	uploadOnlyContainerOuter.classList.add('noDisp');
	outerContainer.classList.remove('noDisp');

}

let urlParams = new URLSearchParams(document.location.search)
if (urlParams.has('data_path'))
{
	let filename = urlParams.get('data_path');
	d3.text(filename).then(data =>
	{
		init(data, filename)
	});
}
else
{
	const bigStyle = true;
	const fileLoadButton = new UploadFileButton(uploadOnlyContainerInner, init, bigStyle);
}

