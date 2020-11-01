import { TabularData } from "./TabularData";
import { ColumnNumeric } from "./ColumnNumeric";
import { ColumnLabel } from "./ColumnLabel";
import { ColumnCategorical } from "./ColumnCategorical";
import { ColumnMixed } from "./ColumnMixed";

export type ColumnTypes =
  | 'Number'
  | 'Label'
  | 'Mixed'
  | 'Categorical';

export abstract class Column<T>
{
    public constructor()
    {
        this._values = [];
        this._visible = true;
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

    protected _visible : Boolean;
    public get visible() : Boolean {
        return this._visible;
    }

    public set visible(visible: Boolean) {
        this._visible = visible;
    }

    public static getColumnById(data: TabularData, id: string) : ColumnNumeric | ColumnMixed | ColumnCategorical | ColumnLabel {

        if(data == null || id == null) return null;
        
        let selectedColumn = null;

        data.columnList.forEach((column) => {
            if(column._id == id) 
                selectedColumn = column;
        });   

        return selectedColumn;
    }
}