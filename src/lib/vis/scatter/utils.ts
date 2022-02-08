import {
    PlotlyInfo,
    PlotlyData,
    EColumnTypes,
    VisNumericalColumn,
    ColumnInfo,
    IVisConfig,
    Scales,
    ESupportedPlotlyVis,
    VisColumn
} from '../interfaces';
import { getCol } from '../sidebar';
import { merge } from 'lodash';
import * as d3 from 'd3';
import { getCssValue } from '../util';
import {
    resolveColumnValues,
    resolveSingleColumn
} from '../general/layoutUtils';

export enum ENumericalColorScaleType {
    SEQUENTIAL = 'Sequential',
    DIVERGENT = 'Divergent'
}

export function isScatter(s: IVisConfig): s is IScatterConfig {
    return s.type === ESupportedPlotlyVis.SCATTER;
}

export interface IScatterConfig {
    type: ESupportedPlotlyVis.SCATTER;
    numColumnsSelected: ColumnInfo[];
    color: ColumnInfo | null;
    numColorScaleType: ENumericalColorScaleType;
    shape: ColumnInfo | null;
    isRectBrush: boolean;
    alphaSliderVal: number;
}

const defaultConfig: IScatterConfig = {
    type: ESupportedPlotlyVis.SCATTER,
    numColumnsSelected: [],
    color: null,
    numColorScaleType: ENumericalColorScaleType.SEQUENTIAL,
    shape: null,
    isRectBrush: true,
    alphaSliderVal: 1
};

export function scatterMergeDefaultConfig(
    columns: VisColumn[],
    config: IScatterConfig
): IVisConfig {
    const merged = merge({}, defaultConfig, config);

    const numCols = columns.filter(c => c.type === EColumnTypes.NUMERICAL);

    if (merged.numColumnsSelected.length === 0 && numCols.length > 1) {
        merged.numColumnsSelected.push(numCols[numCols.length - 1].info);
        merged.numColumnsSelected.push(numCols[numCols.length - 2].info);
    } else if (merged.numColumnsSelected.length === 1 && numCols.length > 1) {
        if (
            numCols[numCols.length - 1].info.id !==
            merged.numColumnsSelected[0].id
        ) {
            merged.numColumnsSelected.push(numCols[numCols.length - 1].info);
        } else {
            merged.numColumnsSelected.push(numCols[numCols.length - 2].info);
        }
    }

    return merged;
}

