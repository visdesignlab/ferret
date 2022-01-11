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
        document.addEventListener('highlightChanged', () => this.onSelectionChange());
    }
}   