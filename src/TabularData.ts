import * as d3 from 'd3';
// import * as XLSX from 'xlsx/xlsx.mjs';
// import {Xlsx}
// import * as XLSX from 'xlsx';
// import * as XLSX from 'sheetjs-style';
// import * as excelJS from 'exceljs';
import { Workbook, Cell } from 'exceljs';
import { Column } from './Column';
import { ColumnFactory } from './ColumnFactory';

export class TabularData {
    public constructor() {
        this._columnList = [];
    }

    public static async FromExcel(data: ArrayBuffer): Promise<TabularData> {
        const tabularData = new TabularData();

        let workbook = new Workbook();
        await workbook.xlsx.load(data);
        console.log(workbook);
        const ws = workbook.getWorksheet(1);
        const numCols = ws.columnCount;
        for (let i = 1; i <= numCols; i++) {
            const column = ColumnFactory.FromExcelColumn(ws.getColumn(i));
            tabularData.columnList.push(column);
        }
        tabularData._rowLength = ws.rowCount - 1; // subtract one because the first row is consumed as a label.
        const rowColumn = ColumnFactory.Count(tabularData.rowLength, 'ROW');
        tabularData.columnList.unshift(rowColumn);
        return tabularData;
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

    private _columnList: Column<string | number | Cell>[];
    public get columnList(): Column<string | number | Cell>[] {
        return this._columnList;
    }

    public SetColumnList(columnList: Column<string | number>[]): void {
        this._columnList = columnList;
    }

    private _rowLength: number;
    public get rowLength(): number {
        return this._rowLength;
    }

    public getRowList(): Record<string, string | number | Cell>[] {
        const rowList: Record<string, string | number | Cell>[] = [];
        for (let i = 0; i < this.rowLength; i++) {
            rowList.push(this.getRowRecord(i));
        }
        return rowList;
    }

    public getRowRecord(index: number): Record<string, string | number | Cell> {
        let rowRecord: Record<string, string | number | Cell> = {};
        for (let i = 0; i < this.columnList.length; i++) {
            rowRecord[i.toString()] = this.columnList[i].values[index];
        }
        return rowRecord;
    }

    public getRow(index: number): (string | number | Cell)[] {
        let row: (string | number | Cell)[] = [];
        for (let column of this.columnList) {
            row.push(column.values[index]);
        }
        return row;
    }
}
