import { ColumnExcelData } from './ColumnExcelData';
import { Column } from './Column';
import { ColumnNumeric } from './ColumnNumeric';
import { ColumnCategorical } from './ColumnCategorical';
import { ColumnLabel } from './ColumnLabel';
import { ColumnMixed } from './ColumnMixed';
import { getColumnType } from './ColumnType';
import { Cell, Column as ExcelColumn, Style, ValueType } from 'exceljs';
import { uniqueId } from 'lodash';

// export interface CellWithStyle {
//     value: any;
//     style: Partial<Style>;
// }

export class ColumnFactory {
    public static FromExcelColumn(
        data: ExcelColumn,
        existingKeys: Set<string>
    ): Column<Cell> {
        let valList: Cell[] = [];
        let key: string = null;
        data.eachCell((cell: Cell, num) => {
            if (key === null) {
                key = ColumnFactory.getUniqueKey(cell, existingKeys);
            } else {
                valList.push(cell);
            }
        });
        return this.fromValList(valList, key);
    }

    public static FromExcelColumnStripped(
        data: ExcelColumn,
        existingKeys: Set<string>
    ): Column<string | number> {
        let valList: (string | number)[] = [];
        let key: string = null;
        data.eachCell((cell: Cell, num) => {
            if (key === null) {
                key = ColumnFactory.getUniqueKey(cell, existingKeys);
            } else {
                let cellVal: string | number;
                if (cell.type == ValueType.Null || cell.value == '') {
                    cellVal = 0; // prioritize number columns
                } else if (cell.type == ValueType.Formula) {
                    if (cell.result instanceof Date) {
                        cellVal = cell.result.toString();
                    } else {
                        cellVal = cell.result;
                    }
                } else if (cell.type == ValueType.Number) {
                    cellVal = (cell.value as number) ?? 0;
                } else if (cell.type === ValueType.String) {
                    cellVal = (cell.value as string) ?? '';
                } else {
                    cellVal = cell.toString();
                }
                valList.push(cellVal);
            }
        });
        return this.fromValList(valList, key);
    }

    private static getUniqueKey(cell: Cell, existingKeys: Set<string>): string {
        let newKey = cell.toString();
        if (newKey == '') {
            newKey = '[blank]';
        }
        let key = newKey;
        let dupNum = 2;
        while (existingKeys.has(key)) {
            key = `${newKey} [${dupNum++}]`;
        }
        existingKeys.add(key);
        return key;
    }

    public static FromDSVRowArray(
        data: d3.DSVRowArray<string>,
        key: string,
        noHeader = false
    ): Column<string | number> {
        // todo - deduplicate keys
        let valList: (string | number)[] = [];

        if (noHeader) {
            // todo
        }
        for (let row of data) {
            let val: string | number = row[key];
            valList.push(val);
        }

        return this.fromValList(valList, key);
    }

    private static fromValList(valList: any[], key: string): Column<any> {
        let col: Column<string | number | Cell>;

        switch (getColumnType(valList)) {
            case 'Excel':
                col = new ColumnExcelData(valList as Cell[]);
                break;
            case 'Categorical':
                col = new ColumnCategorical(valList as string[]);
                break;
            case 'Number':
                col = new ColumnNumeric(valList.map(Number));
                break;
            case 'Label':
                col = new ColumnLabel(valList as string[]);
                break;
            default:
                col = new ColumnMixed(valList as string[]);
                break;
        }

        col.label = key;
        col.id = key + '_' + uniqueId();
        return col;
    }

    public static Count(size: number, name: string): Column<number> {
        const data = Array(size)
            .fill(null)
            .map((_d, i) => i + 1);
        const col: Column<number> = new ColumnNumeric(data);
        col.label = name;
        col.id = name + '_' + uniqueId();
        return col;
    }

    private static isNumeric(val: string): boolean {
        if (val === '') {
            return false;
        }
        return !isNaN(Number(val));
    }
}
