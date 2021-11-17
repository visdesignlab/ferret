import { TabularData } from "./TabularData";
import * as d3 from "d3";
import * as uuid from 'uuid';
import * as LineUpJS from 'lineupjs';
import vegaEmbed, { VisualizationSpec } from 'vega-embed';
import { ColumnNumeric } from "./ColumnNumeric";
import * as filterNames from "./lib/constants/filter";
import { ColumnCategorical } from "./ColumnCategorical";
import { DuplicateCountType, chartType } from "./lib/constants/filter";
import { Filter } from "./Filter";
import { ControlsDisplay } from "./ControlsDisplay";
import { FilterPicker } from "./components/filter-picker";
import { ItemTail } from "./components/item-tail";
import * as $ from 'jquery';
import { ColumnBuilder, ICategory, LocalDataProvider } from "lineupjs";
import FerretRenderer from "./FerretRenderer"
import FerretColumn from "./FerretColumn"
export class TableDisplay extends EventTarget
{
    charts = ['overallDist', 'duplicateCount', 'replicates', 'nGram', 'benfordDist'];
    chartNames = ['Value Distribution', 'Frequent Values', 'Replicates', 'N Grams', 'Leading Digit Frequency'];
    constructor() {
        super();
        document.addEventListener("drawVizRows", (e: CustomEvent) => this.drawVizRows(e.detail.data));
        document.addEventListener("drawBody", (e: CustomEvent) => this.drawBody(e.detail.data));
        document.addEventListener("updateLineup", (e: CustomEvent) => this.lineup.update());
        document.addEventListener("itemTailClicked", (e: CustomEvent) => {
            let dupCountType: DuplicateCountType = (e.detail.state == 'open') ? 'ALL' : 'TOP';
            switch(e.detail.key) {
                case 'duplicateCount-': 
                    this.drawFrequentDuplicates(null, e.detail.column, e.detail.key, e.detail.i, dupCountType);
                    break;
                case 'replicates-': 
                    this.drawReplicates(null, e.detail.column, e.detail.key, e.detail.i, dupCountType);
                    break;
                case 'nGram-':
                    this.drawNGramFrequency(null, e.detail.column, e.detail.key, e.detail.i, e.detail.nGram, e.detail.lsd, dupCountType)
            }
        });

        document.addEventListener("filterRows", (e: CustomEvent) => this.onFilterRows(e))
        document.addEventListener("highlightRows", (e: CustomEvent) => this.onHighlightRows(e))
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

    private _lineup : LineUpJS.LineUp;
    public get lineup() : LineUpJS.LineUp {
        return this._lineup;
    }    

    public SetData(data: TabularData, defaultVizShown: boolean[]): void
    {
        this._data = data;
        this.onDataChanged(this._data, defaultVizShown);
    }

    private onDataChanged(data: TabularData, defaultVizShown: boolean[]): void
    {
        document.dispatchEvent(new CustomEvent('onDataChange', {detail: {data: data}}));
        document.dispatchEvent(new CustomEvent('onLocalDataChange', {detail: {data: data}}));
        this.drawHeader(data);
        this.setupVizRows(data, defaultVizShown);
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
        let table = document.getElementById('vizTable');
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
        let header = document.getElementById("des-header");
        let define = document.getElementById("des-define");
        let use = document.getElementById("des-use");
        let caveat = document.getElementById("des-caveat");
        while(caveat.firstChild) 
            caveat.removeChild(caveat.firstChild);
        let caveatHeader = document.createElement('div');
        caveatHeader.classList.add('des-header');
        caveatHeader.innerHTML = "Caveats";
        let br = document.createElement('br');
        caveat.appendChild(br);
        caveat.appendChild(caveatHeader);
    }

    public setupVizRows(data: TabularData, defaultVizShown: boolean[]): void {
        let tbody = d3.select(this.container).select('tbody');
        let dataRow = tbody.html(null).append('tr')
        dataRow.append('th')
        let dataCell = dataRow.selectAll('td')
            .data(data.columnList)
            .join('td') 
            .classed('vizCell', true);
        let vizIndex = 0;
        dataCell.append('div').attr('id', (d, i) => 'overallDist-' + i).classed('noDisp', !defaultVizShown[vizIndex++]);
        dataCell.append('div').attr('id', (d, i) => 'benfordDist-' + i).classed('noDisp', !defaultVizShown[vizIndex++]);
        dataCell.append('div').classed('chartDiv', true).classed('scrollbar', true).attr('id', (d, i) => 'duplicateCount-' + i).classed('noDisp', !defaultVizShown[vizIndex++]);
        dataCell.append('div').classed('chartDiv', true).classed('scrollbar', true).attr('id', (d, i) => 'replicates-' + i).classed('noDisp', !defaultVizShown[vizIndex++]);
        dataCell.append('div').classed('chartDiv', true).classed('scrollbar', true).attr('id', (d, i) => 'nGram-' + i).classed('noDisp', !defaultVizShown[vizIndex++]);
        this.attachChildren(data.columnList.length);
        this.drawVizRows(data);
    }

    private attachChildren(length: number) {
        this.charts.forEach((chart) => {
            let index = 0;
            while(index < length) {
                let parent = document.getElementById(chart+'-'+index);
                let chartDiv = document.createElement('div');
                chartDiv.setAttribute('id', chart+'-chart-'+index); 
                let itemTailDiv = document.createElement('div');
                itemTailDiv.setAttribute('id', chart+'-tail-'+index); 
                parent.appendChild(itemTailDiv);
                parent.appendChild(chartDiv);
                index++;
            }
        });
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
                this.drawOverallDist(data, colNum, 'overallDist-', i, false, 'nominal');
            }
            else if (column.type === 'Number')
            {
                let colNum = column as ColumnNumeric;
                this.drawOverallDist(data, colNum, 'overallDist-', i, true, 'quantitative');
                this.drawLeadingDigitDist(data, colNum, 'benfordDist-', i);
                this.drawFrequentDuplicates(data, colNum, 'duplicateCount-', i, dupCountType);
                this.drawNGramFrequency(data, colNum, 'nGram-', i, nGram, lsd, nGramCountType);
                this.drawReplicates(data, colNum, 'replicates-', i, repCountType); 
            }
        }
    }

    private drawOverallDist(data: TabularData, column: ColumnNumeric | ColumnCategorical, key: string, i: number, isBinned: boolean, columnType: chartType): void
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
          vegaEmbed('#' + key + 'chart-' + i, yourVlSpec, { actions: false }
          ).then(result => {
              result.view.addSignalListener(selectionName, (name, value) => {
                let selectedData : Array<number> = this.getSelectedData(value._vgsid_, dataValues, "value");
                let filter: Filter = new Filter(uuid.v4(), column, selectionName, selectedData, 'LOCAL') 
                document.dispatchEvent(new CustomEvent('addHighlight', {detail: {filter: filter}}));
              });
          });
    }

    private drawLeadingDigitDist(data: TabularData, column: ColumnNumeric, key: string,  i: number): void
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
        
        vegaEmbed('#' + key + 'chart-' + i, yourVlSpec, { actions: false }
            ).then(result => {
              result.view.addEventListener('mouseover', (event, value) => {
                    this.attachFilterPicker(value, selectionName, column, key, dataValues, i, "digit");
                });
              result.view.addEventListener('mouseout', (event, value) => {
                    this.removeFilterPicker(value, selectionName, column);
                });
              result.view.addSignalListener(selectionName, (name, value) => {
                    this.attachSignalListener(value, dataValues, "digit", column, selectionName);
                });
          })
        .catch(console.warn); 
    }
    
    private drawReplicates(data: TabularData, column: ColumnNumeric, key: string, i: number, dupCountType: DuplicateCountType): void
    {
        let replicateCount = column.GetReplicates();
        let dataValues : Array<any> = [];
        let index = 0;
        let [maxIndex, itemTail] = this.getItemTail(dupCountType, replicateCount);
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
        
        this.attachItemTail(itemTail, column, key, i);
  
        vegaEmbed('#' + key + 'chart-' + i, yourVlSpec, { actions: false })
        .catch(console.warn); 
        
    }
    
    private drawFrequentDuplicates(data: TabularData, column: ColumnNumeric, key: string, i: number, dupCountType: DuplicateCountType): void
    {
        let dupCounts = column.GetDuplicateCounts();
        let selectionName = filterNames.FREQUENT_VALUES_SELECTION;
        let dataValues : Array<any> = [];
        let index = 0;
        let multiFrequentValues : Array<any> = [];
        for (let [val, count] of dupCounts) {
            if (count === 1) continue;
            multiFrequentValues.push([val, count]);
        }

        let [maxIndex, itemTail] = this.getItemTail(dupCountType, multiFrequentValues);

        for(let [val, count] of multiFrequentValues) {
            if (index >= maxIndex) break;
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
                y: {field: 'value', type: 'ordinal', sort: '-x', axis: {labelBound: 20}},
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
          
          this.attachItemTail(itemTail, column, key, i);
    
          vegaEmbed('#' + key + 'chart-' + i, yourVlSpec, { actions: false }
          ).then(result => {
              result.view.addEventListener('mouseover', (event, value) => {
                this.attachFilterPicker(value, selectionName, column, key, dataValues, i, "value");
                 });
              result.view.addEventListener('mouseout', (event, value) => {
                this.removeFilterPicker(value, selectionName, column);
                 });
              result.view.addSignalListener(selectionName, (name, value) => {
                this.attachSignalListener(value, dataValues, "value", column, selectionName);
              });
          });

    }


    private drawNGramFrequency(data: TabularData, column: ColumnNumeric, key: string, i: number, n: number, lsd: boolean, dupCountType: DuplicateCountType): void
    {
        let nGramFrequency = column.GetNGramFrequency(n, lsd);
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

          this.attachItemTail(itemTail, column, key, i, n, lsd);
    
          vegaEmbed('#' + key + 'chart-' + i, yourVlSpec, { actions: false }
          ).then(result => {
            result.view.addEventListener('mouseover', (event, value) => {
                this.attachFilterPicker(value, selectionName, column, key, dataValues, i, "value");
                 });
              result.view.addEventListener('mouseout', (event, value) => {
                this.removeFilterPicker(value, selectionName, column);
                 });
              result.view.addSignalListener(selectionName, (name, value) => {
                this.attachSignalListener(value, dataValues, "value", column, selectionName);
                 });
          })
         
    }


    public drawBody(data: TabularData): void
    {
        ControlsDisplay.updateCurrentSummary(data);
        let indices: number[] = [...Array(data.rowLength).keys()];
        
        const rowFirstData = data.getRowList();
        console.log(rowFirstData);
        const builder = LineUpJS.builder(rowFirstData);
        builder.registerColumnType('FerretColumn', FerretColumn)
        LineUpJS.toolbar('rename', 'sort', 'sortBy', 'filterNumber')(FerretColumn);

        for (let i = 0; i < data.columnList.length; i++)
        {
            const key = i.toString();
            const column = data.columnList[i];
            const label = column.id;
            let columnBuilder: ColumnBuilder;
            if (column.type === 'Number')
            {
                // columnBuilder = LineUpJS.buildNumberColumn(key);
                columnBuilder = LineUpJS.buildColumn('FerretColumn', key)
                columnBuilder.renderer('brightness', '', 'FerretRenderer');
                columnBuilder.custom('numberFormat', d3.format('.8~f'));
            }
            else if (column.type === 'Categorical')
            {
                const categoryList: (string | Partial<ICategory>)[] = [];
                for (let val of new Set(column.values))
                {
                    const category: Partial<ICategory> = {
                        name: val.toString(),
                        color: '#C1C1C1'
                    }
                    categoryList.push(category);
                }
                columnBuilder = LineUpJS.buildCategoricalColumn(key, categoryList);
                columnBuilder.renderer('string', '', '');
            }
            else
            {
                columnBuilder = LineUpJS.buildStringColumn(key);
            }
            builder.column(columnBuilder.label(label).width(140));
        }
        // builder
        //     .column(LineUpJS.buildStringColumn('vizLinkHtml').label('Viz Link').width(100).html())
        //     .column(LineUpJS.buildStringColumn('displayName').label('Name').width(260))
        //     .column(LineUpJS.buildCategoricalColumn('author', data.authorList).width(100))
        //     .column(LineUpJS.buildStringColumn('folder').label('Folder Path').width(350))
        //     .column(LineUpJS.buildStringColumn('driveLinkHtml').label('Google Drive Link').width(120).html())
        //     .column(LineUpJS.buildNumberColumn('fileSize', data.sizeRange).label('size (mb)').width(120))
        //     .column(LineUpJS.buildDateColumn('modifiedDate').label('Last Modified Date').width(120).format("%b %d, %Y",'%Y-%m-%d'));

        // const ranking = LineUpJS.buildRanking()
        //     .supportTypes()
        //     .allColumns()
        //     .groupBy('author')
        //     .sortBy('modifiedDate', 'desc');

        // builder.ranking(ranking);
        const lineupContainer = document.getElementById('lineupContainer');

        builder.disableAdvancedModelFeatures()
        builder.sidePanel(false, true)
        builder.registerRenderer('FerretRenderer', new FerretRenderer());
        this._lineup = builder.build(lineupContainer);
        // this.lineup.setSelection([1,3,5,7,9]);

        // const firstRanking = this.lineup.data.getFirstRanking(); // get the first ranking from the data provider
        // firstRanking.filter({v: 1, i: 1});

        // let columnDescList = this.lineup.data.getColumns();

        // let dataProvider = new LocalDataProvider([rowFirstData, rowFirstData], columnDescList);
        // this.lineup.setDataProvider(dataProvider);
        // this.lineup.update();



        // new LocalDataProvider(data: any[], columns?: IColumnDesc[], options?: Partial<ILocalDataProviderOptions & IDataProviderOptions>): LocalDataProvider

        // firstRanking.children[0]
        // this.lineup.update()
        // const firstRanking = this.lineup.data.getFirstRanking(); // get the first ranking from the data provider
        // firstRanking.on('orderChanged.custom', (previous, current, previousGroups, currentGroups, dirtyReason) => {
    
        //   // discard all order changed events that are not triggered by filter actions
        //   if(dirtyReason.indexOf('filter') === -1) {
        //     return;
        //   }
    
        //   console.log(previous, current, previousGroups, currentGroups, dirtyReason);
        // });


        // let rowSelect = d3.select(this._container).select('tbody')
        //     .selectAll('.dataRow')
        //     .data(indices)
        //     .join('tr')
        //     .attr('id', (d) => "dataRow" + (d+1))
        //     .classed('dataRow', true);

        // rowSelect.html(null)
        //     .append('th')
        //     .text(d => d + 1);
             
        // rowSelect.selectAll('td')
        //     .data(d => data.getRow(d))
        //     .join('td')
        //     .attr('id', (d, i) => "col" + (i+1))
        //     .text(d => d);
    }

    private onHighlightRows(e: CustomEvent): void
    {
        this.lineup.setSelection(e.detail.rowIndices);
        this.lineup.sortBy('col1');
        // lineup appears to not do anything if sort by is already set to col2, so this is to force an update
        this.lineup.sortBy('col2', false);
        this.lineup.update();
    }

    private onFilterRows(e: CustomEvent): void
    {
        // let firstTenRows = this.data.getRowList().slice(0,10);
        // let columnDescList = this.lineup.data.getColumns();
// 
        // let dataProvider = new LocalDataProvider(firstTenRows, columnDescList);
        // this.lineup.setDataProvider(dataProvider);
        this.lineup.update();


        // const firstRanking = this.lineup.data.getFirstRanking(); // get the first ranking from the data provider
        // firstRanking.filter([1,2,3])
        // this.lineup.data.view([1,2,3])
        // selectAll([1,2,3])
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

    private getItemTail(dupCountType: DuplicateCountType, data: any) {
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
    
    private attachFilterPicker(value: any, selectionName: string, column: ColumnNumeric, key: string, dataValues: any[], i: number, selectDataType: string) {
        if(value != null && value.datum != null) {
            let selectedIndices: Array<number> = [];
            selectedIndices.push(value.datum._vgsid_);
            let selectedData : Array<number> = this.getSelectedData(selectedIndices, dataValues, selectDataType);
            let filter: Filter = new Filter(uuid.v4(), column, selectionName, selectedData,'LOCAL');
            let e = window.event;
            let filterPickerId = selectionName+column.id.replace('.', '_')+value.datum.digit;
            let filterPicker: HTMLElement = FilterPicker.create(filterPickerId, filter, e, document.getElementById(key + 'chart-' + i));
            document.getElementById(key + 'chart-' + i).appendChild(filterPicker);
            } 
        }
    
    private removeFilterPicker(value: any, selectionName: string, column: ColumnNumeric) {
        if(value != null && value.datum != null) {
            let filterPickerId = selectionName+column.id.replace('.', '_')+value.datum.digit;
            let filterPicker = document.getElementById(filterPickerId);
            $(document).on('mousemove', () => {
                if($('#'+filterPickerId+":hover").length == 0) {
                        if(filterPickerId!=null) filterPicker.remove();
                    }
            });
        }
    }

    private attachSignalListener(value: any, dataValues: any[], selectDataType: string, column: ColumnNumeric | ColumnCategorical, selectionName: string) {
        console.log("gere0");
        let selectedData : Array<number> = this.getSelectedData(value._vgsid_, dataValues, selectDataType);
        let filter: Filter = new Filter(uuid.v4(), column, selectionName, selectedData, 'LOCAL') 
        document.dispatchEvent(new CustomEvent('addHighlight', {detail: {filter: filter}}));
    }
}