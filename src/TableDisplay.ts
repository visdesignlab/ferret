import { TabularData } from './TabularData';
import * as LineUpJS from 'lineupjs';
import { ColumnNumeric } from './ColumnNumeric';
import { ColumnBuilder, ICategory } from 'lineupjs';
import FerretRenderer from './FerretRenderer';
import FerretCellRenderer from './FerretCellRenderer';
import FerretColumn from './FerretColumn';
import { LINEUP_COL_COUNT } from './lib/constants';

import {
    ChartCalculations,
    LeadDigitCountMetadata,
    FreqValsMetadata,
    NGramMetadata
} from './ChartCalculations';

export class TableDisplay extends EventTarget {
    charts = [
        'overallDist',
        'duplicateCount',
        'replicates',
        'nGram',
        'benfordDist'
    ];
    chartNames = [
        'Value Distribution',
        'Frequent Values',
        'Replicates',
        'N Grams',
        'Leading Digit Frequency'
    ];
    constructor() {
        super();
        document.addEventListener('updateLineup', async (e: CustomEvent) => {
            await this.updateFerretColumnMetaData();
            this.lineup.update();
        });
        document.addEventListener('highlightRows', (e: CustomEvent) => {
            this.onHighlightRows(e);
        });
        document.addEventListener(
            'toggleColumnVisibility',
            (e: CustomEvent) => {
                const args = e.detail;
                this.toggleColumnVisibilty(args.colIndex, args.visible);
            }
        );
    }

    private _data: TabularData;
    public get data(): TabularData {
        return this._data;
    }

    private _lineup: LineUpJS.LineUp;
    public get lineup(): LineUpJS.LineUp {
        return this._lineup;
    }

    private _allColumns: LineUpJS.Column[];
    public get allColumns(): LineUpJS.Column[] {
        return this._allColumns;
    }

    private _ferretColumns: FerretColumn[];
    public get ferretColumns(): FerretColumn[] {
        return this._ferretColumns;
    }

    public SetData(data: TabularData): void {
        this._data = data;
        this.onDataChanged(this._data);
    }

    private onDataChanged(data: TabularData): void {
        document.dispatchEvent(
            new CustomEvent('onDataChange', { detail: { data: data } })
        );
        document.dispatchEvent(
            new CustomEvent('onLocalDataChange', { detail: { data: data } })
        );
        this.initLineup(data);
    }

    public toggleColumnVisibilty(index: number, visible: boolean) {
        const firstRanking = this.lineup.data.getFirstRanking(); // get the first ranking from the data provider
        let col = this.allColumns[LINEUP_COL_COUNT + index];
        col.setVisible(visible);
    }

