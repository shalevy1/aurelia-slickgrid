import { autoinject } from 'aurelia-framework';
import { I18N } from 'aurelia-i18n';
import { CustomInputFilter } from './custom-inputFilter';
import {
  AureliaGridInstance,
  Column,
  FieldType,
  Filters,
  Formatter,
  Formatters,
  GridOption,
  JQueryUiSliderOption,
  MultipleSelectOption,
  OperatorType,
  Metrics,
} from '../../aurelia-slickgrid';
import * as moment from 'moment-mini';

const NB_ITEMS = 1500;

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

// create a custom translate Formatter (typically you would move that a separate file, for separation of concerns)
const taskTranslateFormatter: Formatter = (row: number, cell: number, value: any, columnDef: any, dataContext: any, grid: any) => {
  const gridOptions = (grid && typeof grid.getOptions === 'function') ? grid.getOptions() : {};
  const i18n = gridOptions.i18n;

  return i18n && i18n.tr && i18n.tr('TASK_X', { x: value });
};

@autoinject()
export class Example23 {
  title = 'Example 23: Filtering from Range of Search Values';
  subTitle = `
    This demo shows how to use Filters with Range of Search Values
    <br/>
    <ul class="small">
      <li>All input filters support the following operators: (>, >=, <, <=, <>, !=, =, ==, *) and now also the (..) for an input range
      <li>All filters (which support ranges) can be defined via the 2 dots (..) which represents a range, this also works for dates and slider in the "presets"</li>
      <ul>
        <li>For a numeric range defined in an input filter (must be of type text), you can use 2 dots (..) to represent a range</li>
        <li>example: typing "10..90" will filter values between 10 and 90 (but excluding the number 10 and 90)</li>
      </ul>
      <ul>
        <li>note that the examples shown below for the operator, are case sensitive</li>
        <li>by default the range are not inclusive which would be the same as defining the filter options to "operator: 'RangeExclusive'" or "operator: OperatoryType.rangeExclusive"</li>
        <li>you can also set the inverse (inclusive) by defining the filter options to "operator: 'RangeInclusive'" or "operator: OperatoryType.rangeIncluside"</li>
      </ul>
      <li>Date Range with Flatpickr Date Picker, they will also use the locale, choose a start date then drag or click on the end date</li>
    </ul>
  `;

  aureliaGrid: AureliaGridInstance;
  columnDefinitions: Column[];
  gridOptions: GridOption;
  dataset: any[];
  selectedLanguage: string;
  metrics: Metrics;

  constructor(private i18n: I18N) {
    // define the grid options & columns and then create the grid itself
    this.defineGrid();

    // always start with English for Cypress E2E tests to be consistent
    const defaultLang = 'en';
    this.i18n.setLocale(defaultLang);
    this.selectedLanguage = defaultLang;
  }

  attached() {
    // populate the dataset once the grid is ready
    this.dataset = this.mockData(NB_ITEMS);
  }

  detached() {
    this.saveCurrentGridState();
  }

  aureliaGridReady(aureliaGrid: AureliaGridInstance) {
    this.aureliaGrid = aureliaGrid;
  }

