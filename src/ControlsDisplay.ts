import * as d3 from 'd3';
import { TabularData } from './TabularData';
import { Column } from './Column';
import { DuplicateCountType, LINEUP_COL_COUNT } from './lib/constants';

export class ControlsDisplay {
    charts = [
        'newOverallDist',
        'newDuplicateCount',
        'newReplicates',
        'newNGram',
        'newBenfordDist'
    ];
    chartNames = [
        'Value Distribution',
        'Frequent Values',
        'Replicates',
        'N Grams',
        'Leading Digit Frequency'
    ];

    private _chartsShown: boolean[];
    public get chartsShown(): boolean[] {
        return this._chartsShown;
    }

    chartIndex: number = 0;

    public constructor(
        toolbarContainer: HTMLElement,
        controlsContainer: HTMLElement,
        descriptionContainer: HTMLElement,
        dataTableContainer: HTMLElement
    ) {
        this._toolbarContainer = toolbarContainer;
        this._controlsContainer = controlsContainer;
        this._descriptionContainer = descriptionContainer;
        this._dataTableContainer = dataTableContainer;
    }

    private _toolbarContainer: HTMLElement;
    public get toolbarContainer(): HTMLElement {
        return this._toolbarContainer;
    }

    private _controlsContainer: HTMLElement;
    public get controlsContainer(): HTMLElement {
        return this._controlsContainer;
    }

    private _dataTableContainer: HTMLElement;
    public get dataTableContainer(): HTMLElement {
        return this._dataTableContainer;
    }

    private _descriptionContainer: HTMLElement;
    public get descriptionContainer(): HTMLElement {
        return this._descriptionContainer;
    }

    private _data: TabularData;
    public get data(): TabularData {
        return this._data;
    }

    public SetData(data: TabularData, chartsShown: boolean[]): void {
        this._data = data;
        this._chartsShown = chartsShown;
    }

    public drawControls(tabularData: TabularData): void {
        let settingsButton = this.createToolbarButton(
            'Settings',
            'settingsButton',
            'controlsContainer',
            ['fas', 'fa-cogs'],
            (e: MouseEvent) => {
                this.toggleControlsPanel();
            }
        );
        this._toolbarContainer.appendChild(settingsButton);

        let descriptionsButton = this.createToolbarButton(
            'Descriptions',
            'descriptionsButton',
            'description',
            ['fas', 'fa-info-circle'],
            (e: MouseEvent) => {
                this.toggleDescriptions();
            }
        );
        // descriptionsButton.classList.add('selected');
        this._toolbarContainer.appendChild(descriptionsButton);
        this.drawDataColumnRows(tabularData.columnList);
        this.drawSummaryRows(tabularData);
        this.attachChartControls();
        document.addEventListener('visibilityChanged', () => {
            this.updateChartVisibility();
        });
    }

    private createToolbarButton(
        label: string,
        ID: string,
        collapseTargetID: string,
        iconClasses: string[],
        callback: (e: MouseEvent) => void
    ): HTMLButtonElement {
        let toolbarButton = document.createElement('button');

        let icon = document.createElement('i');
        icon.classList.add(...iconClasses);
        icon.classList.add('customButtonIcon');
        toolbarButton.appendChild(icon);

        let settingsButtonText = document.createElement('span');
        settingsButtonText.innerHTML = label;
        toolbarButton.appendChild(settingsButtonText);

        toolbarButton.id = ID;
        toolbarButton.setAttribute('data-bs-toggle', 'collapse');
        toolbarButton.setAttribute('data-bs-target', `#${collapseTargetID}`);
        toolbarButton.classList.add('btn', 'btn-outline-primary');
        toolbarButton.classList.add('selected');
        toolbarButton.addEventListener('click', e => {
            callback(e);
        });
        return toolbarButton;
    }

    private drawSummaryRows(tabularData: TabularData) {
        document.getElementById('numberOfRecords').innerHTML =
            'Rows: ' + tabularData.rowLength;
        document.getElementById('numberOfColumns').innerHTML =
            'Columns: ' + tabularData.columnList.length;
    }

    private drawDataColumnRows(columnList: Column<String | Number>[]): void {
        let parentDiv = document.getElementById('data-columns');

        for (let i = 0; i < columnList.length; i++) {
            const column = columnList[i];
            const uniqueId = 'COL- ' + i + ':' + column.id;

            let input = document.createElement('input');
            input.type = 'checkbox';
            input.checked = true;
            input.id = uniqueId;
            input.addEventListener('click', e =>
                this.toggleColumnDisplay(e, column, i)
            );
            input.classList.add('form-check-input');

            let label = document.createElement('label');
            label.innerHTML = column.id;
            label.htmlFor = uniqueId;
            label.classList.add('controlsLabel');
            label.classList.add('form-check-label');

            let div = document.createElement('div');
            div.classList.add('form-check', 'form-switch');
            div.appendChild(input);
            div.appendChild(label);
            parentDiv.appendChild(div);
        }
    }

    private toggleColumnDisplay(
        e: any,
        column: Column<Number | String>,
        index: number
    ) {
        column.visible = !column.visible;
        document.dispatchEvent(
            new CustomEvent('toggleColumnVisibility', {
                detail: {
                    colIndex: index,
                    visible: column.visible
                }
            })
        );
    }

    private toggleControlsPanel(): void {
        ControlsDisplay.toggleElementClass('settingsButton', 'selected');
    }

    private toggleDescriptions(): void {
        ControlsDisplay.toggleElementClass('descriptionsButton', 'selected');
    }

