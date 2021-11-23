import * as d3 from 'd3';
import { Column, IDataRow, IColumnDesc, ILinkColumnDesc, IValueColumnDesc, INumberColumnDesc, ValueColumn, INumberColumn, EAdvancedSortMethod, ECompareValueType, IGroup } from 'lineupjs';
import { IAdvancedBoxPlotData, IEventListener, ISequence } from 'lineupjs/build/src/internal';

interface FerretFilter {
  ignoreValues: Set<number>
}

export interface CombinedFilter {
  local: FerretFilter,
  global: FerretFilter
}

export default class FerretColumn extends ValueColumn<number> {
  static readonly EVENT_FILTER_CHANGED = 'filterChanged';

  private _defaultDecimalPlaces: number = 6;

  private static _globalFilter: FerretFilter = {
    ignoreValues: new Set<number>()
  }

  public static get globalFilter(): FerretFilter {
    return FerretColumn._globalFilter;
  }


  private _localFilter : FerretFilter = {
    ignoreValues: new Set<number>()
  }
  public get localFilter() : FerretFilter {
    return this._localFilter;
  }

  protected createEventList() {
    return super
      .createEventList()
      .concat([
        FerretColumn.EVENT_FILTER_CHANGED
      ]);
  }

  // on(type: typeof FerretColumn.EVENT_FILTER_CHANGED, listener: typeof filterChanged_NC | null): this;
  on(type: string | string[], listener: IEventListener | null): this {
    return super.on(type as any, listener);
  }

  public getValue(row: IDataRow): number {
    return this.getRaw(row);
  }

  public getRaw(row: IDataRow): number {
    return row.v[(this.desc as any).column];
  }

  public getNumber(row: IDataRow): number {
    return this.getRaw(row);
  }

  public getRightPaddingString(row: IDataRow): string
  {
    const label: string = this.getLabel(row);
    const numberParts = label.split('.');
    
    let decimalPlaces;
    if (typeof (this.desc as any).decimalPlaces !== 'undefined')
    {
      decimalPlaces = (this.desc as any).decimalPlaces;
    }
    else
    {
      decimalPlaces = this._defaultDecimalPlaces;
    }
    let paddingString = '';
    let numZeros: number;
    if (numberParts.length == 1)
    {
      paddingString += '.';
      numZeros = decimalPlaces;
    }
    else
    {
      numZeros = decimalPlaces - numberParts[1].length;
    }
    if (numZeros <=0)
    {
      return ''
    }
    
    paddingString += '0'.repeat(numZeros);

    return paddingString
  }

  public isFiltered(): boolean {
    return this.localFilter.ignoreValues.size > 0 || FerretColumn.globalFilter.ignoreValues.size > 0;
  }

  public getFilter(): CombinedFilter {
    // let local: FerretFilter =  {ignoreValues: new Set([...this.localFilter.ignoreValues])};
    // let global: FerretFilter =  {ignoreValues: new Set([...FerretColumn.globalFilter.ignoreValues])};
    return {local: this.localFilter, global: FerretColumn.globalFilter};
  }


  public addValueToIgnore(value: number, type: 'local' | 'global')
  {
    const lastFilter = this.getFilter();
    switch (type)
    {
      case 'local':
        this.localFilter.ignoreValues.add(value);
        break;
      case 'global':
        FerretColumn.globalFilter.ignoreValues.add(value);
        break;
    }

    this.triggerEvent(lastFilter);
  }

  public removeValueToIgnore(value: number, type: 'local' | 'global')
  {
    const lastFilter = this.getFilter();
    switch (type)
    {
      case 'local':
        this.localFilter.ignoreValues.delete(value);
        break;
      case 'global':
        FerretColumn.globalFilter.ignoreValues.delete(value);
        break;
    }

    this.triggerEvent(lastFilter);
  }

  public triggerEvent(oldFilter: CombinedFilter): void
  {
    this.fire(
      [FerretColumn.EVENT_FILTER_CHANGED, Column.EVENT_DIRTY_VALUES, Column.EVENT_DIRTY],
      // oldFilter,
      this.getFilter(),
      this
    );
  }

  // setFilter(index: number | null) {
  //   console.log('inside setFilter')
  //   if (index === null)
  //   {
  //     return;
  //   }

  //   const lastFilter = this.getFilter();
  //   this.currentFilter = !this.currentFilter;
  //   this.fire(
  //     [FerretColumn.EVENT_FILTER_CHANGED, Column.EVENT_DIRTY_VALUES, Column.EVENT_DIRTY],
  //     lastFilter,
  //     this.getFilter()
  //   );
  // }

  /**
   * filter the current row if any filter is set
   * @param row
   * @returns {boolean}
   */
  filter(row: IDataRow) {
    return true;
  }

  /**
   * ignore the current value in analysis, also strike through it in the table.
   * @param row
   * @returns {boolean}
   */
  public ignoreInAnalysis(row: IDataRow): boolean {
      const thisValue = this.getValue(row);
      if (this.localFilter.ignoreValues.has(thisValue) || FerretColumn.globalFilter.ignoreValues.has(thisValue))
      {
        return true;
      }
      return false;
    }

  clearFilter() {
    const was = this.isFiltered();

    const lastFilter = this.getFilter();
    this.localFilter.ignoreValues.clear();
    FerretColumn.globalFilter.ignoreValues.clear();
    this.triggerEvent(lastFilter);

    return was;
  }


  toCompareValue(row: IDataRow, valueCache?: any) {
    return valueCache != null ? valueCache : this.getNumber(row);
  }

  toCompareValueType() {
    return ECompareValueType.FLOAT;
  }

}