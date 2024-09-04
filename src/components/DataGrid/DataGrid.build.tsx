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
import keyBy from 'lodash/keyBy';
import mapValues from 'lodash/mapValues';
import { TableVisibility } from './parts';
const DataGrid: FC<IDataGridProps> = ({
  datasource,
  columns = [],
  style,
  displayFooter = true,
  variant = 'pagination',
  headerHeight,
  rowHeight,
  className,
  classNames = [],
  columnsVisibility,
}) => {
  const {
    connectors: { connect },
  } = useEnhancedNode();

  const calculateHeight = (height: string | number | undefined): number => {
    /* make it dynamic for inifinite scroll*/
    if (height === undefined) {
      return 600;
    }
    if (typeof height === 'number') {
      return 600;
    }

    if (height.includes('px')) {
      const value =
        parseInt(height.replace('px', '')) - headerHeight - (columnsVisibility ? 40 : 0);
      return value / rowHeight;
    } else if (height.includes('%')) {
      const value = (divElement?.clientHeight || 600) - headerHeight - (columnsVisibility ? 40 : 0);
      return value / rowHeight;
    }

    return 600;
  };

  const [data, setData] = useState<any>([]);
  const columnHelper = createColumnHelper<any>();
  const ColumnsAux = columns
    .filter((column) => column.source !== '')
    .map((column: IColumn) =>
      columnHelper.accessor(column.source as string, {
        header: () => column.title,
        cell: () => column.title,
        footer: () => column.title,
        size: column.width,
      }),
    );
  const [divElement, setDivElement] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    const initialData = Array.from(
      {
        length: variant === 'pagination' ? 10 : calculateHeight(style?.height),
      },
      () => {
        const obj = mapValues(keyBy(columns, 'source'), (value) => value.title);
        return obj;
      },
    );
    setData(initialData);
  }, [style?.height, columns, variant, divElement]);

  const table = useReactTable({
    data,
    columns: ColumnsAux,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div
      ref={(e) => {
        connect(e);
        setDivElement(e);
      }}
      style={{
        ...style,
        height: variant === 'pagination' ? 'fit-content' : style?.height,
        maxWidth: '100%',
      }}
      className={cn(className, classNames)}
    >
      <div className="relative overflow-auto block">
        {columnsVisibility && <TableVisibility table={table} disabled={true} />}
        {datasource ? (
          ColumnsAux.length > 0 && data ? (
            <table className="w-full">
              <thead className="header bg-gray-50">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id} className="">
                    {headerGroup.headers.map((header) => (
                      <th
                        className={`th-${header.column.id} text-left`}
                        {...{
                          key: header.id,
                          colSpan: header.colSpan,
                          style: {
                            height: headerHeight,
                            width: header.getSize(),
                          },
                        }}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="body">
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="tr-body" style={{ height: rowHeight }}>
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className={`td-${cell.column.id}`}
                        style={{ width: cell.column.getSize() }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
              {displayFooter && (
                <tfoot className="footer">
                  {table.getFooterGroups().map((footerGroup) => (
                    <tr key={footerGroup.id} className={`tf-${footerGroup.id} text-left`}>
                      {footerGroup.headers.map((header) => (
                        <th key={header.id} style={{ width: header.getSize() }}>
                          {flexRender(header.column.columnDef.footer, header.getContext())}
                        </th>
                      ))}
                    </tr>
                  ))}
                </tfoot>
              )}
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
    </div>
  );
};

export default DataGrid;
