import { TabularData } from "./TabularData";
import { TableDisplay } from "./TableDisplay";
import { Column } from "./Column";
import { DUPLICATE_COUNT_TYPE } from "./lib/constants/filter";
 
export class ControlsDisplay
{
    public constructor(toolbarContainer: HTMLElement, controlsContainer: HTMLElement, tableContainer: HTMLElement)
    {
        this._toolbarContainer = toolbarContainer;
        this._controlsContainer = controlsContainer;
        this._tableContainer = tableContainer;
    }

    
    private _toolbarContainer : HTMLElement;
    public get toolbarContainer() : HTMLElement {
        return this._toolbarContainer;
    }

    private _controlsContainer : HTMLElement;
    public get controlsContainer() : HTMLElement {
        return this._controlsContainer;
    }

    private _tableContainer : HTMLElement;
    public get tableContainer() : HTMLElement {
        return this._tableContainer;
    }

    private _data : TabularData;
    public SetData(data: TabularData) : void {
        this._data = data;
    }


    public drawControls(tabularData: TabularData): void {

         let settingsButton = document.createElement("div");

         let icon = document.createElement("i")
         icon.classList.add("fas", "fa-cogs", "customButtonIcon");
         settingsButton.appendChild(icon);

         let settingsButtonText = document.createElement("span");
         settingsButtonText.innerHTML = "Settings";
         settingsButton.appendChild(settingsButtonText);

         settingsButton.id = "settingsButton";
         settingsButton.classList.add("customButton", "customButtonIcon");
         settingsButton.addEventListener("click", e => this.toggleControlsPanel());
         this._toolbarContainer.appendChild(settingsButton);
         this.toggleControlsPanel();
         this.drawDataColumnRows(tabularData.columnList);
         this.drawSummaryRows(tabularData);
         this.attachChartControls();
    }


    private drawSummaryRows(tabularData: TabularData) {
        document.getElementById("numberOfRecords").innerHTML = "# of records: "+tabularData.rowLength;
        document.getElementById("numberOfColumns").innerHTML = "# of columns: "+tabularData.columnList.length;
    }

    private drawDataColumnRows(columnList: Column<String | Number>[]): void {
        let parentDiv = document.getElementById("data-columns");
        let columnName = columnList.map(d => d.id);
        for(let column of columnList) {
            let label = document.createElement("label");
            label.innerHTML = column.id;
            label.classList.add('controlsLabel');
            let input = document.createElement("input");
            input.type = "checkbox";
            input.checked = true;
            input.id = column+"-COL";
            input.addEventListener("click", e => this.toggleColumnDisplay(e, column, columnName.indexOf(column.id)));
            let div = document.createElement("div");
            div.appendChild(input);
            div.appendChild(label);
            parentDiv.appendChild(div);
        }

    }

    private toggleColumnDisplay(e: any, column: Column<Number | String>, index: number) {
      let tableDisplay = new TableDisplay();
      column.visible = !column.visible;
      tableDisplay.changeColumnVisibilty(index, column.visible);
    }

    private toggleControlsPanel(): void {

        let containerWidth = this._controlsContainer.style.width;
        if(containerWidth == "250px") {
            this._controlsContainer.style.width = "0px";
            this._tableContainer.style.marginLeft = "0px";
            document.getElementById("settingsButton").classList.remove("selected");
        }
        else {
            this._controlsContainer.style.width = "250px";
            this._tableContainer.style.marginLeft = "250px";
            document.getElementById("settingsButton").classList.add("selected");

        }
    }

    public attachChartControls(): void {
        let leadingDigitSwitch = document.getElementById("leading-digit-switch");
        let frequentValueSwitch = document.getElementById("freq-val-switch");
        let valueDistSwitch = document.getElementById("val-dist-switch");
        let uniqueValuesSwitch = document.getElementById("unique-values-switch");
        let nGramSwitch = document.getElementById("n-gram-switch");

        leadingDigitSwitch.addEventListener("click", e => this.toggleChartVisibility(e, "benfordDist"));
        frequentValueSwitch.addEventListener("click", e => this.toggleChartVisibility(e, "duplicateCount"));
        valueDistSwitch.addEventListener("click", e => this.toggleChartVisibility(e, "overallDist"));
        nGramSwitch.addEventListener("click", e => this.toggleChartVisibility(e, "nGram"));

        uniqueValuesSwitch.addEventListener("click", e => this.setupDuplicateCount(e));
    }

    private toggleChartVisibility(e: any, chartName: string): void {
        let tableDisplay = new TableDisplay();
        let eventTarget = e.target;

        if(eventTarget.classList.contains("shown")) {
            eventTarget.classList.remove("shown");
            eventTarget.classList.add("hidden");
            eventTarget.style.backgroundColor = "#eeeeee"; 
            tableDisplay.hideVizRows(chartName, this._data);
        }

        else if(eventTarget.classList.contains("hidden")) {
            eventTarget.classList.remove("hidden");
            eventTarget.classList.add("shown");
            tableDisplay.showVizRows(chartName, this._data);
            switch(chartName) {
                case "benfordDist": 
                        eventTarget.style.backgroundColor = "#4db6ac"; 
                        break;
                case "duplicateCount":
                        eventTarget.style.backgroundColor = "#e57373"; 
                        break;
                case "overallDist":
                        eventTarget.style.backgroundColor = "#ffb726"; 
                        break;
                case "nGram":
                        eventTarget.style.backgroundColor = "#ff8f00"; 
                        break;
            }
        }

    }

    private setupDuplicateCount(e: any) {
        let dupCountType: DUPLICATE_COUNT_TYPE = (e.target.checked) ? 'ALL' : 'TOP';
        let tableDisplay = new TableDisplay();
        tableDisplay.drawVizRows(this._data, dupCountType, 3);
    }
}
