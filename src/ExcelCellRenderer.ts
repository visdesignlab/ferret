import { TabularData } from './TabularData';
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
import { color } from 'd3';

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
                const styleHash = TabularData.getStyleHash(cell);
                const styleGroup = TabularData.styleMap.get(styleHash);
                n.style.cssText =
                    ExcelCellRenderer.getFontStyleGroupCss(styleGroup);
                n.title = cell.text;
                const span = document.createElement('span');
                const font = cell.font;
                if (font) {
                    if (font.bold) span.style.fontWeight = 'bold';
                    if (font.italic) span.style.fontStyle = 'italic';
                    if (font.underline) span.style.textDecoration = 'underline';
                }
                span.innerText = cell.text;
                n.innerHTML = span.outerHTML;
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

    private static getFontStyleGroupCss(group: number): string {
        if (group === -1) {
            return '';
        }
        const colors = [
            '#8dd3c7',
            '#e5e5a1', //'#ffffb3', original yellow
            '#bebada',
            '#fb8072',
            '#80b1d3',
            '#fdb462',
            '#b3de69'
        ];
        // https://colorbrewer2.org/#type=qualitative&scheme=Set3&n=7
        const primaryColorHex = colors[group % colors.length];
        const primaryColor = color(primaryColorHex);
        const secondaryColorHex = primaryColor.brighter(0.3).formatHex();
        return ExcelCellRenderer.getTextureCss(
            group,
            secondaryColorHex,
            primaryColorHex
        );
    }

    private static getTextureCss(
        group: number,
        c1: string,
        c2: string
    ): string {
        const numTextures = 5;
        const textureIndex = group % numTextures;
        const bg = `background-color: ${c2};`;
        // modified from: https://www.magicpattern.design/tools/css-backgrounds
        switch (textureIndex) {
            case 0:
                return (
                    bg +
                    `background-image: repeating-linear-gradient(-45deg, ${c2} 0, ${c2} 2px, ${c1} 0, ${c1} 50%); background-size: 8px 8px;`
                );
            case 1:
                return (
                    bg +
                    `background-image:  linear-gradient(30deg, ${c1}   12%, transparent 12.5%, transparent 87%, ${c1} 87.5%,     ${c1}), linear-gradient(150deg,   ${c1} 12%, transparent 12.5%, transparent 87%,   ${c1} 87.5%,   ${c1}), linear-gradient(30deg,   ${c1} 12%, transparent 12.5%, transparent 87%,   ${c1} 87.5%,   ${c1}), linear-gradient(150deg,   ${c1} 12%, transparent 12.5%, transparent 87%,   ${c1} 87.5%,   ${c1}), linear-gradient(60deg, ${c1}77 25%, transparent 25.5%, transparent 75%, ${c1}77 75%, ${c1}77), linear-gradient(60deg, ${c1}77 25%, transparent 25.5%, transparent 75%, ${c1}77 75%, ${c1}77);
                     background-size: 8px 14px;
                     background-position: 0 0, 0 0, 4px 7px, 4px 7px, 0 0, 4px 7px;`
                );
            case 2:
                return (
                    bg +
                    `background-image: linear-gradient(to right,${c1} , ${c1} 6px, ${c2} 6px, ${c2} ); background-size: 8px 100%;`
                );
            case 3:
                return (
                    bg +
                    `background-image: radial-gradient( ellipse farthest-corner at 8px 8px , ${c1}, ${c1} 50%, ${c2} 50%); background-size: 8px 8px;`
                );
            case 4:
                return (
                    bg +
                    `background-image:  linear-gradient(135deg, ${c1} 25%, transparent 25%), linear-gradient(225deg, ${c1} 25%, transparent 25%), linear-gradient(45deg, ${c1} 25%, transparent 25%), linear-gradient(315deg, ${c1} 25%, ${c2} 25%);
                     background-position:  8px 0, 8px 0, 0 0, 0 0;
                     background-size: 8px 8px;
                     background-repeat: repeat;`
                );
            default:
                return 'background-color: magenta;';
        }
    }

    createGroup(): IGroupCellRenderer {
        return { template: `<div></div>`, update: () => {} };
    }

    createSummary(): ISummaryRenderer {
        return { template: `<div></div>`, update: () => {} };
    }
}
