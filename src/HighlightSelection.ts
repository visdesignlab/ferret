import { TabularData } from './TabularData';
import { Column } from './Column';
import { ColumnMixed } from './ColumnMixed';
import { ColumnCategorical } from './ColumnCategorical';
import { ColumnLabel } from './ColumnLabel';
import { ColumnNumeric } from './ColumnNumeric';
import * as filterNames from "./lib/constants/filter";
import { SelectionDropdown, SelectionVal } from "./SelectionDropdown";
import { Filter } from "./Filter";
import * as d3 from "d3";
import { local } from 'd3';
import FerretColumn, { FerretSelection } from './FerretColumn';
export class HighlightSelection extends SelectionDropdown
{

    constructor(container: HTMLElement) {
        super();
        super.Init(
            'highlight', container, 'Highlight', 'highlighter', 'highlighted',
            () => FerretColumn.globalHighlight,
            (col: FerretColumn) => col.localHighlight,
            (val: SelectionVal, allColumns: FerretColumn[]) =>
                {
                    let removeFrom: FerretColumn | FerretColumn[] = val.col !== null ? val.col : allColumns;
                    switch (val.type)
                    {
                        case 'value':
                            FerretColumn.removeValueFromHighlight( val.val as number, removeFrom);
                            break;
                        case 'nGram':
                            FerretColumn.removeNGramFromHighlight(val.val as string, removeFrom);
                            break;
                        case 'leadingDigit':
                            FerretColumn.removeLeadingDigitFromHighlight(val.val as string, removeFrom);
                            break;
                    }
                }
            );

        // super.SetId('ignore');
        // super.SetSelectionType('Filter');
        document.addEventListener('highlightChanged', () => this.onSelectionChange());
        // document.addEventListener('addGlobalFilter', (e: CustomEvent) => this.selectFilter(e.detail.filter));
        // document.addEventListener('onLocalDataChange', (e: CustomEvent) => this.SetLocalData(e.detail.data));
    }

    // constructor() {
    //     super();
    //     super.SetId('highlight');
    //     super.SetSelectionType('Highlight');
    //     // document.addEventListener('addHighlight', (e: CustomEvent) => this.selectFilter(e.detail.filter));
    //     document.addEventListener('onLocalDataChange', (e: CustomEvent) => {
    //         this.SetLocalData(e.detail.data)
    //         this.filterData(null, this._data, this._localData);
    //     });
    // }

//     public drawSetup(): void {
//         let filters: Array<Filter> = [];
//         let id: string = "highlight";
//         let title: string = "Highlight";
//         let iconType: string = "highlighter";
//         super.drawSetup(filters, id, title, iconType);
//     }

//     protected filterData(filter: Filter | null, data: TabularData | null, localData: TabularData | null) { 
      
//         let highlightedIndices : Array<number> = [];

//         let rows = d3.selectAll('tr');
//         rows.classed('highlighted', false);
 
//         let cols = d3.selectAll('td');
//         cols.classed('gram-highlighted', false);
        
//         if(!this._filters) return;
        
//         for(let f of this._filters) {
            
//             let selectedColumn : ColumnNumeric | ColumnLabel | ColumnCategorical | ColumnMixed = Column.getColumnById(localData, f.column.id);

//             switch(f.chart) {
            
//                 case filterNames.LEADING_DIGIT_FREQ_SELECTION:
//                         selectedColumn.values.forEach((value : any, index : number) => {
//                             if(ColumnNumeric.getLeadingDigit(value, new Set(f.selectedData)) != null) 
//                                 highlightedIndices.push(index);
//                         });
//                         break;
            
//                 case filterNames.FREQUENT_VALUES_SELECTION:
//                         selectedColumn.values.forEach((value : any, index : number) => {
//                             if(ColumnNumeric.isSelectedValue(value, new Set(f.selectedData))) 
//                                 highlightedIndices.push(index);
//                         });
//                         break;
                
//                 case filterNames.N_GRAM_SELECTION:
//                         localData.columnList.forEach((column: Column<String | Number>) => {
//                             let selectedColumn : ColumnNumeric | ColumnLabel | ColumnCategorical | ColumnMixed = Column.getColumnById(localData, column.id);
//                             selectedColumn.values.forEach((value : any, index : number) => {
//                                 if(ColumnNumeric.containsNGram(value, new Set(f.selectedData))) {
//                                     let row = d3.select('#dataRow'+ (index+1));
//                                     let col = row.select('#col' + selectedColumn.position);
//                                     highlightedIndices.push(index);
//                                     col.classed('gram-highlighted', true);
//                                 }
//                             });
//                         });
//                         break;
//             }
//         }

//         this.reorderRows(highlightedIndices, data, localData);

//     }

//     private reorderRows(highlightedIndices: Array<number>, data: TabularData | null, localData: TabularData | null) { 
//         let header = data.columnList.map(d => d.id).toString();
//         let localDataString : string = "";
//         let length = 0;

//         highlightedIndices.sort((a, b) => {return a - b});

//         let highlightedIndex = highlightedIndices[length];
//         for(let i = 0; i < localData.rowLength; i++) {
//             if(i == highlightedIndex) {
//                 localDataString = localData.getRow(i).toString().concat("\n"+localDataString);
//                 if(length < highlightedIndices.length) 
//                     highlightedIndex = highlightedIndices[++length];
//             }
//             else {
//                 localDataString = localDataString.concat(localData.getRow(i).toString()+"\n");
//             }
//         }

//         localDataString = header.concat("\n"+localDataString);
//         let localDataArray = TabularData.FromString(localDataString);
//         document.dispatchEvent(new CustomEvent('drawVizRows', {detail: {data: localDataArray}}));
//         document.dispatchEvent(new CustomEvent('drawBody', {detail: {data: localDataArray}}));
        
//         // Actual Highlighting Rows
//         for(let i = 0; i < highlightedIndices.length; i++) {
//           let row = d3.select('#dataRow'+ (i+1));
//           row.classed('highlighted', true);
//         }
//    //   document.dispatchEvent(new CustomEvent('onLocalDataChange', {detail: {data: localDataArray}}));
  
//     }
}   