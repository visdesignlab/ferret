import { FilterRange } from '../lib/constants/filter';
import { Filter } from '../Filter';

export class FilterPicker
{

    public _id: string;
    private _filter: Filter;
    private _filterRange: FilterRange;

    constructor(id: string, filter: Filter, filterRange: FilterRange) {
        this._id = id;
        this._filter = filter;
        this._filterRange = filterRange;
    }

    public get id() : string {
        return this._id;
    }
    public set id(v: string)
    {
        this._id = v;
    }

    public get filter() : Filter {
        return this._filter;
    }
    public set filter(v: Filter)
    {
        this._filter = v;
    }

    public get filterRange() : FilterRange {
        return this._filterRange;
    }
    public set filterRange(v: FilterRange)
    {
        this._filterRange = v;
    }

    public static attach(parent: HTMLElement) {
        let element = document.createElement('div');
        let iconGlobal = document.createElement('i');
        let iconLocal = document.createElement('i');
        iconGlobal.classList.add('fas','fa-filter','customButtonIcon');
        iconLocal.classList.add('fas','fa-strikethrough','customButtonIcon');
        element.appendChild(iconGlobal);
        element.appendChild(iconLocal);
        parent.appendChild(element);
    }   
}