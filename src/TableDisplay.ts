import { TabularData } from './TabularData';
import * as LineUpJS from 'lineupjs';
import { ColumnNumeric } from './ColumnNumeric';
import { ControlsDisplay } from './ControlsDisplay';
import { ColumnBuilder, ICategory } from 'lineupjs';
import FerretRenderer from './FerretRenderer';
import FerretCellRenderer from './FerretCellRenderer';
import FerretColumn from './FerretColumn';
import { LINEUP_COL_COUNT } from './lib/constants';

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
        document.addEventListener('updateLineup', (e: CustomEvent) => {
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
        for (let col of this.allColumns) {
            if (col instanceof FerretColumn) {
                col.on('filterChanged', () => {
                    document.dispatchEvent(new CustomEvent('filterChanged'));
                });
                col.on('highlightChanged', () => {
                    document.dispatchEvent(new CustomEvent('highlightChanged'));
                });
                col.on('visibilityChanged', () => {
                    document.dispatchEvent(
                        new CustomEvent('visibilityChanged')
                    );
                });
            }
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
