import * as d3 from 'd3';
import { UploadFileButton } from './lib/UploadFileButton';
import { TabularData } from './TabularData';
import { TableDisplay } from './TableDisplay';
import { VisDisplay } from './VisDisplay';
import { DescriptionDisplay } from './DescriptionDisplay';
import { ControlsDisplay } from './ControlsDisplay';
import { DropdownIgnore } from './DropdownIgnore';
import { DropdownHighlight } from './DropdownHighlight';

let dataTableContainer = document.getElementById('lineupContainerOuter');
let tableDisplay = new TableDisplay();
let visContainer = document.getElementById('customChartContainer');
let visDisplay = new VisDisplay(visContainer);

let outerContainer = document.getElementById('outerContainer');
let uploadOnlyContainerOuter = document.getElementById(
    'uploadOnlyContainerOuter'
);
let uploadOnlyContainerInner = document.getElementById(
    'uploadOnlyContainerInner'
);
let toolbarContainer = document.getElementById('toolbar');
let controlsContainer = document.getElementById('controlsContainer');
let descriptionContainer = document.getElementById(
    'description'
) as HTMLDivElement;

let descriptionDisplay = new DescriptionDisplay(descriptionContainer);

let controlsDisplay = new ControlsDisplay(
    toolbarContainer,
    controlsContainer,
    descriptionContainer,
    dataTableContainer
);

let ignoreDropdown = new DropdownIgnore(
    document.getElementById('ignore-toggle') as HTMLButtonElement
);
let highlightDropdown = new DropdownHighlight(
    document.getElementById('highlight-toggle') as HTMLButtonElement
);

let clear = (): void => {
    toolbarContainer.innerHTML = '';
};

let init = (data: string, filename: string) => {
    clear(); // clearing all the existing elements.
    const bigStyle = false;

    let navigateHomeLink = document.createElement('a');
    navigateHomeLink.classList.add('btn', 'btn-outline-primary');
    navigateHomeLink.href = './';
    navigateHomeLink.innerHTML =
        '<i class="fas fa-home customButtonIcon"></i>Home';
    toolbarContainer.appendChild(navigateHomeLink);

    let fileLoadButton = new UploadFileButton(toolbarContainer, init, bigStyle);
    let tabularData: TabularData = TabularData.FromString(data);
    controlsDisplay.drawControls(tabularData);
    const defaultVizShown = [true, false, false, false, false, false];
    controlsDisplay.SetData(tabularData, defaultVizShown);
    tableDisplay.SetData(tabularData);
    visDisplay.SetData(tableDisplay.lineup);
    ignoreDropdown.SetData(tableDisplay.lineup);
    highlightDropdown.SetData(tableDisplay.lineup);

    descriptionDisplay.init();

    document.title = filename;
    uploadOnlyContainerOuter.classList.add('d-none');
    outerContainer.classList.remove('d-none');
};

let urlParams = new URLSearchParams(document.location.search);
if (urlParams.has('data_path')) {
    let filename = urlParams.get('data_path');
    d3.text(filename).then(data => {
        init(data, filename);
    });
} else {
    const bigStyle = true;
    const fileLoadButton = new UploadFileButton(
        uploadOnlyContainerInner,
        init,
        bigStyle
    );
}
