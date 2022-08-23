import { Cell } from 'exceljs';
import * as d3 from 'd3';
import { Column, IDataRow, ValueColumn, ECompareValueType } from 'lineupjs';
import { IEventListener } from 'lineupjs/build/src/internal';
import {
    ChartCalculations,
    FreqValsMetadata,
    LeadDigitCountMetadata,
    NGramMetadata,
    DecimalMetadata
} from './ChartCalculations';

// MIGHT NOT NEED THIS FILE.

// export interface FerretSelection {
//     values: Set<number>;
//     ngrams: Set<string>;
//     leadingDigits: Set<string>;
// }
// export interface FerretSelectionExplanation {
//     selected: boolean;
//     why: {
//         value: { cause: boolean; col: FerretColumn | null };
//         nGram: { range: Range; col: FerretColumn | null }[];
//         leadingDigit: { cause: boolean; col: FerretColumn | null };
//     };
// }

// export interface Range {
//     start: number;
//     end: number;
// }

// export type SelectionType = 'value' | 'nGram' | 'leadingDigit';

// export function SelectionTypeString(
//     selectionType: SelectionType,
//     upper: boolean = false
// ): string {
//     if (upper) {
//         return {
//             value: 'Value',
//             nGram: 'N-Gram',
//             leadingDigit: 'Leading Digit'
//         }[selectionType];
//     }
//     return {
//         value: 'value',
//         nGram: 'n-gram',
//         leadingDigit: 'leading digit'
//     }[selectionType];
// }

export default class ExcelColumn extends ValueColumn<Cell> {
    // static readonly EVENT_FILTER_CHANGED = 'filterChanged';
    // static readonly EVENT_HIGHLIGHT_CHANGED = 'highlightChanged';

    // private _defaultDecimalPlaces: number = 6;

    // private _leadingDigitCounts: LeadDigitCountMetadata;
    // public get leadingDigitCounts(): LeadDigitCountMetadata {
    //     return this._leadingDigitCounts;
    // }
    // public set leadingDigitCounts(v: LeadDigitCountMetadata) {
    //     this._leadingDigitCounts = v;
    // }

    // private _freqVals: FreqValsMetadata;
    // public get freqVals(): FreqValsMetadata {
    //     return this._freqVals;
    // }
    // public set freqVals(v: FreqValsMetadata) {
    //     this._freqVals = v;
    // }

    // private _ngramCounts: NGramMetadata;
    // public get ngramCounts(): NGramMetadata {
    //     return this._ngramCounts;
    // }
    // public set ngramCounts(v: NGramMetadata) {
    //     this._ngramCounts = v;
    // }

    // private _decimalCounts: DecimalMetadata;
    // public get decimalCounts(): DecimalMetadata {
    //     return this._decimalCounts;
    // }
    // public set decimalCounts(v: DecimalMetadata) {
    //     this._decimalCounts = v;
    // }

    // private static _globalIgnore: FerretSelection = {
    //     values: new Set<number>(),
    //     ngrams: new Set<string>(),
    //     leadingDigits: new Set<string>()
    // };
    // public static get globalIgnore(): FerretSelection {
    //     return FerretColumn._globalIgnore;
    // }

    // private static _globalHighlight: FerretSelection = {
    //     values: new Set<number>(),
    //     ngrams: new Set<string>(),
    //     leadingDigits: new Set<string>()
    // };
    // public static get globalHighlight(): FerretSelection {
    //     return FerretColumn._globalHighlight;
    // }

    // private _localIgnore: FerretSelection = {
    //     values: new Set<number>(),
    //     ngrams: new Set<string>(),
    //     leadingDigits: new Set<string>()
    // };
    // public get localIgnore(): FerretSelection {
    //     return this._localIgnore;
    // }

    // private _localHighlight: FerretSelection = {
    //     values: new Set<number>(),
    //     ngrams: new Set<string>(),
    //     leadingDigits: new Set<string>()
    // };
    // public get localHighlight(): FerretSelection {
    //     return this._localHighlight;
    // }

    // private _normalize: d3.ScaleLinear<number, number>;
    // public get normalize(): d3.ScaleLinear<number, number> {
    //     return this._normalize;
    // }
    // public set normalize(v: d3.ScaleLinear<number, number>) {
    //     this._normalize = v;
    // }

    // protected createEventList() {
    //     return super
    //         .createEventList()
    //         .concat([
    //             FerretColumn.EVENT_FILTER_CHANGED,
    //             FerretColumn.EVENT_HIGHLIGHT_CHANGED
    //         ]);
    // }

    on(type: string | string[], listener: IEventListener | null): this {
        return super.on(type as any, listener);
    }

    public getValue(row: IDataRow): Cell {
        return this.getRaw(row);
    }

    public getRaw(row: IDataRow): Cell {
        return row.v[(this.desc as any).column];
    }

    // public getNumber(row: IDataRow): number {
    //     return this.getRaw(row);
    // }

    // public getScaledNumber(row: IDataRow): number {
    //     const raw = this.getRaw(row);
    //     return this.normalize(raw);
    // }

    // public getRightPaddingString(row: IDataRow): string {
    //     const label: string = this.getLabel(row);
    //     const numberParts = label.split('.');

    //     let decimalPlaces;
    //     if (typeof (this.desc as any).decimalPlaces !== 'undefined') {
    //         decimalPlaces = (this.desc as any).decimalPlaces;
    //     } else {
    //         decimalPlaces = this._defaultDecimalPlaces;
    //     }
    //     let paddingString = '';
    //     let numZeros: number;
    //     if (numberParts.length == 1) {
    //         paddingString += '.';
    //         numZeros = decimalPlaces;
    //     } else {
    //         numZeros = decimalPlaces - numberParts[1].length;
    //     }
    //     if (numZeros <= 0) {
    //         return '';
    //     }

    //     paddingString += '0'.repeat(numZeros);

    //     return paddingString;
    // }

    // public isFiltered(): boolean {
    //     return (
    //         this.localIgnore.values.size > 0 ||
    //         FerretColumn.globalIgnore.values.size > 0
    //     );
    // }

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

    // toCompareValue(row: IDataRow, valueCache?: any) {
    //     return valueCache != null ? valueCache : this.getNumber(row);
    // }

    // toCompareValueType() {
    //     return ECompareValueType.FLOAT;
    // }
}
