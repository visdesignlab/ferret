import * as d3 from 'd3';
import { Column } from './Column';
import { ColumnFactory } from './ColumnFactory';

export class TabularData {
    public constructor() {
        this._columnList = [];
    }

    public static FromString(data: string): TabularData {
        let rawValueArray: d3.DSVRowArray<string> = d3.csvParse(data);
        return TabularData.FromDSVRowArray(rawValueArray);
    }

    public static FromDSVRowArray(data: d3.DSVRowArray<string>): TabularData {
        const tabularData = new TabularData();
        for (let header of data.columns) {
            const column = ColumnFactory.FromDSVRowArray(data, header);
            tabularData.columnList.push(column);
        }
        tabularData._rowLength = d3.max(
            tabularData.columnList,
            d => d.values.length
        );
        const rowColumn = ColumnFactory.Count(tabularData.rowLength, 'ROW');
        tabularData.columnList.unshift(rowColumn);
        return tabularData;
    }

    private _columnList: Column<string | number>[];
    public get columnList(): Column<string | number>[] {
        return this._columnList;
    }

    public SetColumnList(columnList: Column<string | number>[]): void {
        this._columnList = columnList;
    }

    private _rowLength: number;
    public get rowLength(): number {
        return this._rowLength;
    }

    public getRowList(): Record<string, string | number>[] {
        const rowList: Record<string, string | number>[] = [];
        for (let i = 0; i < this.rowLength; i++) {
            rowList.push(this.getRowRecord(i));
        }
        return rowList;
    }

    public getRowRecord(index: number): Record<string, string | number> {
        let rowRecord: Record<string, string | number> = {};
        for (let i = 0; i < this.columnList.length; i++) {
            rowRecord[i.toString()] = this.columnList[i].values[index];
        }
        return rowRecord;
    }

    public getRow(index: number): (string | number)[] {
        let row: (string | number)[] = [];
        for (let column of this.columnList) {
            row.push(column.values[index]);
        }
        return row;
    }
}
