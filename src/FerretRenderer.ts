import {
    CHART_DC,
    CHART_FV,
    CHART_LDF,
    CHART_NG,
    CHART_R,
    CHART_VD
} from './colors';
import * as d3 from 'd3';
import type {
    Column,
    IImposer,
    ICellRendererFactory,
    IRenderContext,
    ISummaryRenderer
} from 'lineupjs';
import { ChartCalculations } from './ChartCalculations';
import * as filterNames from './lib/constants';
import vegaEmbed, { VisualizationSpec } from 'vega-embed';
import FerretColumn, {
    SelectionType,
    SelectionTypeString
} from './FerretColumn';
import { uniqueId } from 'lodash';

export default class FerretRenderer implements ICellRendererFactory {
    readonly title: string = 'Ferret Visualizations';
    readonly maxCollapseCount: number = 5;

    public canRender(col: Column) {
        return (
            col.desc.type === 'number' ||
            col.desc.type === 'categorical' ||
            col.desc.type === 'FerretColumn'
        );
    }

    public createSummary(
        col: FerretColumn,
        context: IRenderContext,
        interactive: boolean,
        imposer?: IImposer
    ): ISummaryRenderer {
        return {
            template: `
            <div class="vizContainer">
                <div class="noDisp innerVizContainer"></div>
                <div class="noDisp duplicateCountViz" data-show-all="false">
                    <div class="innerVizContainer"></div><div class="d-flex flex-column textButton"></div>
                </div>
                <div class="noDisp replicatesViz" data-show-all="false">
                    <div class="innerVizContainer"></div><div class="d-flex flex-column textButton"></div>
                </div>
                <div class="noDisp nGramViz" data-show-all="false">
                    <div class="innerVizContainer"></div><div class="d-flex flex-column textButton"></div>
                </div>
                <div class="noDisp innerVizContainer"></div>
                <div class="noDisp innerVizContainer"></div>
                <div class="noDisp innerVizContainer"></div>
                <div class="noDisp innerVizContainer"></div>
            </div>`,
            update: (container: HTMLElement) => {
                let childIndex = 0;
                let vizContainer = container.children[
                    childIndex++
                ] as HTMLElement;
                this.drawOverallDist(
                    vizContainer,
                    col,
                    context,
                    interactive,
                    'overallDist-',
                    col.id
                );

                vizContainer = container.children[childIndex++] as HTMLElement;
                this.drawFrequentDuplicates(
                    vizContainer,
                    col,
                    context,
                    'duplicateCount-',
                    col.id
                );

                vizContainer = container.children[childIndex++] as HTMLElement;
                this.drawReplicates(
                    vizContainer,
                    col,
                    context,
                    'replicates-',
                    col.id
                );

                vizContainer = container.children[childIndex++] as HTMLElement;
                this.drawNGramFrequency(
                    vizContainer,
                    col,
                    context,
                    'nGram-',
                    col.id
                );

                vizContainer = container.children[childIndex++] as HTMLElement;
                this.drawLeadingDigitDist(
                    vizContainer,
                    col,
                    context,
                    'benfordDist-',
                    col.id
                );

                vizContainer = container.children[childIndex++] as HTMLElement;
                this.drawTerminalDigitDist(
                    vizContainer,
                    col,
                    context,
                    'terminalDigit-',
                    col.id
                );

                vizContainer = container.children[childIndex++] as HTMLElement;
                this.drawTextPrecision(
                    vizContainer,
                    col,
                    context,
                    'textPrecision-',
                    col.id
                );

                // triggering this here ensures the right charts are shown
                // the setTimeout(0) is required so it will update correctly
                setTimeout(() => {
                    document.dispatchEvent(
                        new CustomEvent('visibilityChanged')
                    );
                }, 0);
            }
        };
    }

