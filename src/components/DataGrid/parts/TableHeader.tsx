import { Table } from '@tanstack/react-table';
import DraggableTableHeader from './DraggableTableHeader';
import TableFilter from './TableFilter';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';

const TableHeader = ({
  table,
  headerHeight,
  filter,
  columnOrder,
  infinite = false,
  handleHeaderClick,
}: {
  table: Table<any>;
  headerHeight: number;
  filter: boolean;
  columnOrder: string[];
  infinite?: boolean;
  handleHeaderClick: (
    event: React.MouseEvent<Element, MouseEvent>,
    ...params: {
      source: string;
      index: number;
    }[]
  ) => void;
}) => {
  return (
    <thead className={`header ${infinite && 'sticky top-0 z-10'} bg-gray-50`}>
      {table.getHeaderGroups().map((headerGroup) => (
        <tr key={headerGroup.id}>
          <SortableContext items={columnOrder} strategy={horizontalListSortingStrategy}>
            {headerGroup.headers.map((header) => (
              <th style={{ minWidth: header.column.getSize(), width: header.column.getSize() }}>
                <DraggableTableHeader
                  key={header.id}
                  header={header}
                  headerHeight={headerHeight}
                  filter={filter}
                  table={table}
                  handleHeaderClick={handleHeaderClick}
                >
                  {false && filter && header.column.getCanFilter() && (
                    <TableFilter column={header.column} table={table} />
                  )}
                </DraggableTableHeader>
              </th>
            ))}
          </SortableContext>
        </tr>
      ))}
    </thead>
  );
};

export default TableHeader;
