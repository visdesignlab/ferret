export const LEADING_DIGIT_FREQ_SELECTION = 'LEADING_DIGIT_FREQ_SELECTION';
export const FREQUENT_VALUES_SELECTION = 'FREQUENT_VALUES_SELECTION';
export const N_GRAM_SELECTION = 'N_GRAM_SELECTION';
export const VALUE_DIST_SELECTION = 'VALUE_DIST_SELECTION';
export const LINEUP_COL_COUNT = 3; // number of columns lineup inserts [agg groups, rank, checkboxes]

export type DuplicateCountType = 'ALL' | 'TOP';
export type FilterAction = 'FILTER_ADDED' | 'FILTER_REMOVED';
export type SelectionType = 'Filter' | 'Highlight';
export type FilterRange = 'GLOBAL' | 'LOCAL';

export type chartType = 'nominal' | 'quantitative';