    private async drawOverallDist(
        container: HTMLElement,
        column: FerretColumn,
        context: IRenderContext,
        interactive: boolean,
        chartKey: string,
        colKey: string
    ): Promise<void> {
        let dataValues: Array<any> = [];
        let selectionName = filterNames.VALUE_DIST_SELECTION;

        const ranking = column.findMyRanker();
        const indices = ranking.getOrder();
        for (let i of indices) {
            const dataRow = await context.provider.getRow(i);
            if (!column.ignoreInAnalysis(dataRow)) {
                const dataValue = column.getRaw(dataRow);
                dataValues.push({ value: dataValue });
            }
        }

        const prefix = chartKey + colKey;
        const elementID = uniqueId(prefix + '-');
        container.classList.add(prefix);
        container.id = elementID;

        const isNumeric =
            column.desc.type === 'number' ||
            column.desc.type === 'FerretColumn';
        const xAxisType = isNumeric ? 'quantitative' : 'nominal';

        var yourVlSpec: VisualizationSpec = {
            width: 85,
            height: 50,
            $schema: 'https://vega.github.io/schema/vega-lite/v4.json',
            description: 'Overall Distribution',
            data: {
                values: dataValues
            },
            mark: 'bar',
            selection: {
                VALUE_DIST_SELECTION: {
                    type: 'multi',
                    clear: false
                }
            },
            encoding: {
                x: {
                    field: 'value',
                    type: xAxisType,
                    bin: isNumeric,
                    title: null
                },
                color: {
                    value: CHART_VD
                },
                y: {
                    field: 'value',
                    aggregate: 'count',
                    type: 'quantitative',
                    title: null
                },
                opacity: {
                    condition: {
                        selection: selectionName,
                        value: 1
                    },
                    value: 1
                }
            }
        };
        vegaEmbed('#' + elementID, yourVlSpec, { actions: true }).then(
            result => {
                // TODO - add back some interactivity here
                //   result.view.addSignalListener(selectionName, (name, value) => {
                //     let selectedData : Array<number> = this.getSelectedData(value._vgsid_, dataValues, "value");
                //     let filter: Filter = new Filter(uuid.v4(), column, selectionName, selectedData, 'LOCAL')
                //     document.dispatchEvent(new CustomEvent('addHighlight', {detail: {filter: filter}}));
                //   });
            }
        );
    }

    private async drawFrequentDuplicates(
        container: HTMLElement,
        column: FerretColumn,
        context: IRenderContext,
        chartKey: string,
        colKey: string
    ): Promise<void> {
        const prefix = chartKey + colKey;
        const elementID = uniqueId(prefix + '-');
        container.classList.add(prefix);
        container.id = elementID;

        const vizContainer = container.querySelector('.innerVizContainer');
        vizContainer.id = elementID + '-inner';

        let dupCounts = column?.freqVals?.acknowledged ?? [];

        let selectionName = filterNames.FREQUENT_VALUES_SELECTION;
        let dataValues: Array<any> = [];
        let index = 0;
        let multiFrequentValues: Array<any> = [];
        const showAll = container.dataset.showAll === 'true';
        for (let [val, count] of dupCounts) {
            if (count === 1) {
                continue;
            }
            multiFrequentValues.push([val, count]);
        }

        const maxIndex = showAll
            ? multiFrequentValues.length
            : this.maxCollapseCount;

        for (let [val, count] of multiFrequentValues) {
            if (index >= maxIndex) {
                break;
            }
            index++;
            dataValues.push({
                value: val,
                count: count
            });
        }

        var yourVlSpec: VisualizationSpec = {
            width: 85,
            ...(!showAll && { height: 80 }),
            $schema: 'https://vega.github.io/schema/vega-lite/v4.json',
            description: 'Duplicate Counts',
            data: {
                values: dataValues
            },
            encoding: {
                y: {
                    field: 'value',
                    type: 'ordinal',
                    sort: '-x',
                    axis: { labelBound: 20 },
                    title: null
                },
                x: { field: 'count', type: 'quantitative', title: null },
                color: {
                    value: CHART_FV
                },
                opacity: {
                    condition: {
                        selection: selectionName,
                        value: 1
                    },
                    value: 0.6
                }
            },
            layer: [
                {
                    mark: 'bar',
                    selection: {
                        FREQUENT_VALUES_SELECTION: {
                            type: 'multi',
                            clear: 'dblclick'
                        }
                    }
                },
                {
                    mark: {
                        type: 'text',
                        align: 'left',
                        baseline: 'middle',
                        dx: 3
                    },
                    encoding: {
                        text: { field: 'count', type: 'quantitative' }
                    }
                }
            ]
        };

        const tailCount = multiFrequentValues.length - this.maxCollapseCount;
        this.drawExpandCollapseTail(container, tailCount);

        vegaEmbed('#' + elementID + '-inner', yourVlSpec, {
            actions: true
        }).then(result => {
            result.view.addEventListener('contextmenu', (event, value) => {
                if (!value || !value.datum) {
                    return;
                }
                event = event as PointerEvent;
                event.preventDefault();
                this.drawContextMenu(
                    'value',
                    value.datum.value,
                    column,
                    context,
                    event.pageX,
                    event.pageY
                );
            });
        });
    }

