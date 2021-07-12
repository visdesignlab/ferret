import { Column, IImposer, INumberColumn, ValueColumn } from 'lineupjs';
import type {
    ICellRendererFactory,
    IRenderContext,
    ISummaryRenderer
} from 'lineupjs';
import { TabularData } from './TabularData';
import { ColumnNumeric } from './ColumnNumeric';
import { ColumnCategorical } from './ColumnCategorical';
import { chartType } from './lib/constants/filter';
import * as filterNames from "./lib/constants/filter";
import vegaEmbed, { VisualizationSpec } from 'vega-embed';
export default class ValueDistRenderer implements ICellRendererFactory
{
    readonly title: string = 'Value Distribution';

    public canRender(col: Column)
    {
        return col.desc.type === 'number' || col.desc.type === 'categorical';
    }

    public createSummary
    (
        col: ValueColumn<string | number>,
        context: IRenderContext,
        interactive: boolean,
        imposer?: IImposer
    ): ISummaryRenderer
    {
        return {
            template: '<div class="vizContainer"></div>',
            update: (n: HTMLElement) =>
            {
                console.log('update');
                console.log(n);
                // context.provider.data
                this.drawOverallDist(
                    n,
                    col,
                    context,
                    interactive,
                    'newOverallDist-',
                    col.id
                    )
            },
        };
    }

    private async drawOverallDist
    (
        container: HTMLElement,
        column: ValueColumn<string | number>,
        context: IRenderContext,
        interactive: boolean,
        chartKey: string,
        colKey: string
    ): Promise<void>
    {
        let dataValues : Array<any> = [];
        let selectionName = filterNames.VALUE_DIST_SELECTION;

        const N = context.provider.getTotalNumberOfRows();
        for (let i = 0; i < N; i++)
        {
            const dataRow = await context.provider.getRow(i);
            if (column.filter(dataRow))
            {
                // todo - this filter function is column-wise, not global
                const dataValue = column.getRaw(dataRow);
                dataValues.push({'value': dataValue});
            }
        }

        const elementID = chartKey + 'col-' + colKey;
        container.id = elementID;
        // type: 'string' | 'number' | 'categorical'
        const isNumeric = column.desc.type === 'number';
        const xAxisType = isNumeric ? 'quantitative' : 'nominal';


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
}
