import { Column } from './Column';
import FerretColumn from './FerretColumn';
import { FilterRange } from './lib/constants/filter';

export class Filter
{

    constructor(column: FerretColumn, chart: string, selectedData: Array<string | number>, filterRange: FilterRange) {
        this._id = column.id;
        this._column = column;
        this._chart = chart;
        this._selectedData = selectedData;
        this._filterRange = filterRange;
    }
    
    private _id : string;
    public get id() : string {
        return this._id;
    }
    public set id(v: string)
    {
        this._id = v;
    }

    private _column : FerretColumn;
    public get column() : FerretColumn {
        return this._column;
    }
    public set column(v: FerretColumn)
    {
        this._column = v;
    }

    private _chart : string;
    public get chart() : string {
        return this._chart;
    }
    public set chart(v: string)
    {
        this._chart = v;
    }

    private _filterRange : FilterRange;
    public get filterRange() : FilterRange {
        return this._filterRange;
    }
    public set filterRange(v: FilterRange)
    {
        this._filterRange = v;
    }

    private _selectedData : Array<string | number>;
    public get selectedData() : Array<string | number> {
        return this._selectedData;
    }
    public set selectedData(v: Array<string | number>)
    {
        this._selectedData = v;
    }
}
