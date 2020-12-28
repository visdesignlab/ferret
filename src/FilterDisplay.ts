import { Filter } from './Filter';
import _ from 'lodash';
import { TabularData } from './TabularData';
import { TableDisplay } from './TableDisplay';
import { Column } from './Column';
import { ColumnMixed } from './ColumnMixed';
import { ColumnCategorical } from './ColumnCategorical';
import { ColumnLabel } from './ColumnLabel';
import { ColumnNumeric } from './ColumnNumeric';
import * as filterNames from "./lib/constants/filter";
import { FilterDropdown } from './FilterDropdown';

export class FilterDisplay extends FilterDropdown
{

    constructor() {
        super();
        super.SetId('filter');
        super.SetSelectionType('Filter');
    }

    public drawDropdown(): void {
        let filters: Array<Filter> = [];
        let id: string = "filter";
        let title: string = "Filter";
        let iconType: string = "filter";
        this.draw(filters, id, title, iconType);
    }

    protected filterData(filter: Filter | null, data: TabularData | null, tableDisplay: TableDisplay | null) {
        let header = data.columnList.map(d => d.id).toString();
        let localData:any = [];
        
        for(let i = 0; i < data.rowLength; i++) {
            localData[i] = {};
            localData[i].data = data.getRow(i).toString();
            localData[i].include = true;
        }

        for(let f of this._filters) {
            
            let selectedColumn : ColumnNumeric | ColumnLabel | ColumnCategorical | ColumnMixed = Column.getColumnById(data, f.column.id);

            switch(f.chart) {
                case filterNames.LEADING_DIGIT_FREQ_SELECTION:
                        selectedColumn.values.forEach((value : any, index : number) => {
                            if(ColumnNumeric.getLeadingDigit(value, new Set(f.selectedData)) != null) {
                                localData[index].include = false;
                            }
                        });
                        break;
                case filterNames.FREQUENT_VALUES_SELECTION:
                        selectedColumn.values.forEach((value : any, index : number) => {
                            if(ColumnNumeric.isSelectedValue(value, new Set(f.selectedData))) {
                                localData[index].include = false;
                            }
                        });
                        break;
            }
        }

        
        let localDataString = "";
        localDataString = localDataString.concat(header);

        for(let i = 0; i < data.rowLength; i++) {
            localDataString = (localData[i].include) ? localDataString.concat("\n"+localData[i].data) : localDataString;
        }

        let localDataArray = TabularData.FromString(localDataString);
        tableDisplay.drawVizRows(localDataArray);
        tableDisplay.drawBody(localDataArray);
    }
}   