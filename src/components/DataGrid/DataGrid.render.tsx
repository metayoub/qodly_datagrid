import { useRenderer, useSources } from '@ws-ui/webform-editor';
import cn from 'classnames';
import { FC, useEffect, useMemo, useCallback, useState } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { IColumn, IDataGridProps } from './DataGrid.config';
import './DataGrid.css';
import { DataLoader } from '@ws-ui/webform-editor';

const DataGrid: FC<IDataGridProps> = ({ columns = [], style, className, classNames = [] }) => {
  const { connect } = useRenderer();
  const [data, setData] = useState<datasources.IEntity[]>(() => []);
  const [length, setLength] = useState(() => 0);
  const {
    sources: { datasource: ds },
  } = useSources();

  const columnHelper = createColumnHelper<any>();
  const ColumnsAux = columns
    .filter((column) => column.source !== '')
    .map((column: IColumn) =>
      columnHelper.accessor(column.source as string, {
        header: () => column.title,
        footer: (info) => info.column.id,
      }),
    );

  /*useEffect(() => {
    if (!ds) return;

    const listener = async (/* event /) => {
      const v = await ds.getValue<string>();
      setValue(v || name);
    };

    listener();

    ds.addListener('changed', listener);

    return () => {
      ds.removeListener('changed', listener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ds]);*/

  const loader = useMemo<DataLoader | null>(() => {
    if (!ds) {
      return null;
    }
    return DataLoader.create(
      ds,
      columns.map((column) => column.source),
    );
  }, [ds, columns]);

  const updateFromLoader = useCallback(() => {
    if (!loader) {
      return;
    }
    console.log('loader.page', loader.page);
    setData(loader.page);
    setLength(loader.length);
  }, [loader]);

  useEffect(() => {
    if (!loader || !ds) {
      return;
    }
    loader.sourceHasChanged().then(updateFromLoader);
  }, [loader, ds, updateFromLoader]);

  const table = useReactTable({
    data,
    columns: ColumnsAux,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div ref={connect} style={style} className={cn(className, classNames)}>
      {loader ? (
        <table>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                ))}
              </tr>
            ))}
          </tbody>
          <tfoot>
            {table.getFooterGroups().map((footerGroup) => (
              <tr key={footerGroup.id}>
                {footerGroup.headers.map((header) => (
                  <th key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.footer, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </tfoot>
        </table>
      ) : (
        <div className="flex h-full flex-col items-center justify-center rounded-lg border bg-purple-400 py-4 text-white">
          <p>Error</p>
        </div>
      )}
    </div>
  );
};

export default DataGrid;
