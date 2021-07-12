import { Column, IDataRow, IImposer, IOrderedGroup, ISetColumn, isSetColumn } from 'lineupjs';
// import { CANVAS_HEIGHT, cssClass, UPSET } from 'lineupjs';
import type {
  ICellRendererFactory,
  IRenderContext,
  ISummaryRenderer,
  IGroupCellRenderer,
  ICellRenderer,
} from 'lineupjs';
import { renderMissingCanvas, renderMissingDOM } from 'lineupjs';

export default class ValueDistRenderer implements ICellRendererFactory {
  readonly title: string = 'Value Distribution';

  canRender(col: Column) {
    return true;
  }

//   private static calculateSetPath(setData: boolean[], cellDimension: number) {
//     const catindexes: number[] = [];
//     setData.forEach((d: boolean, i: number) => (d ? catindexes.push(i) : -1));

//     const left = catindexes[0] * cellDimension + cellDimension / 2;
//     const right = catindexes[catindexes.length - 1] * cellDimension + cellDimension / 2;

//     return { left, right };
//   }

  private static createDOMContext(col: ISetColumn) {
    const categories = col.categories;
    let templateRows = '';
    for (const cat of categories) {
      templateRows += `<div class="test" title="${cat.label}"></div>`;
    }
    return {
      template: `<div><div class="test"></div>${templateRows}</div>`,
      render: (n: HTMLElement, value: boolean[]) => {
        Array.from(n.children)
          .slice(1)
          .forEach((d, i) => {
            const v = value[i];
            // d.classList.toggle(cssClass('enabled'), v);
          });

        const line = n.firstElementChild as HTMLElement;
        const left = value.findIndex((d) => d);
        const right = value.length - 1 - value.reverse().findIndex((d) => d);

        if (left < 0 || left === right) {
          line.style.display = 'none';
          return;
        }
        line.style.display = null;
        line.style.left = `${Math.round((100 * (left + 0.5)) / value.length)}%`;
        line.style.width = `${Math.round((100 * (right - left)) / value.length)}%`;
      },
    };
  }

//   create(col: ISetColumn, context: IRenderContext): ICellRenderer {
//     const { template, render } = ValueDistRenderer.createDOMContext(col);
//     const width = context.colWidth(col);
//     const cellDimension = width / col.categories.length;

//     return {
//       template,
//       update: (n: HTMLElement, d: IDataRow) => {
//         if (renderMissingDOM(n, col, d)) {
//           return;
//         }
//         render(n, col.getValues(d));
//       },
//       render: (ctx: CanvasRenderingContext2D, d: IDataRow) => {
//         if (renderMissingCanvas(ctx, col, d, width)) {
//           return;
//         }
//         // Circle
//         const data = col.getValues(d);

//         const hasTrueValues = data.some((d) => d); //some values are true?

//         ctx.save();
//         ctx.fillStyle = 'green';
//         ctx.strokeStyle = 'blue';
//         if (hasTrueValues) {
//           const { left, right } = ValueDistRenderer.calculateSetPath(data, cellDimension);
//           ctx.beginPath();
//           ctx.moveTo(left, 4 / 2);
//           ctx.lineTo(right, 4 / 2);
//           ctx.stroke();
//         }

//         data.forEach((d, j) => {
//           const posX = j * cellDimension;
//           ctx.beginPath();
//           ctx.globalAlpha = d ? 1 : 0;
//           ctx.fillRect(posX, 0, cellDimension, 4);
//           ctx.fill();
//         });

//         ctx.restore();
//       },
//     };
//   }

//   createGroup(col: ISetColumn, context: IRenderContext): IGroupCellRenderer {
//     const { template, render } = ValueDistRenderer.createDOMContext(col);
//     return {
//       template,
//       update: (n: HTMLElement, group: IOrderedGroup) => {
//         return context.tasks.groupCategoricalStats(col, group).then((r) => {
//           if (typeof r === 'symbol') {
//             return;
//           }
//           render(
//             n,
//             r.group.hist.map((d) => d.count > 0)
//           );
//         });
//       },
//     };
//   }

  createSummary(col: Column, context: IRenderContext, interactive: boolean, imposer?: IImposer): ISummaryRenderer {
    // const { template, render } = ValueDistRenderer.createDOMContext(col);
    return {
      template: '<b>test</b>',
      update: (n: HTMLElement) => {
        //   n.innerHTML = '<b>bold</b> Test';
        // return context.tasks.summaryCategoricalStats(col).then((r) => {
        //   if (typeof r === 'symbol') {
        //     return;
        //   }
        //   render(
        //     n,
        //     r.summary.hist.map((d) => d.count > 0)
        //   );
        // });
      },
    };
  }
}
