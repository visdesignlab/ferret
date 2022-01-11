import * as d3 from 'd3';
import { Column } from "./Column";

export class ColumnNumeric extends Column<number>
{

    public constructor(valList: number[])
    {
        super();
        this._values = valList;
        this._type = 'Number';
    }
    
    public getDecimalPlaces(): number
    {
        return d3.max(this.values, d => ColumnNumeric.decimalPlaces(d));
    }

    public static decimalPlaces(val: number): number
    {
        const valString = val.toString();
        const parts = valString.split('.');
        if (parts.length == 1)
        {
            return 0;
        }
        return parts[1].length;

    }

}