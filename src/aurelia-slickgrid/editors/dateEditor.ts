import { inject, Optional } from 'aurelia-framework';
import { I18N } from 'aurelia-i18n';
import { Constants } from './../constants';
import { mapFlatpickrDateFormatWithFieldType, mapMomentDateFormatWithFieldType, setDeepValue, getDescendantProperty } from './../services/utilities';
import {
  Column,
  ColumnEditor,
  Editor,
  EditorArguments,
  EditorValidator,
  EditorValidatorOutput,
  FieldType,
  FlatpickrOption,
  GridOption,
} from './../models/index';
import * as flatpickr from 'flatpickr';
import * as moment from 'moment-mini';
import * as $ from 'jquery';

declare function require(name: string): any;

/*
 * An example of a date picker editor using Flatpickr
 * https://chmln.github.io/flatpickr
 */
@inject(Optional.of(I18N))
export class DateEditor implements Editor {
  private _$inputWithData: any;
  private _$input: any;

  flatInstance: any;
  defaultDate: string;
  originalDate: string;

  /** SlickGrid Grid object */
  grid: any;

  /** Grid options */
  gridOptions: GridOption;

  constructor(private i18n: I18N, private args: EditorArguments) {
    if (!args) {
      throw new Error('[Aurelia-Slickgrid] Something is wrong with this grid, an Editor must always have valid arguments.');
    }
    this.grid = args.grid;
    this.init();
  }

  /** Get Column Definition object */
  get columnDef(): Column | undefined {
    return this.args && this.args.column;
  }

  /** Get Column Editor object */
  get columnEditor(): ColumnEditor {
    return this.columnDef && this.columnDef.internalColumnEditor || {};
  }

  /** Get the Editor DOM Element */
  get editorDomElement(): any {
    return this._$input;
  }

  /** Get Flatpickr options passed to the editor by the user */
  get editorOptions(): any {
    return this.columnEditor.editorOptions || {};
  }

  get hasAutoCommitEdit() {
    return this.grid.getOptions().autoCommitEdit;
  }

  /** Get the Validator function, can be passed in Editor property or Column Definition */
  get validator(): EditorValidator | undefined {
    return (this.columnEditor && this.columnEditor.validator) || (this.columnDef && this.columnDef.validator);
  }

  init(): void {
    if (this.args && this.columnDef) {
      const columnId = this.columnDef && this.columnDef.id;
      const placeholder = this.columnEditor && this.columnEditor.placeholder || '';
      const title = this.columnEditor && this.columnEditor.title || '';
      const gridOptions = this.args.grid.getOptions() as GridOption;
      this.defaultDate = (this.args.item) ? this.args.item[this.columnDef.field] : null;
      const inputFormat = mapFlatpickrDateFormatWithFieldType(this.columnDef.type || FieldType.dateIso);
      const outputFormat = mapFlatpickrDateFormatWithFieldType(this.columnDef.outputType || FieldType.dateUtc);
      let currentLocale = this.i18n && this.i18n.getLocale && this.i18n.getLocale() || 'en';
      if (currentLocale.length > 2) {
        currentLocale = currentLocale.substring(0, 2);
      }

      const pickerOptions: FlatpickrOption = {
        defaultDate: this.defaultDate as string,
        altInput: true,
        altFormat: inputFormat,
        dateFormat: outputFormat,
        closeOnSelect: false,
        locale: (currentLocale !== 'en') ? this.loadFlatpickrLocale(currentLocale) : 'en',
        onChange: (selectedDates: Date[] | Date, dateStr: string, instance: any) => {
          this.save();
        },
      };

      // merge options with optional user's custom options
      const pickerMergedOptions: FlatpickrOption = { ...pickerOptions, ...(this.editorOptions as FlatpickrOption) };
      const inputCssClasses = `.editor-text.editor-${columnId}.flatpickr`;
      if (pickerMergedOptions.altInput) {
        pickerMergedOptions.altInputClass = 'flatpickr-alt-input editor-text';
      }

      this._$input = $(`<input type="text" data-defaultDate="${this.defaultDate}" class="${inputCssClasses.replace(/\./g, ' ')}" placeholder="${placeholder}" title="${title}" />`);
      this._$input.appendTo(this.args.container);
      this.flatInstance = (flatpickr && this._$input[0] && typeof this._$input[0].flatpickr === 'function') ? this._$input[0].flatpickr(pickerMergedOptions) : null;

      // when we're using an alternate input to display data, we'll consider this input as the one to do the focus later on
      // else just use the top one
      this._$inputWithData = (pickerMergedOptions && pickerMergedOptions.altInput) ? $(`${inputCssClasses}.flatpickr-alt-input`) : this._$input;
    }
  }

