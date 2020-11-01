import { Column, ColumnTypes } from "./Column";

export class ColumnLabel extends Column<string | number>
{
    public constructor(valList: (number | string)[])
    {
        super();
        this._values = valList;
        this._type = 'Label';
    }
}