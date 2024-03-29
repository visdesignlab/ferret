import * as React from 'react';
import {
    IVisConfig,
    ColumnInfo,
    EFilterOptions,
    ESupportedPlotlyVis,
    Scales,
    VisColumn
} from '../interfaces';
import {
    BrushOptionButtons,
    ColorSelect,
    FilterButtons,
    NumericalColumnSelect,
    OpacitySlider,
    ShapeSelect,
    VisTypeSelect
} from '../sidebar';
import * as Plotly from 'plotly.js-dist-min';

import Plot from 'react-plotly.js';
import { InvalidCols } from '../general';
import * as d3 from 'd3';
import {
    createScatterTraces,
    ENumericalColorScaleType,
    IScatterConfig
} from './utils';
import { beautifyLayout } from '../general/layoutUtils';
import { merge, uniqueId } from 'lodash';
import { useAsync } from '../useAsync';

interface ScatterVisProps {
    config: IScatterConfig;
    optionsConfig?: {
        color?: {
            enable?: boolean;
            customComponent?: React.ReactNode;
        };
        shape?: {
            enable?: boolean;
            customComponent?: React.ReactNode;
        };
        filter?: {
            enable?: boolean;
            customComponent?: React.ReactNode;
        };
    };
    extensions?: {
        prePlot?: React.ReactNode;
        postPlot?: React.ReactNode;
        preSidebar?: React.ReactNode;
        postSidebar?: React.ReactNode;
    };
    shapes?: string[];
    columns: VisColumn[];
    filterCallback?: (s: EFilterOptions) => void;
    selectionCallback?: (s: number[]) => void;
    selected?: { [key: number]: boolean };
    setConfig: (config: IVisConfig) => void;
    scales: Scales;
}

const defaultConfig = {
    color: {
        enable: true,
        customComponent: null
    },
    shape: {
        enable: true,
        customComponent: null
    },
    filter: {
        enable: true,
        customComponent: null
    }
};

const defaultExtensions = {
    prePlot: null,
    postPlot: null,
    preSidebar: null,
    postSidebar: null
};

