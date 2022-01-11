import { SelectionDropdown, SelectionVal } from './SelectionDropdown';
import FerretColumn from './FerretColumn';

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
        document.addEventListener('filterChanged', () => this.onSelectionChange());
    }
}   