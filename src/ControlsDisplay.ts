import * as d3 from "d3";
import { TabularData } from "./TabularData";
import { TableDisplay } from "./TableDisplay";
import { Column } from "./Column";
import { DuplicateCountType } from "./lib/constants/filter";
import { FilterPicker } from "./components/filter-picker";
 
export class ControlsDisplay
{

    charts = ['overallDist', 'duplicateCount', 'replicates', 'nGram', 'benfordDist'];
    chartNames = ['Value Distribution', 'Frequent Values', 'Replicates', 'N Grams', 'Leading Digit Frequency'];
    chartsShown = [true, false, false, false, false];
    chartIndex : number = 0;

    public constructor(toolbarContainer: HTMLElement, controlsContainer: HTMLElement, tableContainer: HTMLElement)
    {
        this._toolbarContainer = toolbarContainer;
        this._controlsContainer = controlsContainer;
        this._tableContainer = tableContainer;
        this._show = false;
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

    private _show : boolean;
    public get show() : boolean {
        return this._show;
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
         this.showControlsPanel();
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
        if(this.show) {
            this.hideControlsPanel();
        }
        else {
            this.showControlsPanel();
        }
    }

    private showControlsPanel(): void
    {
        this._controlsContainer.style.width = "250px";
        this._tableContainer.style.marginLeft = "250px";
        document.getElementById("settingsButton").classList.add("selected");
        this._show = true;
    }

    private hideControlsPanel(): void
    {
        this._controlsContainer.style.width = "0px";
        this._tableContainer.style.marginLeft = "0px";
        document.getElementById("settingsButton").classList.remove("selected");
        this._show = false;
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

        d3.selectAll('.item')
            .on('click', (_d, i) =>
            {
                this.showOnly(i);
            });

        valueDistSwitch.addEventListener("click", e => this.toggleChart(0, e));
        frequentValueSwitch.addEventListener("click", e => this.toggleChart(1, e));
        repSwitch.addEventListener("click", e => this.toggleChart(2, e));
        nGramSwitch.addEventListener("click", e => this.toggleChart(3, e));
        leadingDigitSwitch.addEventListener("click", e => this.toggleChart(4, e));
       
        lsdSwitch.addEventListener("click", e => this.updateTable());
        uniqueValuesSwitch.addEventListener("click", e => this.updateTable());
        ngramCountSwitch.addEventListener("click", e => this.updateTable());
        repCountSwitch.addEventListener("click", e => this.updateTable());
        twoGramSwitch.addEventListener("click", e => this.updateTable());
        threeGramSwitch.addEventListener("click", e => this.updateTable());

        nextSwitch.addEventListener("click", e =>  
        {
            this.setChartIndex(this.chartIndex + 1);
            // document.dispatchEvent(new CustomEvent('goToNext', {detail: {data: this._data}}))
        }


        );
        
        prevSwitch.addEventListener("click", e =>  
        {
            this.setChartIndex(this.chartIndex - 1);
            // document.dispatchEvent(new CustomEvent('goToPrevious', {detail: {data: this._data}}))
        }


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
    

    private setChartIndex(index: number): void
    {
        if (index < 0 || index >= this.charts.length)
        {
            return
        }
        this.chartIndex = index;
        this.showOnly(this.chartIndex);
    }

    private showOnly(index: number): void
    {
        this.chartsShown.fill(false);
        this.chartsShown[index] = true;
        this.drawChartSelectRowsRows();
    }

    private drawChartSelectRowsRows(): void
    {
        const showCount: number = this.chartsShown.filter(Boolean).length;
        const disableIndexIndicator: boolean = showCount != 1;
        if (showCount === 1)
        {
            this.chartIndex = this.chartsShown.findIndex(Boolean);
        }

        d3.selectAll('.current-index')
            .classed('hide', (d,i) => i !== this.chartIndex)
            .classed('disable', disableIndexIndicator);

        d3.selectAll('.customButtonEyeIcon')
            .data(this.chartsShown)
            .classed('hidden', d => !d);
    }

    private toggleChart(index: number, e: Event): void
    {
        this.chartsShown[index] = !this.chartsShown[index];
        const showCount: number = this.chartsShown.filter(Boolean).length;
        this.drawChartSelectRowsRows();
        e.stopPropagation();
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
