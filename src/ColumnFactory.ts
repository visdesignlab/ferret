import { Column } from "./Column";
import { ColumnNumeric } from "./ColumnNumeric";
import { ColumnString } from "./ColumnString";
import { ColumnMixed } from "./ColumnMixed";

export class ColumnFactory
{
    public static FromDSVRowArray(data: d3.DSVRowArray<string>, key: string, noHeader = false): Column<string | number>
    {
        let valList: (string | number)[] = [];
        let allString = true;
        let allNumeric = true;
        if (noHeader)
        {
            // todo
        }
        for (let row of data)
        {
            let val: string | number = row[key];
            if (ColumnFactory.isNumeric(val))
            {
                val = Number(val);
                allString = false;
            }
            else
            {
                allNumeric = false;
            }
            valList.push(val);
        }
        let col: Column<string | number>;
        if (allNumeric)
        {
            console.log(key);
            col = new ColumnNumeric(valList as number[]);
        }
        else if (allString)
        {
            col = new ColumnString(valList as string[]);
        }
        else
        {
            col = new ColumnMixed(valList);
        }

        col.id = key;
        return col;
    }

    private static isNumeric(val: string): boolean
    {
        if (val === "")
        {
            return false;
        }
        return !isNaN(Number(val));
    }
}