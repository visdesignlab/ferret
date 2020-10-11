import { TabularData } from "./TabularData";
import * as d3 from "d3";
// import * as vega from "vega";
import vegaEmbed, { VisualizationSpec } from 'vega-embed';
import { Column, ColumnTypes } from "./Column";
import { ColumnNumeric } from "./ColumnNumeric";
import { FilterUtil } from "./lib/FilterUtil";
import * as filterNames from "./lib/constants/filter";


export class TableDisplay
{

    public constructor()
    {}

    
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
        this.onDataChanged();
    }

    private onDataChanged(): void
    {
        this.drawHeader();
        this.drawVizRows(this._data);
        this.drawBody();
    }

    private drawHeader(): void
    {
        let thead = d3.select(this.container).select('thead');
        let th = thead.html(null)
            .append('tr')
            .selectAll('th')
            .data([{id: 'Row'}, ...this.data.columnList])
            .join('th');

        th.append('div').text(d => d.id); 
    }

    public hideVizRows(key: String, data: TabularData): void 
    {
        for (let i = 0; i < data.columnList.length; i++)
        {
                let element = document.getElementById(key+"-"+ i);
                element.classList.add("chart-hidden");
        }
    }

    public showVizRows(key: String, data: TabularData): void 
    {
        for (let i = 0; i < data.columnList.length; i++)
        {
                let element = document.getElementById(key+"-"+ i);
                element.classList.remove("chart-hidden");
        }
    }

    public drawVizRows(data: TabularData): void
    {
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
        dataCell.append('div').attr('id', (d, i) => 'duplicateCount-' + i);

        for (let i = 0; i < data.columnList.length; i++)
        {
            let column = data.columnList[i];
            if (column.type === ColumnTypes.numeric)
            {
                let colNum = column as ColumnNumeric;
                this.drawOverallDist(colNum, 'overallDist-' + i);
                this.drawLeadingDigitDist(colNum, 'benfordDist-' + i);
                this.drawFrequentDuplicates(colNum, 'duplicateCount-' + i);
            }
        }
    }

    private drawOverallDist(column: ColumnNumeric, key: string): void
    {
        let dataValues : Array<any> = [];
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
                valueDistributionSelection: {
                    type: "multi",
                    clear: false
                },
            },
            encoding: {
              x: {field: 'value', type: 'quantitative', bin: true},
              color: {
                  value: "#ffb726"
              },
              y: {field: 'value', aggregate: 'count', type: 'quantitative'},
              opacity: {
                condition: {
                    selection: "valueDistributionSelection", 
                    value: 1
                },
                value: 0.5
              },
            }   
          };
          vegaEmbed('#' + key, yourVlSpec, { actions: false }
          ).then(result => {
              result.view.addSignalListener('valueDistributionSelection', (name, value) => {
              });
              result.view.addEventListener('dblclick', ((e) => {
                    console.log(e);
                }
              ));
          })
    }

    private drawLeadingDigitDist(column: ColumnNumeric, key: string): void
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
                "LEADING_DIGIT_FREQ_SELECTION": {
                    type: "multi",
                    clear: "dblclick"
                },
            },
            encoding: {
              x: {field: 'digit', type: 'ordinal'},
              y: {field: 'frequency', type: 'quantitative'},
              color: {
                value: "#4db6ac"
              },
              opacity: {
                condition: {
                    selection: selectionName, 
                    value: 1
                },
                value: 0.5
              },
            }
          };
        
        
        vegaEmbed('#' + key, yourVlSpec, { actions: false }
          ).then(result => {
              result.view.addSignalListener(selectionName, (name, value) => {
                let selectedData : Array<number> = this.getSelectedData(value._vgsid_, dataValues, "digit");
                new FilterUtil().highlightRows(name, selectedData, this._data, column)
              });
              result.view.addEventListener('dblclick', ((e) => {
                    let clearedData = dataValues;
                    new FilterUtil().clearHighlight(filterNames.LEADING_DIGIT_FREQ_CLEAR_SELECTION, clearedData, this._data, column)
                }
              ));
          })
        .catch(console.warn); 
    }
    
    private drawFrequentDuplicates(column: ColumnNumeric, key: string): void
    {
        let dupCounts = column.GetDuplicateCounts();
        let selectionName = filterNames.FREQUENT_VALUES_SELECTION;
        let dataValues : Array<any> = [];
        let index = 0;
        for (let [val, count] of dupCounts)
        {
            if (count === 1)
            {
                break;
            }
            if (index >= 5)
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
            height: 50,
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
                    value: 0.5
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
                new FilterUtil().highlightRows(name, selectedData, this._data, column);
              });
              result.view.addEventListener('dblclick', ((e) => {
                let clearedData = dataValues.map(d => d.value);;
                new FilterUtil().clearHighlight(filterNames.FREQUENT_VALUES_CLEAR_SELECTION, clearedData, this._data, column)
                }
              ));
          })

    }

    private drawBody(): void
    {
        let indices: number[] = [...Array(this.data.rowLength).keys()];
        let tbody = d3.select(this.container).select('tbody');
        let rowSelect = tbody.selectAll('.dataRow')
            .data(indices)
            .join('tr')
            .attr('id', (d) => "dataRow" + (d+1))
            .classed('dataRow', true);

        rowSelect.html(null)
            .append('th')
            .text(d => d + 1);

        rowSelect.selectAll('td')
            .data(d => this.data.getRow(d))
            .join('td')
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

    

    
}