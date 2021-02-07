import { FilterRange } from '../lib/constants/filter';
import { Filter } from '../Filter';

export class FilterPicker extends EventTarget
{

    constructor(id: string, filter: Filter, filterRange: FilterRange) {
        super();
        this._id = id;
        this._filter = filter;
        this._filterRange = filterRange;
    }

    public _id: string;
    public get id() : string {
        return this._id;
    }
    public set id(v: string)
    {
        this._id = v;
    }

    protected _filter: Filter;
    public get filter() : Filter {
        return this._filter;
    }
    public set filter(v: Filter)
    {
        this._filter = v;
    }

    private _filterRange: FilterRange;
    public get filterRange() : FilterRange {
        return this._filterRange;
    }
    public set filterRange(v: FilterRange)
    {
        this._filterRange = v;
    }

    public static create(id: string, filter: Filter, e: any, parent: HTMLElement) {
        let element = document.createElement('div');
        let iconGlobal = document.createElement('i');
        let iconLocal = document.createElement('i');
        let iconHighlight = document.createElement('i');
        iconGlobal.classList.add('fas','fa-filter','filter-picker-icon');
        iconLocal.classList.add('fas','fa-strikethrough','filter-picker-icon');
        iconHighlight.classList.add('fas','fa-highlighter','filter-picker-icon');
        iconGlobal.addEventListener('click', (e) => document.dispatchEvent(new CustomEvent('addFilter', {detail: {filter: filter}})));
        element.appendChild(iconGlobal);
        element.appendChild(iconLocal);
        element.appendChild(iconHighlight);
        element.setAttribute("id", id);
        element.classList.add('filter-picker');
        element.style.left = (e.clientX-parent.getBoundingClientRect().left)+'px';
        element.style.top = (e.clientY-parent.getBoundingClientRect().top)+'px';
        return element;
    }   
}