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
  onMouseEnter: ({ source, rowIndex }: { source: string; rowIndex: number }) => void;
}) => {
  return rowVirtualizer.getVirtualItems().map((virtualRow) => {
    const { rows } = table.getRowModel();
    const row = rows[virtualRow.index];
    return (
      <tr
        data-index={virtualRow.index} //needed for dynamic row height measurement
        ref={(node) => rowVirtualizer.measureElement(node)} //measure dynamic row height
        key={row.id}
        style={{
          height: rowHeight,
          transform: `translateY(${virtualRow.start}px)`, //this should always be a `style` as it changes on scroll
        }}
        // remove className and use only style
        className={cn(`flex absolute w-full tr-${virtualRow.index}`, {
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
