import * as d3 from 'd3';
import { Filter } from './Filter';
import { applyFilterUpdate, removedFilterUpdate } from "./ProvenanceSetup";
import { TabularData } from './TabularData';
import * as filterNames from "./lib/constants/filter";
import LineUp from 'lineupjs';
import FerretColumn from './FerretColumn';
import { duplicate } from 'vega-lite';

export abstract class FilterDropdown extends EventTarget
{

    constructor() {
        super();
        document.addEventListener('onDataChange', (e: CustomEvent) => this.SetData(e.detail.data));
    }

    private _toolbarContainer: HTMLElement;
    public get container(): HTMLElement {
        return this._toolbarContainer;
    }

    public SetContainer(container: HTMLElement): void {
        this._toolbarContainer = container;
    }

    private _lineupInstance : LineUp;
    public get lineupInstance() : LineUp {
        return this._lineupInstance;
    }

    public SetLineUp(lineup: LineUp): void
    {
        this._lineupInstance = lineup;
    }
    
    
    protected _filters: Array<Filter>;
    public get filters(): Array<Filter> {
        return this._filters;
    }

    public SetFilters(filters: Array<Filter>): void {
        this._filters = filters;
    }

    protected _data: TabularData;
    public get data(): TabularData {
        return this._data;
    }

    public SetData(data: TabularData): void{
        this._data = data;
    }

    protected _localData: TabularData;
    public get localData(): TabularData {
        return this._localData;
    }

    public SetLocalData(localData: TabularData): void{
        this._localData = localData;
    }
    private _id: string;
    public get id(): string {
        return this._id;
    }

    public SetId(id: string) {
        this._id = id;
    }

    protected _selectionType: filterNames.SelectionType;
    public get selectionType(): filterNames.SelectionType {
        return this._selectionType;
    }

    public SetSelectionType(selectionType: filterNames.SelectionType) {
        this._selectionType = selectionType;
    }

    protected filterData(filter: Filter | null, data: TabularData | null, localData: TabularData | null): void {}

    public draw(filters: Array<Filter>, id: string, title: string, iconType: string): void {

        let div = document.createElement("div");

        let button = document.createElement("div");

        let icon = document.createElement("i")
        icon.classList.add("fas", "fa-"+iconType, "customButtonIcon");
        button.appendChild(icon);

        let buttonText = document.createElement("span");
        buttonText.innerHTML = title;
        button.appendChild(buttonText);

        let countText = document.createElement("span");
        countText.id = id+"Count";
        button.appendChild(countText);

        let dropdownIcon = document.createElement("i")
        dropdownIcon.classList.add("fas", "fa-chevron-circle-down", "customButtonIconRight");
        button.appendChild(dropdownIcon);

        button.id = id+"Button";
        button.classList.add("customButton");

        let dropdownMenu = document.createElement("div");
        dropdownMenu.id = id+"DropdownMenu";
        dropdownMenu.classList.add('dropdown-content');

        div.appendChild(button);
        div.appendChild(dropdownMenu);
        div.classList.add('dropdown');

        button.addEventListener("click", e => this.toggleFilterDropdown(id+"DropdownMenu"));
        this._toolbarContainer.appendChild(div);
        this.drawFilterCount(filters);
    }

    private toggleFilterDropdown(filterDropdownMenuID: string ) {
        let dropdownMenu = document.getElementById(filterDropdownMenuID);
        if(dropdownMenu.classList.contains('show'))
            dropdownMenu.classList.remove('show');
        else 
            dropdownMenu.classList.add('show');
    }

