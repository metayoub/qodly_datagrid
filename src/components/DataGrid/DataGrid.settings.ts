import { ESetting, TSetting } from '@ws-ui/webform-editor';
import { BASIC_SETTINGS, DEFAULT_SETTINGS, load } from '@ws-ui/webform-editor';
import { validateServerSide } from '@ws-ui/shared';

const commonSettings: TSetting[] = [
  {
    type: ESetting.SELECT,
    label: 'Variant',
    isClearable: false,
    defaultValue: 'pagination',
    options: [
      {
        label: 'Pagination',
        value: 'pagination',
      },
      {
        label: 'Infinite scroll',
        value: 'infinite',
      },
    ],
    key: 'variant',
    isSearchable: false,
  },
  {
    label: 'Columns visibility',
    type: ESetting.CHECKBOX,
    key: 'columnsVisibility',
    defaultValue: false,
  },
  /*{
    label: 'Filter',
    type: ESetting.CHECKBOX,
    key: 'filter',
    defaultValue: true,
  },*/
  {
    label: 'Header height',
    type: ESetting.NUMBER_FIELD,
    defaultValue: 36,
    key: 'headerHeight',
    min: 1,
  },
  {
    label: 'Row height',
    type: ESetting.NUMBER_FIELD,
    defaultValue: 30,
    key: 'rowHeight',
    min: 1,
  },
  {
    label: 'Pagination size',
    type: ESetting.SELECT,
    defaultValue: 10,
    key: 'paginationSize',
    options: [
      { label: '10', value: '10' },
      { label: '25', value: '25' },
      { label: '50', value: '50' },
      { label: '100', value: '100' },
    ],
  },
  { label: 'Display Footer', type: ESetting.CHECKBOX, defaultValue: true, key: 'displayFooter' },
  {
    type: ESetting.DATAGRID,
    key: 'columns',
    label: 'Columns',
    titleProperty: 'title',
    data: [
      {
        label: 'Title',
        defaultValue: '',
        type: ESetting.TEXT_FIELD,
        key: 'title',
      },
      {
        label: 'Source',
        // defaultValue: '',
        type: ESetting.DS_AUTO_SUGGEST,
        key: 'source',
      },
      {
        label: 'Format',
        defaultValue: '',
        type: ESetting.FORMAT_FIELD,
        key: 'format',
        labelClassName: 'mr-4 ml-2 w-16',
        className: 'mb-2',
      },
      {
        label: 'Width',
        type: ESetting.NUMBER_FIELD,
        defaultValue: 150,
        key: 'width',
      },
      {
        label: 'Sorting',
        defaultValue: false,
        type: ESetting.CHECKBOX,
        key: 'sorting',
      },
      {
        label: 'Enable Hiding',
        defaultValue: true,
        type: ESetting.CHECKBOX,
        key: 'hidden',
      },
    ],
  },
];

const dataAccessSettings: TSetting[] = [
  {
    key: 'datasource',
    label: 'DataSource',
    type: ESetting.DS_AUTO_SUGGEST,
  },
  {
    key: 'currentElement',
    label: 'Selected Element',
    type: ESetting.DS_AUTO_SUGGEST,
  },
  {
    key: 'serverSideRef',
    label: 'Server Side',
    type: ESetting.TEXT_FIELD,
    hasError: validateServerSide,
    validateOnEnter: true,
  },
];

const Settings: TSetting[] = [
  {
    key: 'properties',
    label: 'Properties',
    type: ESetting.GROUP,
    components: commonSettings,
  },
  {
    key: 'dataAccess',
    label: 'Data Access',
    type: ESetting.GROUP,
    components: dataAccessSettings,
  },
  ...load(DEFAULT_SETTINGS).filter('dataAccess'),
];

export const BasicSettings: TSetting[] = [
  ...commonSettings,
  ...dataAccessSettings,
  ...load(BASIC_SETTINGS).filter('style.overflow', 'serverSideRef'),
];

export default Settings;