    private static toggleElementClass(id: string, cssClass: string): void {
        const toggleButton = document.getElementById(id);
        toggleButton.classList.toggle(cssClass);
    }

    public attachChartControls(): void {
        let nextSwitch = document.getElementById('next-step');
        let prevSwitch = document.getElementById('prev-step');
        let leadingDigitSwitch = document.getElementById(
            'leading-digit-switch'
        );
        let frequentValueSwitch = document.getElementById('freq-val-switch');
        let valueDistSwitch = document.getElementById('val-dist-switch');
        let repSwitch = document.getElementById('rep-switch');
        let uniqueValuesSwitch = document.getElementById(
            'unique-values-switch'
        );
        let repCountSwitch = document.getElementById('rep-count-switch');
        let ngramCountSwitch = document.getElementById('ngram-count-switch');
        let twoGramSwitch = document.getElementById('2-gram-switch');
        let threeGramSwitch = document.getElementById('3-gram-switch');
        let nGramSwitch = document.getElementById('n-gram-switch');
        let lsdSwitch = document.getElementById('lsd-switch');

        d3.selectAll('.item').on('click', (_d, i) => {
            this.showOnly(i);
        });

        valueDistSwitch.addEventListener('click', e => this.toggleChart(0, e));
        frequentValueSwitch.addEventListener('click', e =>
            this.toggleChart(1, e)
        );
        repSwitch.addEventListener('click', e => this.toggleChart(2, e));
        nGramSwitch.addEventListener('click', e => this.toggleChart(3, e));
        leadingDigitSwitch.addEventListener('click', e =>
            this.toggleChart(4, e)
        );

        uniqueValuesSwitch.addEventListener('click', e => {
            this.setShowAll('.duplicateCountViz', e);
        });
        repCountSwitch.addEventListener('click', e => {
            this.setShowAll('.replicatesViz', e);
        });
        ngramCountSwitch.addEventListener('click', e => {
            this.setShowAll('.nGramViz', e);
        });

        twoGramSwitch.addEventListener('click', e => this.updateLineUp());
        threeGramSwitch.addEventListener('click', e => this.updateLineUp());
        lsdSwitch.addEventListener('click', e => this.updateLineUp());

        nextSwitch.addEventListener('click', e => {
            this.setChartIndex(this.chartIndex + 1);
        });

        prevSwitch.addEventListener('click', e => {
            this.setChartIndex(this.chartIndex - 1);
        });
    }

    private setShowAll(selector: string, e: MouseEvent): void {
        const value = (e.target as HTMLInputElement).checked;
        d3.selectAll(selector).attr('data-show-all', value);
        this.updateLineUp();
    }

    public static getLSDStatus(): boolean {
        let lsdSwitch = document.getElementById(
            'lsd-switch'
        ) as HTMLInputElement;
        let lowestSignificant = lsdSwitch.checked ? true : false;
        return lowestSignificant;
    }

    public static getNGramStatus(): number {
        let twoSwitch = document.getElementById(
            '2-gram-switch'
        ) as HTMLInputElement;
        let n: number = twoSwitch.checked ? 2 : 3;
        return n;
    }

    public static getCountStatus(id: string): DuplicateCountType {
        let countSwitch = document.getElementById(id) as HTMLInputElement;
        let dupCountType: DuplicateCountType = countSwitch.checked
            ? 'ALL'
            : 'TOP';
        return dupCountType;
    }

    private updateLineUp() {
        document.dispatchEvent(new CustomEvent('updateLineup'));
    }

    private updateDescriptions() {
        document.dispatchEvent(
            new CustomEvent('changeCurrentChartIndex', {
                detail: { chartIndex: this.chartIndex }
            })
        );
    }

    private setChartIndex(index: number): void {
        if (index < 0 || index >= this.charts.length) {
            return;
        }
        this.chartIndex = index;
        this.showOnly(this.chartIndex);
        this.updateDescriptions();
    }

    private showOnly(index: number): void {
        this.chartsShown.fill(false);
        this.chartsShown[index] = true;
        this.drawChartSelectRowsRows();
    }

    private drawChartSelectRowsRows(): void {
        const showCount: number = this.chartsShown.filter(Boolean).length;
        const disableIndexIndicator: boolean = showCount != 1;
        if (showCount === 1) {
            this.chartIndex = this.chartsShown.findIndex(Boolean);
            this.updateDescriptions();
        }

        d3.selectAll('.current-index')
            .classed('hide', (d, i) => i !== this.chartIndex)
            .classed('disable', disableIndexIndicator);

        d3.selectAll('.customButtonEyeIcon')
            .data(this.chartsShown)
            .classed('hidden', d => !d);

        this.updateChartVisibility();
    }

    private toggleChart(index: number, e: Event): void {
        this.chartsShown[index] = !this.chartsShown[index];
        const showCount: number = this.chartsShown.filter(Boolean).length;
        this.drawChartSelectRowsRows();
        this.updateChartVisibility();
        e.stopPropagation();
    }

    private updateChartVisibility(): void {
        // this would maybe be better in TableDisplay.ts semantically.
        for (let i = 0; i < this.charts.length; i++) {
            const chartKey = this.charts[i];
            const visible = this.chartsShown[i];

            const lastIndex = this.data.columnList.length + LINEUP_COL_COUNT;
            for (let j = LINEUP_COL_COUNT; j < lastIndex; j++) {
                d3.select(`#${chartKey}-col${j}`).classed('noDisp', !visible);
            }
        }

        d3.selectAll('.item-option-container')
            .data(this.chartsShown)
            .classed('noDisp', d => !d);
    }
}
