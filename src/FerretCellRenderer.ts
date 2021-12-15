import * as d3 from 'd3';
import { Column, ERenderMode, ICellRenderer, ICellRendererFactory, IDataRow, IGroupCellRenderer, IImposer, IRenderContext, ISummaryRenderer, renderMissingDOM } from "lineupjs";
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
        const cellLabel = col.getLabel(d);
        n.title = cellLabel;

        const selectionExplanation = col.highlightValueExplanation(d);
        const cellLabelSpan = document.createElement('span');
        cellLabelSpan.classList.add('ferretCellValue');
        let currentSpan = cellLabelSpan;
        currentSpan.innerText = cellLabel;
        if (selectionExplanation.selected)
        {
          if (selectionExplanation.why.value.cause)
          {
            const highlightValueSpan = document.createElement('span');
            highlightValueSpan.classList.add('highlight', 'value');
            highlightValueSpan.innerText = cellLabel;

            currentSpan.innerHTML = null;
            currentSpan.appendChild(highlightValueSpan);
            currentSpan = highlightValueSpan;
          }
          if (selectionExplanation.why.nGram.length > 0)
          {
            const highlightNGramSpan = document.createElement('span');
            highlightNGramSpan.classList.add('highlight', 'ngram');

            const minStart = d3.min(selectionExplanation.why.nGram, d => d.start);
            const maxStop  = d3.max(selectionExplanation.why.nGram, d => d.end);

            const subBefore = cellLabel.substring(0, minStart);
            const subInner = cellLabel.substring(minStart, maxStop);
            const subAfter = cellLabel.substring(maxStop);
            
            highlightNGramSpan.innerText = subInner;
            currentSpan.innerHTML = null;
            currentSpan.append(subBefore)
            currentSpan.appendChild(highlightNGramSpan)
            currentSpan.append(subAfter)

            if (minStart === 0)
            {
              currentSpan = highlightNGramSpan;
            }
          }
          if (selectionExplanation.why.leadingDigit.cause)
          {
            const highlightLeadingDigitSpan = document.createElement('span');
            highlightLeadingDigitSpan.classList.add('highlight', 'leadingDigit');

            const textNode: Text = currentSpan.firstChild as Text;
            const _after = textNode.splitText(1);
            highlightLeadingDigitSpan.innerText = textNode.textContent;
            currentSpan.replaceChild(highlightLeadingDigitSpan, textNode);
          }
        }
        // add ngrams
        //add

        n.innerHTML = `${cellLabelSpan.outerHTML}<span class='paddingZeros'>${col.getRightPaddingString(d)}</span>`;
        // n.innerHTML = `<span class='ferretCellValue'>${cellLabel}</span><span class='paddingZeros'>${col.getRightPaddingString(d)}</span>`;
        n.classList.toggle('ignoredCell', col.ignoreInAnalysis(d));
        // n.classList.toggle('highlightedCell', col.highlightValue(d));


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
