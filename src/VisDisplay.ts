import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as LineUpJS from 'lineupjs';
// import { ColumnInfo, EColumnTypes, VisColumn } from './lib/vis/interfaces';
import { Vis, ColumnInfo, EColumnTypes, VisColumn } from './lib/vis';
import {
    CategoricalColumn,
    Column,
    IDataRow,
    NumberColumn,
    ValueColumn
} from 'lineupjs';
import { line } from 'd3';
import FerretColumn from './FerretColumn';

export class VisDisplay {
    constructor(container: HTMLElement) {
        this._container = container;
    }

    private _container: HTMLElement;
    public get container(): HTMLElement {
        return this._container;
    }

    public async SetData(lineup: LineUpJS.LineUp): Promise<void> {
        const getColumnInfo = (column: Column): ColumnInfo => {
            return {
                // This regex strips any html off of the label and summary, leaving only the center text. For example, <div><span>Hello</span></div> would be hello.
                name: column.getMetaData().label.replace(/(<([^>]+)>)/gi, ''),
                description: 'awesome_desxcript',
                // description: column
                //     .getMetaData()
                //     .summary.replace(/(<([^>]+)>)/gi, ''),
                id: column.fqid
            };
        };

        const mapData = <T extends ValueColumn<any>>(
            data: IDataRow[],
            column: T
        ) => {
            // TODO: Refactor to use _visyn_id instead.
            return data.map((d, i) => ({ id: d.v._id, val: column.getRaw(d) }));
        };

        const getColumnValue = async <T extends ValueColumn<any>>(
            column: T
        ) => {
            if (column.isLoaded()) {
                return mapData(data, column);
            }

            return new Promise<{ id: number; val: T }[]>((resolve, reject) => {
                //times out if we take longer than 60 seconds to load the columns.
                const timeout = setTimeout(() => {
                    reject('Timeout');
                }, 60000);

                column.on(ValueColumn.EVENT_DATA_LOADED, () => {
                    clearTimeout(timeout);
                    resolve(mapData(data, column));
                });
            });
        };

        const ranking = lineup.data.getFirstRanking();
        const data: IDataRow[] = [];
        for (let i of ranking.getOrder()) {
            data[i] = await lineup.data.getRow(i);
        }
        // const data = lineup.data.getRow(5)
        // const data = lineup.data.viewRawRows(ranking.getOrder());
        const cols: VisColumn[] = [];
        for (const c of ranking.flatColumns) {
            if (c instanceof FerretColumn) {
                cols.push({
                    info: getColumnInfo(c),
                    values: () => getColumnValue(c),
                    type: EColumnTypes.NUMERICAL
                });
            } else if (c instanceof CategoricalColumn) {
                cols.push({
                    info: getColumnInfo(c),
                    values: () =>
                        getColumnValue(c).then(res =>
                            res.map(v =>
                                v.val
                                    ? v
                                    : {
                                          ...v,
                                          val: '--'
                                      }
                            )
                        ),
                    type: EColumnTypes.CATEGORICAL
                });
            }
        }

        // const selectedMap: { [key: number]: boolean } = {};
        const someReactThing = React.createElement(Vis, {
            columns: cols,
            // selected: selectedMap,
            selectionCallback: (s: number[]) => {
                console.log('selectionCallback', s);
            },
            filterCallback: (s: string) => {
                console.log('filterCallback', s);
            }
        });
        ReactDOM.render(someReactThing, this.container);
    }
}
