import { Filter } from './Filter';
import * as d3 from 'd3';
import _ from 'lodash';
import { applyFilterUpdate, removedFilterUpdate } from "./ProvenanceSetup";
import { TabularData } from './TabularData';
import { FilterAction } from './lib/constants/filter';
import { TableDisplay } from './TableDisplay';
import { Column } from './Column';
import { ColumnMixed } from './ColumnMixed';
import { ColumnCategorical } from './ColumnCategorical';
import { ColumnLabel } from './ColumnLabel';
import { ColumnNumeric } from './ColumnNumeric';
import * as filterNames from "./lib/constants/filter";
import { local } from 'd3';
import { filter } from 'minimatch';

export class FilterDisplay
{

    private _toolbarContainer : HTMLElement;
    public get container() : HTMLElement {
        return this._toolbarContainer;
    }

    public SetContainer(container: HTMLElement) : void {
        this._toolbarContainer = container;
    }
    
    private _filters : Array<Filter>;
    public get filters() : Array<Filter> {
        return this._filters;
    }

    public SetFilters(filters: Array<Filter>): void
    {
        this._filters = filters;
        this.draw(filters);
    }

    private _data : TabularData;
    public get data() : TabularData {
        return this._data;
    }

    public SetData(data: TabularData): void
    {
        this._data = data;
    }

    public draw(filters: Array<Filter>): void {

        let filterDiv = document.createElement("div");

        let filterButton = document.createElement("div");

        let icon = document.createElement("i")
        icon.classList.add("fas", "fa-filter", "customButtonIcon");
        filterButton.appendChild(icon);

        let filterButtonText = document.createElement("span");
        filterButtonText.innerHTML = "Filter";
        filterButton.appendChild(filterButtonText);

        let filterCountText = document.createElement("span");
        filterCountText.id = "filterCount";
        filterButton.appendChild(filterCountText);

        let dropdownIcon = document.createElement("i")
        dropdownIcon.classList.add("fas", "fa-chevron-circle-down", "customButtonIconRight");
        filterButton.appendChild(dropdownIcon);

        filterButton.id = "filterButton";
        filterButton.classList.add("customButton");

        let dropdownMenu = document.createElement("div");
        dropdownMenu.id = "filterDropdownMenu";
        dropdownMenu.classList.add('dropdown-content');

        filterDiv.appendChild(filterButton);
        filterDiv.appendChild(dropdownMenu);
        filterDiv.classList.add('dropdown');

        filterButton.addEventListener("click", e => this.toggleFilterDropdown(e));
        this._toolbarContainer.appendChild(filterDiv);
        this.drawFilterCount(filters);
    }

    private toggleFilterDropdown(e: any) {
        let dropdownMenu = document.getElementById("filterDropdownMenu");
        if(dropdownMenu.classList.contains('show'))
            dropdownMenu.classList.remove('show');
        else 
            dropdownMenu.classList.add('show');
    }

    private manageDropdown(filters: Array<Filter>, tableDisplay: TableDisplay) {
        let dropdownMenu = document.getElementById("filterDropdownMenu");
        dropdownMenu.innerHTML = null;
        for(let f of filters) {
            let filterItemDiv = document.createElement('div');
            filterItemDiv.classList.add('dropdown-item');
            filterItemDiv.id = f.id;
            filterItemDiv.addEventListener("click", e => this.removeFilter(new Filter(f.id, f.column, f.chart, f.selectedData), tableDisplay));
            let columnDiv = document.createElement('span');
            let selectedDataDiv = document.createElement('span');
            columnDiv.innerHTML = f.column.id;
            columnDiv.classList.add('group-sub-header');
            selectedDataDiv.innerHTML = f.selectedData.toString();
            selectedDataDiv.style.backgroundColor = this.getBackgroundColor(f.chart);
            selectedDataDiv.classList.add('data-div');
            filterItemDiv.appendChild(selectedDataDiv);
            filterItemDiv.appendChild(columnDiv);
            dropdownMenu.appendChild(filterItemDiv);
        }
    }

    private getBackgroundColor(chart: string): string {
        switch(chart) {
            case filterNames.LEADING_DIGIT_FREQ_SELECTION: return '#4db6ac';
            case filterNames.FREQUENT_VALUES_SELECTION: return '#e57373';
            default: return '#eeeeee';
        }
    }

    public drawFilterCount(filters: Array<Filter>): void {
        let filterCountText = document.getElementById("filterCount");
        filterCountText.innerHTML = "("+filters.length+")";
    }
    
    public selectFilter(filter: Filter, tableDisplay: TableDisplay) : void
    {
        if(this._filters == null || this._filters.length == 0) 
            this._filters = [];

        let selectedFilter = this.find(filter, this._filters);
        if(selectedFilter != null) 
            this.removeFilter(selectedFilter, tableDisplay);
        else 
            this.addFilter(filter, tableDisplay);
    }

    private find(filter: Filter, filters: Array<Filter>): Filter {
        if(filters == null || filters.length == null || filter == null) return null;
        for(let f of filters) {
            let selectedFilterData = filter.selectedData.map((x) => x).sort().toString();
            let iterableFilterData = f.selectedData.map((x) => x).sort().toString();
            if(f.chart == filter.chart && f.column == filter.column && selectedFilterData == iterableFilterData)
                return f;
        }
        return null;
    }

    private addFilter(filter: Filter, tableDisplay: TableDisplay): void 
    {
        this._filters.push(filter);
        applyFilterUpdate(filter);
        this.filterData(filter, this._data, tableDisplay);
        this.drawFilterCount(this._filters);
        this.manageDropdown(this._filters, tableDisplay);
    }

    private removeFilter(filter: Filter, tableDisplay: TableDisplay): void 
    {
        this._filters = this._filters.filter(f => { return f.id != filter.id});
        this.drawFilterCount(this._filters);
        this.filterData(filter, this._data, tableDisplay);
        removedFilterUpdate(filter);
        this.manageDropdown(this._filters, tableDisplay);
    }

    private filterData(filter: Filter, data: TabularData, tableDisplay: TableDisplay) {
        let header = data.columnList.map(d => d.id).toString();
        let localData:any = [];
        
        for(let i = 0; i < data.rowLength; i++) {
            localData[i] = {};
            localData[i].data = data.getRow(i).toString();
            localData[i].include = true;
        }

        for(let f of this._filters) {
            
            let selectedColumn : ColumnNumeric | ColumnLabel | ColumnCategorical | ColumnMixed = Column.getColumnById(data, f.column.id);

            switch(f.chart) {
                case filterNames.LEADING_DIGIT_FREQ_SELECTION:
                        selectedColumn.values.forEach((value : any, index : number) => {
                            if(ColumnNumeric.getLeadingDigit(value, new Set(f.selectedData)) != null) {
                                localData[index].include = false;
                            }
                        });
                        break;
                case filterNames.FREQUENT_VALUES_SELECTION:
                        selectedColumn.values.forEach((value : any, index : number) => {
                            if(ColumnNumeric.isSelectedValue(value, new Set(f.selectedData))) {
                                localData[index].include = false;
                            }
                        });
                        break;
            }
        }

        
        let localDataString = "";
        localDataString = localDataString.concat(header);

        for(let i = 0; i < data.rowLength; i++) {
            localDataString = (localData[i].include) ? localDataString.concat("\n"+localData[i].data) : localDataString;
        }

        let localDataArray = TabularData.FromString(localDataString);
        tableDisplay.drawVizRows(localDataArray, 'TOP', 2);
        tableDisplay.drawBody(localDataArray);
    }
}   