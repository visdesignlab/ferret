import { TabularData } from "./TabularData";
import * as d3 from "d3";
// import * as vega from "vega";
import vegaEmbed from 'vega-embed'
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

        th.append('div')
            .attr('id', (d, i) => 'benfordDist-' + i);


        for (let i = 0; i < this.data.columnList.length; i++)
        {
            let column = this.data.columnList[i];
            if (column.type === ColumnTypes.numeric)
            {
                this.drawLeadingDigitDist(column as ColumnNumeric, 'benfordDist-' + i);
            }
        }
 
    }

    private drawLeadingDigitDist(column: ColumnNumeric, key: string): any
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
            $schema: 'https://vega.github.io/schema/vega-lite/v4.12.2.json',
            description: 'A simple bar chart with embedded data.',
            data: {
              values: dataValues
            },
            mark: 'bar',
            encoding: {
              x: {field: 'digit', type: 'ordinal'},
              y: {field: 'frequency', type: 'quantitative'}
            }
          };
          vegaEmbed('#' + key, yourVlSpec);

    }
    
    private drawBody(): void
    {
        let indices: number[] = [...Array(this.data.rowLength).keys()];
        let tbody = d3.select(this.container).select('tbody');
        tbody.selectAll('tr')
            .data(indices)
            .join('tr')
            .selectAll('td')
            .data(d => this.data.getRow(d))
            .join('td')
            .text(d => d);
    }
}