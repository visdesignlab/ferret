export type ColumnTypeKeys = 'number' | 'label' | 'categorical' | 'excel';

export type ColumnTypeValues = 'Number' | 'Label' | 'Categorical' | 'Excel';

export const ColumnTypeMap: { [K in ColumnTypeKeys]: ColumnTypeValues } = {
    number: 'Number',
    label: 'Label',
    categorical: 'Categorical',
    excel: 'Excel'
};

export const ReverseColumnTypeMap: { [K in ColumnTypeValues]: ColumnTypeKeys } =
    {
        Number: 'number',
        Label: 'label',
        Categorical: 'categorical',
        Excel: 'excel'
    };

export type ColumnMap = { [key: string]: ColumnTypeValues };

export function getColumnType(arr: any[]): ColumnTypeValues {
    if (isNumericArray(arr)) {
        return 'Number';
    }
    if (isExcelArray(arr)) {
        return 'Excel';
    }
    if (isCategoricalArray(arr)) {
        return 'Categorical';
    }
    return 'Label';
}

function isExcelArray(arr: any[]): boolean {
    return arr.every((val: any) => typeof val == 'object');
}

export function isNumericArray(arr: any[]) {
    return arr.every((val: any) => typeof val == 'number');
}

function isCategoricalArray(arr: any[]) {
    let uniqueVals = [...new Set(arr)];
    return uniqueVals.length > 1 && uniqueVals.length < 5;
}
