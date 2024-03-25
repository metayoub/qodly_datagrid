import {
  EComponentKind,
  T4DComponentConfig,
  isDatasourcePayload,
  isAttributePayload,
  getDataTransferSourceID,
} from '@ws-ui/webform-editor';
import {
  isArrayDatasource,
  isEntityDatasource,
  isEntitySelectionDatasource,
  isObjectDatasource,
  isRelatedEntitiesAttribute,
  isRelatedEntityAttribute,
} from '@ws-ui/shared';

import { Settings } from '@ws-ui/webform-editor';
import { MdTableChart } from 'react-icons/md';
import { capitalize, cloneDeep } from 'lodash';
import DataGridSettings, { BasicSettings } from './DataGrid.settings';
import { generate } from 'short-uuid';

export default {
  craft: {
    displayName: 'DataTables',
    kind: EComponentKind.BASIC,
    props: {
      name: '',
      classNames: [],
      events: [],
    },
    related: {
      settings: Settings(DataGridSettings, BasicSettings),
    },
  },
  info: {
    displayName: 'DataTables',
    sanityCheck: {
      keys: [
        { name: 'datasource', require: true, isDatasource: true },
        { name: 'currentElement', require: false, isDatasource: false },
      ],
    },
    exposed: true,
    icon: MdTableChart,
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
        label: 'On MouseEnter',
        value: 'onmouseenter',
      },
      {
        label: 'On MouseLeave',
        value: 'onmouseleave',
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
        label: 'On CellMouseEnter',
        value: 'oncellmouseenter',
      },
    ],
    datasources: {
      set: (nodeId, query, payload) => {
        const new_props = cloneDeep(query.node(nodeId).get().data.props) as IExostiveElementProps;
        payload.forEach((item) => {
          if (isDatasourcePayload(item)) {
            if (isEntitySelectionDatasource(item.source) || isArrayDatasource(item.source)) {
              new_props.datasource = getDataTransferSourceID(item);
            }
            if (isEntityDatasource(item.source) || isObjectDatasource(item.source)) {
              new_props.currentElement = getDataTransferSourceID(item);
            }
          } else if (isAttributePayload(item)) {
            if (isRelatedEntitiesAttribute(item.attribute)) {
              new_props.datasource = getDataTransferSourceID(item);
            } else if (isRelatedEntityAttribute(item.attribute)) {
              new_props.currentElement = getDataTransferSourceID(item);
            } else {
              new_props.columns = [
                ...(new_props.columns || []),
                {
                  title: capitalize(item.attribute.name),
                  source: item.attribute.name,
                  width: 150,
                  sorting: false,
                  id: generate(),
                  ...((['bool', 'blob', 'object'] as catalog.AttributeType[]).includes(
                    item.attribute.type as catalog.AttributeType,
                  )
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
    columns: [],
  },
} as T4DComponentConfig<IDataGridProps>;

export interface IDataGridProps extends webforms.ComponentProps {
  headerHeight: number;
  rowHeight: number;
  columns: IColumn[];
  ref?: any;
}

export interface IColumn {
  title: string;
  source: string;
  sorting: boolean;
  width: number | string;
  initialWidth?: number | string;
  format: string;
  id: string;
  dataType: string;
}
export interface IExostiveElementProps extends webforms.ComponentProps {
  columns: IColumn[];
  text: string;
  variant: string;
}
