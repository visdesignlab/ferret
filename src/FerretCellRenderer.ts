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
import FerretColumn from './FerretColumn';

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

                const selectionExplanation = col.highlightValueExplanation(d);
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
                    let leadingDigitIndex: number = 0;
                    if (selectionExplanation.why.leadingDigit.cause) {
                        leadingDigitIndex =
                            ChartCalculations.getLeadingDigitIndex(cellLabel);
                    }

                    if (selectionExplanation.why.nGram.length > 0) {
                        const minStart = d3.min(
                            selectionExplanation.why.nGram,
                            d => d.start
                        );
                        const maxStop = d3.max(
                            selectionExplanation.why.nGram,
                            d => d.end
                        );
                        const highlightNGramSpan =
                            FerretCellRenderer.highlightSpanSubstring(
                                currentSpan,
                                minStart,
                                maxStop,
                                ['highlight', 'ngram']
                            );

                        if (
                            minStart <= leadingDigitIndex &&
                            leadingDigitIndex < maxStop
                        ) {
                            currentSpan = highlightNGramSpan;
                            leadingDigitIndex -= minStart;
                            cellLabel = cellLabel.substring(minStart, maxStop);
                        }
                    }
                    if (selectionExplanation.why.leadingDigit.cause) {
                        const highlightNGramSpan =
                            FerretCellRenderer.highlightSpanSubstring(
                                currentSpan,
                                leadingDigitIndex,
                                leadingDigitIndex + 1,
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