  /* Define grid Options and Columns */
  defineGrid() {
    this.columnDefinitions = [
      {
        id: 'title', name: 'Title', field: 'id', headerKey: 'TITLE', minWidth: 100,
        formatter: taskTranslateFormatter,
        sortable: true,
        filterable: true,
        params: { useFormatterOuputToFilter: true }
      },
      {
        id: 'description', name: 'Description', field: 'description', filterable: true, sortable: true, minWidth: 80,
        type: FieldType.string,
        filter: {
          model: new CustomInputFilter(), // create a new instance to make each Filter independent from each other
          enableTrimWhiteSpace: true // or use global "enableFilterTrimWhiteSpace" to trim on all Filters
        }
      },
      {
        id: 'complete', name: '% Complete', field: 'percentComplete', headerKey: 'PERCENT_COMPLETE', minWidth: 120,
        sortable: true,
        formatter: Formatters.progressBar,
        type: FieldType.number,
        filterable: true,
        filter: {
          model: Filters.sliderRange,
          maxValue: 100, // or you can use the filterOptions as well
          operator: OperatorType.rangeInclusive, // defaults to exclusive
          params: { hideSliderNumbers: false }, // you can hide/show the slider numbers on both side
          filterOptions: { min: 0, step: 5 } as JQueryUiSliderOption // you can also optionally pass any option of the jQuery UI Slider
        }
      },
      {
        id: 'start', name: 'Start', field: 'start', headerKey: 'START', formatter: Formatters.dateIso, sortable: true, minWidth: 75, width: 100, exportWithFormatter: true,
        type: FieldType.date, filterable: true, filter: { model: Filters.compoundDate }
      },
      {
        id: 'finish', name: 'Finish', field: 'finish', headerKey: 'FINISH', formatter: Formatters.dateIso, sortable: true, minWidth: 75, width: 120, exportWithFormatter: true,
        type: FieldType.date,
        filterable: true,
        filter: {
          model: Filters.dateRange,
        }
      },
      {
        id: 'duration', field: 'duration', headerKey: 'DURATION', maxWidth: 90,
        type: FieldType.number,
        sortable: true,
        filterable: true, filter: {
          model: Filters.input,
          operator: OperatorType.rangeExclusive // defaults to exclusive
        }
      },
      {
        id: 'completed', name: 'Completed', field: 'completed', headerKey: 'COMPLETED', minWidth: 85, maxWidth: 90,
        formatter: Formatters.checkmark,
        exportWithFormatter: true, // you can set this property in the column definition OR in the grid options, column def has priority over grid options
        filterable: true,
        filter: {
          collection: [{ value: '', label: '' }, { value: true, label: 'True' }, { value: false, label: 'False' }],
          model: Filters.singleSelect,
          filterOptions: { autoDropWidth: true } as MultipleSelectOption
        }
      }
    ];

    const presetLowestDay = moment().add(-2, 'days').format('YYYY-MM-DD');
    const presetHighestDay = moment().add(20, 'days').format('YYYY-MM-DD');

    this.gridOptions = {
      autoResize: {
        containerId: 'demo-container',
        sidePadding: 15
      },
      enableExcelCopyBuffer: true,
      enableFiltering: true,
      // enableFilterTrimWhiteSpace: true,
      enableTranslate: true,
      i18n: this.i18n,

      // use columnDef searchTerms OR use presets as shown below
      presets: {
        filters: [
          //  you can use the 2 dots separator on all Filters which support ranges
          { columnId: 'duration', searchTerms: ['4..88'] },
          // { columnId: 'complete', searchTerms: ['5..80'] }, // without operator will default to 'RangeExclusive'
          // { columnId: 'finish', operator: 'RangeInclusive', searchTerms: [`${presetLowestDay}..${presetHighestDay}`] },

          // or you could also use 2 searchTerms values, instead of using the 2 dots (only works with SliderRange & DateRange Filters)
          // BUT make sure to provide the operator, else the filter service won't know that this is really a range
          { columnId: 'complete', operator: 'RangeInclusive', searchTerms: [5, 80] }, // same result with searchTerms: ['5..80']
          { columnId: 'finish', operator: 'RangeInclusive', searchTerms: [presetLowestDay, presetHighestDay] },
        ],
        sorters: [
          { columnId: 'complete', direction: 'DESC' },
          { columnId: 'duration', direction: 'ASC' },
        ],
      }
    };
  }

  mockData(itemCount, startingIndex = 0): any[] {
    // mock a dataset
    const tempDataset = [];
    for (let i = startingIndex; i < (startingIndex + itemCount); i++) {
      const randomDuration = randomBetween(0, 365);
      const randomYear = randomBetween(moment().year(), moment().year() + 1);
      const randomMonth = randomBetween(1, 12);
      const randomDay = randomBetween(10, 28);
      const randomPercent = randomBetween(0, 100);

      tempDataset.push({
        id: i,
        title: 'Task ' + i,
        description: (i % 5) ? 'desc ' + i : null, // also add some random to test NULL field
        duration: randomDuration,
        percentComplete: randomPercent,
        percentCompleteNumber: randomPercent,
        start: (i % 4) ? null : new Date(randomYear, randomMonth, randomDay),          // provide a Date format
        finish: new Date(randomYear, (randomMonth + 1), randomDay),
        completed: (randomPercent === 100) ? true : false,
      });
    }

    return tempDataset;
  }

  /** Dispatched event of a Grid State Changed event */
  gridStateChanged(gridState) {
    console.log('Client sample, Grid State changed:: ', gridState);
  }

  /** Save current Filters, Sorters in LocaleStorage or DB */
  saveCurrentGridState() {
    console.log('Client sample, current Grid State:: ', this.aureliaGrid.gridStateService.getCurrentGridState());
  }

  refreshMetrics(e, args) {
    if (args && args.current > 0) {
      setTimeout(() => {
        this.metrics = {
          startTime: new Date(),
          itemCount: args && args.current,
          totalItemCount: this.dataset.length
        };
      });
    }
  }

  switchLanguage() {
    const nextLocale = (this.selectedLanguage === 'en') ? 'fr' : 'en';
    this.i18n.setLocale(nextLocale).then(() => this.selectedLanguage = nextLocale);
  }
}
