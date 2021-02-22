import { TabularData } from "./TabularData";
import * as d3 from "d3";
import * as uuid from 'uuid';
import vegaEmbed, { VisualizationSpec } from 'vega-embed';
import { ColumnNumeric } from "./ColumnNumeric";
import * as filterNames from "./lib/constants/filter";
import { ColumnCategorical } from "./ColumnCategorical";
import { DuplicateCountType, chartType } from "./lib/constants/filter";
import { Filter } from "./Filter";
import { ControlsDisplay } from "./ControlsDisplay";
import { FilterPicker } from "./components/filter-picker";
import * as $ from 'jquery';

export class TableDisplay extends EventTarget
{

    constructor() {
        super();
        document.addEventListener("drawVizRows", (e: CustomEvent) => {this.drawVizRows(e.detail.data)});
        document.addEventListener("drawBody", (e: CustomEvent) => {this.drawBody(e.detail.data)});
    }

    private _container : HTMLElement;
    public get container() : HTMLElement {
        return this._container;
    }

    public SetContainer(container: HTMLElement) : void {
        this._container = container;
    }

    
    private _data : TabularData;
    public get data() : TabularData {
        return this._data;
    }

    public SetData(data: TabularData): void
    {
        this._data = data;
        this.onDataChanged(this._data);
    }

    private onDataChanged(data: TabularData): void
    {
        document.dispatchEvent(new CustomEvent('onDataChange', {detail: {data: data}}));
        document.dispatchEvent(new CustomEvent('onLocalDataChange', {detail: {data: data}}));
        this.drawHeader(data);
        this.setupVizRows(data);
        this.drawBody(data);
    }

    private drawHeader(data: TabularData): void
    {

        let thead = d3.select(this.container).select('thead');
        let th = thead.html(null)
            .append('tr')
            .selectAll('th')
            .data([{id: 'Row', type: ' ', visible: true}, ...data.columnList])
            .join('th');

        th.append('div').text(d => d.id).attr('id', d => 'col-header-' + d.id);
        th.append('div').text(d => d.type.toUpperCase()).attr('id', d => 'col-type-' + d.id).classed('columnType', true);
    }

    public changeColumnVisibilty(index: number, visible: Boolean) {
        let table = document.getElementById('dataTable');
        let rows = table.getElementsByTagName('tr');

        for (let row = 0; row < rows.length; row++) {
            let cols = rows[row].cells;
            if (index >= 0 && index < cols.length) {
                cols[index+1].style.display = visible ? '' : 'none';
            }
        }
    }

    public hideVizRows(key: String, data: TabularData): void 
    {
        for (let i = 0; i < data.columnList.length; i++)
        {
                let element = document.getElementById(key+"-"+ i);
                element.classList.add("chartHidden");
        }
    }

    public showVizRows(key: String, data: TabularData): void 
    {
        for (let i = 0; i < data.columnList.length; i++)
        {
                let element = document.getElementById(key+"-"+ i);
                element.classList.remove("chartHidden");
        }
    }

    public setupVizRows(data: TabularData): void {
        let tbody = d3.select(this.container).select('tbody');
        let dataRow = tbody.html(null).append('tr')
        // let dataCell = tbody.html(null).append('tr')
        dataRow.append('th')
        let dataCell = dataRow.selectAll('td')
            .data(data.columnList)
            .join('td') 
            .classed('vizCell', true);
        
        dataCell.append('div').attr('id', (d, i) => 'overallDist-' + i);
        dataCell.append('div').attr('id', (d, i) => 'benfordDist-' + i);
        dataCell.append('div').classed('chartDiv', true).classed('scrollbar', true).attr('id', (d, i) => 'duplicateCount-' + i);
        dataCell.append('div').classed('chartDiv', true).classed('scrollbar', true).attr('id', (d, i) => 'nGram-' + i);
        dataCell.append('div').classed('chartDiv', true).classed('scrollbar', true).attr('id', (d, i) => 'replicates-' + i);
        this.drawVizRows(data);
    }

    public drawVizRows(data: TabularData): void
    {
        let dupCountType: DuplicateCountType = ControlsDisplay.getCountStatus("unique-values-switch");                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          
        let repCountType: DuplicateCountType = ControlsDisplay.getCountStatus("rep-count-switch");
        let nGramCountType: DuplicateCountType = ControlsDisplay.getCountStatus("ngram-count-switch");
        let nGram: number = ControlsDisplay.getNGramStatus();
        let lsd: boolean = ControlsDisplay.getLSDStatus();

        for (let i = 0; i < data.columnList.length; i++)
        {
            let column = data.columnList[i];
            if (column.type === 'Categorical') {
                let colNum = column as ColumnCategorical;
                this.drawOverallDist(data, colNum, 'overallDist-' + i, false, 'nominal');
            }
            else if (column.type === 'Number')
            {
                let colNum = column as ColumnNumeric;
                this.drawOverallDist(data, colNum, 'overallDist-' + i, true, 'quantitative');
                this.drawLeadingDigitDist(data, colNum, 'benfordDist-' + i);
                this.drawFrequentDuplicates(data, colNum, 'duplicateCount-' + i, dupCountType);
                this.drawNGramFrequency(data, colNum, 'nGram-' + i, nGram, lsd, nGramCountType);
                this.drawReplicates(data, colNum, 'replicates-' + i, repCountType);
            }
        }
    }