    private async drawReplicates(
        container: HTMLElement,
        column: FerretColumn,
        context: IRenderContext,
        chartKey: string,
        colKey: string
    ): Promise<void> {
        let replicateCount = await ChartCalculations.GetReplicates(
            column,
            context
        );
        let dataValues: Array<any> = [];
        let index = 0;
        const showAll = container.dataset.showAll === 'true';
        const maxIndex = showAll
            ? replicateCount.length
            : this.maxCollapseCount;

        const prefix = chartKey + colKey;
        const elementID = uniqueId(prefix + '-');
        container.classList.add(prefix);
        container.id = elementID;

        container.querySelector('.innerVizContainer').id = elementID + '-inner';
        for (let [frequency, count] of replicateCount) {
            if (index >= maxIndex) {
                break;
            }
            index++;
            dataValues.push({
                frequency: frequency,
                count: count
            });
        }

        var yourVlSpec: VisualizationSpec = {
            width: 85,
            ...(!showAll && { height: 80 }),
            $schema: 'https://vega.github.io/schema/vega-lite/v4.json',
            description: 'Replicate Count',
            data: {
                values: dataValues
            },
            encoding: {
                x: { field: 'count', type: 'quantitative', title: null },
                color: {
                    value: CHART_R
                },
                y: {
                    field: 'frequency',
                    type: 'nominal',
                    sort: '-y',
                    title: null
                },
                tooltip: [
                    {
                        field: 'frequency',
                        type: 'nominal',
                        title: 'Repetitions:'
                    },
                    {
                        field: 'count',
                        type: 'quantitative',
                        title: 'Number of values repeated:'
                    }
                ]
            },
            layer: [
                {
                    mark: 'bar'
                },
                {
                    mark: {
                        type: 'text',
                        align: 'left',
                        baseline: 'middle',
                        dx: 3
                    },
                    encoding: {
                        text: { field: 'count', type: 'quantitative' }
                    }
                }
            ],
            view: { stroke: null }
        };

        const tailCount = replicateCount.length - this.maxCollapseCount;
        this.drawExpandCollapseTail(container, tailCount);
        vegaEmbed('#' + elementID + '-inner', yourVlSpec, {
            actions: true
        }).catch(console.warn);
    }

    private async drawNGramFrequency(
        container: HTMLElement,
        column: FerretColumn,
        context: IRenderContext,
        chartKey: string,
        colKey: string
    ): Promise<void> {
        const prefix = chartKey + colKey;
        const elementID = uniqueId(prefix + '-');
        container.classList.add(prefix);
        container.id = elementID;

        const vizContainer = container.querySelector('.innerVizContainer');
        vizContainer.id = elementID + '-inner';

        let nGramFrequency = column?.ngramCounts?.acknowledged ?? [];

        let dataValues: Array<any> = [];
        let index = 0;
        let multiFrequentGrams: Array<any> = [];
        let selectionName = filterNames.N_GRAM_SELECTION;

        for (let [val, count] of nGramFrequency) {
            if (count === 1) continue;
            multiFrequentGrams.push([val, count]);
        }
        const showAll = container.dataset.showAll === 'true';
        const maxIndex = showAll
            ? multiFrequentGrams.length
            : this.maxCollapseCount;

        for (let [val, count] of multiFrequentGrams) {
            if (index >= maxIndex) {
                break;
            }
            index++;
            dataValues.push({
                value: val,
                count: count
            });
        }

        var yourVlSpec: VisualizationSpec = {
            width: 85,
            ...(!showAll && { height: 80 }),
            $schema: 'https://vega.github.io/schema/vega-lite/v4.json',
            description: 'Duplicate Counts',
            data: {
                values: dataValues
            },
            encoding: {
                y: { field: 'value', type: 'ordinal', sort: '-x', title: null },
                x: { field: 'count', type: 'quantitative', title: null },
                color: {
                    value: CHART_NG
                },
                opacity: {
                    condition: {
                        selection: selectionName,
                        value: 1
                    },
                    value: 1
                }
            },
            layer: [
                {
                    mark: 'bar',
                    selection: {
                        N_GRAM_SELECTION: {
                            type: 'multi',
                            clear: 'dblclick'
                        }
                    }
                },
                {
                    mark: {
                        type: 'text',
                        align: 'left',
                        baseline: 'middle',
                        dx: 3
                    },
                    encoding: {
                        text: { field: 'count', type: 'quantitative' }
                    }
                }
            ]
        };

        const tailCount = multiFrequentGrams.length - this.maxCollapseCount;
        this.drawExpandCollapseTail(container, tailCount);

        vegaEmbed('#' + elementID + '-inner', yourVlSpec, {
            actions: true
        }).then(result => {
            result.view.addEventListener('contextmenu', (event, value) => {
                if (!value || !value.datum) {
                    return;
                }
                event = event as PointerEvent;
                event.preventDefault();
                this.drawContextMenu(
                    'nGram',
                    value.datum.value.toString(),
                    column,
                    context,
                    event.pageX,
                    event.pageY
                );
            });
        });
    }

