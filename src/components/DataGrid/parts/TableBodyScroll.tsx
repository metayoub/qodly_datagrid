import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import DragAlongCell from './DragAlongCell';
import cn from 'classnames';
import { Virtualizer } from '@tanstack/react-virtual';
import { Table } from '@tanstack/react-table';

const TableBodyScroll = ({
  table,
  rowHeight,
  columnOrder,
  onRowClick,
  rowVirtualizer,
  selectedIndex,
  oncellclick,
  onMouseEnter,
}: {
  table: Table<any>;
  rowHeight: number;
  columnOrder: string[];
  selectedIndex: number;
  onRowClick: (row: any) => void;
  oncellclick: (
    event: React.MouseEvent<Element, MouseEvent>,
    ...params: {
      source: string;
      rowIndex: number;
      value: any;
    }[]
  ) => void;
  rowVirtualizer: Virtualizer<HTMLDivElement, Element>;
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
  const { rows } = table.getRowModel();
  return rowVirtualizer.getVirtualItems().map((virtualRow, index) => {
    const row = rows[virtualRow.index];
    return (
      <tr
        key={row.id}
        /*data-index={virtualRow.index} //needed for dynamic row height measurement
        ref={(node) => rowVirtualizer.measureElement(node)}*/
        style={{
          height: rowHeight,
          transform: `translateY(${virtualRow.start - index * virtualRow.size}px)`,
        }}
        // remove className and use only style
        className={cn(`tr-${virtualRow.index}`, {
          selected: selectedIndex === virtualRow.index,
          'bg-blue-100': selectedIndex === virtualRow.index,
        })}
        onClick={() => onRowClick(virtualRow)}
      >
        {row.getVisibleCells().map((cell) => (
          <SortableContext
            key={cell.id}
            items={columnOrder}
            strategy={horizontalListSortingStrategy}
          >
            <DragAlongCell
              key={cell.id}
              cell={cell}
              oncellclick={oncellclick}
              onMouseEnter={onMouseEnter}
            />
          </SortableContext>
        ))}
      </tr>
    );
  });
};

export default TableBodyScroll;
