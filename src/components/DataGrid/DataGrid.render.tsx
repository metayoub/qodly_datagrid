import { useRenderer, useSources } from '@ws-ui/webform-editor';
import cn from 'classnames';
import { FC, useMemo } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import { IColumn, IDataGridProps } from './DataGrid.config';
import './DataGrid.css';
import { DataLoader } from '@ws-ui/webform-editor';
import { CustomCell } from './parts';
import Pagination from './mode/pagination';
import InfiniteScroll from './mode/infiniteScroll';

const DataGrid: FC<IDataGridProps> = ({
  columns = [],
  paginationSize = 10,
  displayFooter = true,
  rowHeight,
  headerHeight,
  columnsVisibility,
  filter,
  variant = 'pagination',
  style,
  className,
  classNames = [],
}) => {
  const { connect, emit } = useRenderer();
  const {
    sources: { datasource: ds, currentElement },
  } = useSources({ acceptIteratorSel: true });

  const columnHelper = createColumnHelper<any>();
  const ColumnsAux = columns
    .filter((column) => column.source !== '')
    .map((column: IColumn) =>
      columnHelper.accessor(column.source as string, {
        id: column.source,
        header: () => column.title,
        footer: () => column.title,
        enableSorting: column.sorting,
        enableHiding: column.hidden ? true : false, // TODO
        cell: (props) => {
          if (column.source.includes('.')) {
            const nestedProperties = column.source.split('.');
            let value = props.row.original;
            nestedProperties.forEach((property) => {
              value = props.row.original[column.source] || value[property];
            });
            return <CustomCell value={value} format={column.format} dataType={column.dataType} />;
          }
          return (
            <CustomCell
              value={props.getValue()}
              format={column.format}
              dataType={column.dataType}
            />
          );
        },
        size: column.width,
      }),
    );

  const loader = useMemo<DataLoader | null>(() => {
    if (!ds) {
      return null;
    }
    return DataLoader.create(
      ds,
      columns.map(({ source }) => source.trim()),
    );
  }, [columns, ds]);

  /*useEffect(() => {
    if (!ds) {
      return;
    }
    const loader = DataLoader.create(
      ds,
      columns.map(({ source }) => source.trim()),
    );
    setLoader(loader);
  }, [ds, columns]);*/

  return (
    <div
      ref={connect}
      style={{
        ...style,
        height: variant === 'pagination' ? 'fit-content' : style?.height,
      }}
      className={cn(className, classNames)}
    >
      {loader ? (
        <>
          {variant === 'pagination' ? (
            <Pagination
              loader={loader}
              paginationSize={paginationSize}
              displayFooter={displayFooter}
              rowHeight={rowHeight}
              headerHeight={headerHeight}
              columnsVisibility={columnsVisibility}
              filter={filter}
              datasource={ds}
              columns={ColumnsAux}
              currentElement={currentElement}
              emit={emit}
            />
          ) : (
            <InfiniteScroll
              height={style?.height}
              datasource={ds}
              columns={ColumnsAux}
              columnsVisibility={columnsVisibility}
              rowHeight={rowHeight}
              headerHeight={headerHeight}
              filter={filter}
              loader={loader}
              currentElement={currentElement}
              emit={emit}
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
