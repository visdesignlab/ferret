import * as d3 from 'd3';
import LineUp from 'lineupjs';
import FerretColumn, {
    FerretSelection,
    SelectionType,
    SelectionTypeString
} from './FerretColumn';
export interface SelectionVal {
    col: FerretColumn | null;
    val: number | string;
    type: SelectionType;
}
export abstract class DropdownBase extends EventTarget {
    private _toggleButton: HTMLButtonElement;
    public get toggleButton(): HTMLButtonElement {
        return this._toggleButton;
    }

    private _lineupInstance: LineUp;
    public get lineupInstance(): LineUp {
        return this._lineupInstance;
    }

    private _title: string;
    public get title(): string {
        return this._title;
    }

    private _actionWord: string;
    public get actionWord(): string {
        return this._actionWord;
    }

    private _globalAccessor: () => FerretSelection;
    public get globalAccessor(): () => FerretSelection {
        return this._globalAccessor;
    }

    private _localAccessor: (col: FerretColumn) => FerretSelection;
    public get localAccessor(): (col: FerretColumn) => FerretSelection {
        return this._localAccessor;
    }

    private _onRowclick: (
        val: SelectionVal,
        allColumns: FerretColumn[]
    ) => void;
    public get onRowclick(): (
        val: SelectionVal,
        allColumns: FerretColumn[]
    ) => void {
        return this._onRowclick;
    }

    public SetData(lineup: LineUp): void {
        this._lineupInstance = lineup;
    }

    public Init(
        toggleButton: HTMLButtonElement,
        title: string,
        actionWord: string,
        globalAccessor: () => FerretSelection,
        localAccessor: (col: FerretColumn) => FerretSelection,
        onRowClick: (val: SelectionVal, allColumns: FerretColumn[]) => void
    ): void {
        this._toggleButton = toggleButton;
        this._title = title;
        this._actionWord = actionWord;
        this._localAccessor = localAccessor;
        this._globalAccessor = globalAccessor;
        this._onRowclick = onRowClick;
    }

    private getListOfSelectionValues(): {
        selectionVals: SelectionVal[];
        allColumns: FerretColumn[];
    } {
        const selectionVals: SelectionVal[] = [];

        const globalSelectList: {
            selectionValues: Set<number> | Set<string>;
            type: SelectionType;
        }[] = [
            { selectionValues: this.globalAccessor().values, type: 'value' },
            { selectionValues: this.globalAccessor().ngrams, type: 'nGram' },
            {
                selectionValues: this.globalAccessor().leadingDigits,
                type: 'leadingDigit'
            }
        ];

        for (let globalSelect of globalSelectList) {
            const globalVals: SelectionVal[] = [
                ...globalSelect.selectionValues
            ].map(val => {
                return {
                    col: null,
                    val: val,
                    type: globalSelect.type
                };
            });
            selectionVals.push(...globalVals);
        }

        const firstRanking = this.lineupInstance.data.getFirstRanking();
        const ferretColumns: FerretColumn[] = firstRanking.flatColumns.filter(
            col => col instanceof FerretColumn
        ) as FerretColumn[];

        let localSelectList: {
            colAccessor: (col: FerretColumn) => Set<number> | Set<string>;
            type: SelectionType;
        }[] = [
            {
                colAccessor: (col: FerretColumn) =>
                    this.localAccessor(col).values,
                type: 'value'
            },
            {
                colAccessor: (col: FerretColumn) =>
                    this.localAccessor(col).ngrams,
                type: 'nGram'
            },
            {
                colAccessor: (col: FerretColumn) =>
                    this.localAccessor(col).leadingDigits,
                type: 'leadingDigit'
            }
        ];

        for (let localSelect of localSelectList) {
            const ferretColumnsWithFilter: FerretColumn[] =
                ferretColumns.filter(
                    col => localSelect.colAccessor(col).size > 0
                );
            const localVals = ferretColumnsWithFilter
                .map(col =>
                    [...localSelect.colAccessor(col)].map(val => {
                        return {
                            col: col,
                            val: val,
                            type: localSelect.type
                        };
                    })
                )
                .flat();

            selectionVals.push(...localVals);
        }

        return { selectionVals: selectionVals, allColumns: ferretColumns };
    }

    private drawDropdown() {
        const { selectionVals: selectionVals, allColumns: allColumns } =
            this.getListOfSelectionValues();

        const selectorString = this.toggleButton.dataset.bsTarget;
        const dropdownMenuSelect = d3.select(selectorString);

        dropdownMenuSelect
            .selectAll('div')
            .data(selectionVals)
            .join('div')
            .classed('dropdown-item', true)
            .attr('title', 'select to remove filter')
            .on('click', d => this.onRowclick(d, allColumns))
            .each((d, i, nodes) => {
                const element: HTMLDivElement = nodes[i] as HTMLDivElement;

                const selectionTypeWord = SelectionTypeString(d.type, true);

                const valueSpan: HTMLSpanElement =
                    document.createElement('span');
                valueSpan.classList.add('selection-label', d.type);
                valueSpan.innerText = d.val.toString();

                const columnSpan: HTMLSpanElement =
                    document.createElement('span');
                columnSpan.classList.add('selection-label', 'column-label');
                columnSpan.innerText =
                    d.col !== null
                        ? `${d.col.desc.label} (${d.col.id})`
                        : `ALL`;

                const trashSpan: HTMLSpanElement =
                    document.createElement('span');
                trashSpan.classList.add('trash-container');
                trashSpan.innerHTML = '<i class="fas fa-trash"></i>';

                element.innerHTML = `${selectionTypeWord} ${valueSpan.outerHTML} ${this.actionWord} in ${columnSpan.outerHTML}${trashSpan.outerHTML}`;
            });
    }

    public drawFilterCount(): void {
        let filterList = this.getListOfSelectionValues();
        this.toggleButton.innerText = `${this.title} (${filterList.selectionVals.length})`;
    }

    public onSelectionChange(): void {
        this.drawFilterCount();
        this.drawDropdown();
    }
}
