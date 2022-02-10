import {
    Column,
    IDataRow,
    ValueColumn,
    ECompareValueType,
    IRenderContext
} from 'lineupjs';
import { IEventListener } from 'lineupjs/build/src/internal';
import {
    ChartCalculations,
    FreqValsMetadata,
    LeadDigitCountMetadata
} from './ChartCalculations';

export interface FerretSelection {
    values: Set<number>;
    ngrams: Set<string>;
    leadingDigits: Set<string>;
}
export interface FerretSelectionExplanation {
    selected: boolean;
    why: {
        value: { cause: boolean; col: FerretColumn | null };
        nGram: { range: Range; col: FerretColumn | null }[];
        leadingDigit: { cause: boolean; col: FerretColumn | null };
    };
}

export interface Range {
    start: number;
    end: number;
}

export type SelectionType = 'value' | 'nGram' | 'leadingDigit';

export function SelectionTypeString(
    selectionType: SelectionType,
    upper: boolean = false
): string {
    if (upper) {
        return {
            value: 'Value',
            nGram: 'N-Gram',
            leadingDigit: 'Leading Digit'
        }[selectionType];
    }
    return {
        value: 'value',
        nGram: 'n-gram',
        leadingDigit: 'leading digit'
    }[selectionType];
}

export default class FerretColumn extends ValueColumn<number> {
    static readonly EVENT_FILTER_CHANGED = 'filterChanged';
    static readonly EVENT_HIGHLIGHT_CHANGED = 'highlightChanged';

    private _defaultDecimalPlaces: number = 6;

    private _leadingDigitCounts: LeadDigitCountMetadata;
    public get leadingDigitCounts(): LeadDigitCountMetadata {
        return this._leadingDigitCounts;
    }
    public set leadingDigitCounts(v: LeadDigitCountMetadata) {
        this._leadingDigitCounts = v;
    }

    private _freqVals: FreqValsMetadata;
    public get freqVals(): FreqValsMetadata {
        return this._freqVals;
    }
    public set freqVals(v: FreqValsMetadata) {
        this._freqVals = v;
    }

    private static _globalIgnore: FerretSelection = {
        values: new Set<number>(),
        ngrams: new Set<string>(),
        leadingDigits: new Set<string>()
    };
    public static get globalIgnore(): FerretSelection {
        return FerretColumn._globalIgnore;
    }

    private static _globalHighlight: FerretSelection = {
        values: new Set<number>(),
        ngrams: new Set<string>(),
        leadingDigits: new Set<string>()
    };
    public static get globalHighlight(): FerretSelection {
        return FerretColumn._globalHighlight;
    }

    private _localIgnore: FerretSelection = {
        values: new Set<number>(),
        ngrams: new Set<string>(),
        leadingDigits: new Set<string>()
    };
    public get localIgnore(): FerretSelection {
        return this._localIgnore;
    }

    private _localHighlight: FerretSelection = {
        values: new Set<number>(),
        ngrams: new Set<string>(),
        leadingDigits: new Set<string>()
    };
    public get localHighlight(): FerretSelection {
        return this._localHighlight;
    }

    protected createEventList() {
        return super
            .createEventList()
            .concat([
                FerretColumn.EVENT_FILTER_CHANGED,
                FerretColumn.EVENT_HIGHLIGHT_CHANGED
            ]);
    }

    on(type: string | string[], listener: IEventListener | null): this {
        return super.on(type as any, listener);
    }

    public getValue(row: IDataRow): number {
        return this.getRaw(row);
    }

    public getRaw(row: IDataRow): number {
        return row.v[(this.desc as any).column];
    }

    public getNumber(row: IDataRow): number {
        return this.getRaw(row);
    }

    public getRightPaddingString(row: IDataRow): string {
        const label: string = this.getLabel(row);
        const numberParts = label.split('.');

        let decimalPlaces;
        if (typeof (this.desc as any).decimalPlaces !== 'undefined') {
            decimalPlaces = (this.desc as any).decimalPlaces;
        } else {
            decimalPlaces = this._defaultDecimalPlaces;
        }
        let paddingString = '';
        let numZeros: number;
        if (numberParts.length == 1) {
            paddingString += '.';
            numZeros = decimalPlaces;
        } else {
            numZeros = decimalPlaces - numberParts[1].length;
        }
        if (numZeros <= 0) {
            return '';
        }

        paddingString += '0'.repeat(numZeros);

        return paddingString;
    }

