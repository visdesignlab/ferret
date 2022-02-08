import * as React from 'react';
import Select from 'react-select';
import { ColumnInfo, EColumnTypes, VisColumn } from '../interfaces';

interface MultiplesSelectProps {
    callback: (c: ColumnInfo) => void;
    columns: VisColumn[];
    currentSelected: ColumnInfo | null;
}

export function MultiplesSelect(props: MultiplesSelectProps) {
    return (
        <>
            <label className="pt-2 pb-1">Multiples</label>
            <Select
                isClearable
                onChange={e => props.callback(e)}
                name={'multiplesSelect'}
                getOptionLabel={option => option.name}
                getOptionValue={option => option.id}
                options={props.columns
                    .filter(c => c.type === EColumnTypes.CATEGORICAL)
                    .map(c => c.info)}
                value={props.currentSelected ? props.currentSelected : []}
            />
        </>
    );
}
