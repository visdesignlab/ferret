import { IRenderContext, ValueColumn } from "lineupjs";

export class ChartCalculations
{

    public static async GetLeadingDigitFreqs(column: ValueColumn<number>, context: IRenderContext): Promise<Map<number, number>>
    {
        let digitCounts = await ChartCalculations.getLeadingDigitCounts(column, context);
        for (let digit of digitCounts.keys())
        {
            let count = digitCounts.get(digit);
            digitCounts.set(digit, count / context.provider.getTotalNumberOfRows());
        }

        return digitCounts;
    }
    
    private static async getLeadingDigitCounts(column: ValueColumn<number>, context: IRenderContext): Promise<Map<number, number>>
    {
        let digitCounts = new Map<number, number>();

        for (let i = 0; i <= 9; i++)
        {
            digitCounts.set(i, 0);
        }

        const N = context.provider.getTotalNumberOfRows();
        for (let i = 0; i < N; i++)
        {
            const dataRow = await context.provider.getRow(i);
            if (column.filter(dataRow))
            {
                // todo - this filter function is column-wise, not global
                const dataValue = column.getRaw(dataRow);

                let digit = ChartCalculations.getLeadingDigit(dataValue, null);
                let oldVal = digitCounts.get(digit);
                digitCounts.set(digit, oldVal + 1);
            }
        }

        return digitCounts;
    }

    private static getLeadingDigit(val: number, nums: Set<Number | string> | null): 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 
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

}