    private async drawLeadingDigitDist(
        container: HTMLElement,
        column: FerretColumn,
        context: IRenderContext,
        chartKey: string,
        colKey: string
    ): Promise<void> {
        let digitCounts: Map<number, number>;
        digitCounts = new Map(column?.leadingDigitCounts?.acknowledged);
        const leadDictFreq = await ChartCalculations.GetLeadingDigitFreqs(
            column,
            context.provider,
            digitCounts
        );

        let selectionName = filterNames.LEADING_DIGIT_FREQ_SELECTION;
        let dataValues: Array<any> = [];
        for (let [digit, freq] of leadDictFreq) {
            dataValues.push({
                digit: digit,
                frequency: freq
            });
        }

        const prefix = chartKey + colKey;
        const elementID = uniqueId(prefix + '-');
        container.classList.add(prefix);
        container.id = elementID;

        var yourVlSpec: VisualizationSpec = {
            width: 85,
            height: 50,
            $schema: 'https://vega.github.io/schema/vega-lite/v4.json',
            description: 'Leading Digit frequencies',
            data: {
                values: dataValues
            },
            mark: 'bar',
            selection: {
                highlightBar: {
                    type: 'single',
                    empty: 'none',
                    on: 'mouseover'
                },
                LEADING_DIGIT_FREQ_SELECTION: {
                    type: 'multi',
                    clear: 'dblclick'
                }
            },
            encoding: {
                x: {
                    field: 'digit',
                    type: 'ordinal',
                    title: null
                },
                y: { field: 'frequency', type: 'quantitative', title: null },
                color: {
                    value: CHART_LDF
                },
                opacity: {
                    condition: {
                        selection: 'highlightBar',
                        value: 0.7
                    },
                    value: 1
                }
            }
        };

        vegaEmbed('#' + elementID, yourVlSpec, { actions: true })
            .then(result => {
                result.view.addEventListener('contextmenu', (event, value) => {
                    if (!value || !value.datum) {
                        return;
                    }
                    event = event as PointerEvent;
                    event.preventDefault();
                    this.drawContextMenu(
                        'leadingDigit',
                        value.datum.digit.toString(),
                        column,
                        context,
                        event.pageX,
                        event.pageY
                    );
                });
            })
            .catch(console.warn);
    }
    private async drawTerminalDigitDist(
        container: HTMLElement,
        column: FerretColumn,
        context: IRenderContext,
        chartKey: string,
        colKey: string
    ): Promise<void> {
        // let digitCounts: Map<number, number>;
        // digitCounts = new Map(column?.leadingDigitCounts?.acknowledged);
        const leadDictFreq = await ChartCalculations.GetTerminalDigitFreqs(
            column,
            context.provider
        );

        let selectionName = filterNames.LEADING_DIGIT_FREQ_SELECTION;
        let dataValues: Array<any> = [];
        for (let [digit, freq] of leadDictFreq) {
            dataValues.push({
                digit: digit,
                frequency: freq
            });
        }

        const prefix = chartKey + colKey;
        const elementID = uniqueId(prefix + '-');
        container.classList.add(prefix);
        container.id = elementID;

        var yourVlSpec: VisualizationSpec = {
            width: 85,
            height: 50,
            $schema: 'https://vega.github.io/schema/vega-lite/v4.json',
            description: 'Terminal Digit frequencies',
            data: {
                values: dataValues
            },
            mark: 'bar',
            selection: {
                highlightBar: {
                    type: 'single',
                    empty: 'none',
                    on: 'mouseover'
                },
                LEADING_DIGIT_FREQ_SELECTION: {
                    type: 'multi',
                    clear: 'dblclick'
                }
            },
            encoding: {
                x: {
                    field: 'digit',
                    type: 'ordinal',
                    title: null
                },
                y: { field: 'frequency', type: 'quantitative', title: null },
                color: {
                    value: 'black'
                },
                opacity: {
                    condition: {
                        selection: 'highlightBar',
                        value: 0.7
                    },
                    value: 1
                }
            }
        };

        vegaEmbed('#' + elementID, yourVlSpec, { actions: true })
            .then(result => {
                result.view.addEventListener('contextmenu', (event, value) => {
                    if (!value || !value.datum) {
                        return;
                    }
                    event = event as PointerEvent;
                    event.preventDefault();
                    this.drawContextMenu(
                        'leadingDigit',
                        value.datum.digit.toString(),
                        column,
                        context,
                        event.pageX,
                        event.pageY
                    );
                });
            })
            .catch(console.warn);
    }

