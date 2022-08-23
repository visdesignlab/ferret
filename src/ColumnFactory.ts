import { ColumnExcelData } from './ColumnExcelData';
import { Column } from './Column';
import { ColumnNumeric } from './ColumnNumeric';
import { ColumnCategorical } from './ColumnCategorical';
import { ColumnLabel } from './ColumnLabel';
import { ColumnMixed } from './ColumnMixed';
import { getColumnType } from './ColumnType';
import { Cell, Column as ExcelColumn, Style } from 'exceljs';

// export interface CellWithStyle {
//     value: any;
//     style: Partial<Style>;
// }

export class ColumnFactory {
    public static FromExcelColumn(data: ExcelColumn): Column<Cell> {
        let valList: Cell[] = [];
        let key: string = null;
        data.eachCell((cell: Cell, num) => {
            let style: Partial<Style> = cell.style;
            if (key === null) {
                key = cell.toString();
            } else {
                valList.push(cell);
                console.log(cell);
            }
        });
        return this.fromValList(valList, key);
    }

    public static FromDSVRowArray(
        data: d3.DSVRowArray<string>,
        key: string,
        noHeader = false
    ): Column<string | number> {
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

        col.id = key;
        return col;
    }

    public static Count(size: number, name: string): Column<number> {
        const data = Array(size)
            .fill(null)
            .map((_d, i) => i + 1);
        const col: Column<number> = new ColumnNumeric(data);
        col.id = name;
        return col;
    }

    private static isNumeric(val: string): boolean {
        if (val === '') {
            return false;
        }
        return !isNaN(Number(val));
    }
}
