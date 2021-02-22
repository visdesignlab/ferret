import { vals } from "vega-lite";
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

    public static getLeadingDigit(val: number, nums: Set<Number | string> | null): 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 
    {

        val = (val < 0) ? val*-1 : val;
    
        const validNums = new Set([1,2,3,4,5,6,7,8,9]);
        
        let valString = val.toString();

        for (let char of valString)
        { 
            /* 
            * assigning it to zero since we don't count zero as leading digit.
            * should we decide to count it, we should change this code.
            */
           
            let num = (char >= '1' && char <= '9') ? +char : 0; 
            if (validNums.has(num))
            {
                if(nums == null)
                    return num as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 ;
              
                else if(nums != null) {
                    if (nums.has(num)) {
                        return num as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
                    }  
                    else 
                        return null;
                }
            }
        } 
    }

    public static isSelectedValue(val: number, nums: Set<Number | string> | null) : Boolean {

        if(nums == null) return false;
        return nums.has(val);

    }

    public GetReplicates(): [number, number][]
    {
        let duplicateCountMap: [number, number][];
        duplicateCountMap = this.GetDuplicateCounts();
        let replicateCountMap: Map<number, number> = new Map<number, number>();
        for(let duplicateCount of duplicateCountMap) {
            if(duplicateCount[1] > 1) {
                if(replicateCountMap.has(duplicateCount[1]))
                    replicateCountMap.set(duplicateCount[1], replicateCountMap.get(duplicateCount[1])+1);
                else
                    replicateCountMap.set(duplicateCount[1], 1);
            }
        }

        let replicateCounts = Array.from(replicateCountMap);
        
        replicateCounts.sort((a: [number, number], b: [number, number]) =>
        {
            if (a[0] > b[0])
            {
                return -1;
            }
            else if (a[0] < b[0])
            {
                return 1;
            }
            return 0;
        });

        return replicateCounts;
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

    public static containsNGram(val: number, nums: Set<Number | string> | null): boolean {
        for(let num of nums) 
            return (val.toString().indexOf(num.toString()) > -1);
    }

}