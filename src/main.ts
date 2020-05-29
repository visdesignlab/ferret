import * as d3 from 'd3';
import { UploadFileButton } from './lib/UploadFileButton';


let toolbar = document.getElementById('toolbar');
let fileLoadButton = new UploadFileButton(toolbar, (data: string, filename: string) =>
{
	console.log(filename);
	console.log(data);
});