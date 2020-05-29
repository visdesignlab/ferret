import { TabularData } from "./TabularData";
import * as d3 from "d3";

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
        thead.html(null)
            .append('tr')
            .selectAll('td')
            .data(this.data.columnList)
            .join('td')
            .text(d => d.id);
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