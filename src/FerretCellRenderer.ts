import * as d3 from 'd3';
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
    renderMissingDOM
} from 'lineupjs';
import { ChartCalculations } from './ChartCalculations';
import FerretColumn, {
    FerretSelectionExplanation,
    Range
} from './FerretColumn';
import clog from './lib/clog';

export default class FerretCellRenderer implements ICellRendererFactory {
    readonly title: string = 'FerretCellRenderer';

    canRender(col: Column, mode: ERenderMode): boolean {
        return true;
    }

    create(
        col: FerretColumn,
        context: IRenderContext,
        imposer?: IImposer
    ): ICellRenderer {
        return {
            template: `<div title="" class="ferretCell"></div>`,
            update: (n: HTMLElement, d: IDataRow) => {
                const missing = renderMissingDOM(n, col, d);
                let cellLabel = col.getLabel(d);
                n.title = cellLabel;

                const selectionExplanation: FerretSelectionExplanation =
                    col.highlightValueExplanation(d);
                const cellLabelSpan = document.createElement('span');
                cellLabelSpan.classList.add('ferretCellValue');
                let currentSpan = cellLabelSpan;
                currentSpan.innerText = cellLabel;
                if (selectionExplanation.selected) {
                    if (selectionExplanation.why.value.cause) {
                        const highlightValueSpan =
                            document.createElement('span');
                        highlightValueSpan.classList.add('highlight', 'value');
                        highlightValueSpan.innerText = cellLabel;

                        currentSpan.innerHTML = null;
                        currentSpan.appendChild(highlightValueSpan);
                        currentSpan = highlightValueSpan;
                    }
                    let leadDigitIdx: number = 0;
                    if (selectionExplanation.why.leadingDigit.cause) {
                        leadDigitIdx =
                            ChartCalculations.getLeadingDigitIndex(cellLabel);
                    }

                    if (selectionExplanation.why.nGram.length > 0) {
                        let nextSpan: HTMLSpanElement = currentSpan;
                        let ranges = selectionExplanation.why.nGram.map(
                            x => x.range
                        );
                        ranges = FerretCellRenderer.consolidateRanges(ranges);

                        console.log(JSON.stringify(ranges));
                        for (let range of ranges) {
                            let { start, end } = range;
                            const highlightNGramSpan =
                                FerretCellRenderer.highlightSpanSubstring(
                                    currentSpan,
                                    start,
                                    end,
                                    ['highlight', 'ngram']
                                );

                            if (
                                FerretCellRenderer.inRange(leadDigitIdx, range)
                            ) {
                                nextSpan = highlightNGramSpan;
                                leadDigitIdx -= start;
                                cellLabel = cellLabel.substring(start, end);
                            }
                        }
                        currentSpan = nextSpan;
                    }
                    if (selectionExplanation.why.leadingDigit.cause) {
                        const highlightNGramSpan =
                            FerretCellRenderer.highlightSpanSubstring(
                                currentSpan,
                                leadDigitIdx,
                                leadDigitIdx + 1,
                                ['highlight', 'leadingDigit']
                            );
                    }
                }

                n.innerHTML = `${
                    cellLabelSpan.outerHTML
                }<span class='paddingZeros'>${col.getRightPaddingString(
                    d
                )}</span>`;
                n.classList.toggle('ignoredCell', col.ignoreInAnalysis(d));
            }
        };
    }

    private static consolidateRanges(ranges: Range[]): Range[] {
        const out: Range[] = [];
        while (ranges.length > 0) {
            let r1 = ranges.pop();
            for (let i = ranges.length - 1; i >= 0; i--) {
                let r2 = ranges[i];
                if (FerretCellRenderer.canMerge(r1, r2)) {
                    r1 = FerretCellRenderer.merge(r1, r2);
                    ranges.splice(i, 1);
                    // remove element and restart loop.
                    i = ranges.length;
                }
            }
            // since we made it through the loop r1 doesn't match any range in ranges
            out.push(r1);
        }
        return out;
    }

    private static merge(r1: Range, r2: Range): Range {
        return {
            start: Math.min(r1.start, r2.start),
            end: Math.max(r1.end, r2.end)
        };
    }

    private static canMerge(r1: Range, r2: Range): boolean {
        return (
            FerretCellRenderer.inRange(r1.start, r2) ||
            FerretCellRenderer.inRange(r1.end - 1, r2) ||
            FerretCellRenderer.inRange(r2.start, r1) ||
            FerretCellRenderer.inRange(r2.end - 1, r1)
        );
    }

    private static inRange(n: number, r: Range): boolean {
        return r.start <= n && n < r.end;
    }

    private static highlightSpanSubstring(
        currentSpan: HTMLSpanElement,
        start: number,
        end: number,
        cssClasses: string[]
    ): HTMLSpanElement {
        // find the appropriate text node
        let textIndex = 0;
        let lastIndex = 0;
        for (let childNode of currentSpan.childNodes) {
            textIndex += childNode.textContent.length;
            if (textIndex > start) {
                if (childNode.nodeType == Node.TEXT_NODE) {
                    return FerretCellRenderer.highlightTextSubstring(
                        currentSpan,
                        childNode as Text,
                        start - lastIndex,
                        end - lastIndex,
                        cssClasses
                    );
                } else {
                    return FerretCellRenderer.highlightSpanSubstring(
                        childNode as HTMLSpanElement,
                        start - lastIndex,
                        end - lastIndex,
                        cssClasses
                    );
                }
            }
            lastIndex = textIndex;
        }
        return null;
    }

    private static highlightTextSubstring(
        parentSpan: HTMLSpanElement,
        textNode: Text,
        start: number,
        end: number,
        cssClasses: string[]
    ): HTMLSpanElement {
        const label = textNode.data;
        const highlightSpan = document.createElement('span');
        highlightSpan.classList.add(...cssClasses);

        textNode.splitText(end);
        let highlightText = textNode.splitText(start);
        highlightSpan.innerText = highlightText.textContent;
        parentSpan.replaceChild(highlightSpan, highlightText);
        parentSpan.normalize();
        return highlightSpan;
    }

    createGroup(): IGroupCellRenderer {
        return { template: `<div></div>`, update: () => {} };
    }

    createSummary(): ISummaryRenderer {
        return { template: `<div></div>`, update: () => {} };
    }
}