    private async drawTextPrecision(
        container: HTMLElement,
        column: FerretColumn,
        context: IRenderContext,
        chartKey: string,
        colKey: string
    ): Promise<void> {
        let decimalCounts: Map<number, number>;
        decimalCounts = new Map(column?.decimalCounts?.acknowledged);
        const leadDictFreq = await ChartCalculations.GetPecisionFreqs(
            column,
            context.provider,
            decimalCounts
        );

        let dataValues: Array<any> = [];
        for (let [digit, freq] of leadDictFreq) {
            dataValues.push({
                digit: digit,
                frequency: freq
            });
        }

        const prefix = chartKey + colKey;
        const elementID = uniqueId(prefix + '-');
        container.classList.add(prefix);
        container.id = elementID;

        var yourVlSpec: VisualizationSpec = {
            width: 85,
            height: 50,
            $schema: 'https://vega.github.io/schema/vega-lite/v4.json',
            description: 'Text Precision',
            data: {
                values: dataValues
            },
            mark: 'bar',
            selection: {
                highlightBar: {
                    type: 'single',
                    empty: 'none',
                    on: 'mouseover'
                }
            },
            encoding: {
                x: {
                    field: 'digit',
                    type: 'ordinal',
                    title: null
                },
                y: { field: 'frequency', type: 'quantitative', title: null },
                color: {
                    value: CHART_DC
                },
                opacity: {
                    condition: {
                        selection: 'highlightBar',
                        value: 0.7
                    },
                    value: 1
                }
            }
        };

        vegaEmbed('#' + elementID, yourVlSpec, { actions: true })
            .then(result => {
                result.view.addEventListener('contextmenu', (event, value) => {
                    if (!value || !value.datum) {
                        return;
                    }
                    event = event as PointerEvent;
                    event.preventDefault();
                    this.drawContextMenu(
                        'leadingDigit', // todo remove or make work
                        value.datum.digit.toString(),
                        column,
                        context,
                        event.pageX,
                        event.pageY
                    );
                });
            })
            .catch(console.warn);
    }

    private drawExpandCollapseTail(
        container: HTMLElement,
        count: number
    ): void {
        const buttonContainer = container.querySelector('.textButton');
        buttonContainer.innerHTML = '';
        if (count <= 0) {
            return;
        }

        const showAll = container.dataset.showAll === 'true';
        const button = document.createElement('button');
        button.classList.add('btn', 'btn-sm', 'btn-light');
        if (showAll) {
            button.textContent = 'collapse';
        } else {
            button.textContent = `expand ${count} more items`;
        }
        button.onclick = () => {
            container.dataset.showAll = showAll ? 'false' : 'true';
            document.dispatchEvent(new CustomEvent('updateLineup'));
        };
        buttonContainer.appendChild(button);
    }

