import { Filter } from './Filter';
import { applyFilterUpdate, removedFilterUpdate } from "./ProvenanceSetup";
import { TabularData } from './TabularData';
import * as filterNames from "./lib/constants/filter";

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
        let dropdownMenu = document.getElementById(this._id+"DropdownMenu");
        dropdownMenu.innerHTML = null;
        if(this._id == "highlight") 
            this.addChangeToFilterOption(filters);

        for(let f of filters) {
            let filterItemDiv = document.createElement('div');
            filterItemDiv.classList.add('dropdown-item');
            filterItemDiv.id = f.id;
            filterItemDiv.addEventListener("click", e => this.removeFilter(new Filter(f.id, f.column, f.chart, f.selectedData, f.filterRange)));
            let columnDiv = document.createElement('span');
            let selectedDataDiv = document.createElement('span');
            columnDiv.innerHTML = f.filterRange == 'LOCAL' ? f.column.id : 'GLOBAL';
            columnDiv.classList.add('group-sub-header');
            selectedDataDiv.innerHTML = f.selectedData.toString();
            selectedDataDiv.style.backgroundColor = this.getBackgroundColor(f.chart);
            selectedDataDiv.classList.add('data-div');
            filterItemDiv.appendChild(selectedDataDiv);
            filterItemDiv.appendChild(columnDiv);
            dropdownMenu.appendChild(filterItemDiv);
        }
    }

    private addChangeToFilterOption(filters: Array<Filter>) {
        let icon = document.createElement("i")
        icon.classList.add("fas", "fa-filter", "customButtonSubIcon");
        let dropdownMenu = document.getElementById(this._id+"DropdownMenu");
        let filterItemDiv = document.createElement('div');
        filterItemDiv.classList.add('dropdown-item');
        let selectedDataDiv = document.createElement('span');
        selectedDataDiv.innerHTML = 'TRANSFORM TO FILTER';
        selectedDataDiv.classList.add('data-div');
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
        this._filters.push(filter);
        applyFilterUpdate(filter, this._selectionType);
        this.filterData(filter, this._data, this._localData);
        this.drawFilterCount(this._filters);
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

    public clear() {
        let elements = document.getElementsByClassName('dropdown');
        for(let element of elements) {
            element.innerHTML = "";
        }
    }
    
}   