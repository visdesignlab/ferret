import * as d3 from 'd3';
import { Filter } from './Filter';
import { applyFilterUpdate, removedFilterUpdate } from "./ProvenanceSetup";
import { TabularData } from './TabularData';
import * as filterNames from "./lib/constants/filter";
import LineUp from 'lineupjs';
import FerretColumn, { FerretSelection } from './FerretColumn';
import { duplicate } from 'vega-lite';

export abstract class SelectionDropdown extends EventTarget
{

    // constructor() {
    //     super();
    //     // document.addEventListener('onDataChange', (e: CustomEvent) => this.SetData(e.detail.data));
    // }

    private _id: string;
    public get id(): string {
        return this._id;
    }

    private _toolbarContainer: HTMLElement;
    public get container(): HTMLElement {
        return this._toolbarContainer;
    }

    private _lineupInstance : LineUp;
    public get lineupInstance() : LineUp {
        return this._lineupInstance;
    }

    private _title : string;
    public get title() : string {
        return this._title;
    }

    private _iconType : string;
    public get iconType() : string {
        return this._iconType;
    }

    private _actionWord : string;
    public get actionWord() : string {
        return this._actionWord;
    }   

    
    private _globalAccessor : () => FerretSelection;
    public get globalAccessor() : () => FerretSelection {
        return this._globalAccessor;
    }
    
    
    private _localAccessor : (col: FerretColumn) => FerretSelection;
    public get localAccessor() : (col: FerretColumn) => FerretSelection {
        return this._localAccessor;
    }
    
    private _onRowclick : (val: {col: FerretColumn, val: number}) => void;
    public get onRowclick() : (val: {col: FerretColumn, val: number}) => void {
        return this._onRowclick;
    }    

    public SetData(lineup: LineUp): void
    {
        this._lineupInstance = lineup;
    }


    public Init(
        id: string,
        container: HTMLElement,
        title: string,
        iconType: string,
        actionWord: string,
        globalAccessor: () => FerretSelection,
        localAccessor: (col: FerretColumn) => FerretSelection,
        onRowClick: (val: {col: FerretColumn, val: number}) => void): void
    {
        this._id = id;
        this._toolbarContainer = container;
        this._title = title;
        this._iconType = iconType;
        this._actionWord = actionWord;
        this._localAccessor = localAccessor;
        this._globalAccessor = globalAccessor;
        this._onRowclick = onRowClick;
    }

    // protected _selectionType: filterNames.SelectionType;
    // public get selectionType(): filterNames.SelectionType {
    //     return this._selectionType;
    // }

    // public SetSelectionType(selectionType: filterNames.SelectionType) {
    //     this._selectionType = selectionType;
    // }

    // protected filterData(filter: Filter | null, data: TabularData | null, localData: TabularData | null): void {}

    public drawSetup(): void {

        let div = document.createElement("div");

        let button = document.createElement("div");

        let icon = document.createElement("i")
        icon.classList.add("fas", "fa-"+this.iconType, "customButtonIcon");
        button.appendChild(icon);

        let buttonText = document.createElement("span");
        buttonText.innerHTML = this.title;
        button.appendChild(buttonText);

        let countText = document.createElement("span");
        countText.id = this.id+"Count";
        button.appendChild(countText);

        let dropdownIcon = document.createElement("i")
        dropdownIcon.classList.add("fas", "fa-chevron-circle-down", "customButtonIconRight");
        button.appendChild(dropdownIcon);

        button.id = this.id+"Button";
        button.classList.add("customButton");

        let dropdownMenu = document.createElement("div");
        dropdownMenu.id = this.id+"DropdownMenu";
        dropdownMenu.classList.add('dropdown-content');

        div.appendChild(button);
        div.appendChild(dropdownMenu);
        div.classList.add('dropdown');

        button.addEventListener("click", e => this.toggleSelectionDropdown(this.id+"DropdownMenu"));
        this._toolbarContainer.appendChild(div);
        this.drawFilterCount();
    }

    private toggleSelectionDropdown(selectionDropdownMenuID: string ) {
        let dropdownMenu = document.getElementById(selectionDropdownMenuID);
        if(dropdownMenu.classList.contains('show'))
            dropdownMenu.classList.remove('show');
        else 
            dropdownMenu.classList.add('show');
    }

    private getListOfSelectionValues(): {
        col: FerretColumn | null;
        val: number;
    }[]
    {
        const selectionVals: {
            col: FerretColumn | null;
            val: number;
        }[] = []

        const globalVals = [...this.globalAccessor().values].map(val => {
            return {
                col: null,
                val: val
            }
        });
        selectionVals.push(...globalVals);

        const firstRanking = this.lineupInstance.data.getFirstRanking();
        const ferretColumns: FerretColumn[] = firstRanking.flatColumns.filter(col => col instanceof FerretColumn) as FerretColumn[];

        const ferretColumnsWithFilter: FerretColumn[] = ferretColumns.filter(col => this.localAccessor(col).values.size > 0);
        const localVals = ferretColumnsWithFilter.map(col => [...this.localAccessor(col).values].map(val => {
            return {
                col: col,
                val: val
            }
        })).flat();

        selectionVals.push(...localVals);
        return selectionVals;
    }

