import { Column, ColumnTypes } from "./Column";

export class ColumnNumeric extends Column<number>
{

    public constructor(valList: number[])
    {
        super();
        this._values = valList;
        this._type = 'Number';
    }

    public GetDuplicateCounts(): [number, number][]
    {
        let duplicateCountMap: Map<number, number> = new Map<number, number>();
        for (let val of this.values)
        {
            let currentCount = 0;
            if (duplicateCountMap.has(val))
            {
                currentCount = duplicateCountMap.get(val);
            }
            duplicateCountMap.set(val, currentCount + 1);
        }

        let duplicateCounts = Array.from(duplicateCountMap);
        
        duplicateCounts.sort((a: [number, number], b: [number, number]) =>
        {
            if (a[1] > b[1])
            {
                return -1;
            }
            else if (a[1] < b[1])
            {
                return 1;
            }
            return 0;
        })
        return duplicateCounts;
    }

    public GetLeadingDigitFreqs(): Map<number, number>
    {
        let digitCounts = this.getLeadingDigitCounts();
        for (let digit of digitCounts.keys())
        {
            let count = digitCounts.get(digit);
            digitCounts.set(digit, count / this.length);
        }

        return digitCounts;
    }

    private getLeadingDigitCounts(): Map<number, number>
    {
        let digitCounts = new Map<number, number>();

        for (let i = 0; i <= 9; i++)
        {
            digitCounts.set(i, 0);
        }

        for (let val of this.values)
        {
            let digit = ColumnNumeric.getLeadingDigit(val, null);
            let oldVal = digitCounts.get(digit);
            digitCounts.set(digit, oldVal + 1);
        }

        return digitCounts;
    }

    public static getLeadingDigit(val: number, nums: Set<Number | string> | null): 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 0
    {
        if (val === 0)
        {
            return 0;
        }

        const validNums = (nums == null) ? new Set([1,2,3,4,5,6,7,8,9]) : nums;
        let valString = val.toString();
        for (let char of valString)
        { 
            let char = valString.charAt(0);
            let num = +char;
            if (validNums.has(num))
            {
                return num as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
            }
        } 
    }

    public static isSelectedValue(val: number, nums: Set<Number | string> | null) : Boolean {

        if(nums == null) return false;
        return nums.has(val);

    }

    public GetNGramFrequency(n: number, lsd: boolean): [string, number][]
    {
        let nGramFrequencyMap: Map<string, number> = new Map<string, number>();
        for (let val of this.values)
        {
            let valString = val.toString();
            if(valString.length < n || (lsd && valString.indexOf('.') == -1)) continue;

            for(let i = 0; i < valString.length; i++) {
                let currentCount = 0;
                valString = (lsd) ? valString.substr(valString.indexOf('.')) : valString;
                let nGram = valString.substr(i, n);
                nGram = nGram.indexOf('.') > -1 ? valString.substr(i, n+1) : nGram;  // n gram does not count decimal symbol.
                if((nGram.indexOf('.') > -1 && nGram.length < n+1) || (nGram.indexOf('.') == -1 && nGram.length < n)) continue;
                if (nGramFrequencyMap.has(nGram))
                        currentCount = nGramFrequencyMap.get(nGram);
                nGramFrequencyMap.set(nGram, currentCount + 1);
                if(valString.charAt(i) == '.') i++;
            }

        }

        let nGramFrequency = Array.from(nGramFrequencyMap);
        
        nGramFrequency.sort((a: [string, number], b: [string, number]) =>
        {
            if (a[1] > b[1])
            {
                return -1;
            }
            else if (a[1] < b[1])
            {
                return 1;
            }
            return 0;
        })
        return nGramFrequency;
    }

}