import { Column } from './Column';

export class Filter
{

    constructor(id: string, column: Column<string | number>, chart: string, selectedData: Array<string | number>) {
        this._id = id;
        this._column = column;
        this._chart = chart;
        this._selectedData = selectedData;
    }
    
    private _id : string;
    public get id() : string {
        return this._id;
    }
    public set id(v: string)
    {
        this._id = v;
    }

    private _column : Column<string | number>;
    public get column() : Column<string | number> {
        return this._column;
    }
    public set column(v: Column<string | number>)
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

    private _selectedData : Array<string | number>;
    public get selectedData() : Array<string | number> {
        return this._selectedData;
    }
    public set selectedData(v: Array<string | number>)
    {
        this._selectedData = v;
    }
}
