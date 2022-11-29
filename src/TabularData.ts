import * as d3 from 'd3';
import { Workbook, Cell } from 'exceljs';
import { Column, ColumnTypes } from './Column';
import { ColumnFactory } from './ColumnFactory';

export interface StyleCount {
    count: number;
    rank: number;
}
export class TabularData {
    public constructor() {
        this._columnList = [];
    }

    public static async FromExcel(
        data: ArrayBuffer,
        stripFormatting = false
    ): Promise<TabularData> {
        const tabularData = new TabularData();

        let workbook = new Workbook();
        await workbook.xlsx.load(data);
        const ws = workbook.worksheets[0];
        const numCols = ws.columnCount;
        for (let i = 1; i <= numCols; i++) {
            let column: Column<string | number> | Column<Cell>;
            if (stripFormatting) {
                column = ColumnFactory.FromExcelColumnStripped(ws.getColumn(i));
            } else {
                column = ColumnFactory.FromExcelColumn(ws.getColumn(i));
            }
            tabularData.columnList.push(column);
        }
        tabularData._rowLength = ws.rowCount - 1; // subtract one because the first row is consumed as a label.
        const rowColumn = ColumnFactory.Count(tabularData.rowLength, 'ROW');
        tabularData.columnList.unshift(rowColumn);
        tabularData.buildStyleMap();
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

    private buildStyleMap() {
        const styleCountsShort = new Map<string, number>();
        const styleCountsLong = new Map<string, number>();
        for (let column of this.columnList) {
            if (column.type !== 'Excel') continue;
            for (let value of (column as Column<Cell>).values) {
                const [longHash, shortHash] = TabularData.getStyleHashes(value);
                TabularData.updateCounts(styleCountsShort, shortHash);
                TabularData.updateCounts(styleCountsLong, longHash);
            }
        }

        const entriesShort = TabularData.buildEntries(styleCountsShort);
        const entriesLong = TabularData.buildEntries(styleCountsLong);

        TabularData._styleMapShort = new Map<string, StyleCount>(
            entriesShort as [string, StyleCount][]
        );
        TabularData._styleMapLong = new Map<string, StyleCount>(
            entriesLong as [string, StyleCount][]
        );
    }

    private static updateCounts(
        counts: Map<string, number>,
        key: string
    ): void {
        if (counts.has(key)) {
            counts.set(key, counts.get(key) + 1);
        } else {
            counts.set(key, 1);
        }
    }

    private static buildEntries(
        counts: Map<string, number>
    ): [string, number | StyleCount][] {
        const entries: [string, number | StyleCount][] = Array.from(
            counts.entries()
        );
        entries.sort((a: [string, number], b: [string, number]) => {
            return b[1] - a[1];
        });
        for (let i = 0; i < entries.length; i++) {
            // entries[i][1] = i - 1;
            entries[i][1] = {
                count: entries[i][1] as number,
                rank: i - 1 // the default style of -1 will have no style
            };
        }
        return entries;
    }

    public static getStyleHashes(cell: Cell): [string, string] {
        const t: number = cell.type; // cell type, number, string, etc
        const b: string = cell.font?.bold ? '1' : '0';
        const i: string = cell.font?.italic ? '1' : '0';
        const u: string = cell.font?.underline ? '1' : '0';
        const size: string = cell.font?.size
            ? cell.font?.size.toString()
            : 'default';
        // : '12'; // on the file I made on my machine the default is 12, on another file, the default seems to be 11.
        // const font: string = cell.font?.name ?? 'Calibri'; // on my mac the default is Calibri
        const font: string = cell.font?.name ?? 'default'; // on my mac the default is Calibri
        return [
            `${t}_${b}_${i}_${u}_${size}_${font}`,
            `${b}_${i}_${u}_${size}_${font}`
        ];
    }

    public static getStyleGroup(cell: Cell): StyleCount {
        const [longHash, shortHash] = TabularData.getStyleHashes(cell);
        let styleGroup: StyleCount;
        if (globalThis.includeDataFormat) {
            styleGroup = TabularData.styleMapLong.get(longHash);
        } else {
            styleGroup = TabularData.styleMapShort.get(shortHash);
        }
        if (styleGroup == null) {
            console.log('null style group');
        }
        return styleGroup;
    }

    private _columnList: Column<string | number | Cell>[];
    public get columnList(): Column<string | number | Cell>[] {
        return this._columnList;
    }

    public SetColumnList(columnList: Column<string | number>[]): void {
        this._columnList = columnList;
    }

    private static _styleMapShort: Map<string, StyleCount>;
    public static get styleMapShort(): Map<string, StyleCount> {
        return TabularData._styleMapShort;
    }

    private static _styleMapLong: Map<string, StyleCount>;
    public static get styleMapLong(): Map<string, StyleCount> {
        return TabularData._styleMapLong;
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
