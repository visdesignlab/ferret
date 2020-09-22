import { TabularData } from "./TabularData";
import { ColumnString } from "./ColumnString";
import { ColumnNumeric } from "./ColumnNumeric";

export enum ColumnTypes
{
    "numeric",
    "string",
    "mixed"
}

export abstract class Column<T>
{
    public constructor()
    {
        this._values = [];
    }

    private _id : string;
    public get id() : string {
        return this._id;
    }
    public set id(v: string)
    {
        this._id = v;
    }

    protected _values : T[];
    public get values() : T[] {
        return this._values;
    }

    protected _type : ColumnTypes;
    public get type() : ColumnTypes {
        return this._type;
    }

    public get length(): number
    {
        return this._values.length;
    }

    public static getColumnById(data: TabularData, id: string) : ColumnNumeric | ColumnString {

        if(data == null || id == null) return null;
        
        let selectedColumn = null;

        data.columnList.forEach((column) => {
            if(column._id == id) 
                selectedColumn = column;
        });   

        return selectedColumn;
    }
}