  destroy() {
    this.hide();
    this._$input.remove();
    if (this._$inputWithData && typeof this._$inputWithData.remove === 'function') {
      this._$inputWithData.remove();
    }
    if (this.flatInstance && typeof this.flatInstance.destroy === 'function') {
      this.flatInstance.destroy();
    }
  }

  focus() {
    if (this._$inputWithData && typeof this._$inputWithData.focus === 'function') {
      this._$inputWithData.focus().select();
    } else if (this._$input && typeof this._$input.focus === 'function') {
      this._$input.focus().select();
    }
  }

  hide() {
    if (this.flatInstance && typeof this.flatInstance.close === 'function') {
      this.flatInstance.close();
    }
  }

  show() {
    if (this.flatInstance && typeof this.flatInstance.open === 'function') {
      this.flatInstance.open();
    }
  }

  getValue(): string {
    return this._$input.val();
  }

  setValue(val: string) {
    this.flatInstance.setDate(val);
  }

  applyValue(item: any, state: any) {
    const fieldName = this.columnDef && this.columnDef.field;
    if (fieldName !== undefined) {
      const outputFormat = mapMomentDateFormatWithFieldType(this.columnDef && this.columnDef.type || FieldType.dateIso);
      const isComplexObject = fieldName.indexOf('.') > 0; // is the field a complex object, "address.streetNumber"

      // validate the value before applying it (if not valid we'll set an empty string)
      const validation = this.validate(state);
      const newValue = (validation && validation.valid) ? moment(state, outputFormat).toDate() : '';

      // set the new value to the item datacontext
      if (isComplexObject) {
        setDeepValue(item, fieldName, newValue);
      } else {
        item[fieldName] = newValue;
      }
    }
  }

  isValueChanged(): boolean {
    const elmValue = this._$input.val();
    const outputFormat = mapMomentDateFormatWithFieldType(this.columnDef && this.columnDef.type || FieldType.dateIso);
    const elmDateStr = elmValue ? moment(elmValue).format(outputFormat) : '';
    const orgDateStr = this.originalDate ? moment(this.originalDate).format(outputFormat) : '';

    return (!(elmDateStr === '' && orgDateStr === '')) && (elmDateStr !== orgDateStr);
  }

  loadValue(item: any) {
    const fieldName = this.columnDef && this.columnDef.field;

    if (fieldName !== undefined) {
      // is the field a complex object, "address.streetNumber"
      const isComplexObject = fieldName.indexOf('.') > 0;

      if (item && this.columnDef && (item.hasOwnProperty(fieldName) || isComplexObject)) {
        const value = (isComplexObject) ? getDescendantProperty(item, fieldName) : item[fieldName];
        this.originalDate = value;
        this.flatInstance.setDate(value);
        this.show();
        this.focus();
      }
    }
  }

  save() {
    // autocommit will not focus the next editor
    const validation = this.validate();
    if (validation && validation.valid && this.isValueChanged()) {
      if (this.hasAutoCommitEdit) {
        this.grid.getEditorLock().commitCurrentEdit();
      } else {
        this.args.commitChanges();
      }
    }
  }

  serializeValue() {
    const domValue: string = this._$input.val();

    if (!domValue) {
      return '';
    }

    const outputFormat = mapMomentDateFormatWithFieldType((this.columnDef && this.columnDef.type) || FieldType.dateIso);
    const value = moment(domValue).format(outputFormat);

    return value;
  }

  validate(inputValue?: any): EditorValidatorOutput {
    const isRequired = this.columnEditor.required;
    const elmValue = (inputValue !== undefined) ? inputValue : this._$input && this._$input.val && this._$input.val();
    const errorMsg = this.columnEditor.errorMessage;

    if (this.validator) {
      return this.validator(elmValue, this.args);
    }

    // by default the editor is almost always valid (except when it's required but not provided)
    if (isRequired && elmValue === '') {
      return {
        valid: false,
        msg: errorMsg || Constants.VALIDATION_REQUIRED_FIELD
      };
    }

    return {
      valid: true,
      msg: null
    };
  }

  //
  // private functions
  // ------------------

  /** Load a different set of locales for Flatpickr to be localized */
  private loadFlatpickrLocale(language: string) {
    let locales = 'en';

    if (language !== 'en') {
      // change locale if needed, Flatpickr reference: https://chmln.github.io/flatpickr/localization/
      const localeDefault: any = require(`flatpickr/dist/l10n/${language}.js`).default;
      locales = (localeDefault && localeDefault[language]) ? localeDefault[language] : 'en';
    }
    return locales;
  }
}
