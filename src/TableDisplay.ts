import { TabularData } from "./TabularData";
import * as d3 from "d3";
// import * as vega from "vega";
import vegaEmbed from 'vega-embed';
import { Column, ColumnTypes } from "./Column";
import { ColumnNumeric } from "./ColumnNumeric";

export class TableDisplay
{
    public constructor(container: HTMLElement)
    {
        this._container = container;
    }

    
    private _container : HTMLElement;
    public get container() : HTMLElement {
        return this._container;
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
        this.drawVizRows();
        this.drawBody();
    }

    private drawHeader(): void
    {
        let thead = d3.select(this.container).select('thead');
        let th = thead.html(null)
            .append('tr')
            .selectAll('th')
            .data(this.data.columnList)
            .join('th');

        th.append('div').text(d => d.id); 
    }

    private drawVizRows(): void
    {
        let tbody = d3.select(this.container).select('tbody');
        let dataCell = tbody.append('tr')
            .selectAll('td')
            .data(this.data.columnList)
            .join('td')
            .classed('vizCell', true);
        
        dataCell.append('div').attr('id', (d, i) => 'benfordDist-' + i);
        dataCell.append('div').attr('id', (d, i) => 'duplicateCount-' + i);

        for (let i = 0; i < this.data.columnList.length; i++)
        {
            let column = this.data.columnList[i];
            if (column.type === ColumnTypes.numeric)
            {
                let colNum = column as ColumnNumeric;
                this.drawLeadingDigitDist(colNum, 'benfordDist-' + i);
                this.drawFrequentDuplicates(colNum, 'duplicateCount-' + i);
            }
        }
    }

    private drawLeadingDigitDist(column: ColumnNumeric, key: string): void
    {
        let leadDictFreq = column.GetLeadingDigitFreqs();

        let dataValues = [];
        for (let [digit, freq] of leadDictFreq)
        {
            dataValues.push({
                'digit': digit,
                'frequency': freq
            });
        }

        var yourVlSpec = {
            width: 100,
            height: 50,
            $schema: 'https://vega.github.io/schema/vega-lite/v4.json',
            description: 'Leading Digit frequencies',
            data: {
              values: dataValues
            },
            mark: 'bar',
            encoding: {
              x: {field: 'digit', type: 'ordinal'},
              y: {field: 'frequency', type: 'quantitative'}
            }
          };
          vegaEmbed('#' + key, yourVlSpec, { actions: false });

    }
    
    private drawFrequentDuplicates(column: ColumnNumeric, key: string): void
    {
        let leadingDupCounts = column.GetDuplicateCounts();


        let dataValues = [];
        let index = 0;
        for (let [val, count] of leadingDupCounts)
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
        if (dataValues.length === 0)
        {
            return;
        }

        var yourVlSpec = {
            width: 100,
            height: 50,
            $schema: 'https://vega.github.io/schema/vega-lite/v4.json',
            description: 'A simple bar chart with embedded data.',
            data: {
              values: dataValues
            },
            encoding: {
                y: {field: 'value', type: 'ordinal', sort: '-x'},
                x: {field: 'count', type: 'quantitative'}
            },
            layer: [
                {
                    mark: 'bar'
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
          vegaEmbed('#' + key, yourVlSpec, { actions: false });

    }

    private drawBody(): void
    {
        let indices: number[] = [...Array(this.data.rowLength).keys()];
        let tbody = d3.select(this.container).select('tbody');
        tbody.selectAll('.dataRow')
            .data(indices)
            .join('tr')
            .classed('dataRow', true)
            .selectAll('td')
            .data(d => this.data.getRow(d))
            .join('td')
            .text(d => d);
    }
}