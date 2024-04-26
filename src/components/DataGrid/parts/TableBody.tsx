import { Table } from '@tanstack/react-table';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import DragAlongCell from './DragAlongCell';
import cn from 'classnames';

const TableBody = ({
  table,
  rowHeight,
  columnOrder,
  selection,
  page,
  onRowClick,
  oncellclick,
  onMouseEnter,
}: {
  table: Table<any>;
  rowHeight: number;
  columnOrder: string[];
  selection: any;
  page: number;
  onRowClick: (row: any) => void;
  oncellclick: (
    event: React.MouseEvent<Element, MouseEvent>,
    ...params: {
      source: string;
      rowIndex: number;
      value: any;
    }[]
  ) => void;
  onMouseEnter: ({
    source,
    rowIndex,
    value,
  }: {
    source: string;
    rowIndex: number;
    value: any;
  }) => void;
}) => {
  return table.getRowModel().rows.map((row) => (
    <tr
      key={row.id}
      style={{ height: rowHeight }}
      className={cn(`flex tr-${row.id}`, {
        selected: selection.selectedIndex === row.index && selection.selectedPage === page,
        'bg-blue-100': selection.selectedIndex === row.index && selection.selectedPage === page,
      })}
      onClick={() => onRowClick(row)}
    >
      {row.getVisibleCells().map((cell) => (
        <SortableContext key={cell.id} items={columnOrder} strategy={horizontalListSortingStrategy}>
          <DragAlongCell
            key={cell.id}
            cell={cell}
            oncellclick={oncellclick}
            onMouseEnter={onMouseEnter}
          />
        </SortableContext>
      ))}
    </tr>
  ));
};

export default TableBody;
