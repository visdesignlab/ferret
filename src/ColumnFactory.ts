import { Column } from "./Column";
import { ColumnNumeric } from "./ColumnNumeric";
import { ColumnCategorical } from "./ColumnCategorical";
import { ColumnLabel } from "./ColumnLabel";
import { ColumnMixed } from "./ColumnMixed";
import { getColumnType } from "./ColumnType";

export class ColumnFactory
{
    public static FromDSVRowArray(data: d3.DSVRowArray<string>, key: string, noHeader = false): Column<string | number>
    {
        let valList: (string | number)[] = [];
     
        if (noHeader)
        {
            // todo
        }
        for (let row of data)
        {
            let val: string | number = row[key];
            valList.push(val);
        }

        let col: Column<string | number>;

        switch(getColumnType(valList)) {
            
            case "Categorical": 
                col = new ColumnCategorical(valList as string[]);
                break;
            case "Number":
                col = new ColumnNumeric(valList as number[]);
                break;
            case "Label":  
                col = new ColumnLabel(valList as string[]);
                break; 
            default: 
                col = new ColumnMixed(valList as string[]);
                break;
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