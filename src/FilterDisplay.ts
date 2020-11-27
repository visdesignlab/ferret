import { Filter } from './Filter';
import * as d3 from 'd3';
import { applyFilterUpdate, removedFilterUpdate } from "./ProvenanceSetup";

export class FilterDisplay
{

    private _toolbarContainer : HTMLElement;
    public get container() : HTMLElement {
        return this._toolbarContainer;
    }

    public SetContainer(container: HTMLElement) : void {
        this._toolbarContainer = container;
    }
    
    private _data : Array<Filter>;
    public get data() : Array<Filter> {
        return this._data;
    }

    public SetData(data: Array<Filter>): void
    {
        this._data = data;
        this.draw(data);
    }

    public draw(data: Array<Filter>): void {

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

        filterButton.id = "filterButton";
        filterButton.classList.add("customButton", "customButtonIcon");
       // filterButton.addEventListener("click", e => this.toggleControlsPanel());
        this._toolbarContainer.appendChild(filterButton);
        this.drawFilterCount(data);
    }

    public drawFilterCount(data: Array<Filter>): void {
        let filterCountText = document.getElementById("filterCount");
        filterCountText.innerHTML = "("+data.length+")";
    }
    
    public selectFilter(filter: Filter) : void
    {
        if(this._data == null || this._data.length == 0) 
            this._data = [];
       
        let selectedFilter = this._data.find(o => o.id === filter.id);
        if(selectedFilter != null) this.removeFilter(filter);
        else this.addFilter(filter);
    }

    private addFilter(filter: Filter) : void 
    {
        this._data.push(filter);
        applyFilterUpdate(filter);
        this.drawFilterCount(this._data);
    }

    private removeFilter(filter: Filter) : void 
    {
        this._data = this._data.filter(f => { return f.id != filter.id});
        this.drawFilterCount(this._data);
        removedFilterUpdate(filter);
    }

}