    private drawDropdown() {
        let dropdownMenu = document.getElementById(this._id + 'DropdownMenu');
        // if(this._id == "highlight") 
        //     this.addChangeToFilterOption(filters);

        const selectionVals = this.getListOfSelectionValues();
        let firstFerretColumn: FerretColumn;
        for (let selectionVal of selectionVals)
        {
            if (selectionVal.col)
            {
                firstFerretColumn = selectionVal.col;
                break;
            }
        }

        const selectorString = '#' + this._id + 'DropdownMenu';
        const dropdownMenuSelect = d3.select(selectorString);
        
        dropdownMenuSelect.selectAll('div')
            .data(selectionVals)
            .join('div')
            .classed('dropdown-item', true)
            .attr('title', 'select to remove filter')
            .on('click', (d) => this.onRowclick(d))
            .each((d, i, nodes) => {
                const element: HTMLDivElement = nodes[i] as HTMLDivElement;   
                
                const valueSpan: HTMLSpanElement = document.createElement('span');
                valueSpan.classList.add('selection-label', 'value');
                valueSpan.innerText = d.val.toString();

                const columnSpan: HTMLSpanElement = document.createElement('span');
                columnSpan.classList.add('selection-label', 'column-label');
                columnSpan.innerText = d.col !== null ? `${d.col.desc.label} (${d.col.id})` : `ALL`;

                const trashSpan: HTMLSpanElement = document.createElement('span');
                trashSpan.classList.add('trash-container');
                trashSpan.innerHTML = '<i class="fas fa-trash"></i>';

                element.innerHTML = `Value ${valueSpan.outerHTML} ${this.actionWord} in ${columnSpan.outerHTML}${trashSpan.outerHTML}`
            });
    }

    private addChangeToFilterOption(filters: Array<Filter>) {
        let icon = document.createElement("i")
        icon.classList.add("fas", "fa-filter", "customButtonSubIcon");
        let dropdownMenu = document.getElementById(this._id+"DropdownMenu");
        let filterItemDiv = document.createElement('div');
        filterItemDiv.classList.add('dropdown-item');
        let selectedDataDiv = document.createElement('span');
        selectedDataDiv.innerHTML = 'TRANSFORM TO FILTER';
        selectedDataDiv.classList.add('selection-label');
        filterItemDiv.appendChild(icon);
        filterItemDiv.appendChild(selectedDataDiv);
        dropdownMenu.appendChild(filterItemDiv);
        // filterItemDiv.addEventListener("click", () => this.changeToFilter());
    }

    // private changeToFilter() {
    //     for(let f of this._filters) 
    //         document.dispatchEvent(new CustomEvent('addFilter', {detail: {filter: f}}));
        
    //     for(let f of this._filters) 
    //         document.dispatchEvent(new CustomEvent('addHighlight', {detail: {filter: f}}));
        
    // }

    private getBackgroundColor(chart: string): string {
        switch(chart) {
            case filterNames.LEADING_DIGIT_FREQ_SELECTION: return '#4db6ac';
            case filterNames.FREQUENT_VALUES_SELECTION: return '#e57373';
            case filterNames.N_GRAM_SELECTION: return '#ff8f00';
            default: return '#eeeeee';
        }
    }

    public drawFilterCount(): void {
        let filterCountText = document.getElementById(this._id+"Count");
        let filterList = this.getListOfSelectionValues();
        filterCountText.innerHTML = "("+filterList.length+")";
    }
    
    // public selectFilter(filter: Filter) : void
    // { 
    //     if(this._filters == null || this._filters.length == 0) 
    //         this._filters = [];

    //     let selectedFilter = this.find(filter, this._filters);
    //     if(selectedFilter == null) 
    //         this.addFilter(filter);

    // }

    // private find(filter: Filter, filters: Array<Filter>): Filter {
    //     if(filters == null || filters.length == 0 || filter == null) return null;
    //     for(let f of filters) {
    //         let selectedFilterData = filter.selectedData.map((x) => x).sort().toString();
    //         let iterableFilterData = f.selectedData.map((x) => x).sort().toString();
    //         if(f.chart == filter.chart && f.column.id == filter.column.id && selectedFilterData == iterableFilterData)
    //             return f;
    //     }
    //     return null;
    // }

    public onSelectionChange(): void 
    {
        console.log('recompile pls');
        // this._filters.push(filter);
        // applyFilterUpdate(filter, this._selectionType);
        // this.filterData(filter, this._data, this._localData);
        this.drawFilterCount();
        this.drawDropdown();
    }

    // private removeFilter(filter: Filter): void 
    // {
    //     this._filters = this._filters.filter(f => { return f.id != filter.id});
    //     this.drawFilterCount();
    //     this.filterData(filter, this._data, this._localData);
    //     removedFilterUpdate(filter, this._selectionType);
    //     this.drawDropdown(this._filters);
    // }    
}   