export async function createScatterTraces(
    columns: VisColumn[],
    selected: { [key: number]: boolean },
    config: IScatterConfig,
    scales: Scales,
    shapes: string[] | null
): Promise<PlotlyInfo> {
    let plotCounter = 1;

    const emptyVal = {
        plots: [],
        legendPlots: [],
        rows: 0,
        cols: 0,
        errorMessage: 'tdp:core.vis.scatterError',
        formList: ['color', 'shape', 'bubble', 'opacity']
    };

    if (!config.numColumnsSelected) {
        return emptyVal;
    }

    const numCols: VisNumericalColumn[] = columns.filter(
        c =>
            config.numColumnsSelected.some(d => c.info.id === d.id) &&
            c.type === EColumnTypes.NUMERICAL
    ) as VisNumericalColumn[];
    const plots: PlotlyData[] = [];

    const validCols = await resolveColumnValues(numCols);
    const shapeCol = await resolveSingleColumn(getCol(columns, config.shape));
    const colorCol = await resolveSingleColumn(getCol(columns, config.color));

    const shapeScale = config.shape
        ? d3
              .scaleOrdinal()
              .domain([
                  ...new Set(shapeCol.resolvedValues.map(v => v.val))
              ] as string[])
              .range(shapes)
        : null;

    let min = 0;
    let max = 0;

    if (config.color) {
        (min = d3.min(
            colorCol.resolvedValues.map(v => +v.val).filter(v => v !== null)
        )),
            (max = d3.max(
                colorCol.resolvedValues.map(v => +v.val).filter(v => v !== null)
            ));
    }

    const numericalColorScale = config.color
        ? d3
              .scaleLinear<string, number>()
              .domain([max, (max + min) / 2, min])
              .range(
                  config.numColorScaleType ===
                      ENumericalColorScaleType.SEQUENTIAL
                      ? [
                            getCssValue('visyn-s9-blue'),
                            getCssValue('visyn-s5-blue'),
                            getCssValue('visyn-s1-blue')
                        ]
                      : [
                            getCssValue('visyn-c1'),
                            '#d3d3d3',
                            getCssValue('visyn-c2')
                        ]
              )
        : null;

    const legendPlots: PlotlyData[] = [];

    //cant currently do 1d scatterplots
    if (validCols.length === 1) {
        return emptyVal;
    }

    //if exactly 2 then return just one plot. otherwise, loop over and create n*n plots. TODO:: make the diagonal plots that have identical axis a histogram
    if (validCols.length === 2) {
        plots.push({
            data: {
                x: validCols[0].resolvedValues.map(v => v.val),
                y: validCols[1].resolvedValues.map(v => v.val),
                ids: validCols[0].resolvedValues.map(v => v.id.toString()),
                xaxis: plotCounter === 1 ? 'x' : 'x' + plotCounter,
                yaxis: plotCounter === 1 ? 'y' : 'y' + plotCounter,
                type: 'scattergl',
                mode: 'markers',
                showlegend: false,
                text: validCols[0].resolvedValues.map(v => v.id.toString()),
                marker: {
                    line: {
                        width: 0
                    },
                    symbol: shapeCol
                        ? shapeCol.resolvedValues.map(v =>
                              shapeScale(v.val as string)
                          )
                        : 'circle',
                    color: colorCol
                        ? colorCol.resolvedValues.map(v =>
                              selected[v.id]
                                  ? '#E29609'
                                  : colorCol.type === EColumnTypes.NUMERICAL
                                  ? numericalColorScale(v.val as number)
                                  : scales.color(v.val)
                          )
                        : validCols[0].resolvedValues.map(v =>
                              selected[v.id] ? '#E29609' : '#2e2e2e'
                          ),
                    opacity: config.alphaSliderVal,
                    size: 10
                }
            },
            xLabel: validCols[0].info.name,
            yLabel: validCols[1].info.name
        });
    } else {
        for (const yCurr of validCols) {
            for (const xCurr of validCols) {
                plots.push({
                    data: {
                        x: xCurr.resolvedValues.map(v => v.val),
                        y: yCurr.resolvedValues.map(v => v.val),
                        ids: xCurr.resolvedValues.map(v => v.id.toString()),
                        xaxis: plotCounter === 1 ? 'x' : 'x' + plotCounter,
                        yaxis: plotCounter === 1 ? 'y' : 'y' + plotCounter,
                        type: 'scattergl',
                        mode: 'markers',
                        hoverlabel: {
                            namelength: 5
                        },
                        showlegend: false,
                        text: validCols[0].resolvedValues.map(v =>
                            v.id.toString()
                        ),
                        marker: {
                            line: {
                                width: 0
                            },
                            symbol: shapeCol
                                ? shapeCol.resolvedValues.map(v =>
                                      shapeScale(v.val as string)
                                  )
                                : 'circle',
                            color: colorCol
                                ? colorCol.resolvedValues.map(v =>
                                      selected[v.id]
                                          ? '#E29609'
                                          : colorCol.type ===
                                            EColumnTypes.NUMERICAL
                                          ? numericalColorScale(v.val as number)
                                          : scales.color(v.val)
                                  )
                                : xCurr.resolvedValues.map(v =>
                                      selected[v.id] ? '#E29609' : '#2e2e2e'
                                  ),
                            opacity: config.alphaSliderVal,
                            size: 10
                        }
                    },
                    xLabel: xCurr.info.name,
                    yLabel: yCurr.info.name
                });

                plotCounter += 1;
            }
        }
    }

    //if we have a column for the color, and its a categorical column, add a legendPlot that creates a legend.
    if (
        colorCol &&
        colorCol.type === EColumnTypes.CATEGORICAL &&
        validCols.length > 0
    ) {
        legendPlots.push({
            data: {
                x: validCols[0].resolvedValues.map(v => v.val),
                y: validCols[0].resolvedValues.map(v => v.val),
                ids: validCols[0].resolvedValues.map(v => v.id),
                xaxis: 'x',
                yaxis: 'y',
                type: 'scattergl',
                mode: 'markers',
                visible: 'legendonly',
                legendgroup: 'color',
                legendgrouptitle: {
                    text: 'Color'
                },
                marker: {
                    line: {
                        width: 0
                    },
                    symbol: 'circle',
                    size: 10,
                    color: colorCol
                        ? colorCol.resolvedValues.map(v => scales.color(v.val))
                        : '#2e2e2e',
                    opacity: 0.5
                },
                transforms: [
                    {
                        type: 'groupby',
                        groups: colorCol.resolvedValues.map(v => v.val),
                        styles: [
                            ...[
                                ...new Set<string>(
                                    colorCol.resolvedValues.map(
                                        v => v.val
                                    ) as string[]
                                )
                            ].map(c => {
                                return { target: c, value: { name: c } };
                            })
                        ]
                    }
                ]
            },
            xLabel: validCols[0].info.name,
            yLabel: validCols[0].info.name
        } as any);
    }

    //if we have a column for the shape, add a legendPlot that creates a legend.
    if (shapeCol) {
        legendPlots.push({
            data: {
                x: validCols[0].resolvedValues.map(v => v.val),
                y: validCols[0].resolvedValues.map(v => v.val),
                ids: validCols[0].resolvedValues.map(v => v.id.toString()),
                xaxis: 'x',
                yaxis: 'y',
                type: 'scattergl',
                mode: 'markers',
                visible: 'legendonly',
                showlegend: true,
                legendgroup: 'shape',
                legendgrouptitle: {
                    text: 'Shape'
                },
                marker: {
                    line: {
                        width: 0
                    },
                    opacity: config.alphaSliderVal,
                    size: 10,
                    symbol: shapeCol
                        ? shapeCol.resolvedValues.map(v =>
                              shapeScale(v.val as string)
                          )
                        : 'circle',
                    color: '#2e2e2e'
                },
                transforms: [
                    {
                        type: 'groupby',
                        groups: shapeCol.resolvedValues.map(v => v.val),
                        styles: [
                            ...[
                                ...new Set<string>(
                                    shapeCol.resolvedValues.map(
                                        v => v.val
                                    ) as string[]
                                )
                            ].map(c => {
                                return { target: c, value: { name: c } };
                            })
                        ]
                    }
                ]
            },
            xLabel: validCols[0].info.name,
            yLabel: validCols[0].info.name
        } as any);
    }

    return {
        plots,
        legendPlots,
        rows: Math.sqrt(plots.length),
        cols: Math.sqrt(plots.length),
        errorMessage: 'tdp:core.vis.scatterError'
    };
}