    private async drawContextMenu(
        type: SelectionType,
        value: number | string,
        column: FerretColumn,
        context: IRenderContext,
        pageX: number,
        pageY: number
    ): Promise<void> {
        const outerContextSelection = d3
            .select('#outerContextMenu')
            .on('click', () => {
                this.hideContextMenu();
            });

        const innerContextSelection = d3.select('#innerContextMenu');
        (innerContextSelection.node() as HTMLElement).style.top = pageY + 'px';
        (innerContextSelection.node() as HTMLElement).style.left = pageX + 'px';

        const { local: localRowIndices, global: globalRowIndices } =
            await this.getMatchingRowIndices(type, value, column, context);

        let typeString: string = SelectionTypeString(type);

        const buttonInfoList = [
            {
                iconKey: 'eye-slash',
                label: `Ignore ${typeString} ${value} in this column.`,
                func: () => this.onFilter(type, column, value, 'local')
            },
            {
                iconKey: 'globe-americas',
                label: `Ignore ${typeString} ${value} in any column.`,
                func: () => this.onFilter(type, column, value, 'global')
            },
            {
                iconKey: 'highlighter',
                label: `Highlight ${typeString} ${value} in this column.`,
                func: () => {
                    this.onHighlight(
                        type,
                        column,
                        value,
                        'local',
                        localRowIndices
                    );
                }
            },
            {
                iconKey: 'globe-americas',
                label: `Highlight ${typeString} ${value} in any column.`,
                func: () => {
                    this.onHighlight(
                        type,
                        column,
                        value,
                        'global',
                        globalRowIndices
                    );
                }
            }
        ];

        innerContextSelection
            .selectAll('button')
            .data(buttonInfoList)
            .join('button')
            .on('click', d => d.func())
            .html(d => `<i class="fas fa-${d.iconKey}"></i> ` + d.label);

        d3.select('#outerContextMenu').classed('d-none', false);
    }

    private async getMatchingRowIndices(
        type: SelectionType,
        value: number | string,
        column: FerretColumn,
        context: IRenderContext
    ): Promise<{ local: number[]; global: number[] }> {
        const localIndices: number[] = [];
        const globalIndices: number[] = [];
        const ranking = column.findMyRanker();
        const indices = ranking.getOrder();
        for (let i of indices) {
            const dataRow = await context.provider.getRow(i);

            const dataValue = column.getRaw(dataRow);
            if (FerretRenderer.isMatchingRow(dataValue, type, value)) {
                localIndices.push(i);
            }
            for (let colKey in dataRow.v) {
                let val = dataRow.v[colKey];
                if (FerretRenderer.isMatchingRow(val, type, value)) {
                    globalIndices.push(i);
                }
            }
        }
        return { local: localIndices, global: globalIndices };
    }

    private static isMatchingRow(
        dataValue: number,
        type: SelectionType,
        value: number | string
    ): boolean {
        return (
            (type === 'value' && dataValue === value) ||
            (type === 'nGram' &&
                dataValue.toString().includes(value as string)) ||
            (type === 'leadingDigit' &&
                ChartCalculations.getLeadingDigitString(dataValue) ===
                    (value as string))
        );
    }

    private onFilter(
        type: SelectionType,
        column: FerretColumn,
        value: number | string,
        scope: 'local' | 'global'
    ): void {
        switch (type) {
            case 'value':
                column.addValueToIgnore(value as number, scope);
                break;
            case 'nGram':
                column.addNGramToIgnore(value as string, scope);
                break;
            case 'leadingDigit':
                column.addLeadingDigitToIgnore(value as string, scope);
                break;
        }
    }

    private onHighlight(
        type: SelectionType,
        column: FerretColumn,
        value: number | string,
        scope: 'local' | 'global',
        rowIndices: number[]
    ): void {
        switch (type) {
            case 'value':
                column.addValueToHighlight(value as number, scope);
                break;
            case 'nGram':
                column.addNGramToHighlight(value as string, scope);
                break;
            case 'leadingDigit':
                column.addLeadingDigitToHighlight(value as string, scope);
                break;
        }

        document.dispatchEvent(
            new CustomEvent('highlightRows', {
                detail: { rowIndices: rowIndices }
            })
        );
    }

    private hideContextMenu(): void {
        d3.select('#outerContextMenu').classed('d-none', true);
    }
}
