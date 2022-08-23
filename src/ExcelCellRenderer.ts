import { Cell, CellValue } from 'exceljs';
import {
    Column,
    ERenderMode,
    ICellRenderer,
    ICellRendererFactory,
    IDataRow,
    IGroupCellRenderer,
    IImposer,
    IRenderContext,
    ISummaryRenderer,
    renderMissingDOM,
    StringColumn
} from 'lineupjs';
import { ChartCalculations } from './ChartCalculations';
import { CHART_FV, CHART_LDF, CHART_NG } from './colors';
import ExcelColumn from './ExcelColumn';
import FerretColumn, {
    FerretSelectionExplanation,
    Range
} from './FerretColumn';

export default class ExcelCellRenderer implements ICellRendererFactory {
    readonly title: string = 'ExcelCellRenderer';

    canRender(col: Column, mode: ERenderMode): boolean {
        return true;
    }

    create(
        col: ExcelColumn,
        context: IRenderContext,
        imposer?: IImposer
    ): ICellRenderer {
        const width = context.colWidth(col);
        return {
            template: `<div title="" class="excelCell"></div>`,
            update: (n: HTMLElement, d: IDataRow) => {
                const missing = renderMissingDOM(n, col, d);
                const cell: Cell = col.getRaw(d);
                console.log(cell);
                n.title = cell.text;
                n.innerHTML = `!! ${cell} !!`;
            },
            render: (ctx: CanvasRenderingContext2D, d: IDataRow) => {
                ctx.save();
                ctx.fillStyle = '#FF0000';
                const w = width * 0.75;
                ctx.fillRect(width - w, 0, w, 4);
                ctx.fill();

                ctx.restore();
            }
        };
    }

    createGroup(): IGroupCellRenderer {
        return { template: `<div></div>`, update: () => {} };
    }

    createSummary(): ISummaryRenderer {
        return { template: `<div></div>`, update: () => {} };
    }
}
