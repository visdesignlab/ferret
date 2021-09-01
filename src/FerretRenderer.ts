import { Column, IImposer, INumberColumn, ValueColumn } from 'lineupjs';
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
export default class FerretRenderer implements ICellRendererFactory
{
    readonly title: string = 'Ferret Visualizations';
    readonly maxCollapseCount: number = 5;

    public canRender(col: Column)
    {
        return col.desc.type === 'number' || col.desc.type === 'categorical';
    }

    public createSummary
    (
        col: ValueColumn<number>,
        context: IRenderContext,
        interactive: boolean,
        imposer?: IImposer
    ): ISummaryRenderer
    {
        return {
            template: `
            <div class="vizContainer">
                <div class="innerVizContainer"></div>
                <div class="noDisp" data-show-all="false">
                    <div class="innerVizContainer"></div><div class="expandCollapseTail"></div>
                </div>
                <div class="noDisp" data-show-all="false">
                    <div class="innerVizContainer"></div><div class="expandCollapseTail"></div>
                </div>
                <div class="noDisp" data-show-all="false">
                    <div class="innerVizContainer"></div><div class="expandCollapseTail"></div>
                </div>
                <div class="noDisp innerVizContainer"></div>
            </div>`,
            update: (container: HTMLElement) =>
            {
                console.log('update');
                // container.innerHTML = null;
                // console.log(n);
                // context.provider.data
                let childIndex = 0;
                let vizContainer = container.children[childIndex++] as HTMLElement;
                // vizContainer.innerHTML = null
                // let vizContainer = document.createElement('div');
                // container.appendChild(vizContainer);
                this.drawOverallDist(
                    vizContainer,
                    col,
                    context,
                    interactive,
                    'newOverallDist-',
                    col.id
                    )

      
                // vizContainer = document.createElement('div');
                // // vizContainer.classList.add('noDisp');
                // container.appendChild(vizContainer);

                vizContainer = container.children[childIndex++] as HTMLElement;

                // const dupCountType = 'TOP'; // todo
                this.drawFrequentDuplicates(vizContainer, col, context, 'newDuplicateCount-', col.id);
                
                // vizContainer = document.createElement('div');
                // // vizContainer.classList.add('noDisp');
                // container.appendChild(vizContainer);
                vizContainer = container.children[childIndex++] as HTMLElement;

                const repCountType = 'TOP'; // todo
                this.drawReplicates(vizContainer, col, context, 'newReplicates-', col.id, repCountType); 

                // vizContainer = document.createElement('div');
                // // vizContainer.classList.add('noDisp');
                // container.appendChild(vizContainer);
                vizContainer = container.children[childIndex++] as HTMLElement;

                const nGram = 2; // todo
                const lsd = false; // todo
                const nGramCountType = 'TOP'; // todo
                this.drawNGramFrequency(vizContainer, col, context, 'newNGram-', col.id, nGram, lsd, nGramCountType);

                // vizContainer = document.createElement('div');
                // // vizContainer.classList.add('noDisp');
                // container.appendChild(vizContainer);
                vizContainer = container.children[childIndex++] as HTMLElement;

                this.drawLeadingDigitDist(vizContainer, col, context, 'newBenfordDist-', col.id);

            },
        };
    }

    private async drawOverallDist
    (
        container: HTMLElement,
        column: ValueColumn<number>,
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
            const dataValue = column.getRaw(dataRow);
            dataValues.push({'value': dataValue});
        }