    private drawOverallDist(data: TabularData, column: ColumnNumeric | ColumnCategorical, key: string, isBinned: boolean, columnType: chartType): void
    {
        let dataValues : Array<any> = [];
        let selectionName = filterNames.VALUE_DIST_SELECTION;
        for (let val of column.values)
        {
            dataValues.push({
                'value': val
            });
        }

        var yourVlSpec: VisualizationSpec = {
            width: 100,
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
              x: {field: 'value', type: columnType, bin: isBinned},
              color: {
                  value: "#ffb726"
              },
              y: {field: 'value', aggregate: 'count', type: 'quantitative'},
              opacity: {
                condition: {
                    selection: selectionName, 
                    value: 1
                },
                value: 1
              },
            }   
          };
          vegaEmbed('#' + key, yourVlSpec, { actions: false }
          ).then(result => {
              result.view.addSignalListener(selectionName, (name, value) => {
                let selectedData : Array<number> = this.getSelectedData(value._vgsid_, dataValues, "value");
                let filter: Filter = new Filter(uuid.v4(), column, selectionName, selectedData) 
                document.dispatchEvent(new CustomEvent('addHighlight', {detail: {filter: filter}}));
              });
          });
    }

    private drawLeadingDigitDist(data: TabularData, column: ColumnNumeric, key: string): void
    {
        let leadDictFreq = column.GetLeadingDigitFreqs();
        let selectionName = filterNames.LEADING_DIGIT_FREQ_SELECTION;
        let dataValues : Array<any> = [];
        for (let [digit, freq] of leadDictFreq)
        {
            dataValues.push({
                'digit': digit,
                'frequency': freq
            });
        }

        var yourVlSpec: VisualizationSpec = {
            width: 100,
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
                  type: 'ordinal'
              },
              y: {field: 'frequency', type: 'quantitative'},
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
        
        
        vegaEmbed('#' + key, yourVlSpec, { actions: false }
            ).then(result => {
              result.view.addEventListener('mouseover', (event, value) => {
                if(value != null && value.datum != null) {
                    let selectedIndices: Array<number> = [];
                    selectedIndices.push(value.datum._vgsid_);
                    let selectedData : Array<number> = this.getSelectedData(selectedIndices, dataValues, "digit");
                    let filter: Filter = new Filter(uuid.v4(), column, selectionName, selectedData);
                    let e = window.event;
                    let filterPickerId = selectionName+column.id+value.datum.digit;
                    let filterPicker: HTMLElement = FilterPicker.create(filterPickerId, filter, e, document.getElementById('benfordDist-3'));
                    document.getElementById('benfordDist-3').appendChild(filterPicker);
                }
            });
            result.view.addEventListener('mouseout', (event, value) => {
                if(value != null && value.datum != null) {
                    let filterPickerId = selectionName+column.id+value.datum.digit;
                    let filterPicker = document.getElementById(filterPickerId);
                    $(document).on('mousemove', () => {
                        if($('#'+filterPickerId+":hover").length == 0) {
                                if(filterPickerId!=null) filterPicker.remove();
                            }
                    });
                    
                }
            });
              result.view.addSignalListener(selectionName, (name, value) => {
                let selectedData : Array<number> = this.getSelectedData(value._vgsid_, dataValues, "digit");
                let filter: Filter = new Filter(uuid.v4(), column, selectionName, selectedData);
                document.dispatchEvent(new CustomEvent('addHighlight', {detail: {filter: filter}}));
            });
          })
        .catch(console.warn); 
    }
    
    private drawReplicates(data: TabularData, column: ColumnNumeric, key: string, dupCountType: DuplicateCountType): void
    {
        let replicateCount = column.GetReplicates();
        let dataValues : Array<any> = [];
        let maxIndex = (dupCountType === 'ALL') ? replicateCount.length : 5;
        let index = 0;
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
            width: 100,
            ...(dupCountType === 'TOP' && { height: 50 }),
            $schema: 'https://vega.github.io/schema/vega-lite/v4.json',
            description: 'Replicate Count',
            data: {
              values: dataValues
            },
            encoding: {
                x: {field: "count", type: "quantitative"},
                color: {
                    value: "#0277BD"
                },
                y: {field: "frequency", type: "nominal", sort: '-y'},
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
        
        vegaEmbed('#' + key, yourVlSpec, { actions: false })
        .catch(console.warn); 
    }
    
    private drawFrequentDuplicates(data: TabularData, column: ColumnNumeric, key: string, dupCountType: DuplicateCountType): void
    {
        let dupCounts = column.GetDuplicateCounts();
        let selectionName = filterNames.FREQUENT_VALUES_SELECTION;
        let dataValues : Array<any> = [];
        let index = 0;
        let maxIndex = (dupCountType === 'ALL') ? dupCounts.length : 5;
        for (let [val, count] of dupCounts)
        {
            if (count === 1)
            {
                break;
            }
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

        var yourVlSpec: VisualizationSpec = {
            //title: "Frequent Values (" + dupCounts.length + " unique)",
            width: 100,
            ...(dupCountType === 'TOP' && { height: 50 }),
            $schema: 'https://vega.github.io/schema/vega-lite/v4.json',
            description: 'Duplicate Counts',
            data: {
              values: dataValues
            },
            encoding: {
                y: {field: 'value', type: 'ordinal', sort: '-x'},
                x: {field: 'count', type: 'quantitative'},
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
          
          vegaEmbed('#' + key, yourVlSpec, { actions: false }
          ).then(result => {
              result.view.addSignalListener(selectionName, (name, value) => {
                let selectedData : Array<number> = this.getSelectedData(value._vgsid_, dataValues, "value");
                let filter: Filter = new Filter(uuid.v4(), column, selectionName, selectedData) 
                document.dispatchEvent(new CustomEvent('addHighlight', {detail: {filter: filter}}));
              });
          });

    }


    private drawNGramFrequency(data: TabularData, column: ColumnNumeric, key: string, n: number, lsd: boolean, dupCountType: DuplicateCountType): void
    {
        let nGramFrequency = column.GetNGramFrequency(n, lsd);
        let dataValues : Array<any> = [];
        let index = 0;
        let maxIndex = (dupCountType === 'ALL') ? nGramFrequency.length : 5;
        let selectionName = filterNames.N_GRAM_SELECTION;
        for (let [val, count] of nGramFrequency)
        {
            if (count === 1)
            {
                break;
            }
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

        var yourVlSpec: VisualizationSpec = {
            width: 100,
            ...(dupCountType === 'TOP' && { height: 50 }),
            $schema: 'https://vega.github.io/schema/vega-lite/v4.json',
            description: 'Duplicate Counts',
            data: {
              values: dataValues
            },
            encoding: {
                y: {field: 'value', type: 'ordinal', sort: '-x'},
                x: {field: 'count', type: 'quantitative'},
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
          
          vegaEmbed('#' + key, yourVlSpec, { actions: false }
          ).then(result => {
              result.view.addSignalListener(selectionName, (name, value) => {
                let selectedData : Array<number> = this.getSelectedData(value._vgsid_, dataValues, "value");
                let filter: Filter = new Filter(uuid.v4(), column, selectionName, selectedData) 
                document.dispatchEvent(new CustomEvent('addHighlight', {detail: {filter: filter}}));
              });
          })
         

    }


    public drawBody(data: TabularData): void
    {
        ControlsDisplay.updateCurrentSummary(data);
        let indices: number[] = [...Array(data.rowLength).keys()];
        let rowSelect = d3.select(this._container).select('tbody')
            .selectAll('.dataRow')
            .data(indices)
            .join('tr')
            .attr('id', (d) => "dataRow" + (d+1))
            .classed('dataRow', true);

        rowSelect.html(null)
            .append('th')
            .text(d => d + 1);
             
        rowSelect.selectAll('td')
            .data(d => data.getRow(d))
            .join('td')
            .attr('id', (d, i) => "col" + (i+1))
            .text(d => d);
    }

    private getSelectedData(selectedIndices: Array<number>, dataValues: Array<any>, prop: string) : Array<number> {
    
        if(!dataValues || dataValues.length == 0 || !selectedIndices || selectedIndices.length == 0 ) return;
        
        let selectedData : Array<number> = [];
        
        dataValues.forEach((value, index) => {
            if(selectedIndices.indexOf(index+1) > -1)
                selectedData.push(value[prop]);
        });
        
        return selectedData;

    }

    public hoverNode(hoverNode: string)
    {
      d3.select(".hoverNode")
        .classed("hoverNode", false)
  
      if(hoverNode !== "")
      {
        d3.select("#" + hoverNode)
          .classed("hoverNode", true)
      }
    }

    

    
}