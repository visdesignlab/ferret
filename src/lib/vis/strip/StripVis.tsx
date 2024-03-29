import * as React from 'react';
import {
    IVisConfig,
    ColumnInfo,
    ESupportedPlotlyVis,
    Scales,
    VisColumn
} from '../interfaces';
import {
    CategoricalColumnSelect,
    NumericalColumnSelect,
    VisTypeSelect
} from '../sidebar';
import * as Plotly from 'plotly.js-dist-min';
import Plot from 'react-plotly.js';
import { InvalidCols } from '../general';
import * as d3 from 'd3';
import { beautifyLayout } from '../general/layoutUtils';
import { merge } from 'lodash';
import { createStripTraces, IStripConfig } from './utils';
import { useAsync } from '../useAsync';

interface StripVisProps {
    config: IStripConfig;
    optionsConfig?: {};
    extensions?: {
        prePlot?: React.ReactNode;
        postPlot?: React.ReactNode;
        preSidebar?: React.ReactNode;
        postSidebar?: React.ReactNode;
    };
    columns: VisColumn[];
    setConfig: (config: IVisConfig) => void;
    scales: Scales;
}

const defaultConfig = {};

const defaultExtensions = {
    prePlot: null,
    postPlot: null,
    preSidebar: null,
    postSidebar: null
};

export function StripVis({
    config,
    optionsConfig,
    extensions,
    columns,
    setConfig,
    scales
}: StripVisProps) {
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
    } = useAsync(createStripTraces, [columns, config, scales]);

    const uniqueId = React.useMemo(() => {
        return Math.random().toString(36).substr(2, 5);
    }, []);

    React.useEffect(() => {
        const menu = document.getElementById(`generalVisBurgerMenu${uniqueId}`);
        const controlsContainer = document.getElementById(`controlsContainer`);
        for (let triggerEl of [menu, controlsContainer]) {
            triggerEl.addEventListener('hidden.bs.collapse', () => {
                Plotly.Plots.resize(
                    document.getElementById(`plotlyDiv${uniqueId}`)
                );
            });

            triggerEl.addEventListener('shown.bs.collapse', () => {
                Plotly.Plots.resize(
                    document.getElementById(`plotlyDiv${uniqueId}`)
                );
            });
        }
    }, []);

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
            grid: {
                rows: traces.rows,
                columns: traces.cols,
                xgap: 0.3,
                pattern: 'independent'
            },
            shapes: [],
            violingap: 0
        };

        return beautifyLayout(traces, layout);
    }, [traces]);

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
                        divId={`plotlyDiv${uniqueId}`}
                        data={[
                            ...traces.plots.map(p => p.data),
                            ...traces.legendPlots.map(p => p.data)
                        ]}
                        layout={layout as any}
                        config={{ responsive: true, displayModeBar: false }}
                        useResizeHandler={true}
                        style={{ width: '100%', height: '100%' }}
                        // plotly redraws everything on updates, so you need to reappend title and
                        onUpdate={() => {
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
                {mergedExtensions.postPlot}
            </div>
            <div className="position-relative h-100 flex-shrink-1 bg-light ">
                <button
                    className="btn btn-primary-outline"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target={`#generalVisBurgerMenu${uniqueId}`}
                    aria-expanded="true"
                    aria-controls="generalVisBurgerMenu"
                >
                    <i className="fas fa-bars" />
                </button>
                <div
                    className="collapse show collapse-horizontal overflow-y-auto max-height-100"
                    id={`generalVisBurgerMenu${uniqueId}`}
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
                        <CategoricalColumnSelect
                            callback={(catColumnsSelected: ColumnInfo[]) =>
                                setConfig({ ...config, catColumnsSelected })
                            }
                            columns={columns}
                            currentSelected={config.catColumnsSelected || []}
                        />
                        <hr />
                        {mergedExtensions.preSidebar}
                        {mergedExtensions.postSidebar}
                    </div>
                </div>
            </div>
        </div>
    );
}
