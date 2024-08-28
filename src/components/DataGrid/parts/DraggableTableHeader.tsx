import { ReactNode } from 'react';
import cn from 'classnames';
// needed for row & cell level scope DnD setup
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { flexRender, Table } from '@tanstack/react-table';
import { RiSortAsc, RiSortDesc, RiDraggable } from 'react-icons/ri';

const DraggableTableHeader = ({
  header,
  headerHeight,
  children,
  handleHeaderClick,
}: {
  header: any;
  headerHeight: number;
  filter: Boolean;
  table: Table<any>;
  children: ReactNode;
  handleHeaderClick: (
    event: React.MouseEvent<Element, MouseEvent>,
    ...params: {
      source: string;
      index: number;
    }[]
  ) => void;
}) => {
  const { attributes, isDragging, listeners, setNodeRef, transform } = useSortable({
    id: header.column.id,
  });

  return (
    <th
      onClick={async (e) => {
        handleHeaderClick(e, { source: header.column.id, index: header.index });
      }}
      key={header.id}
      colSpan={header.colSpan}
      className={`th-${header.column.id} relative whitespace-nowrap`}
      style={{
        width: header.column.getSize(),
        height: headerHeight,
        zIndex: isDragging ? 1 : 0,
        opacity: isDragging ? 0.8 : 1,
        transform: CSS.Translate.toString(transform), // translate instead of transform to avoid squishing
        transition: 'width transform 0.2s ease-in-out',
      }}
      ref={setNodeRef}
    >
      <div
        className={cn('flex items-center gap-2', {
          'cursor-pointer': header.column.getCanSort(),
        })}
        {...(header.column.getCanSort()
          ? { onClick: () => header.column.toggleSorting(null, true) }
          : {})}
      >
        <RiDraggable className="tdrag" {...attributes} {...listeners} />
        {flexRender(header.column.columnDef.header, header.getContext())}
        {{ asc: <RiSortAsc />, desc: <RiSortDesc /> }[header.column.getIsSorted() as string] ??
          null}
      </div>
      {header.column.getCanResize() && (
        <div
          onMouseDown={header.getResizeHandler()}
          onTouchStart={header.getResizeHandler()}
          className={cn('resizer', { isResizing: header.column.getIsResizing() })}
        ></div>
      )}
      {children}
    </th>
  );
};

export default DraggableTableHeader;
