import { Filter } from './Filter';
import { TabularData } from './TabularData';
import { Column } from './Column';
import { ColumnMixed } from './ColumnMixed';
import { ColumnCategorical } from './ColumnCategorical';
import { ColumnLabel } from './ColumnLabel';
import { ColumnNumeric } from './ColumnNumeric';
import * as filterNames from "./lib/constants/filter";
import { SelectionDropdown, SelectionVal } from './SelectionDropdown';
import FerretColumn, { FerretSelection } from './FerretColumn';

export class IgnoreSelection extends SelectionDropdown
{

    constructor(container: HTMLElement) {
        super();
        super.Init(
            'ignore', container, 'Ignore', 'eye-slash', 'ignored',
            () => FerretColumn.globalIgnore,
            (col: FerretColumn) => col.localIgnore,
            (val: SelectionVal, allColumns: FerretColumn[]) =>
                {
                    let removeFrom: FerretColumn | FerretColumn[] = val.col !== null ? val.col : allColumns;
                    switch (val.type)
                    {
                        case 'value':
                            FerretColumn.removeValueFromIgnore( val.val as number, removeFrom);
                            break;
                        case 'nGram':
                            FerretColumn.removeNGramFromIgnore(val.val as string, removeFrom);
                            break;
                        case 'leadingDigit':
                            FerretColumn.removeLeadingDigitFromIgnore(val.val as string, removeFrom);
                            break;
                    }
 
                }
            );

        // super.SetId('ignore');
        // super.SetSelectionType('Filter');
        document.addEventListener('filterChanged', () => this.onSelectionChange());
        // document.addEventListener('addGlobalFilter', (e: CustomEvent) => this.selectFilter(e.detail.filter));
        // document.addEventListener('onLocalDataChange', (e: CustomEvent) => this.SetLocalData(e.detail.data));
    }

    // public drawSetup(): void {
    //     super.drawSetup();
    // }

    // protected filterData(filter: Filter | null, data: TabularData | null, localData: TabularData | null) {
    //     let header = data.columnList.map(d => d.id).toString();
    //     let locData:any = [];
        
    //     for(let i = 0; i < data.rowLength; i++) {
    //         locData[i] = {};
    //         locData[i].data = data.getRow(i).toString();
    //         locData[i].include = true;
    //     }

    //     for(let f of this._filters) {
            
    //         let selectedColumn: ColumnNumeric | ColumnCategorical | ColumnLabel | ColumnMixed;
            
    //         for(let column of data.columnList) {
    //             if(f.filterRange == 'LOCAL' && column.id != f.column.id) continue;
    //             if(f.filterRange == 'GLOBAL' || column.id == f.column.id) 
    //                 selectedColumn = (Column.getColumnById(data, column.id));

    //         switch(f.chart) {
    //             case filterNames.LEADING_DIGIT_FREQ_SELECTION:
    //                     selectedColumn.values.forEach((value : any, index : number) => {
    //                         if(ColumnNumeric.getLeadingDigit(value, new Set(f.selectedData)) != null) {
    //                             locData[index].include = false;
    //                         }
    //                     });
    //                     break;
    //             case filterNames.FREQUENT_VALUES_SELECTION:
    //                     selectedColumn.values.forEach((value : any, index : number) => {
    //                         if(ColumnNumeric.isSelectedValue(value, new Set(f.selectedData))) {
    //                             locData[index].include = false;
    //                         }
    //                     });
    //                     break;
    //             case filterNames.N_GRAM_SELECTION:
    //                 selectedColumn.values.forEach((value : any, index : number) => {
    //                     if(ColumnNumeric.containsNGram(value, new Set(f.selectedData))) {
    //                         locData[index].include = false;
    //                     }
    //                 });
    //                 break;
    //             }
    //         }   
    //     }

        
    //     let localDataString = "";
    //     localDataString = localDataString.concat(header);

    //     for(let i = 0; i < data.rowLength; i++) {
    //         localDataString = (locData[i].include) ? localDataString.concat("\n"+locData[i].data) : localDataString;
    //     }

    //     let localDataArray = TabularData.FromString(localDataString);
    //     document.dispatchEvent(new CustomEvent('drawVizRows', {detail: {data: localDataArray}}));
    //     document.dispatchEvent(new CustomEvent('drawBody', {detail: {data: localDataArray}}));
    //     document.dispatchEvent(new CustomEvent('onLocalDataChange', {detail: {data: localDataArray}}));
    // }
}   