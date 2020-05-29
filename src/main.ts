import * as d3 from 'd3';
import { UploadFileButton } from './lib/UploadFileButton';
import { TabularData } from './TabularData';
import { TableDisplay } from './TableDisplay';

let tableContainer = document.getElementById('tableContainer');
let tableDisplay = new TableDisplay(tableContainer);

let toolbarContainer = document.getElementById('toolbar');
let fileLoadButton = new UploadFileButton(toolbarContainer, (data: string, filename: string) =>
{
	let tabularData: TabularData = TabularData.FromString(data);
	tableDisplay.SetData(tabularData);
	console.log(filename);
	console.log(tabularData);
});