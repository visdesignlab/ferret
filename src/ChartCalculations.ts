import { IDataProvider, IRenderContext, LineUp } from 'lineupjs';
import FerretColumn from './FerretColumn';

export interface SelectionMetadata<T> {
    ignored: T;
    acknowledged: T;
}

export type FreqValsMetadata = SelectionMetadata<[number, number][]>;
export type LeadDigitCountMetadata = SelectionMetadata<Map<number, number>>;

export class ChartCalculations {
    public static async GetLeadingDigitFreqs(
        column: FerretColumn,
        provider: IDataProvider,
        counts?: Map<number, number>
    ): Promise<Map<number, number>> {
        let digitCounts =
            counts ??
            (await ChartCalculations.getLeadingDigitCounts(column, provider))
                .acknowledged;
        for (let digit of digitCounts.keys()) {
            let count = digitCounts.get(digit);
            digitCounts.set(digit, count / provider.getTotalNumberOfRows());
        }

        return digitCounts;
    }

    public static async getLeadingDigitCounts(
        column: FerretColumn,
        provider: IDataProvider
    ): Promise<LeadDigitCountMetadata> {
        let acknowledged = new Map<number, number>();
        let ignored = new Map<number, number>();

        for (let i = 0; i <= 9; i++) {
            acknowledged.set(i, 0);
            ignored.set(i, 0);
        }

        const ranking = column.findMyRanker();
        const indices = ranking.getOrder();
        for (let i of indices) {
            const dataRow = await provider.getRow(i);
            const dataValue = column.getRaw(dataRow);

            let digit = ChartCalculations.getLeadingDigit(dataValue);
            let relevantMap = column.ignoreInAnalysis(dataRow)
                ? ignored
                : acknowledged;
            let oldVal = relevantMap.get(digit);
            relevantMap.set(digit, oldVal + 1);
        }

        return { acknowledged, ignored };
    }

    public static getLeadingDigitIndex(val: number | string): number | null {
        const validNums = new Set([
            '1',
            '2',
            '3',
            '4',
            '5',
            '6',
            '7',
            '8',
            '9'
        ]);

        let valString: string;
        if (typeof val === 'number') {
            valString = val.toString();
        } else {
            valString = val;
        }

        for (let i = 0; i < valString.length; i++) {
            let char = valString[i];
            if (validNums.has(char)) {
                return i;
            }
        }
        return null;
    }

    public static getLeadingDigit(
        val: number
    ): 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | null {
        let leadingDigitIndex = ChartCalculations.getLeadingDigitIndex(val);
        if (leadingDigitIndex === null) {
            return null;
        }
        let valString = val.toString();
        return +valString[leadingDigitIndex] as
            | 1
            | 2
            | 3
            | 4
            | 5
            | 6
            | 7
            | 8
            | 9;
    }

    public static getLeadingDigitString(
        val: number
    ): '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '' {
        const leadingDigit = ChartCalculations.getLeadingDigit(val);
        if (leadingDigit === null) {
            return '';
        }
        return leadingDigit.toString() as
            | '1'
            | '2'
            | '3'
            | '4'
            | '5'
            | '6'
            | '7'
            | '8'
            | '9';
    }

    public static async GetDuplicateCounts(
        column: FerretColumn,
        provider: IDataProvider
    ): Promise<FreqValsMetadata> {
        const ignoredCountMap = new Map<number, number>();
        const acknowledgedCountMap = new Map<number, number>();

        const ranking = column.findMyRanker();
        const indices = ranking.getOrder();
        for (let i of indices) {
            const dataRow = await provider.getRow(i);
            const val = column.getRaw(dataRow);

            let duplicateCountMap = column.ignoreInAnalysis(dataRow)
                ? ignoredCountMap
                : acknowledgedCountMap;

            let currentCount = 0;
            if (duplicateCountMap.has(val)) {
                currentCount = duplicateCountMap.get(val);
            }
            duplicateCountMap.set(val, currentCount + 1);
        }

        let ignored = Array.from(ignoredCountMap);
        let acknowledged = Array.from(acknowledgedCountMap);

        for (let countList of [ignored, acknowledged]) {
            countList.sort((a: [number, number], b: [number, number]) => {
                if (a[1] > b[1]) return -1;
                else if (a[1] < b[1]) return 1;
                return 0;
            });
        }
        return { ignored, acknowledged };
    }

    public static async GetReplicates(
        column: FerretColumn,
        context: IRenderContext
    ): Promise<[number, number][]> {
        let duplicateCountMap: [number, number][];
        duplicateCountMap = (
            await ChartCalculations.GetDuplicateCounts(column, context.provider)
        ).acknowledged;
        let replicateCountMap: Map<number, number> = new Map<number, number>();
        for (let duplicateCount of duplicateCountMap) {
            if (duplicateCount[1] > 1) {
                if (replicateCountMap.has(duplicateCount[1]))
                    replicateCountMap.set(
                        duplicateCount[1],
                        replicateCountMap.get(duplicateCount[1]) + 1
                    );
                else replicateCountMap.set(duplicateCount[1], 1);
            }
        }

        let replicateCounts = Array.from(replicateCountMap);

        replicateCounts.sort((a: [number, number], b: [number, number]) => {
            if (a[0] > b[0]) {
                return -1;
            } else if (a[0] < b[0]) {
                return 1;
            }
            return 0;
        });

        return replicateCounts;
    }

    public static async GetNGramFrequency(
        column: FerretColumn,
        context: IRenderContext,
        n: number,
        lsd: boolean
    ): Promise<[string, number][]> {
        let nGramFrequencyMap: Map<string, number> = new Map<string, number>();
        const ranking = column.findMyRanker();
        const indices = ranking.getOrder();
        for (let i of indices) {
            const dataRow = await context.provider.getRow(i);
            if (column.ignoreInAnalysis(dataRow)) {
                continue;
            }
            const val = column.getRaw(dataRow);

            let valString = val.toString();
            if (valString.length < n || (lsd && valString.indexOf('.') == -1))
                continue;

            valString = lsd
                ? valString.substr(valString.indexOf('.'))
                : valString;
            for (let i = 0; i < valString.length; i++) {
                let currentCount = 0;
                let nGram = valString.substr(i, n);
                nGram =
                    nGram.indexOf('.') > -1
                        ? valString.substr(i, n + 1)
                        : nGram; // n gram does not count decimal symbol.
                if (
                    (nGram.indexOf('.') > -1 && nGram.length < n + 1) ||
                    (nGram.indexOf('.') == -1 && nGram.length < n)
                )
                    continue;
                if (nGramFrequencyMap.has(nGram))
                    currentCount = nGramFrequencyMap.get(nGram);
                nGramFrequencyMap.set(nGram, currentCount + 1);
                if (valString.charAt(i) == '.') i++;
            }
        }

        let nGramFrequency = Array.from(nGramFrequencyMap);

        nGramFrequency.sort((a: [string, number], b: [string, number]) => {
            if (a[1] > b[1]) {
                return -1;
            } else if (a[1] < b[1]) {
                return 1;
            }
            return 0;
        });

        return nGramFrequency;
    }
}
