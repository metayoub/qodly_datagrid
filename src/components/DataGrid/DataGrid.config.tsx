import {
  EComponentKind,
  T4DComponentConfig,
  isDatasourcePayload,
  isAttributePayload,
  getDataTransferSourceID,
  splitDatasourceID,
  Settings,
  T4DComponentDatasourceDeclaration,
} from '@ws-ui/webform-editor';

import { MdGridOn } from 'react-icons/md';
import capitalize from 'lodash/capitalize';
import cloneDeep from 'lodash/cloneDeep';
import findIndex from 'lodash/findIndex';
import DataGridSettings, { BasicSettings } from './DataGrid.settings';
import { generate } from 'short-uuid';

const types: string[] = [
  'bool',
  'word',
  'string',
  'text',
  'uuid',
  'short',
  'long',
  'number',
  'long64',
  'duration',
  'object',
  'date',
  'image',
  'blob',
];

export default {
  craft: {
    displayName: 'DataGrid',
    kind: EComponentKind.BASIC,
    props: {
      iterable: true,
      name: '',
      classNames: [],
      events: [],
    },
    related: {
      settings: Settings(DataGridSettings, BasicSettings),
    },
  },
  info: {
    displayName: 'DataGrid',
    sanityCheck: {
      keys: [
        { name: 'datasource', require: true, isDatasource: true },
        { name: 'currentElement', require: false, isDatasource: false },
        { name: 'state', require: false, isDatasource: false },
      ],
    },
    exposed: true,
    icon: MdGridOn,
    events: [
      {
        label: 'On Select',
        value: 'onselect',
      },
      {
        label: 'On Click',
        value: 'onclick',
      },
      {
        label: 'On SaveState',
        value: 'onsavestate',
      },
      {
        label: 'On DoubleClick',
        value: 'ondblclick',
      },

      {
        label: 'On HeaderClick',
        value: 'onheaderclick',
      },
      {
        label: 'On HeaderDoubleClick',
        value: 'onheaderdblclick',
      },

      {
        label: 'On CellClick',
        value: 'oncellclick',
      },
      {
        label: 'On CellDoubleClick',
        value: 'oncelldblclick',
      },
      {
        label: 'On KeyDown',
        value: 'onkeydown',
      },
      {
        label: 'On KeyUp',
        value: 'onkeyup',
      },
      {
        label: 'On MouseEnter',
        value: 'onmouseenter',
      },
      {
        label: 'On MouseLeave',
        value: 'onmouseleave',
      },
      {
        label: 'On CellMouseEnter',
        value: 'oncellmouseenter',
      },
    ],
    datasources: {
      declarations: (props) => {
        const { columns, currentElement = '', datasource = '' } = props;
        const declarations: T4DComponentDatasourceDeclaration[] = [
          { path: datasource, iterable: true },
        ];
        if (currentElement) {
          declarations.push({ path: currentElement });
        }
        if (columns) {
          const { id: ds, namespace } = splitDatasourceID(datasource?.trim()) || {};
          const { id: currentDs, namespace: currentDsNamespace } =
            splitDatasourceID(currentElement) || {};

          if (!ds && !currentDs) {
            return;
          }

          columns.forEach((col) => {
            if (currentDs && currentDsNamespace === namespace) {
              const colSrcID = `${currentDs}.${col.source.trim()}`;
              declarations.push({
                path: namespace ? `${namespace}:${colSrcID}` : colSrcID,
              });
            }
            const colSrcID = `${ds}.[].${col.source.trim()}`;
            const iterable = ds.startsWith('$');
            declarations.push({
              path: namespace ? `${namespace}:${colSrcID}` : colSrcID,
              iterable,
            });
          });
        }
        return declarations;
      },

      set: (nodeId, query, payload) => {
        const new_props = cloneDeep(query.node(nodeId).get().data.props) as IExostiveElementProps;
        payload.forEach((item) => {
          if (isDatasourcePayload(item)) {
            if (
              item.source.type === 'entitysel' ||
              (item.source.type === 'scalar' && item.source.dataType === 'array')
            ) {
              new_props.datasource = getDataTransferSourceID(item);
            }
            if (
              item.source.type === 'entity' ||
              (item.source.type === 'scalar' && item.source.dataType === 'object')
            ) {
              new_props.currentElement = getDataTransferSourceID(item);
            }
          } else if (isAttributePayload(item)) {
            if (
              item.attribute.kind === 'relatedEntities' ||
              item.attribute.type?.includes('Selection') ||
              item.attribute.behavior === 'relatedEntities'
            ) {
              new_props.datasource = getDataTransferSourceID(item);
            } else if (
              item.attribute.kind === 'relatedEntity' ||
              item.attribute.behavior === 'relatedEntity' ||
              !types.includes(item.attribute.type)
            ) {
              new_props.currentElement = getDataTransferSourceID(item);
            } else {
              if (findIndex(new_props.columns, { source: item.attribute.name }) === -1)
                new_props.columns = [
                  ...(new_props.columns || []),
                  {
                    title: capitalize(item.attribute.name),
                    source: item.attribute.name,
                    width: 150,
                    sorting: false,
                    hidden: true,
                    sizing: true,
                    id: generate(),
                    ...(item.attribute.type === 'image'
                      ? {
                          dataType: item.attribute.type,
                        }
                      : item.attribute.type === 'bool'
                        ? {
                            dataType: item.attribute.type,
                            format: 'boolean',
                          }
                        : ['blob', 'object'].includes(item.attribute.type)
                          ? {}
                          : {
                              format: '',
                              dataType: item.attribute.type,
                            }),
                  } as any,
                ];
            }
          }
        });
        return {
          [nodeId]: new_props,
        };
      },
    },
  },
  defaultProps: {
    headerHeight: 36,
    rowHeight: 30,
    displayFooter: true,
    saveState: true,
    columnsVisibility: false,
    filter: true,
    columns: [],
    state: '',
    variant: 'infinite',
    style: {
      overflowX: 'auto',
      overflowY: 'auto',
      height: '600px',
      width: 'fit-content',
    },
  },
} as T4DComponentConfig<IDataGridProps>;

export interface IDataGridProps extends webforms.ComponentProps {
  state?: string;
  variant?: string;
  headerHeight: number;
  rowHeight: number;
  displayFooter: boolean;
  saveState: boolean;
  columnsVisibility: boolean;
  filter: boolean;
  columns: IColumn[];
  ref?: any;
}

export interface IColumn {
  title: string;
  source: string;
  sorting: boolean;
  hidden: boolean;
  sizing: boolean;
  width: number;
  initialWidth?: number | string;
  format: string;
  id: string;
  dataType: string;
}
export interface IExostiveElementProps extends webforms.ComponentProps {
  columns: IColumn[];
  text: string;
  variant: 'pagination' | 'infinite';
}
