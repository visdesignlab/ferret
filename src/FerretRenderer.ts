import * as d3 from "d3";
import * as uuid from 'uuid';
import { Column, IImposer, INumberColumn, StringColumn, ValueColumn } from 'lineupjs';
import type {
    ICellRendererFactory,
    IRenderContext,
    ISummaryRenderer
} from 'lineupjs';
import { TabularData } from './TabularData';
import { ColumnNumeric } from './ColumnNumeric';
import { ChartCalculations } from './ChartCalculations';
import { chartType, DuplicateCountType } from './lib/constants/filter';
import * as filterNames from "./lib/constants/filter";
import vegaEmbed, { VisualizationSpec } from 'vega-embed';
import { ItemTail } from './components/item-tail';
import { Filter } from "./Filter";
import FerretColumn, { SelectionType, SelectionTypeString } from "./FerretColumn";
export default class FerretRenderer implements ICellRendererFactory
{
    readonly title: string = 'Ferret Visualizations';
    readonly maxCollapseCount: number = 5;

    public canRender(col: Column)
    {
        return col.desc.type === 'number' || col.desc.type === 'categorical' || col.desc.type === 'FerretColumn';
    }

    public createSummary
    (
        col: FerretColumn,
        context: IRenderContext,
        interactive: boolean,
        imposer?: IImposer
    ): ISummaryRenderer
    {
        return {
            template: `
            <div class="vizContainer">
                <div class="innerVizContainer"></div>
                <div class="noDisp duplicateCountViz" data-show-all="false">
                    <div class="innerVizContainer"></div><div class="expandCollapseTail"></div>
                </div>
                <div class="noDisp replicatesViz" data-show-all="false">
                    <div class="innerVizContainer"></div><div class="expandCollapseTail"></div>
                </div>
                <div class="noDisp nGramViz" data-show-all="false">
                    <div class="innerVizContainer"></div><div class="expandCollapseTail"></div>
                </div>
                <div class="noDisp innerVizContainer"></div>
            </div>`,
            update: (container: HTMLElement) =>
            {
                console.log('update');
                let childIndex = 0;
                let vizContainer = container.children[childIndex++] as HTMLElement;
                this.drawOverallDist(
                    vizContainer,
                    col,
                    context,
                    interactive,
                    'newOverallDist-',
                    col.id
                    );

                vizContainer = container.children[childIndex++] as HTMLElement;
                this.drawFrequentDuplicates(vizContainer, col, context, 'newDuplicateCount-', col.id);

                vizContainer = container.children[childIndex++] as HTMLElement;
                this.drawReplicates(vizContainer, col, context, 'newReplicates-', col.id); 

                vizContainer = container.children[childIndex++] as HTMLElement;
                const twoGramSwitch = document.getElementById('2-gram-switch') as HTMLInputElement;
                const nGram = twoGramSwitch.checked ? 2 : 3;
                const lsdSwitch = document.getElementById('lsd-switch') as HTMLInputElement;
                const lsd = lsdSwitch.checked;
                this.drawNGramFrequency(vizContainer, col, context, 'newNGram-', col.id, nGram, lsd);

                vizContainer = container.children[childIndex++] as HTMLElement;
                this.drawLeadingDigitDist(vizContainer, col, context, 'newBenfordDist-', col.id);

            },
        };
    }

