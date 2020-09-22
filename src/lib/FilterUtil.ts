import { TabularData } from "../TabularData";
import { ColumnNumeric } from "../ColumnNumeric";
import { Column } from "../Column";
import * as d3 from "d3";
import { select } from "d3";
import { ColumnString } from "../ColumnString";

export class FilterUtil {

    public highlightRows(
            name: string, 
            selectedData: Array<number>, 
            data: TabularData, 
            column: ColumnNumeric,
            ): void 
    {
        let selectedColumn : ColumnNumeric | ColumnString = Column.getColumnById(data, column.id);
        
        if(name == "leadingDigitFrequencySelection") {
            
            selectedColumn.values.forEach((value : any, index : number) => {
                if(ColumnNumeric.getLeadingDigit(value, new Set(selectedData)) != null) {
                    let row = d3.select('#dataRow'+ (index+1));
                    row.classed('highlighted', true);
                }
            });

        } 

        if(name == "frequentValueSelection") {

            selectedColumn.values.forEach((value : any, index : number) => {
                if(ColumnNumeric.isSelectedValue(value, new Set(selectedData))) {
                    let row = d3.select('#dataRow'+ (index+1));
                    row.classed('highlighted', true);
                }
            });

        } 

    }

    public clearHighlight(
        name: string,
        clearedData: Array<number>, 
        data: TabularData,
        column: ColumnNumeric) {

        let selectedColumn : ColumnNumeric | ColumnString = Column.getColumnById(data, column.id);

        if(name == "leadingDigitFrequencyClear") {
            selectedColumn.values.forEach((value : any, index : number) => {
                    let row = d3.select('#dataRow'+ (index+1));
                    row.classed('highlighted', false);
            });
        } 

        if(name == "frequentValueClear") {
            selectedColumn.values.forEach((value : any, index : number) => {
                if(ColumnNumeric.isSelectedValue(value, new Set(clearedData))) {
                    let row = d3.select('#dataRow'+ (index+1));
                    row.classed('highlighted', false);
                }
            });
        } 

    }

}