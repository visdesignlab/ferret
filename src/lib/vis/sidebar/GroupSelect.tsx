import * as React from 'react';
import Select from 'react-select';
import { ColumnInfo, EColumnTypes, VisColumn } from '../interfaces';

interface GroupSelectProps {
    callback: (c: ColumnInfo) => void;
    columns: VisColumn[];
    currentSelected: ColumnInfo | null;
}

export function GroupSelect(props: GroupSelectProps) {
    return (
        <>
            <label className="pt-2 pb-1">Group</label>
            <Select
                isClearable
                onChange={e => props.callback(e)}
                name={'groupSelect'}
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
