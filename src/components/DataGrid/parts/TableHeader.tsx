import { Table } from '@tanstack/react-table';
import DraggableTableHeader from './DraggableTableHeader';
import TableFilter from './TableFilter';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';

const TableHeader = ({
  table,
  headerHeight,
  filter,
  columnOrder,
}: {
  table: Table<any>;
  headerHeight: number;
  filter: boolean;
  columnOrder: string[];
}) => {
  return (
    <thead className="header">
      {table.getHeaderGroups().map((headerGroup) => (
        <tr key={headerGroup.id}>
          <SortableContext items={columnOrder} strategy={horizontalListSortingStrategy}>
            {headerGroup.headers.map((header) => (
              <DraggableTableHeader
                key={header.id}
                header={header}
                headerHeight={headerHeight}
                filter={filter}
                table={table}
              >
                {false && filter && header.column.getCanFilter() && (
                  <TableFilter column={header.column} table={table} />
                )}
              </DraggableTableHeader>
            ))}
          </SortableContext>
        </tr>
      ))}
    </thead>
  );
};

export default TableHeader;