    private manageDropdown(filters: Array<Filter>) {
        let dropdownMenu = document.getElementById(this._id + 'DropdownMenu');
        if(this._id == "highlight") 
            this.addChangeToFilterOption(filters);


        const ignoreVals: {
            col: FerretColumn | null;
            val: number;
        }[] = []

        const globalVals = [...FerretColumn.globalFilter.ignoreValues].map(val => {
            return {
                col: null,
                val: val
            }
        });
        ignoreVals.push(...globalVals);

        const firstRanking = this.lineupInstance.data.getFirstRanking();
        const ferretColumns: FerretColumn[] = firstRanking.flatColumns.filter(col => col instanceof FerretColumn) as FerretColumn[];
        const firstFerretColumn = ferretColumns[0];
        const ferretColumnsWithFilter: FerretColumn[] = ferretColumns.filter(col => col.localFilter.ignoreValues.size > 0);
        const localVals = ferretColumnsWithFilter.map(col => [...col.localFilter.ignoreValues].map(val => {
            return {
                col: col,
                val: val
            }
        })).flat();

        ignoreVals.push(...localVals);

        const selectorString = '#' + this._id + 'DropdownMenu';
        const dropdownMenuSelect = d3.select(selectorString);
        const filterListSelect = dropdownMenuSelect.selectAll('div')
            .data(ignoreVals)
            .join('div')
            .classed('dropdown-item', true)
            // .attr('id', d => d.col.id)
            .attr('title', 'select to remove filter')
            .on('click', (d) => {
                if (d.col !== null)
                {
                    d.col.removeValueToIgnore(d.val, 'local')
                }
                else
                {
                    // need a column instance to fire correctly, but it
                    // does not matter which one.
                    firstFerretColumn.removeValueToIgnore(d.val, 'global');
                }
            })
            .each((d, i, nodes) => {
                const element: HTMLDivElement = nodes[i] as HTMLDivElement;   
                
                const valueSpan: HTMLSpanElement = document.createElement('span');
                valueSpan.classList.add('ignore-label', 'value');
                valueSpan.innerText = d.val.toString();

                const columnSpan: HTMLSpanElement = document.createElement('span');
                columnSpan.classList.add('ignore-label', 'column-label');
                columnSpan.innerText = d.col !== null ? `${d.col.desc.label} (${d.col.id})` : `ALL`;

                const trashSpan: HTMLSpanElement = document.createElement('span');
                trashSpan.classList.add('trash-container');
                trashSpan.innerHTML = '<i class="fas fa-trash"></i>';

                element.innerHTML = `Value ${valueSpan.outerHTML} ignored in ${columnSpan.outerHTML}${trashSpan.outerHTML}`
            });

        // filterListSelect.selectAll('span')
        //     .data(d => [d])
        //     .join('span')
        //     .classed('ignore-label', true)
        //     .classed('ignore-value', true)
        //     .text(d => d.val.toString())
            



        // for(let f of filters) {
        //     let filterItemDiv = document.createElement('div');
        //     filterItemDiv.classList.add('dropdown-item');
        //     filterItemDiv.id = f.id;
        //     filterItemDiv.addEventListener("click", e => this.removeFilter(new Filter(f.column, f.chart, f.selectedData, f.filterRange)));
            
        //     let columnDiv = document.createElement('span');
        //     let selectedDataDiv = document.createElement('span');
        //     columnDiv.innerHTML = f.filterRange == 'LOCAL' ? f.column.id : 'GLOBAL';
        //     columnDiv.classList.add('group-sub-header');
        //     selectedDataDiv.innerHTML = f.selectedData.toString();
        //     selectedDataDiv.style.backgroundColor = this.getBackgroundColor(f.chart);
        //     selectedDataDiv.classList.add('ignore-label');
        //     filterItemDiv.appendChild(selectedDataDiv);
        //     filterItemDiv.appendChild(columnDiv);
            
        //     dropdownMenu.appendChild(filterItemDiv);
        // }
    }

    private addChangeToFilterOption(filters: Array<Filter>) {
        let icon = document.createElement("i")
        icon.classList.add("fas", "fa-filter", "customButtonSubIcon");
        let dropdownMenu = document.getElementById(this._id+"DropdownMenu");
        let filterItemDiv = document.createElement('div');
        filterItemDiv.classList.add('dropdown-item');
        let selectedDataDiv = document.createElement('span');
        selectedDataDiv.innerHTML = 'TRANSFORM TO FILTER';
        selectedDataDiv.classList.add('ignore-label');
        filterItemDiv.appendChild(icon);
        filterItemDiv.appendChild(selectedDataDiv);
        dropdownMenu.appendChild(filterItemDiv);
        filterItemDiv.addEventListener("click", () => this.changeToFilter());
    }

    private changeToFilter() {
        for(let f of this._filters) 
            document.dispatchEvent(new CustomEvent('addFilter', {detail: {filter: f}}));
        
        for(let f of this._filters) 
            document.dispatchEvent(new CustomEvent('addHighlight', {detail: {filter: f}}));
        
    }

    private getBackgroundColor(chart: string): string {
        switch(chart) {
            case filterNames.LEADING_DIGIT_FREQ_SELECTION: return '#4db6ac';
            case filterNames.FREQUENT_VALUES_SELECTION: return '#e57373';
            case filterNames.N_GRAM_SELECTION: return '#ff8f00';
            default: return '#eeeeee';
        }
    }

    public drawFilterCount(filters: Array<Filter>): void {
        let filterCountText = document.getElementById(this._id+"Count");
        filterCountText.innerHTML = "("+filters.length+")";
    }
    
    public selectFilter(filter: Filter) : void
    { 
        if(this._filters == null || this._filters.length == 0) 
            this._filters = [];

        let selectedFilter = this.find(filter, this._filters);
        if(selectedFilter == null) 
            this.addFilter(filter);

    }

    private find(filter: Filter, filters: Array<Filter>): Filter {
        if(filters == null || filters.length == 0 || filter == null) return null;
        for(let f of filters) {
            let selectedFilterData = filter.selectedData.map((x) => x).sort().toString();
            let iterableFilterData = f.selectedData.map((x) => x).sort().toString();
            if(f.chart == filter.chart && f.column.id == filter.column.id && selectedFilterData == iterableFilterData)
                return f;
        }
        return null;
    }

    private addFilter(filter: Filter): void 
    {
        // this._filters.push(filter);
        // applyFilterUpdate(filter, this._selectionType);
        // this.filterData(filter, this._data, this._localData);
        // this.drawFilterCount(this._filters);
        this.manageDropdown(this._filters);
    }

    private removeFilter(filter: Filter): void 
    {
        this._filters = this._filters.filter(f => { return f.id != filter.id});
        this.drawFilterCount(this._filters);
        this.filterData(filter, this._data, this._localData);
        removedFilterUpdate(filter, this._selectionType);
        this.manageDropdown(this._filters);
    }    
}   