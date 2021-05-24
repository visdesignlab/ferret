import * as d3 from "d3";
import { UploadFileButton } from './lib/UploadFileButton';
import { TabularData } from './TabularData';
import { TableDisplay } from './TableDisplay';
import { ControlsDisplay } from './ControlsDisplay';
import { FilterDisplay } from './FilterDisplay';
import { HighlightDisplay } from './HighlightDisplay';

let tableContainer = document.getElementById('tableContainer');
let tableDisplay = new TableDisplay();
let filterDisplay = new FilterDisplay();
let highlightDisplay = new HighlightDisplay();
tableDisplay.SetContainer(tableContainer);
let outerContainer = document.getElementById('outerContainer');
let uploadOnlyContainerOuter = document.getElementById('uploadOnlyContainerOuter');
let uploadOnlyContainerInner = document.getElementById('uploadOnlyContainerInner');
let toolbarContainer = document.getElementById('toolbar');
let controlsContainer = document.getElementById('controlsContainer');
let controlsDisplay = new ControlsDisplay(toolbarContainer, controlsContainer, tableContainer);
filterDisplay.SetContainer(toolbarContainer);
highlightDisplay.SetContainer(toolbarContainer);


let clear = () : void => {
	filterDisplay.clear();
	highlightDisplay.clear();
}

let init = (data: string, filename: string) =>
{
	clear();		// clearing all the existing elements.
	let tabularData: TabularData = TabularData.FromString(data);
	controlsDisplay.drawControls(tabularData);
	controlsDisplay.SetData(tabularData);
	tableDisplay.SetData(tabularData);
	filterDisplay.drawDropdown();
	highlightDisplay.drawDropdown();
	document.title = filename;
	uploadOnlyContainerOuter.classList.add('noDisp');
	outerContainer.classList.remove('noDisp');
}

let urlParams = new URLSearchParams(document.location.search)
let uploadContainer: HTMLElement;
let bigStyle: boolean;
if (urlParams.has('data_path'))
{
	let filename = urlParams.get('data_path');
	d3.text(filename).then(data =>
	{
		init(data, filename)
	});
	uploadContainer = toolbarContainer;
	bigStyle = false;
}
else
{
	uploadContainer = uploadOnlyContainerInner;
	bigStyle = true;
}
let fileLoadButton = new UploadFileButton(uploadContainer, init, bigStyle);

