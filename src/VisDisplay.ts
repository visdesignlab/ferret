import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Vis, ColumnInfo, EColumnTypes, VisColumn } from './lib/vis';
import {
    LineUp,
    CategoricalColumn,
    Column,
    IDataRow,
    NumberColumn,
    ValueColumn
} from 'lineupjs';
import FerretColumn from './FerretColumn';
import ExcelColumn from './ExcelColumn';

export class VisDisplay {
    constructor(container: HTMLElement) {
        this._container = container;
    }

    private _container: HTMLElement;
    public get container(): HTMLElement {
        return this._container;
    }

    private _lineup: LineUp;
    public get lineup(): LineUp {
        return this._lineup;
    }

    public async SetData(lineup: LineUp): Promise<void> {
        const ranking = lineup.data.getFirstRanking();
        this._lineup = lineup;

        const getColumnInfo = (column: Column): ColumnInfo => {
            return {
                // This regex strips any html off of the label and summary, leaving only the center text. For example, <div><span>Hello</span></div> would be hello.
                name: column.getMetaData().label.replace(/(<([^>]+)>)/gi, ''),
                description: 'column_description_placeholder',
                id: column.fqid
            };
        };

        const mapData = <T extends ValueColumn<any>>(
            data: IDataRow[],
            column: T
        ) => {
            return data.map((d, i) => ({
                id: i,
                val: column.getRaw(d)
            }));
        };

        const getColumnValue = async <T extends ValueColumn<any>>(
            column: T
        ) => {
            const data: IDataRow[] = [];
            const indices = ranking.getOrder();
            for (let i of indices) {
                data[i] = await lineup.data.getRow(i);
            }
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

        const cols: VisColumn[] = [];
        for (const c of ranking.flatColumns) {
            if (c instanceof FerretColumn || c instanceof ExcelColumn) {
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
