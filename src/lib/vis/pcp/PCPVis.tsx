import * as React from 'react';
import {
    ColumnInfo,
    ESupportedPlotlyVis,
    VisColumn,
    IVisConfig
} from '../interfaces';
import {
    CategoricalColumnSelect,
    NumericalColumnSelect,
    VisTypeSelect,
    WarningMessage
} from '../sidebar';
// import { PlotlyComponent, Plotly } from '../Plot';
import * as Plotly from 'plotly.js-dist-min';
import Plot from 'react-plotly.js';
import { InvalidCols } from '../general';
import { merge, uniqueId } from 'lodash';
import { createPCPTraces, IPCPConfig } from './utils';
import { useAsync } from '../useAsync';

interface PCPVisProps {
    config: IPCPConfig;
    optionsConfig?: {};
    extensions?: {
        prePlot?: React.ReactNode;
        postPlot?: React.ReactNode;
        preSidebar?: React.ReactNode;
        postSidebar?: React.ReactNode;
    };
    columns: VisColumn[];
    setConfig: (config: IVisConfig) => void;
}

const defaultConfig = {};

const defaultExtensions = {
    prePlot: null,
    postPlot: null,
    preSidebar: null,
    postSidebar: null
};

export function PCPVis({
    config,
    optionsConfig,
    extensions,
    columns,
    setConfig
}: PCPVisProps) {
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
    } = useAsync(createPCPTraces, [columns, config]);

    const id = React.useMemo(() => uniqueId('PCPVis'), []);

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
    }, []);

    const layout = React.useMemo<Partial<Plotly.Layout> | null>(
        // @ts-ignore
        () => {
            return traces
                ? {
                      showlegend: true,
                      legend: {
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
                  }
                : null;
        },
        [traces]
    );

    return (
        <div
            className="d-flex flex-row w-100 h-100"
            style={{ minHeight: '0px' }}
        >
            <div
                className={`position-relative d-flex justify-content-center align-items-center flex-grow-1 ${
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
                        layout={layout}
                        config={{ responsive: true, displayModeBar: false }}
                        useResizeHandler={true}
                        style={{ width: '100%', height: '100%' }}
                        //plotly redraws everything on updates, so you need to reappend title and
                        // change opacity on update, instead of just in a use effect
                    />
                ) : traceStatus !== 'pending' ? (
                    <InvalidCols
                        message={traceError?.message || traces?.errorMessage}
                    />
                ) : null}
                {mergedExtensions.postPlot}
            </div>
            <div className="position-relative h-100 flex-shrink-1 bg-light overflow-auto">
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
                    className="collapse show collapse-horizontal"
                    id={`generalVisBurgerMenu${id}`}
                >
                    <div className="container pb-3" style={{ width: '20rem' }}>
                        {/* <WarningMessage /> */}
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