export function ScatterVis({
    config,
    optionsConfig,
    extensions,
    columns,
    shapes = ['circle', 'square', 'triangle-up', 'star'],
    filterCallback = () => null,
    selectionCallback = () => null,
    selected = {},
    setConfig,
    scales
}: ScatterVisProps) {
    const id = React.useMemo(() => uniqueId('ScatterVis'), []);

    React.useEffect(() => {
        const menu = document.getElementById(`generalVisBurgerMenu${id}`);
        const controlsContainer = document.getElementById(`controlsContainer`);
        for (let triggerEl of [menu, controlsContainer]) {
            triggerEl.addEventListener('hidden.bs.collapse', () => {
                Plotly.Plots.resize(document.getElementById(`plotlyDiv${id}`));
            });

            triggerEl.addEventListener('shown.bs.collapse', () => {
                Plotly.Plots.resize(document.getElementById(`plotlyDiv${id}`));
            });
        }

        document.addEventListener(
            'toggleVisualizations',
            (_event: CustomEvent) => {
                Plotly.Plots.resize(document.getElementById(`plotlyDiv${id}`));
            }
        );
    }, []);

    const mergedOptionsConfig = React.useMemo(() => {
        return merge({}, defaultConfig, optionsConfig);
    }, []);

    const mergedExtensions = React.useMemo(() => {
        return merge({}, defaultExtensions, extensions);
    }, []);

    const {
        value: traces,
        status: traceStatus,
        error: traceError
    } = useAsync(createScatterTraces, [
        columns,
        selected,
        config,
        scales,
        shapes
    ]);

    const layout = React.useMemo(() => {
        if (!traces) {
            return null;
        }

        const layout: Plotly.Layout = {
            showlegend: true,
            legend: {
                //@ts-ignore
                itemclick: false,
                itemdoubleclick: false
            },
            autosize: true,
            width: 10,
            grid: {
                rows: traces.rows,
                columns: traces.cols,
                xgap: 0.3,
                pattern: 'independent'
            },
            shapes: [],
            violingap: 0,
            dragmode: config.isRectBrush ? 'select' : 'lasso'
        };

        return beautifyLayout(traces, layout);
    }, [traces, config.isRectBrush]);

    return (
        <div
            className="d-flex flex-row w-100 h-100"
            style={{ minHeight: '0px' }}
        >
            <div
                className={`min-width-0 position-relative d-flex justify-content-center align-items-center flex-grow-1 ${
                    traceStatus === 'pending' ? 'tdp-busy-partial-overlay' : ''
                }`}
            >
                {mergedExtensions.prePlot}
                {traceStatus === 'success' && traces?.plots.length > 0 ? (
                    <Plot
                        divId={`plotlyDiv${id}`}
                        data={[
                            ...traces.plots.map(p => p.data),
                            ...traces.legendPlots.map(p => p.data)
                        ]}
                        layout={layout as any}
                        config={{ responsive: true, displayModeBar: false }}
                        useResizeHandler={true}
                        style={{ width: '100%', height: '100%' }}
                        onSelected={d => {
                            d
                                ? selectionCallback(
                                      d.points.map(d => +(d as any).id)
                                  )
                                : selectionCallback([]);
                        }}
                        // plotly redraws everything on updates, so you need to reappend title and
                        // change opacity on update, instead of just in a use effect
                        onInitialized={() => {
                            d3.selectAll('g .traces').style(
                                'opacity',
                                config.alphaSliderVal
                            );
                            d3.selectAll('.scatterpts').style(
                                'opacity',
                                config.alphaSliderVal
                            );
                        }}
                        onUpdate={() => {
                            d3.selectAll('g .traces').style(
                                'opacity',
                                config.alphaSliderVal
                            );
                            d3.selectAll('.scatterpts').style(
                                'opacity',
                                config.alphaSliderVal
                            );

                            for (const p of traces.plots) {
                                d3.select(`g .${p.data.xaxis}title`)
                                    .style('pointer-events', 'all')
                                    .append('title')
                                    .text(p.xLabel);

                                d3.select(`g .${p.data.yaxis}title`)
                                    .style('pointer-events', 'all')
                                    .append('title')
                                    .text(p.yLabel);
                            }
                        }}
                    />
                ) : traceStatus !== 'pending' ? (
                    <InvalidCols
                        message={traceError?.message || traces?.errorMessage}
                    />
                ) : null}
                <div className="position-absolute d-flex justify-content-center align-items-center top-0 start-50 mt-4 translate-middle-x">
                    <BrushOptionButtons
                        callback={(e: boolean) =>
                            setConfig({ ...config, isRectBrush: e })
                        }
                        isRectBrush={config.isRectBrush}
                    />
                    <OpacitySlider
                        callback={e =>
                            setConfig({ ...config, alphaSliderVal: e })
                        }
                        currentValue={config.alphaSliderVal}
                    />
                </div>
                {mergedExtensions.postPlot}
            </div>
            <div className="position-relative h-100 flex-shrink-1 bg-light">
                <button
                    className="btn btn-primary-outline"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target={`#generalVisBurgerMenu${id}`}
                    aria-expanded="true"
                    aria-controls="generalVisBurgerMenu"
                >
                    <i className="fas fa-bars" />
                </button>
                <div
                    className="collapse show collapse-horizontal overflow-y-auto max-height-100"
                    id={`generalVisBurgerMenu${id}`}
                >
                    <div className="container pb-3" style={{ width: '20rem' }}>
                        <VisTypeSelect
                            callback={(type: ESupportedPlotlyVis) =>
                                setConfig({ ...(config as any), type })
                            }
                            currentSelected={config.type}
                        />
                        <hr />
                        <NumericalColumnSelect
                            callback={(numColumnsSelected: ColumnInfo[]) =>
                                setConfig({ ...config, numColumnsSelected })
                            }
                            columns={columns}
                            currentSelected={config.numColumnsSelected || []}
                        />
                        <hr />
                        {mergedExtensions.preSidebar}

                        {mergedOptionsConfig.color.enable
                            ? mergedOptionsConfig.color.customComponent || (
                                  <ColorSelect
                                      callback={(color: ColumnInfo) =>
                                          setConfig({ ...config, color })
                                      }
                                      numTypeCallback={(
                                          numColorScaleType: ENumericalColorScaleType
                                      ) =>
                                          setConfig({
                                              ...config,
                                              numColorScaleType
                                          })
                                      }
                                      currentNumType={config.numColorScaleType}
                                      columns={columns}
                                      currentSelected={config.color}
                                  />
                              )
                            : null}
                        {mergedOptionsConfig.shape.enable
                            ? mergedOptionsConfig.shape.customComponent || (
                                  <ShapeSelect
                                      callback={(shape: ColumnInfo) =>
                                          setConfig({ ...config, shape })
                                      }
                                      columns={columns}
                                      currentSelected={config.shape}
                                  />
                              )
                            : null}
                        <hr />
                        {mergedOptionsConfig.filter.enable
                            ? mergedOptionsConfig.filter.customComponent || (
                                  <FilterButtons callback={filterCallback} />
                              )
                            : null}

                        {mergedExtensions.postSidebar}
                    </div>
                </div>
            </div>
        </div>
    );
}
