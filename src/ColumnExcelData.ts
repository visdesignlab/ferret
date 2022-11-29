import { Cell } from 'exceljs';
import { Column } from './Column';

export class ColumnExcelData extends Column<Cell> {
    public constructor(valList: Cell[]) {
        super();
        this._values = valList;
        this._type = 'Excel';
    }
}
