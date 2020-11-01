export type ColumnTypeKeys =
  | 'number'
  | 'label'
  | 'set'
  | 'set-list'
  | 'categorical';

export type ColumnTypeValues =
  | 'Number'
  | 'Label'
  | 'Set'
  | 'Set List'
  | 'Categorical';

export const ColumnTypeMap: {[K in ColumnTypeKeys]: ColumnTypeValues} = {
  number: 'Number',
  label: 'Label',
  set: 'Set',
  'set-list': 'Set List',
  categorical: 'Categorical',
};

export const ReverseColumnTypeMap: {[K in ColumnTypeValues]: ColumnTypeKeys} = {
  Number: 'number',
  Label: 'label',
  Set: 'set',
  'Set List': 'set-list',
  Categorical: 'categorical',
};

export type ColumnMap = {[key: string]: ColumnTypeValues};

export function getColumnType(arr: any[]): ColumnTypeValues {
  if (isNumericArray(arr)) {
    if (isSetArray(arr)) return 'Set';
    if (isDecimalArray(arr)) return 'Number';
    if (isCategoricalArray(arr)) return 'Categorical';
    return 'Number';
  }
  if (isCategoricalArray(arr)) return 'Categorical';
  return 'Label';
}

export function isNumericArray(arr: any[]) {
  return !arr.every(isNaN);
}

export function isDecimalArray(arr: any[]) {
  return arr.some(i => i % 1 !== 0);
}

function isSetArray(arr: any[]) {
  let uniqueVals = [...new Set(arr)];
  return uniqueVals.length > 0 && uniqueVals.length <= 2;
}

function isCategoricalArray(arr: any[]) {
  let uniqueVals = [...new Set(arr)];
  return uniqueVals.length > 0 && uniqueVals.length < 10;
}
