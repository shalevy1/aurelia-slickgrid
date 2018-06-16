import { Column, Formatter } from './../models/index';

/**
 * Takes a value display it according to a mask provided
 * e.: 1234567890 with mask "(000) 000-0000" will display "(123) 456-7890"
 */
export const maskFormatter: Formatter = (row: number, cell: number, value: any, columnDef: Column, dataContext: any) => {
  const params = columnDef.params || {};
  const mask = params.mask;

  if (value && mask) {
    let i = 0;
    const v = value.toString();
    return mask.replace(/[09A]/g, _ => v[i++] || '');
  }
  return '';
};
