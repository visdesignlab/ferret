export const LEADING_DIGIT_FREQ_SELECTION = "LEADING_DIGIT_FREQ_SELECTION";
export const FREQUENT_VALUES_SELECTION = "FREQUENT_VALUES_SELECTION";
export const N_GRAM_SELECTION = "N_GRAM_SELECTION";
export const VALUE_DIST_SELECTION = "VALUE_DIST_SELECTION";

export type DuplicateCountType = 'ALL' | 'TOP';
export type FilterAction = 'FILTER_ADDED' | 'FILTER_REMOVED';
export type SelectionType = 'Filter' | 'Highlight';
export type FilterRange = 'GLOBAL' | 'LOCAL';

export type chartType = 'nominal' | 'quantitative';

interface caveat {
    text?: string;
    image?: string;
    imageCaption?: string;

}
export const define = ['','This chart shows the repeated values (occurring two or more times) in each column along with their frequencies. It is sorted by frequency and shows the most repeated values at the top. \n The chart, by default, shows the top five frequent values in each column with an option to expand and see all.','','',''];
export const use = ['','This can be helpful in detecting duplicate or copied values.','','',''];
const frequentValueCaveats : caveat[] = [{text: "1) Be careful to take into account any limiting values, for eg. maximum time allowed for an experiment, which might be a frequent value as a consequence of the nature of the experiment.", image: "caveat1.png", imageCaption: "Fig 1. 600 seconds is the maximum value possible"},
{text: "2) The chart may indicate uncommon values occurring frequently but it might be a case of conversion from different units, for eg. from seconds to minutes." , image: "caveat2.png", imageCaption: "Fig 2. 23 seconds = ~0.38333333333336 minutes" }];
const todoCaveat : caveat[] = []; 
export const caveats : Array<caveat []> = [todoCaveat,frequentValueCaveats,todoCaveat,todoCaveat,todoCaveat];
