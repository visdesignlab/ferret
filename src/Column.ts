import { ColumnNumeric } from "./ColumnNumeric";
import { ColumnString } from "./ColumnString";
import { ColumnMixed } from "./ColumnMixed";

export enum ColumnTypes
{
    "numeric",
    "string",
    "mixed"
}

export class Column<T>
{
    
    public constructor()
    {
        this._values = [];
    }

    public static FromDSVRowArray(data: d3.DSVRowArray<string>, key: string, noHeader = false): Column<string | number>
    {
        let column = new Column<any>();
        let allString = true;
        let allNumeric = true;
        if (noHeader)
        {
            // todo
        }
        column._id = key;
        for (let row of data)
        {
            let val: string | number = row[key];
            if (Column.isNumeric(val))
            {
                val = Number(val);
                allString = false;
            }
            else
            {
                allNumeric = false;
            }
            column.values.push(val);
        }
        if (allNumeric)
        {
            column._type = ColumnTypes.numeric;
            return column as ColumnNumeric;
        }
        else if (allString)
        {
            column._type = ColumnTypes.string;
            return column as ColumnString;
        }
        column._type = ColumnTypes.mixed;
        return column as ColumnMixed;
    }

    private static isNumeric(val: string): boolean
    {
        if (val === "")
        {
            return false;
        }
        return !isNaN(Number(val));
    }

    private _id : string;
    public get id() : string {
        return this._id;
    }

    private _values : T[];
    public get values() : T[] {
        return this._values;
    }

    private _type : ColumnTypes;
    public get type() : ColumnTypes {
        return this._type;
    }    
}