    public isFiltered(): boolean {
        return (
            this.localIgnore.values.size > 0 ||
            FerretColumn.globalIgnore.values.size > 0
        );
    }

    private addToIgnore<T>(
        value: T,
        scope: 'local' | 'global',
        accessor: (s: FerretSelection) => Set<T>
    ): void {
        switch (scope) {
            case 'local':
                accessor(this.localIgnore).add(value);
                break;
            case 'global':
                accessor(FerretColumn.globalIgnore).add(value);
                break;
        }

        this.triggerEvent(FerretColumn.EVENT_FILTER_CHANGED);
    }

    private addToHighlight<T>(
        value: T,
        scope: 'local' | 'global',
        accessor: (s: FerretSelection) => Set<T>
    ): void {
        switch (scope) {
            case 'local':
                accessor(this.localHighlight).add(value);
                break;
            case 'global':
                accessor(FerretColumn.globalHighlight).add(value);
                break;
        }

        this.triggerEvent(FerretColumn.EVENT_HIGHLIGHT_CHANGED);
    }

    public static removeFromIgnore<T>(
        value: T,
        columnOrListOfColumns: FerretColumn | FerretColumn[],
        accessor: (s: FerretSelection) => Set<T>
    ): void {
        if (columnOrListOfColumns instanceof FerretColumn) {
            accessor(columnOrListOfColumns.localIgnore).delete(value);
            columnOrListOfColumns.triggerEvent(
                FerretColumn.EVENT_FILTER_CHANGED
            );
        } else {
            accessor(FerretColumn.globalIgnore).delete(value);
            for (let col of columnOrListOfColumns) {
                col.triggerEvent(FerretColumn.EVENT_FILTER_CHANGED);
            }
        }
    }

    public static removeFromHighlight<T>(
        value: T,
        columnOrListOfColumns: FerretColumn | FerretColumn[],
        accessor: (s: FerretSelection) => Set<T>
    ): void {
        if (columnOrListOfColumns instanceof FerretColumn) {
            accessor(columnOrListOfColumns.localHighlight).delete(value);
            columnOrListOfColumns.triggerEvent(
                FerretColumn.EVENT_HIGHLIGHT_CHANGED
            );
        } else {
            accessor(FerretColumn.globalHighlight).delete(value);
            for (let col of columnOrListOfColumns) {
                col.triggerEvent(FerretColumn.EVENT_HIGHLIGHT_CHANGED);
            }
        }
    }

    public addValueToIgnore(value: number, scope: 'local' | 'global') {
        this.addToIgnore(value, scope, s => s.values);
    }
    public static removeValueFromIgnore(
        value: number,
        removeFrom: FerretColumn | FerretColumn[]
    ) {
        FerretColumn.removeFromIgnore(value, removeFrom, s => s.values);
    }

    public addNGramToIgnore(ngram: string, scope: 'local' | 'global') {
        this.addToIgnore(ngram, scope, s => s.ngrams);
    }
    public static removeNGramFromIgnore(
        value: string,
        removeFrom: FerretColumn | FerretColumn[]
    ) {
        FerretColumn.removeFromIgnore(value, removeFrom, s => s.ngrams);
    }

    public addLeadingDigitToIgnore(digit: string, scope: 'local' | 'global') {
        this.addToIgnore(digit, scope, s => s.leadingDigits);
    }
    public static removeLeadingDigitFromIgnore(
        value: string,
        removeFrom: FerretColumn | FerretColumn[]
    ) {
        FerretColumn.removeFromIgnore(value, removeFrom, s => s.leadingDigits);
    }

    public addValueToHighlight(value: number, scope: 'local' | 'global') {
        this.addToHighlight(value, scope, s => s.values);
    }
    public static removeValueFromHighlight(
        value: number,
        removeFrom: FerretColumn | FerretColumn[]
    ) {
        FerretColumn.removeFromHighlight(value, removeFrom, s => s.values);
    }