    public initLineup(data: TabularData): void {
        const rowFirstData = data.getRowList();
        const builder = LineUpJS.builder(rowFirstData);
        builder.registerColumnType('FerretColumn', FerretColumn);
        LineUpJS.toolbar(
            'rename',
            'sort',
            'sortBy',
            'filterNumber'
        )(FerretColumn);

        for (let i = 0; i < data.columnList.length; i++) {
            const key = i.toString();
            const column = data.columnList[i];
            const label = column.id;
            let columnBuilder: ColumnBuilder;
            if (column.type === 'Number') {
                columnBuilder = LineUpJS.buildColumn('FerretColumn', key);
                columnBuilder.renderer(
                    'FerretCellRenderer',
                    '',
                    'FerretRenderer'
                );
                const decimalPlaces = (
                    column as ColumnNumeric
                ).getDecimalPlaces();
                columnBuilder.custom('decimalPlaces', decimalPlaces);
            } else if (column.type === 'Categorical') {
                const categoryList: (string | Partial<ICategory>)[] = [];
                for (let val of new Set(column.values)) {
                    const category: Partial<ICategory> = {
                        name: val.toString(),
                        color: '#C1C1C1'
                    };
                    categoryList.push(category);
                }
                columnBuilder = LineUpJS.buildCategoricalColumn(
                    key,
                    categoryList
                );
                columnBuilder.renderer('string', '', '');
            } else {
                columnBuilder = LineUpJS.buildStringColumn(key);
            }
            builder.column(columnBuilder.label(label).width(140));
        }

        const lineupContainer = document.getElementById('lineupContainer');

        builder.disableAdvancedModelFeatures();
        builder.sidePanel(false, true);
        builder.registerRenderer('FerretRenderer', new FerretRenderer());
        builder.registerRenderer(
            'FerretCellRenderer',
            new FerretCellRenderer()
        );
        this._lineup = builder.build(lineupContainer);
        // get the first ranking from the data provider
        const firstRanking = this.lineup.data.getFirstRanking();
        this._allColumns = firstRanking.flatColumns;
        this._ferretColumns = this.allColumns.filter(
            col => col instanceof FerretColumn
        ) as FerretColumn[];
        for (let col of this.ferretColumns) {
            col.on('filterChanged', async () => {
                await this.updateFerretColumnMetaData();
                document.dispatchEvent(new CustomEvent('filterChanged'));
            });
            col.on('highlightChanged', async () => {
                await this.updateFerretColumnMetaData();
                document.dispatchEvent(new CustomEvent('highlightChanged'));
            });
            col.on('visibilityChanged', () => {
                document.dispatchEvent(new CustomEvent('visibilityChanged'));
            });
        }

        let firstRun = true;
        this.lineup.data.on('busy', busy => {
            if (!busy && firstRun) {
                firstRun = false;
                this.updateFerretColumnMetaData();
            }
        });
    }

    private async updateFerretColumnMetaData(): Promise<void> {
        const freqValPromises: Promise<FreqValsMetadata>[] = [];
        const nGramPromises: Promise<NGramMetadata>[] = [];
        const leadingDigitPromises: Promise<LeadDigitCountMetadata>[] = [];
        for (let col of this.ferretColumns) {
            // Frequent Values
            freqValPromises.push(
                ChartCalculations.GetDuplicateCounts(col, this.lineup.data)
            );
            // N-Grams
            const twoGramSwitch = document.getElementById(
                '2-gram-switch'
            ) as HTMLInputElement;
            const nGram = twoGramSwitch.checked ? 2 : 3;
            const lsdSwitch = document.getElementById(
                'lsd-switch'
            ) as HTMLInputElement;
            const lsd = lsdSwitch.checked;
            nGramPromises.push(
                ChartCalculations.GetNGramFrequency(
                    col,
                    this.lineup.data,
                    nGram,
                    lsd
                )
            );
            // Leading Digit Frequency
            leadingDigitPromises.push(
                ChartCalculations.getLeadingDigitCounts(col, this.lineup.data)
            );
        }
        // Frequent Values
        let freqValsList = await Promise.all(freqValPromises);
        for (let i = 0; i < this.ferretColumns.length; i++) {
            let col = this.ferretColumns[i];
            let freqVals = freqValsList[i];
            col.freqVals = freqVals;
        }
        // N-Grams
        let nGramsList = await Promise.all(nGramPromises);
        for (let i = 0; i < this.ferretColumns.length; i++) {
            let col = this.ferretColumns[i];
            let nGramCounts = nGramsList[i];
            col.ngramCounts = nGramCounts;
        }
        // Leading Digit Frequency
        let digitCountsList = await Promise.all(leadingDigitPromises);
        for (let i = 0; i < this.ferretColumns.length; i++) {
            let col = this.ferretColumns[i];
            let digitCounts = digitCountsList[i];
            col.leadingDigitCounts = digitCounts;
        }
    }

    private onHighlightRows(e: CustomEvent): void {
        this.lineup.setSelection(e.detail.rowIndices);
        this.lineup.sortBy('col1');
        // lineup appears to not do anything if sort by is already set to col2
        // so this is to force an update
        this.lineup.sortBy('col2', false);
        this.lineup.update();
    }
}
[];
