import { Column, ColumnTypes } from "./Column";

export class ColumnCategorical extends Column<string | number>
{
    public constructor(valList: (number | string)[])
    {
        super();
        this._values = valList;
        this._type = 'Categorical';
    }
}