import { DropdownBase, SelectionVal } from './DropdownBase';
import FerretColumn from './FerretColumn';
export class DropdownHighlight extends DropdownBase {
    constructor(toggleButton: HTMLButtonElement) {
        super();
        super.Init(
            toggleButton,
            'Highlight',
            'highlighted',
            () => FerretColumn.globalHighlight,
            (col: FerretColumn) => col.localHighlight,
            (val: SelectionVal, allColumns: FerretColumn[]) => {
                let removeFrom: FerretColumn | FerretColumn[] =
                    val.col !== null ? val.col : allColumns;
                switch (val.type) {
                    case 'value':
                        FerretColumn.removeValueFromHighlight(
                            val.val as number,
                            removeFrom
                        );
                        break;
                    case 'nGram':
                        FerretColumn.removeNGramFromHighlight(
                            val.val as string,
                            removeFrom
                        );
                        break;
                    case 'leadingDigit':
                        FerretColumn.removeLeadingDigitFromHighlight(
                            val.val as string,
                            removeFrom
                        );
                        break;
                }
            }
        );
        document.addEventListener('highlightChanged', () => {
            this.onSelectionChange();
        });
    }
}
