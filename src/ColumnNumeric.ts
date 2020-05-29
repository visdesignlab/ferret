import { Column, ColumnTypes } from "./Column";

export class ColumnNumeric extends Column<number>
{

    public constructor(valList: number[])
    {
        super();
        this._values = valList;
        this._type = ColumnTypes.numeric;
        // console.log(this.GetLeadingDigitFreqs());
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

        for (let i = 1; i <= 9; i++)
        {
            digitCounts.set(i, 0);
        }

        for (let val of this.values)
        {
            let digit = ColumnNumeric.getLeadingDigit(val);
            let oldVal = digitCounts.get(digit);
            digitCounts.set(digit, oldVal + 1);
        }

        return digitCounts;
    }

    private static getLeadingDigit(val: number): 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
    {
        const validNums = new Set([1,2,3,4,5,6,7,8,9])
        let valString = val.toString();
        for (let char of valString)
        {
            let num = +char;
            if (validNums.has(num))
            {
                return num as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
            }
        }
    }

}