        const elementID = chartKey + colKey;
        container.id = elementID;
        // type: 'string' | 'number' | 'categorical'
        const isNumeric = column.desc.type === 'number';
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
            //   result.view.addSignalListener(selectionName, (name, value) => {
            //     let selectedData : Array<number> = this.getSelectedData(value._vgsid_, dataValues, "value");
            //     let filter: Filter = new Filter(uuid.v4(), column, selectionName, selectedData, 'LOCAL') 
            //     document.dispatchEvent(new CustomEvent('addHighlight', {detail: {filter: filter}}));
            //   });
          });
    }

    private async drawLeadingDigitDist(
        container: HTMLElement,
        column: ValueColumn<number>,
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
        
        vegaEmbed('#' + elementID, yourVlSpec, { actions: false }
            ).then(result => {
            //   result.view.addEventListener('mouseover', (event, value) => {
            //         this.attachFilterPicker(value, selectionName, column, key, dataValues, i, "digit");
            //     });
            //   result.view.addEventListener('mouseout', (event, value) => {
            //         this.removeFilterPicker(value, selectionName, column);
            //     });
            //   result.view.addSignalListener(selectionName, (name, value) => {
            //         this.attachSignalListener(value, dataValues, "digit", column, selectionName);
            //     });
          })
        .catch(console.warn); 
    }
    
    private async drawReplicates(
        container: HTMLElement,
        column: ValueColumn<number>,
        context: IRenderContext,
        chartKey: string,
        colKey: string,
        dupCountType: DuplicateCountType): Promise<void>
    {
        // let replicateCount = column.GetReplicates();
        let replicateCount = await ChartCalculations.GetReplicates(column, context);
        let dataValues : Array<any> = [];
        let index = 0;
        let [maxIndex, itemTail] = this.getItemTail(dupCountType, replicateCount);


        const elementID = chartKey + colKey;
        container.querySelector('.innerVizContainer').id = elementID;
        for (let [frequency, count] of replicateCount)
        {
            if (index >= maxIndex)
                break;

            index++;
            dataValues.push({
                'frequency': frequency,
                'count': count
            });
        }

        var yourVlSpec: VisualizationSpec = {
            width: 85,
            ...(dupCountType === 'TOP' && { height: 50 }),
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
        
        // this.attachItemTail(itemTail, column, key, i);
  
        vegaEmbed('#' + elementID, yourVlSpec, { actions: false })
        .catch(console.warn); 
        
    }
    
    private async drawFrequentDuplicates(
        container: HTMLElement,
        column: ValueColumn<number>,
        context: IRenderContext,
        chartKey: string,
        colKey: string): Promise<void>
    {
        // let dupCounts = column.GetDuplicateCounts();
        let dupCounts = await ChartCalculations.GetDuplicateCounts(column, context);
        let selectionName = filterNames.FREQUENT_VALUES_SELECTION;
        let dataValues : Array<any> = [];
        let index = 0;
        let multiFrequentValues : Array<any> = [];
        const showAll = container.dataset.showAll === 'true';
        for (let [val, count] of dupCounts) {
            if (count === 1) continue;
            multiFrequentValues.push([val, count]);
        }

        const maxIndex = showAll ? multiFrequentValues.length : this.maxCollapseCount;
        // let [maxIndex, itemTail] = this.getItemTail(showAll, multiFrequentValues);

        for(let [val, count] of multiFrequentValues) {
            if (index >= maxIndex) break;
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
            // ...(dupCountType === 'TOP' && { height: 50 }),
            height: 50,
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
                    value: 1
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
          const tailCount = multiFrequentValues.length - this.maxCollapseCount
          if (tailCount > 0)
          {
              this.drawExpandCollapseTail(container, tailCount)
          }
        //   this.attachItemTail(itemTail, column, key, i);
    
          vegaEmbed('#' + elementID + '-inner', yourVlSpec, { actions: false }
          ).then(result => {
            //   result.view.addEventListener('mouseover', (event, value) => {
            //     this.attachFilterPicker(value, selectionName, column, key, dataValues, i, "value");
            //      });
            //   result.view.addEventListener('mouseout', (event, value) => {
            //     this.removeFilterPicker(value, selectionName, column);
            //      });
            //   result.view.addSignalListener(selectionName, (name, value) => {
            //     this.attachSignalListener(value, dataValues, "value", column, selectionName);
            //   });
          });

    }


    private async drawNGramFrequency(
        container: HTMLElement,
        column: ValueColumn<number>,
        context: IRenderContext,
        chartKey: string,
        colKey: string,
        n: number,
        lsd: boolean,
        dupCountType: DuplicateCountType): Promise<void>
    {
        // let nGramFrequency = column.GetNGramFrequency(n, lsd);
        let nGramFrequency = await ChartCalculations.GetNGramFrequency(column, context, n, lsd);
        let dataValues : Array<any> = [];
        let index = 0;
        let multiFrequentGrams : Array<any> = [];
        let selectionName = filterNames.N_GRAM_SELECTION;
        
        for (let [val, count] of nGramFrequency) {
            if (count === 1) continue;
            multiFrequentGrams.push([val, count]);
        }

        let [maxIndex, itemTail] = this.getItemTail(dupCountType, multiFrequentGrams);

        for(let [val, count] of multiFrequentGrams) {
            if (index >= maxIndex) break;
            index++;
            dataValues.push({
                'value': val,
                'count': count
            });
        }

        const elementID = chartKey + colKey;
        container.querySelector('.innerVizContainer').id = elementID;

        var yourVlSpec: VisualizationSpec = {
            width: 85,
            ...(dupCountType === 'TOP' && { height: 50 }),
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

        //   this.attachItemTail(itemTail, column, key, i, n, lsd);
    
          vegaEmbed('#' + elementID, yourVlSpec, { actions: false }
          ).then(result => {
            // result.view.addEventListener('mouseover', (event, value) => {
            //     this.attachFilterPicker(value, selectionName, column, key, dataValues, i, "value");
            //      });
            //   result.view.addEventListener('mouseout', (event, value) => {
            //     this.removeFilterPicker(value, selectionName, column);
            //      });
            //   result.view.addSignalListener(selectionName, (name, value) => {
            //     this.attachSignalListener(value, dataValues, "value", column, selectionName);
            //      });
          })
         
    }


    private  getItemTail(dupCountType: DuplicateCountType, data: any) {
        let maxIndex = (dupCountType === 'ALL') ? data.length : 5;
        let itemTail = data.length - maxIndex > 0 ? data.length - maxIndex : 0;
        return [maxIndex, itemTail];
    }

    private attachItemTail(count: number, column: ColumnNumeric, key: string, i: number, nGram?: number, lsd?: boolean) {
        let itemTailDiv = document.getElementById(key + 'tail-' + i);
        let itemTailExist = (itemTailDiv.hasChildNodes()) ? true : false;
        let text = itemTailExist ? itemTailDiv.firstChild.textContent : null;
        let itemTailComponent : HTMLElement;

        while(itemTailDiv.firstChild) 
            itemTailDiv.removeChild(itemTailDiv.firstChild);
        
        if(text == null) 
            itemTailComponent = ItemTail.create(count, key, 'close', column, i, nGram, lsd);
        else if(text == 'close')
            itemTailComponent = ItemTail.create(count, key, 'open', column, i, nGram, lsd);
        else 
            itemTailComponent = ItemTail.create(count, key, 'close', column, i, nGram, lsd);

        document.getElementById(key + 'tail-' + i).appendChild(itemTailComponent);
    }

    private drawExpandCollapseTail(container: HTMLElement, count: number): void
    {
        const showAll = container.dataset.showAll === 'true';
        const buttonContainer = container.querySelector('.expandCollapseTail');
        const button = document.createElement('button');
        if (showAll)
        {
            button.textContent = 'collapse';
        }
        else
        {
            button.textContent = `expend ${count} more items`;
        }
        button.onclick = () =>
        {
            container.dataset.showAll = showAll ? 'false' : 'true';
            document.dispatchEvent(new CustomEvent('updateLineup'));
        }
        buttonContainer.innerHTML = '';
        buttonContainer.appendChild(button);
    }

}
