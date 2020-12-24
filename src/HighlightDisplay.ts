import { applyFilterUpdate, removedFilterUpdate } from "./ProvenanceSetup";
import { TabularData } from './TabularData';
import { TableDisplay } from './TableDisplay';
import { Column } from './Column';
import { ColumnMixed } from './ColumnMixed';
import { ColumnCategorical } from './ColumnCategorical';
import { ColumnLabel } from './ColumnLabel';
import { ColumnNumeric } from './ColumnNumeric';
import * as filterNames from "./lib/constants/filter";
import { FilterDropdown } from "./FilterDropdown";
import { Filter } from "./Filter";
import d3 from 'd3';

export class HighlightDisplay extends FilterDropdown
{

    constructor() {
        super();
        super.SetId('highlight');
        super.SetSelectionType('Highlight');
    }

    public drawDropdown(): void {
        let filters: Array<Filter> = [];
        let id: string = "highlight";
        let title: string = "Highlight";
        let iconType: string = "highlighter";
        this.draw(filters, id, title, iconType);
    }

    protected filterData(filter: Filter | null, data: TabularData | null, tableDisplay: TableDisplay | null) { 
        
        for(let f of this._filters) {
            console.log(f);
            console.log(data);
            let selectedColumn : ColumnNumeric | ColumnLabel | ColumnCategorical | ColumnMixed = Column.getColumnById(data, f.column.id);
            console.log(selectedColumn);

            switch(f.chart) {
            
                case filterNames.LEADING_DIGIT_FREQ_SELECTION:
                        selectedColumn.values.forEach((value : any, index : number) => {
                            if(ColumnNumeric.getLeadingDigit(value, new Set(f.selectedData)) != null) {
                                let row = d3.select('#dataRow'+ (index+1));
                                row.classed('highlighted', true);
                            }
                        });
                        break;
            
                case filterNames.FREQUENT_VALUES_SELECTION:
                        selectedColumn.values.forEach((value : any, index : number) => {
                            if(ColumnNumeric.isSelectedValue(value, new Set(f.selectedData))) {
                                let row = d3.select('#dataRow'+ (index+1));
                                row.classed('highlighted', true);
                            }
                        });
                        break;
            }
        }

    }

}   