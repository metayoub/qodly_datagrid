import { useRenderer, useSources, useEnhancedNode } from '@ws-ui/webform-editor';
import cn from 'classnames';
import { FC } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import { IColumn, IDataGridProps } from './DataGrid.config';
import './DataGrid.css';
import { useDoubleClick } from './hooks/useDoubleClick';
import { CustomCell } from './parts';
import Pagination from './mode/pagination';
import InfiniteScroll from './mode/infiniteScroll';

declare global {
  interface Window {
    DataSource: {
      getSource: (state: string, path: string) => any;
    };
  }
}
const DataGrid: FC<IDataGridProps> = ({
  columns = [],
  datasource,
  displayFooter = true,
  rowHeight,
  headerHeight,
  columnsVisibility,
  filter,
  variant = 'pagination',
  saveState,
  state,
  style,
  className,
  classNames = [],
}) => {
  const { connect, emit } = useRenderer({
    omittedEvents: [
      'onmouseover',
      'onselect',
      'onclick',
      'ondblclick',
      'onheaderclick',
      'onheaderdblclick',
      'oncellclick',
      'oncelldblclick',
      'oncellmouseenter',
      'oncellmouseleave',
      'onsavestate',
    ],
  });

  const {
    sources: { datasource: ds, currentElement },
  } = useSources({ acceptIteratorSel: true });

  const { id } = useEnhancedNode();
  const columnHelper = createColumnHelper<any>();
  const ColumnsAux = columns
    .filter((column) => column.source !== '')
    .map((column: IColumn) =>
      columnHelper.accessor(column.source as string, {
        id: column.source,
        header: () => column.title,
        footer: () => column.title,
        enableSorting: column.sorting,
        enableResizing: column.sizing,
        enableHiding: column.hidden,
        cell: (props) => {
          if (column.source.includes('.')) {
            const nestedProperties = column.source.split('.');
            let value = props.row.original;
            nestedProperties.forEach((property) => {
              value = props.row.original[column.source] || value[property];
            });
            return (
              <CustomCell
                value={value}
                format={column.format}
                dataType={column.dataType}
                rowHeight={rowHeight}
              />
            );
          }
          return (
            <CustomCell
              value={props.getValue()}
              format={column.format}
              dataType={column.dataType}
              rowHeight={rowHeight}
            />
          );
        },
        size: column.width,
      }),
    );

  const handleClick = useDoubleClick(
    () => {
      emit('ondblclick');
    },
    () => {
      emit('onclick');
    },
  );

  return (
    <div
      ref={connect}
      onClick={handleClick}
      style={{
        ...style,
        height: variant === 'pagination' ? 'fit-content' : style?.height,
        minWidth: '225px',
        maxWidth: '100%',
      }}
      className={cn(className, classNames)}
    >
      {datasource ? (
        <>
          {variant === 'pagination' ? (
            <Pagination
              displayFooter={displayFooter}
              rowHeight={rowHeight}
              headerHeight={headerHeight}
              columnsVisibility={columnsVisibility}
              filter={filter}
              saveState={saveState}
              state={state}
              datasource={ds}
              columns={ColumnsAux}
              currentElement={currentElement}
              emit={emit}
              id={id}
            />
          ) : (
            <InfiniteScroll
              height={style?.height}
              datasource={ds}
              displayFooter={displayFooter}
              columns={ColumnsAux}
              columnsVisibility={columnsVisibility}
              rowHeight={rowHeight}
              headerHeight={headerHeight}
              filter={filter}
              saveState={saveState}
              state={state}
              currentElement={currentElement}
              emit={emit}
              id={id}
            />
          )}
        </>
      ) : (
        <div className="flex h-full flex-col items-center justify-center rounded-lg border bg-purple-400 py-4 text-white">
          <p>Error</p>
        </div>
      )}
    </div>
  );
};

export default DataGrid;