    public addNGramToHighlight(ngram: string, scope: 'local' | 'global') {
        this.addToHighlight(ngram, scope, s => s.ngrams);
    }
    public static removeNGramFromHighlight(
        value: string,
        removeFrom: FerretColumn | FerretColumn[]
    ) {
        FerretColumn.removeFromHighlight(value, removeFrom, s => s.ngrams);
    }

    public addLeadingDigitToHighlight(
        leadingDigit: string,
        scope: 'local' | 'global'
    ) {
        this.addToHighlight(leadingDigit, scope, s => s.leadingDigits);
    }
    public static removeLeadingDigitFromHighlight(
        value: string,
        removeFrom: FerretColumn | FerretColumn[]
    ) {
        FerretColumn.removeFromHighlight(
            value,
            removeFrom,
            s => s.leadingDigits
        );
    }

    public triggerEvent(event: string): void {
        this.fire([event, Column.EVENT_DIRTY_VALUES, Column.EVENT_DIRTY]);
    }

    /**
     * filter the current row if any filter is set
     * @param row
     * @returns {boolean}
     */
    filter(row: IDataRow) {
        return true;
    }

    /**
     * ignore the current value in analysis, also strike through it in the table.
     */
    public ignoreInAnalysis(row: IDataRow): boolean {
        return this.inSelection(
            row,
            FerretColumn.globalIgnore,
            this.localIgnore
        );
    }

    public highlightValueExplanation(
        row: IDataRow
    ): FerretSelectionExplanation {
        return this.inSelectionExplanation(
            row,
            FerretColumn.globalHighlight,
            this.localHighlight
        );
    }

    private inSelection(
        row: IDataRow,
        global: FerretSelection,
        local: FerretSelection
    ): boolean {
        return this.inSelectionExplanation(row, global, local).selected;
    }

    private inSelectionExplanation(
        row: IDataRow,
        global: FerretSelection,
        local: FerretSelection
    ): FerretSelectionExplanation {
        const explanation: FerretSelectionExplanation = {
            selected: false,
            why: {
                value: { cause: false, col: null },
                nGram: [],
                leadingDigit: { cause: false, col: null }
            }
        };

        const thisValue: number = this.getValue(row);

        // value filter
        if (global.values.has(thisValue)) {
            explanation.selected = true;
            explanation.why.value.cause = true;
        } else if (local.values.has(thisValue)) {
            explanation.selected = true;
            explanation.why.value.cause = true;
            explanation.why.value.col = this;
        }

        // ngram filter
        const valueString: string = thisValue.toString();
        for (let N of [2, 3, 4]) {
            // 4 is included here since it is the easiest solution
            // to the fact that I count '.' here, but not in ChartCalculations.ts
            // including 4 is the lazy way to catch substrings of max length 3 + '.'
            for (let i = 0; i < valueString.length - N + 1; i++) {
                const endIdx = i + N;
                const substring = valueString.substring(i, endIdx);
                if (global.ngrams.has(substring)) {
                    explanation.selected = true;
                    explanation.why.nGram.push({
                        range: {
                            start: i,
                            end: endIdx
                        },
                        col: null
                    });
                } else if (local.ngrams.has(substring)) {
                    explanation.selected = true;
                    explanation.why.nGram.push({
                        range: {
                            start: i,
                            end: endIdx
                        },
                        col: this
                    });
                }
            }
        }

        // leading digit filter
        const leadingDigitString =
            ChartCalculations.getLeadingDigitString(thisValue);
        if (global.leadingDigits.has(leadingDigitString)) {
            explanation.selected = true;
            explanation.why.leadingDigit.cause = true;
            explanation.why.leadingDigit.col = null;
        } else if (local.leadingDigits.has(leadingDigitString)) {
            explanation.selected = true;
            explanation.why.leadingDigit.cause = true;
            explanation.why.leadingDigit.col = this;
        }
        return explanation;
    }

    toCompareValue(row: IDataRow, valueCache?: any) {
        return valueCache != null ? valueCache : this.getNumber(row);
    }

    toCompareValueType() {
        return ECompareValueType.FLOAT;
    }
}
