import * as React from 'react';
import Highlighter from 'react-highlight-words';
import {
    ColumnInfo,
    VisNumericalColumn,
    VisCategoricalColumn,
    VisColumn
} from '../interfaces';

export function getCol(
    columns: VisColumn[],
    info: ColumnInfo | null
): VisNumericalColumn | VisCategoricalColumn | null {
    if (!info) {
        return null;
    }
    return columns.filter(c => c.info.id === info.id)[0];
}
