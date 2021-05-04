import { TabularData } from "./TabularData";
import { TableDisplay } from "./TableDisplay";
import { Column } from "./Column";
import { DuplicateCountType } from "./lib/constants/filter";
import { FilterPicker } from "./components/filter-picker";
 
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

    public static updateCurrentSummary(data: TabularData) {
        document.getElementById("currentNumberOfRecords").innerHTML = "# of records: "+data.rowLength;
        document.getElementById("currentNumberOfColumns").innerHTML = "# of columns: "+data.columnList.length;
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
        let nextSwitch = document.getElementById("next-switch");
        let prevSwitch = document.getElementById("prev-switch");
        let leadingDigitSwitch = document.getElementById("leading-digit-switch");
        let frequentValueSwitch = document.getElementById("freq-val-switch");
        let valueDistSwitch = document.getElementById("val-dist-switch");
        let repSwitch = document.getElementById("rep-switch");
        let uniqueValuesSwitch = document.getElementById("unique-values-switch");
        let ngramCountSwitch = document.getElementById("ngram-count-switch");
        let repCountSwitch = document.getElementById("rep-count-switch");
        let twoGramSwitch = document.getElementById("2-gram-switch");
        let threeGramSwitch = document.getElementById("3-gram-switch");
        let nGramSwitch = document.getElementById("n-gram-switch");
        let lsdSwitch = document.getElementById("lsd-switch");

        leadingDigitSwitch.addEventListener("click", e => this.toggleChartVisibility(e, "benfordDist"));
        frequentValueSwitch.addEventListener("click", e => this.toggleChartVisibility(e, "duplicateCount"));
        valueDistSwitch.addEventListener("click", e => this.toggleChartVisibility(e, "overallDist"));
        nGramSwitch.addEventListener("click", e => this.toggleChartVisibility(e, "nGram"));
        repSwitch.addEventListener("click", e => this.toggleChartVisibility(e, 'replicates'));
       
        lsdSwitch.addEventListener("click", e => this.updateTable());
        uniqueValuesSwitch.addEventListener("click", e => this.updateTable());
        ngramCountSwitch.addEventListener("click", e => this.updateTable());
        repCountSwitch.addEventListener("click", e => this.updateTable());
        twoGramSwitch.addEventListener("click", e => this.updateTable());
        threeGramSwitch.addEventListener("click", e => this.updateTable());

        nextSwitch.addEventListener("click", e =>  
            document.dispatchEvent(new CustomEvent('goToNext', {detail: {data: this._data}}))
        );
        
        prevSwitch.addEventListener("click", e =>  
            document.dispatchEvent(new CustomEvent('goToPrevious', {detail: {data: this._data}}))
        );


    }

    public static getLSDStatus(): boolean {
        let lsdSwitch = document.getElementById("lsd-switch") as HTMLInputElement;
        let lowestSignificant = (lsdSwitch.checked) ? true : false;
        return lowestSignificant;
    }

    public static getNGramStatus() : number {
        let twoSwitch = document.getElementById("2-gram-switch") as HTMLInputElement;
        let n: number = (twoSwitch.checked) ? 2 : 3;
        return n;
    }

    public static getCountStatus(id: string) : DuplicateCountType {
        let countSwitch = document.getElementById(id) as HTMLInputElement;
        let dupCountType: DuplicateCountType = (countSwitch.checked) ? 'ALL' : 'TOP';
        return dupCountType;
    }

    private updateTable() {
        let tableDisplay = new TableDisplay();
        tableDisplay.SetData(this._data);
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

}
