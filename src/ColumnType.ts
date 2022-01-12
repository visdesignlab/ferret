export type ColumnTypeKeys = 'number' | 'label' | 'categorical';

export type ColumnTypeValues = 'Number' | 'Label' | 'Categorical';

export const ColumnTypeMap: { [K in ColumnTypeKeys]: ColumnTypeValues } = {
    number: 'Number',
    label: 'Label',
    categorical: 'Categorical'
};

export const ReverseColumnTypeMap: { [K in ColumnTypeValues]: ColumnTypeKeys } =
    {
        Number: 'number',
        Label: 'label',
        Categorical: 'categorical'
    };

export type ColumnMap = { [key: string]: ColumnTypeValues };

export function getColumnType(arr: any[]): ColumnTypeValues {
    if (isCategoricalArray(arr)) {
        return 'Categorical';
    }
    if (isNumericArray(arr)) {
        return 'Number';
    }
    return 'Label';
}

export function isNumericArray(arr: any[]) {
    return !arr.every(isNaN);
}

function isCategoricalArray(arr: any[]) {
    let uniqueVals = [...new Set(arr)];
    return uniqueVals.length > 1 && uniqueVals.length < 12;
}
