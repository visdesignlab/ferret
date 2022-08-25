import * as d3 from 'd3';
import { TabularData } from './TabularData';

import {
    Column,
    builder as lineupBuilder,
    toolbar,
    buildCategoricalColumn,
    buildStringColumn,
    buildColumn,
    LineUp,
    ColumnBuilder,
    ICategory,
    Taggle
} from 'lineupjs';
import { ColumnNumeric } from './ColumnNumeric';
import FerretRenderer from './FerretRenderer';
import ExcelColumn from './ExcelColumn';
import FerretCellRenderer from './FerretCellRenderer';
import ExcelCellRenderer from './ExcelCellRenderer';
import FerretColumn from './FerretColumn';
import { LINEUP_COL_COUNT } from './lib/constants';

import {
    ChartCalculations,
    LeadDigitCountMetadata,
    FreqValsMetadata,
    NGramMetadata,
    DecimalMetadata
} from './ChartCalculations';

export class TableDisplay extends EventTarget {
    constructor() {
        super();
        document.addEventListener('updateLineup', async (e: CustomEvent) => {
            await this.updateFerretColumnMetaData();
            this.lineup.update();
        });
        document.addEventListener('toggleOverview', async (e: CustomEvent) => {
            this.lineup.setOverviewMode(e.detail.overviewMode);
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

    private _lineup: LineUp;
    public get lineup(): LineUp {
        return this._lineup;
    }

    private _allColumns: Column[];
    public get allColumns(): Column[] {
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
        const builder = lineupBuilder(rowFirstData);
        builder.registerColumnType('FerretColumn', FerretColumn);
        builder.registerColumnType('ExcelColumn', ExcelColumn);
        toolbar('rename', 'sort', 'sortBy', 'filterNumber')(FerretColumn);
        const extentLookup = new Map<string, [number, number]>();
        for (let i = 0; i < data.columnList.length; i++) {
            const key = i.toString();
            const column = data.columnList[i];
            const label = column.id;
            let columnBuilder: ColumnBuilder;
            if (column.type === 'Excel') {
                columnBuilder = buildColumn('ExcelColumn', key);
                columnBuilder.renderer('ExcelCellRenderer');
            } else if (column.type === 'Number') {
                columnBuilder = buildColumn('FerretColumn', key);
                columnBuilder.renderer(
                    'FerretCellRenderer',
                    '',
                    'FerretRenderer'
                );
                const extent = d3.extent(column.values as number[]);
                extentLookup.set(label, extent);
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
                columnBuilder = buildCategoricalColumn(key, categoryList);
                columnBuilder.renderer('string', '', '');
            } else {
                columnBuilder = buildStringColumn(key);
            }
            builder.column(columnBuilder.label(label).width(140));
        }

        const lineupContainer = document.getElementById('lineupContainer');

        builder.disableAdvancedModelFeatures();
        builder.sidePanel(false);
        builder.registerRenderer('FerretRenderer', new FerretRenderer());
        builder.registerRenderer(
            'FerretCellRenderer',
            new FerretCellRenderer()
        );
        builder.registerRenderer('ExcelCellRenderer', new ExcelCellRenderer());
        this._lineup = builder.buildTaggle(
            lineupContainer
        ) as unknown as LineUp;
        // this._lineup = builder.build(lineupContainer);
        // get the first ranking from the data provider
        const firstRanking = this.lineup.data.getFirstRanking();
        this._allColumns = firstRanking.flatColumns;
        this._ferretColumns = this.allColumns.filter(
            col => col instanceof FerretColumn
        ) as FerretColumn[];
        for (let col of this.ferretColumns) {
            const extent = extentLookup.get(col.label);
            col.normalize = d3.scaleLinear().domain(extent).range([0, 1]);

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
        const decimalCountPromises: Promise<DecimalMetadata>[] = [];
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
            // decimal count
            decimalCountPromises.push(
                ChartCalculations.getPecisionCounts(col, this.lineup.data)
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
        // Decimal Counts
        let decimalCountList = await Promise.all(decimalCountPromises);
        for (let i = 0; i < this.ferretColumns.length; i++) {
            let col = this.ferretColumns[i];
            let decimalCounts = decimalCountList[i];
            col.decimalCounts = decimalCounts;
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
