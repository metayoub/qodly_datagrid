import { Table } from '@tanstack/react-table';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import DragAlongCell from './DragAlongCell';

const TableBody = ({
  table,
  rowHeight,
  columnOrder,
}: {
  table: Table<any>;
  rowHeight: number;
  columnOrder: string[];
}) => {
  return table.getRowModel().rows.map((row) => (
    <tr key={row.id} style={{ height: rowHeight }} className={`tr-${row.id}`}>
      {row.getVisibleCells().map((cell) => (
        <SortableContext key={cell.id} items={columnOrder} strategy={horizontalListSortingStrategy}>
          <DragAlongCell key={cell.id} cell={cell} />
        </SortableContext>
      ))}
    </tr>
  ));
};

export default TableBody;