    private async drawOverallDist
    (
        container: HTMLElement,
        column: FerretColumn,
        context: IRenderContext,
        interactive: boolean,
        chartKey: string,
        colKey: string
    ): Promise<void>
    {
        let dataValues : Array<any> = [];
        let selectionName = filterNames.VALUE_DIST_SELECTION;

        const ranking = column.findMyRanker();
        const indices = ranking.getOrder();
        for (let i of indices)
        {
            const dataRow = await context.provider.getRow(i);
            if (!column.ignoreInAnalysis(dataRow))
            {
                const dataValue = column.getRaw(dataRow);
                dataValues.push({'value': dataValue});
            }
        }

        const elementID = chartKey + colKey;
        container.id = elementID;
        const isNumeric = column.desc.type === 'number' || column.desc.type === 'FerretColumn';
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
                "VALUE_DIST_SELECTION": {
                    type: "multi",
                    clear: false
                },
            },
            encoding: {
              x: {field: 'value', type: xAxisType, bin: isNumeric, title: null},
              color: {
                  value: "#ffb726"
              },
              y: {field: 'value', aggregate: 'count', type: 'quantitative', title: null},
              opacity: {
                condition: {
                    selection: selectionName, 
                    value: 1
                },
                value: 1
              },
            }   
          };
          vegaEmbed('#' + elementID, yourVlSpec, { actions: false }
          ).then(result => {
            // TODO - add back some interactivity here
            //   result.view.addSignalListener(selectionName, (name, value) => {
            //     let selectedData : Array<number> = this.getSelectedData(value._vgsid_, dataValues, "value");
            //     let filter: Filter = new Filter(uuid.v4(), column, selectionName, selectedData, 'LOCAL') 
            //     document.dispatchEvent(new CustomEvent('addHighlight', {detail: {filter: filter}}));
            //   });
          });
    }
    
    private async drawFrequentDuplicates(
        container: HTMLElement,
        column: FerretColumn,
        context: IRenderContext,
        chartKey: string,
        colKey: string): Promise<void>
    {
        let dupCounts = await ChartCalculations.GetDuplicateCounts(column, context);
        let selectionName = filterNames.FREQUENT_VALUES_SELECTION;
        let dataValues : Array<any> = [];
        let index = 0;
        let multiFrequentValues : Array<any> = [];
        const showAll = container.dataset.showAll === 'true';
        for (let [val, count] of dupCounts)
        {
            if (count === 1) 
            {
                continue;
            }
            multiFrequentValues.push([val, count]);
        }

        const maxIndex = showAll ? multiFrequentValues.length : this.maxCollapseCount;

        for (let [val, count] of multiFrequentValues)
        {
            if (index >= maxIndex) 
            {
                break;
            }
            index++;
            dataValues.push({
                'value': val,
                'count': count
            });
        }

        const elementID = chartKey + colKey;
        container.id = elementID;
        container.querySelector('.innerVizContainer').id = elementID + '-inner';

        var yourVlSpec: VisualizationSpec = {
            width: 85,
            ...(!showAll && { height: 80 }),
            $schema: 'https://vega.github.io/schema/vega-lite/v4.json',
            description: 'Duplicate Counts',
            data: {
              values: dataValues
            },
            encoding: {
                y: {field: 'value', type: 'ordinal', sort: '-x', axis: {labelBound: 20}, title: null},
                x: {field: 'count', type: 'quantitative', title: null},
                color: {
                    value: "#e57373"
                },
                opacity: {
                    condition: {
                        selection: selectionName, 
                        value: 1
                    },
                    value: .6
                },
            },
            layer: [
                {
                    mark: 'bar',
                    selection: {
                        "FREQUENT_VALUES_SELECTION": {
                            type: "multi",
                            clear: "dblclick"
                        },
                    }
                },
                {
                    mark:
                    {
                        type: 'text',
                        align: 'left',
                        baseline: 'middle',
                        dx: 3
                    },
                    encoding:
                    {
                        text: {field: "count", type: "quantitative"}
                    }
                }
            ],
        };
        
        const tailCount = multiFrequentValues.length - this.maxCollapseCount;
        this.drawExpandCollapseTail(container, tailCount)
    
        vegaEmbed('#' + elementID + '-inner', yourVlSpec, { actions: false })
        .then(result => {
            result.view.addEventListener('contextmenu', (event, value) => {
                if (!value || !value.datum)
                {
                    return;
                }
                event = event as PointerEvent;
                event.preventDefault();
                this.drawContextMenu('value', value.datum.value, column, context, event.pageX, event.pageY);

            });
        });

    }

    private async drawReplicates(
        container: HTMLElement,
        column: FerretColumn,
        context: IRenderContext,
        chartKey: string,
        colKey: string): Promise<void>
    {
        let replicateCount = await ChartCalculations.GetReplicates(column, context);
        let dataValues : Array<any> = [];
        let index = 0;
        const showAll = container.dataset.showAll === 'true';
        const maxIndex = showAll ? replicateCount.length : this.maxCollapseCount;


        const elementID = chartKey + colKey;
        container.id = elementID;
        container.querySelector('.innerVizContainer').id = elementID + '-inner';
        for (let [frequency, count] of replicateCount)
        {
            if (index >= maxIndex)
            {
                break;
            }
            index++;
            dataValues.push({
                'frequency': frequency,
                'count': count
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
                x: {field: "count", type: "quantitative", title: null},
                color: {
                    value: "#0277BD"
                },
                y: {field: "frequency", type: "nominal", sort: '-y', title: null},
                tooltip: [
                    {field: "frequency", type: "nominal", title: "Repetitions:"},
                    {field: "count", type: "quantitative", title: "Number of values repeated:"}
                ]
              },
              layer: [
                {
                    mark: 'bar',
                },
                {
                    mark:
                    {
                        type: 'text',
                        align: 'left',
                        baseline: 'middle',
                        dx: 3
                    },
                    encoding:
                    {
                        text: {field: "count", type: "quantitative"}
                    }
                }
            ],
            view: {stroke: null}
        };
        
        const tailCount = replicateCount.length - this.maxCollapseCount;
        this.drawExpandCollapseTail(container, tailCount)  
        vegaEmbed('#' + elementID + '-inner', yourVlSpec, { actions: false })
        .catch(console.warn); 
        
    }

    private async drawNGramFrequency(
        container: HTMLElement,
        column: FerretColumn,
        context: IRenderContext,
        chartKey: string,
        colKey: string,
        n: number,
        lsd: boolean): Promise<void>
    {
        let nGramFrequency = await ChartCalculations.GetNGramFrequency(column, context, n, lsd);
        let dataValues : Array<any> = [];
        let index = 0;
        let multiFrequentGrams : Array<any> = [];
        let selectionName = filterNames.N_GRAM_SELECTION;
        
        for (let [val, count] of nGramFrequency) {
            if (count === 1) continue;
            multiFrequentGrams.push([val, count]);
        }
        const showAll = container.dataset.showAll === 'true';
        const maxIndex = showAll ? multiFrequentGrams.length : this.maxCollapseCount;

        for (let [val, count] of multiFrequentGrams)
        {
            if (index >= maxIndex) 
            {
                break;
            }
            index++;
            dataValues.push({
                'value': val,
                'count': count
            });
        }

        const elementID = chartKey + colKey;
        container.id = elementID;
        container.querySelector('.innerVizContainer').id = elementID + '-inner';

        var yourVlSpec: VisualizationSpec = {
            width: 85,
            ...(!showAll && { height: 80 }),
            $schema: 'https://vega.github.io/schema/vega-lite/v4.json',
            description: 'Duplicate Counts',
            data: {
              values: dataValues
            },
            encoding: {
                y: {field: 'value', type: 'ordinal', sort: '-x', title: null},
                x: {field: 'count', type: 'quantitative', title: null},
                color: {
                    value: "#ff8f00"
                },
                opacity: {
                    condition: {
                        selection: selectionName, 
                        value: 1
                    },
                    value: 1
                },
            },
            layer: [
                {
                    mark: 'bar',
                    selection: {
                        "N_GRAM_SELECTION": {
                            type: "multi",
                            clear: "dblclick"
                        },
                    }
                },
                {
                    mark:
                    {
                        type: 'text',
                        align: 'left',
                        baseline: 'middle',
                        dx: 3
                    },
                    encoding:
                    {
                        text: {field: "count", type: "quantitative"}
                    }
                }
            ],
          };

        const tailCount = multiFrequentGrams.length - this.maxCollapseCount;
        this.drawExpandCollapseTail(container, tailCount)


          vegaEmbed('#' + elementID + '-inner', yourVlSpec, { actions: false })

          .then(result => {
            result.view.addEventListener('contextmenu', (event, value) => {
                if (!value || !value.datum)
                {
                    return;
                }
                event = event as PointerEvent;
                event.preventDefault();
                this.drawContextMenu('nGram', value.datum.value.toString(), column, context, event.pageX, event.pageY);
            });
            });
    }

    private async drawLeadingDigitDist(
        container: HTMLElement,
        column: FerretColumn,
        context: IRenderContext,
        chartKey: string,
        colKey: string
    ): Promise<void>
    {
        let leadDictFreq = await ChartCalculations.GetLeadingDigitFreqs(column, context);
        let selectionName = filterNames.LEADING_DIGIT_FREQ_SELECTION;
        let dataValues : Array<any> = [];
        for (let [digit, freq] of leadDictFreq)
        {
            dataValues.push({
                'digit': digit,
                'frequency': freq
            });
        }

        const elementID = chartKey + colKey;
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
                "highlightBar": {
                    type: "single", 
                    empty: "none", 
                    on: "mouseover"
                },
                "LEADING_DIGIT_FREQ_SELECTION": {
                        type: "multi",
                        clear: "dblclick"
                }
            },
            encoding: {
              x: {
                  field: 'digit', 
                  type: 'ordinal',
                  title: null
              },
              y: {field: 'frequency', type: 'quantitative', title: null},
              color: {
                value: "#4db6ac"
              },
              opacity: {
                condition: {
                    selection: 'highlightBar', 
                    value: 0.7
                },
                value: 1
              },
            }
          };
        
        vegaEmbed('#' + elementID, yourVlSpec, { actions: false })
            .then(result => {
                result.view.addEventListener('contextmenu', (event, value) => {
                    if (!value || !value.datum)
                    {
                        return;
                    }
                    event = event as PointerEvent;
                    event.preventDefault();
                    this.drawContextMenu('leadingDigit', value.datum.digit.toString(), column, context, event.pageX, event.pageY);
                })
            })
        .catch(console.warn); 
    }

    private drawExpandCollapseTail(container: HTMLElement, count: number): void
    {
        const buttonContainer = container.querySelector('.expandCollapseTail');
        buttonContainer.innerHTML = '';
        if (count <= 0)
        {
            return;
        }

        const showAll = container.dataset.showAll === 'true';
        const button = document.createElement('button');
        if (showAll)
        {
            button.textContent = 'collapse';
        }
        else
        {
            button.textContent = `expand ${count} more items`;
        }
        button.onclick = () =>
        {
            container.dataset.showAll = showAll ? 'false' : 'true';
            document.dispatchEvent(new CustomEvent('updateLineup'));
        }
        buttonContainer.appendChild(button);
    }

    private async drawContextMenu(type: SelectionType, value: number | string, column: FerretColumn, context: IRenderContext, pageX: number, pageY: number): Promise<void>
    {
        const outerContextSelection = d3.select('#outerContextMenu')
            .on('click', () => 
            {
                this.hideContextMenu();
            });

        const innerContextSelection = d3.select('#innerContextMenu');
        (innerContextSelection.node() as HTMLElement).style.top = pageY + 'px';
        (innerContextSelection.node() as HTMLElement).style.left = pageX + 'px';

        const {
            local: localRowIndices,
            global: globalRowIndices
        } = await this.getMatchingRowIndices(type, value, column, context);

        let typeString: string = SelectionTypeString(type);

        const buttonInfoList = [
            {iconKey: 'eye-slash', label: `Ignore ${typeString} ${value} in this column.`, func: () => this.onFilter(type, column, value, 'local')},
            {iconKey: 'globe-americas', label: `Ignore ${typeString} ${value} in any column.`, func: () => this.onFilter(type, column, value, 'global')},
            {iconKey: 'highlighter', label: `Highlight ${typeString} ${value} in this column.`, func: () => this.onHighlight(type, column, value, 'local', localRowIndices)},
            {iconKey: 'globe-americas', label: `Highlight ${typeString} ${value} in any column.`, func: () => this.onHighlight(type, column, value, 'global', globalRowIndices)}
        ];

        innerContextSelection.selectAll('button')
            .data(buttonInfoList)
            .join('button')
            .on('click', d => d.func())
            .html(d => `<i class="fas fa-${d.iconKey}"></i> ` + d.label);

        d3.select('#outerContextMenu').classed('noDisp', false);
    }

    private async getMatchingRowIndices(type: SelectionType, value: number | string, column: FerretColumn, context: IRenderContext): Promise<{local: number[], global: number[]}>
    {
        const localIndices: number[] = [];
        const globalIndices: number[] = [];
        const ranking = column.findMyRanker();
        const indices = ranking.getOrder();
        for (let i of indices)
        {
            const dataRow = await context.provider.getRow(i);

            const dataValue = column.getRaw(dataRow);
            if (FerretRenderer.isMatchingRow(dataValue, type, value))
            {
                localIndices.push(i);
            }
            for (let colKey in dataRow.v)
            {
                if (FerretRenderer.isMatchingRow(dataRow.v[colKey], type, value))
                {
                    globalIndices.push(i);
                }
            }
        }
        return {local: localIndices, global: globalIndices};
    }

    private static isMatchingRow(dataValue: number, type: SelectionType, value: number | string): boolean
    {
        return (type === 'value' && dataValue === value)
            || (type === 'nGram' && dataValue.toString().includes(value as string)) 
            || (type === 'leadingDigit' && ColumnNumeric.getLeadingDigitString(dataValue) === value as string);
    }

    private onFilter(type: SelectionType, column: FerretColumn, value: number | string, scope: 'local' | 'global'): void
    {
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

    private onHighlight(type: SelectionType, column: FerretColumn, value: number | string, scope: 'local' | 'global', rowIndices: number[]): void
    {
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

        document.dispatchEvent(new CustomEvent('highlightRows', {detail: {rowIndices: rowIndices}}));
    }
    
    private hideContextMenu(): void
    {
        d3.select('#outerContextMenu').classed('noDisp', true);
    }

}
