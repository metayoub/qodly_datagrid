import { useEnhancedNode } from '@ws-ui/webform-editor';
import cn from 'classnames';
import { FC, useEffect, useState } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { IColumn, IDataGridProps } from './DataGrid.config';
import './DataGrid.css';
import { BsFillInfoCircleFill } from 'react-icons/bs';
import { keyBy, mapValues } from 'lodash';

const DataGrid: FC<IDataGridProps> = ({
  datasource,
  columns = [],
  style,
  className,
  classNames = [],
}) => {
  const {
    connectors: { connect },
  } = useEnhancedNode();

  const initialData = Array.from({ length: 10 }, () => {
    const obj = mapValues(keyBy(columns, 'source'), (value) => value.title);
    return obj;
  });
  const [data, setData] = useState(initialData);
  const columnHelper = createColumnHelper<any>();
  const ColumnsAux = columns
    .filter((column) => column.source !== '')
    .map((column: IColumn) =>
      columnHelper.accessor(column.source as string, {
        header: () => column.title,
        footer: (info) => info.column.id,
      }),
    );

  const table = useReactTable({
    data,
    columns: ColumnsAux,
    getCoreRowModel: getCoreRowModel(),
  });

  useEffect(() => {
    setData(initialData);
  }, [columns]);

  return (
    <div ref={connect} style={style} className={cn(className, classNames)}>
      {datasource ? (
        ColumnsAux.length > 0 && data ? (
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
                    <td key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
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
            <BsFillInfoCircleFill className="mb-1 h-8 w-8" />
            <p>Please add columns</p>
          </div>
        )
      ) : (
        <div className="flex h-full flex-col items-center justify-center rounded-lg border bg-purple-400 py-4 text-white">
          <BsFillInfoCircleFill className="mb-1 h-8 w-8" />
          <p>Please attach a datasource</p>
        </div>
      )}
    </div>
  );
};

export default DataGrid;
