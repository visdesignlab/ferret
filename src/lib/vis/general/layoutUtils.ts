import { PlotlyInfo, VisColumn } from '../interfaces';
import * as Plotly from 'plotly.js-dist-min';

/**
 * Truncate long texts (e.g., to use as axes title)
 * @param text Input text to be truncated
 * @param maxLength Maximum text length (default: 50)
 */
function truncateText(text: string, maxLength = 50) {
    return text.length > maxLength
        ? `${text.substring(0, maxLength)}...`
        : text;
}

/**
 * Cleans up the layout of a given trace, primarily by positioning potential small multiple plots in a reasonable way
 * @param traces the traces associated with the layout
 * @param layout the current layout to be changed. Typed to any because the plotly types complain.
 * @returns the changed layout
 */
export function beautifyLayout(traces: PlotlyInfo, layout: Plotly.Layout) {
    layout.annotations = [];
    traces.plots.forEach((t, i) => {
        layout[`xaxis${i > 0 ? i + 1 : ''}`] = {
            showline: false,
            showspikes: true,
            spikecolor: 'black',
            spikethickness: 2,
            spikedash: 'dash',
            fixedrange: true,
            ticks: 'outside',
            title: {
                standoff: 5,
                text:
                    traces.plots.length > 1
                        ? truncateText(t.xLabel, 15)
                        : truncateText(t.xLabel, 50),
                font: {
                    family: 'Courier New, monospace',
                    size: traces.plots.length > 9 ? 10 : 14,
                    color: '#7f7f7f'
                }
            }
        };

        layout[`yaxis${i > 0 ? i + 1 : ''}`] = {
            showline: false,
            showspikes: true,
            spikecolor: 'black',
            spikethickness: 2,
            spikedash: 'dash',
            ticks: 'outside',
            fixedrange: true,
            title: {
                text:
                    traces.plots.length > 1
                        ? truncateText(t.yLabel, 15)
                        : truncateText(t.yLabel, 50),
                font: {
                    family: 'Courier New, monospace',
                    size: traces.plots.length > 9 ? 10 : 14,
                    color: '#7f7f7f'
                }
            }
        };

        layout.shapes.push({
            type: 'line',
            // @ts-ignore
            xref: `x${i > 0 ? i + 1 : ''} domain`,
            // @ts-ignore
            yref: `y${i > 0 ? i + 1 : ''} domain`,
            x0: 0,
            y0: 1,
            x1: 1,
            y1: 1,
            line: {
                color: 'rgb(238, 238, 238)',
                width: 2
            },
            opacity: 1,
            row: 2,
            col: 2
        });

        layout.shapes.push({
            type: 'line',
            // @ts-ignore
            xref: `x${i > 0 ? i + 1 : ''} domain`,
            // @ts-ignore
            yref: `y${i > 0 ? i + 1 : ''} domain`,
            x0: 0,
            y0: 0,
            x1: 1,
            y1: 0,
            line: {
                color: 'rgb(238, 238, 238)',
                width: 2
            },
            opacity: 1,
            row: 2,
            col: 2
        });

        layout.shapes.push({
            type: 'line',
            // @ts-ignore
            xref: `x${i > 0 ? i + 1 : ''} domain`,
            // @ts-ignore
            yref: `y${i > 0 ? i + 1 : ''} domain`,
            x0: 0,
            y0: 0,
            x1: 0,
            y1: 1,
            line: {
                color: 'rgb(238, 238, 238)',
                width: 2
            },
            opacity: 1,
            row: 2,
            col: 2
        });

        layout.shapes.push({
            type: 'line',
            // @ts-ignore
            xref: `x${i > 0 ? i + 1 : ''} domain`,
            // @ts-ignore
            yref: `y${i > 0 ? i + 1 : ''} domain`,
            x0: 1,
            y0: 0,
            x1: 1,
            y1: 1,
            line: {
                color: 'rgb(238, 238, 238)',
                width: 2
            },
            opacity: 1,
            row: 2,
            col: 2
        });
    });

    return layout;
}

export function resolveColumnValues(columns: VisColumn[]) {
    return Promise.all(
        columns.map(async col => ({
            ...col,
            resolvedValues: await col.values()
        }))
    );
}

export async function resolveSingleColumn(column: VisColumn) {
    if (!column) {
        return null;
    }
    return {
        ...column,
        resolvedValues: await column.values()
    };
}
