import { Filter } from './Filter';
import { TabularData } from './TabularData';
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
        document.addEventListener('addFilter', (e: CustomEvent) => this.selectFilter(e.detail.filter));
        document.addEventListener('addGlobalFilter', (e: CustomEvent) => this.selectFilter(e.detail.filter));
        document.addEventListener('onLocalDataChange', (e: CustomEvent) => this.SetLocalData(e.detail.data));
    }

    public drawDropdown(): void {
        let filters: Array<Filter> = [];
        let id: string = "filter";
        let title: string = "Filter";
        let iconType: string = "filter";
        this.draw(filters, id, title, iconType);
    }

    protected filterData(filter: Filter | null, data: TabularData | null, localData: TabularData | null) {
        let header = data.columnList.map(d => d.id).toString();
        let locData:any = [];
        
        for(let i = 0; i < data.rowLength; i++) {
            locData[i] = {};
            locData[i].data = data.getRow(i).toString();
            locData[i].include = true;
        }

        for(let f of this._filters) {
            
            let selectedColumn: ColumnNumeric | ColumnCategorical | ColumnLabel | ColumnMixed;
            
            for(let column of data.columnList) {
                if(f.filterRange == 'LOCAL' && column.id != f.column.id) continue;
                if(f.filterRange == 'GLOBAL' || column.id == f.column.id) 
                    selectedColumn = (Column.getColumnById(data, column.id));

            switch(f.chart) {
                case filterNames.LEADING_DIGIT_FREQ_SELECTION:
                        selectedColumn.values.forEach((value : any, index : number) => {
                            if(ColumnNumeric.getLeadingDigit(value, new Set(f.selectedData)) != null) {
                                locData[index].include = false;
                            }
                        });
                        break;
                case filterNames.FREQUENT_VALUES_SELECTION:
                        selectedColumn.values.forEach((value : any, index : number) => {
                            if(ColumnNumeric.isSelectedValue(value, new Set(f.selectedData))) {
                                locData[index].include = false;
                            }
                        });
                        break;
                case filterNames.N_GRAM_SELECTION:
                    selectedColumn.values.forEach((value : any, index : number) => {
                        if(ColumnNumeric.containsNGram(value, new Set(f.selectedData))) {
                            locData[index].include = false;
                        }
                    });
                    break;
                }
            }   
        }

        
        let localDataString = "";
        localDataString = localDataString.concat(header);

        for(let i = 0; i < data.rowLength; i++) {
            localDataString = (locData[i].include) ? localDataString.concat("\n"+locData[i].data) : localDataString;
        }

        let localDataArray = TabularData.FromString(localDataString);
        document.dispatchEvent(new CustomEvent('drawVizRows', {detail: {data: localDataArray}}));
        document.dispatchEvent(new CustomEvent('drawBody', {detail: {data: localDataArray}}));
        document.dispatchEvent(new CustomEvent('onLocalDataChange', {detail: {data: localDataArray}}));
    }
}   