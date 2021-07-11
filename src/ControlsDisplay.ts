import * as d3 from "d3";
import { TabularData } from "./TabularData";
import { TableDisplay } from "./TableDisplay";
import { Column } from "./Column";
import { DuplicateCountType } from "./lib/constants/filter";
 
export class ControlsDisplay
{

    charts = ['overallDist', 'duplicateCount', 'replicates', 'nGram', 'benfordDist'];
    chartNames = ['Value Distribution', 'Frequent Values', 'Replicates', 'N Grams', 'Leading Digit Frequency'];
    
    private _chartsShown : boolean[];
    public get chartsShown() : boolean[] {
        return this._chartsShown;
    }
    
    chartIndex : number = 0;

    public constructor(
        toolbarContainer: HTMLElement,
        controlsContainer: HTMLElement,
        descriptionContainer: HTMLElement,
        vizTableContainer: HTMLElement,
        dataTableContainer: HTMLElement
        )
    {
        this._toolbarContainer = toolbarContainer;
        this._controlsContainer = controlsContainer;
        this._descriptionContainer = descriptionContainer;
        this._vizTableContainer = vizTableContainer;
        this._dataTableContainer = dataTableContainer;
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

    private _vizTableContainer : HTMLElement;
    public get vizTableContainer() : HTMLElement {
        return this._vizTableContainer;
    }
    
    private _dataTableContainer : HTMLElement;
    public get dataTableContainer() : HTMLElement {
        return this._dataTableContainer;
    }    

    private _descriptionContainer : HTMLElement;
    public get descriptionContainer() : HTMLElement {
        return this._descriptionContainer;
    }
    
    private _data : TabularData;
    public get data(): TabularData {
        return this._data;
    }

    public SetData(data: TabularData, chartsShown: boolean[]) : void {
        this._data = data;
        this._chartsShown = chartsShown;
        this.updateChartVisibility();
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
        const settingsContainerWidth = 250;
        const padding = 10;
        this._controlsContainer.style.width = `${settingsContainerWidth}px`;
        this._controlsContainer.style.borderWidth = '1px';
        this._descriptionContainer.style.marginLeft = `${settingsContainerWidth + padding}px`;
        this._vizTableContainer.style.marginLeft = `${settingsContainerWidth + padding}px`;
        this._dataTableContainer.style.marginLeft = `${settingsContainerWidth + padding}px`;
        document.getElementById("settingsButton").classList.add("selected");
        this._show = true;
    }

    private hideControlsPanel(): void
    {
        const padding = 10;
        this._controlsContainer.style.width = "0px";
        this._controlsContainer.style.borderWidth = '0px';
        this._descriptionContainer.style.marginLeft = `${padding}px`;
        this._vizTableContainer.style.marginLeft = `${padding}px`;
        this._dataTableContainer.style.marginLeft = `${padding}px`;
        document.getElementById("settingsButton").classList.remove("selected");
        this._show = false;
    }

    public attachChartControls(): void {
        let nextSwitch = document.getElementById("next-step");
        let prevSwitch = document.getElementById("prev-step");
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
        });
        
        prevSwitch.addEventListener("click", e =>  
        {
            this.setChartIndex(this.chartIndex - 1);
        });


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
        document.dispatchEvent(new CustomEvent('drawVizRows', {detail: {data: this.data}}));
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

        this.updateChartVisibility();
    }

    private toggleChart(index: number, e: Event): void
    {
        this.chartsShown[index] = !this.chartsShown[index];
        const showCount: number = this.chartsShown.filter(Boolean).length;
        this.drawChartSelectRowsRows();
        e.stopPropagation();
    }

    private updateChartVisibility(): void
    {
        // this would maybe be better in TableDisplay.ts semantically.
        for (let i = 0; i < this.charts.length; i++)
        {
            const chartKey = this.charts[i];
            const visible = this.chartsShown[i];
            for (let j = 0; j < this.data.columnList.length; j++)
            {
                d3.select(`#${chartKey}-${j}`).classed('noDisp', !visible);
            }
        }

        d3.selectAll('zero-md')
            .data(this.chartsShown)
            .classed('noDisp', d => !d);

        d3.selectAll('.des-header')
            .data(this.chartsShown)
            .classed('noDisp', d => !d);

        d3.selectAll('.item-option-container')
            .data(this.chartsShown)
            .classed('noDisp', d => !d);
    }

}
