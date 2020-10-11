import { TabularData } from "./TabularData";
import { TableDisplay } from "./TableDisplay";
 
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

         let columnList = tabularData.columnList.map(d => d.id);
         
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
         this.drawDataColumnRows(columnList);
         this.drawSummaryRows(tabularData);
         this.attachChartControls();
    }


    private drawSummaryRows(tabularData: TabularData) {
        document.getElementById("numberOfRecords").innerHTML = "# of records: "+tabularData.rowLength;
        document.getElementById("numberOfColumns").innerHTML = "# of columns: "+tabularData.columnList.length;
    }

    private drawDataColumnRows(columnList: any[]): void {
        let parentDiv = document.getElementById("data-columns");
        for(let column of columnList) {
            let label = document.createElement("label");
            label.innerHTML = column;
            label.classList.add('controlsLabel');
            let input = document.createElement("input");
            input.type = "checkbox";
            input.checked = true;
            let div = document.createElement("div");
            div.appendChild(input);
            div.appendChild(label);
            parentDiv.appendChild(div);
        }

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

        leadingDigitSwitch.addEventListener("click", e => this.toggleChartVisibility(e, "benfordDist"));
        frequentValueSwitch.addEventListener("click", e => this.toggleChartVisibility(e, "duplicateCount"));
        valueDistSwitch.addEventListener("click", e => this.toggleChartVisibility(e, "overallDist"));

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
                        break
            }
        }

    }
}
