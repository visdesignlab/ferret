import { Column, DEFAULT_COLOR, ERenderMode, ICellRenderer, ICellRendererFactory, IDataRow, IGroupCellRenderer, IImposer, IRenderContext, ISummaryRenderer, renderMissingDOM } from "lineupjs";
import FerretColumn from './FerretColumn'

export default class BrightnessCellRenderer implements ICellRendererFactory {
  readonly title: string = 'FerretCellRenderer';

  canRender(col: Column, mode: ERenderMode): boolean {
    return true;
  }

  create(col: FerretColumn, context: IRenderContext, imposer?: IImposer): ICellRenderer {
    // const width = context.colWidth(col);
    return {
      template: `<div title="" class="ferretCell"></div>`,
      update: (n: HTMLElement, d: IDataRow) => {
        const missing = renderMissingDOM(n, col, d);
        n.title = col.getLabel(d);
        n.innerHTML = `<span class='ferretCellValue'>${n.title}</span><span class='paddingZeros'>${col.getRightPaddingString(d)}</span>`;
        n.classList.toggle('ignoredCell', col.ignoreInAnalysis(d));
        n.classList.toggle('highlightedCell', col.highlightValue(d));
        // (n.firstElementChild! as HTMLDivElement).style.backgroundColor = missing
        //   ? null
        //   : toHeatMapColor(col.getNumber(d), d, col, imposer);
        // setText(n.lastElementChild!, n.title);
      },
    //   render: (ctx: CanvasRenderingContext2D, d: IDataRow) => {
    //     if (renderMissingCanvas(ctx, col, d, width)) {
    //       return;
    //     }
    //     ctx.fillStyle = toHeatMapColor(col.getNumber(d), d, col, imposer);
    //     ctx.fillRect(0, 0, width, CANVAS_HEIGHT);
    //   },
    };
  }

  createGroup(): IGroupCellRenderer {
    return { template: `<div></div>`, update: () => {} };
  }

  createSummary(): ISummaryRenderer {
    return { template: `<div></div>`, update: () => {} };
  }
}
