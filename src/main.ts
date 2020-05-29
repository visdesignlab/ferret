import * as d3 from 'd3';
import { UploadFileButton } from './lib/UploadFileButton';
import { TabularData } from './TabularData';


let toolbar = document.getElementById('toolbar');
let fileLoadButton = new UploadFileButton(toolbar, (data: string, filename: string) =>
{
	let tabularData: TabularData = TabularData.FromString(data);
	console.log(filename);
	console.log(tabularData);
});