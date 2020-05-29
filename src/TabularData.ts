import * as d3 from 'd3';
import { Column } from './Column';

export class TabularData
{
    public constructor()
    {
        this._columnList = [];
    }

    public static FromString(data: string): TabularData
    {
        let rawValueArray: d3.DSVRowArray<string> = d3.csvParse(data);
        return TabularData.FromDSVRowArray(rawValueArray);
    }

    public static FromDSVRowArray(data: d3.DSVRowArray<string>): TabularData
    {
        console.log(data);
        let tabularData = new TabularData();
        for (let header of data.columns)
        {
            let column = Column.FromDSVRowArray(data, header);
            tabularData.columnList.push(column);
        }
        return tabularData;
    }

    private _columnList : Column<string | number>[];
    public get columnList() : Column<string | number>[] {
        return this._columnList;
    }    
}