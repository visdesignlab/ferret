import { TabularData } from './TabularData';
import { Cell, CellValue, ValueType } from 'exceljs';
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

import ExcelColumn from './ExcelColumn';
import { color } from 'd3';
import { Popover } from 'bootstrap';

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
                n.innerHTML = '';
                n.style.cssText = '';
                // const missing = renderMissingDOM(n, col, d);
                // if (missing) return;
                const cell: Cell = col.getRawCell(d);
                const styleHash = TabularData.getStyleHash(cell);
                const styleGroup = TabularData.styleMap.get(styleHash);
                n.style.cssText = ExcelCellRenderer.getFontStyleGroupCss(
                    styleGroup.rank
                );
                n.title = cell.text;
                const span = ExcelCellRenderer.buildCellLabelSpan(cell);
                // <i class="fa-info-circle fa"></i>
                const helpIcon = document.createElement('i');
                helpIcon.classList.add('fa', 'fa-info-circle');
                ExcelCellRenderer.addBootstrapPopover(helpIcon, cell);

                n.appendChild(span);
                n.appendChild(helpIcon);
            },
            render: (ctx: CanvasRenderingContext2D, d: IDataRow) => {
                const cell: Cell = col.getRawCell(d);
                if (cell == null) return;
                const styleHash = TabularData.getStyleHash(cell);
                const styleGroup = TabularData.styleMap.get(styleHash);
                let primaryColorHex: string = '#FFF';
                if (styleGroup.rank >= 0) {
                    primaryColorHex = ExcelCellRenderer.getColor(
                        styleGroup.rank
                    );
                }

                ctx.save();
                ctx.fillStyle = primaryColorHex;
                ctx.fillRect(0, 0, width, 4);
                ctx.fill();

                ctx.restore();
            }
        };
    }

    private static buildCellLabelSpan(
        cell: Cell,
        includeSize = false,
        includeFont = false
    ): HTMLSpanElement {
        const span = document.createElement('span');
        const font = cell.font;
        if (font) {
            if (font.bold) span.style.fontWeight = 'bold';
            if (font.italic) span.style.fontStyle = 'italic';
            if (font.underline) span.style.textDecoration = 'underline';
            if (includeSize && font.size) {
                span.style.fontSize = `${font.size}pt`;
            }
            if (includeFont && font.name) {
                span.style.fontFamily = `${font.name}, Josefin Sans, sans-serif`;
            }
        }
        span.innerText = cell.text;
        return span;
    }

    private static buildCellContent(cell: Cell): HTMLElement {
        const div = document.createElement('div');
        div.appendChild(
            ExcelCellRenderer.buildLabelValue('Address', cell.address)
        );

        div.appendChild(
            ExcelCellRenderer.buildLabelValue(
                'Cell Format',
                ExcelCellRenderer.getCellFormatLabel(cell.type)
            )
        );
        if (cell.type === ValueType.Formula) {
            div.appendChild(
                ExcelCellRenderer.buildSecondaryValue(cell.formula)
            );
        }
        if (cell.font) {
            const font = cell.font;
            const labels: string[] = [];
            if (font.bold) labels.push('Bold');
            if (font.italic) labels.push('Italic');
            if (font.underline) labels.push('Underline');

            if (labels.length > 0) {
                div.appendChild(
                    ExcelCellRenderer.buildLabelValue('Text Format', ...labels)
                );
            }
            if (font.size) {
                div.appendChild(
                    ExcelCellRenderer.buildLabelValue(
                        'Font Size',
                        font.size.toFixed(0)
                    )
                );
            }
            if (font.name) {
                div.appendChild(
                    ExcelCellRenderer.buildLabelValue('Font', font.name)
                );
            }
        } else {
            div.appendChild(
                ExcelCellRenderer.buildLabelValue('Font Style', 'Default')
            );
        }

        div.appendChild(ExcelCellRenderer.buildStyleCount(cell));

        return div;
    }

    private static buildStyleCount(cell: Cell): HTMLElement {
        const div = document.createElement('div');
        const styleHash = TabularData.getStyleHash(cell);
        const styleGroup = TabularData.styleMap.get(styleHash);
        div.style.cssText = ExcelCellRenderer.getFontStyleGroupCss(
            styleGroup.rank
        );
        const cellCount = styleGroup.count;
        div.innerHTML = `<span class="fs-5">${cellCount}</span> cell${
            cellCount > 1 ? 's have' : ' has'
        } this format`;
        div.classList.add('fs-6', 'badge', 'text-black');
        return div;
    }

    private static getCellFormatLabel(valueType: ValueType): string {
        switch (valueType) {
            case ValueType.Null:
                return 'Default';
            case ValueType.Merge:
                return 'Merge';
            case ValueType.Number:
                return 'Number';
            case ValueType.String:
                return 'String';
            case ValueType.Date:
                return 'Date';
            case ValueType.Hyperlink:
                return 'Hyperlink';
            case ValueType.Formula:
                return 'Formula';
            case ValueType.SharedString:
                return 'SharedString';
            case ValueType.RichText:
                return 'RichText';
            case ValueType.Boolean:
                return 'Boolean';
            case ValueType.Error:
                return 'Error';
        }
    }

    private static buildLabelValue(
        label: string,
        ...values: string[]
    ): HTMLElement {
        const div = document.createElement('div');

        const labelSpan = document.createElement('span');
        labelSpan.innerText = label + ': ';
        labelSpan.classList.add('me-1');

        const valueSpans: HTMLSpanElement[] = [];
        for (let value of values) {
            const valueSpan = document.createElement('span');
            valueSpan.classList.add(
                'badge',
                'text-bg-dark',
                'bg-dark',
                'fs-6',
                'me-1'
            );
            valueSpan.innerText = value;
            valueSpans.push(valueSpan);
        }

        div.appendChild(labelSpan);
        for (let valueSpan of valueSpans) {
            div.appendChild(valueSpan);
        }
        div.classList.add('mb-2', 'd-flex', 'align-items-center');
        return div;
    }

    private static buildSecondaryValue(value: string): HTMLElement {
        const valueSpan = document.createElement('span');
        valueSpan.classList.add(
            'badge',
            'text-black',
            'bg-light',
            'fs-6',
            'mb-1',
            'ms-2'
        );
        valueSpan.innerText = value;
        return valueSpan;
    }

    private static addBootstrapPopover(element: HTMLElement, cell: Cell): void {
        element.dataset.bsToggle = 'popover';
        element.dataset.bsHtml = 'true';
        element.dataset.trigger = 'hover';
        element.dataset.bsPlacement = 'bottom';
        const span = ExcelCellRenderer.buildCellLabelSpan(cell, true, true);

        element.dataset.bsTitle = span.outerHTML;
        element.dataset.bsContent =
            ExcelCellRenderer.buildCellContent(cell).outerHTML;
        new Popover(element, { trigger: 'hover' });
    }

    private static getFontStyleGroupCss(group: number): string {
        if (group === -1) {
            return '';
        }
        const primaryColorHex = ExcelCellRenderer.getColor(group);
        const primaryColor = color(primaryColorHex);
        const secondaryColorHex = primaryColor.brighter(0.5).formatHex();
        return ExcelCellRenderer.getTextureCss(
            group,
            secondaryColorHex,
            primaryColorHex
        );
    }

    private static getColor(group: number): string {
        const colors = [
            '#80b1d3',
            '#8dd3c7',
            '#e5e5a1', //'#ffffb3', original yellow
            '#bebada',
            '#ee796b', // '#fb8072', original red
            '#fdb462',
            '#b3de69'
        ];
        // https://colorbrewer2.org/#type=qualitative&scheme=Set3&n=7
        return colors[group % colors.length];
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
            // stiped angle
            case 1:
                return (
                    bg +
                    `background-image:  linear-gradient(30deg, ${c1}   12%, transparent 12.5%, transparent 87%, ${c1} 87.5%,     ${c1}), linear-gradient(150deg,   ${c1} 12%, transparent 12.5%, transparent 87%,   ${c1} 87.5%,   ${c1}), linear-gradient(30deg,   ${c1} 12%, transparent 12.5%, transparent 87%,   ${c1} 87.5%,   ${c1}), linear-gradient(150deg,   ${c1} 12%, transparent 12.5%, transparent 87%,   ${c1} 87.5%,   ${c1}), linear-gradient(60deg, ${c1}77 25%, transparent 25.5%, transparent 75%, ${c1}77 75%, ${c1}77), linear-gradient(60deg, ${c1}77 25%, transparent 25.5%, transparent 75%, ${c1}77 75%, ${c1}77);
                     background-size: 8px 14px;
                     background-position: 0 0, 0 0, 4px 7px, 4px 7px, 0 0, 4px 7px;`
                );
            // isometric
            case 2:
                return (
                    bg +
                    `background-image: linear-gradient(to right,${c1} , ${c1} 6px, ${c2} 6px, ${c2} ); background-size: 8px 100%;`
                );
            // verticle striped
            case 3:
                return (
                    bg +
                    `background-image: radial-gradient( ellipse farthest-corner at 8px 8px , ${c1}, ${c1} 50%, ${c2} 50%); background-size: 8px 8px;`
                );
            // quarter moon
            case 4:
                return (
                    bg +
                    `background-image:  linear-gradient(135deg, ${c1} 25%, transparent 25%), linear-gradient(225deg, ${c1} 25%, transparent 25%), linear-gradient(45deg, ${c1} 25%, transparent 25%), linear-gradient(315deg, ${c1} 25%, ${c2} 25%);
                     background-position:  8px 0, 8px 0, 0 0, 0 0;
                     background-size: 8px 8px;
                     background-repeat: repeat;`
                );
            // checkerboard
            default:
                // should never be reached
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
