// needed for row & cell level scope DnD setup
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { flexRender } from '@tanstack/react-table';

const DragAlongCell = ({
  cell,
  oncellclick,
  onMouseEnter,
}: {
  cell: any;
  oncellclick: (
    event: React.MouseEvent<Element, MouseEvent>,
    ...params: {
      source: string;
      rowIndex: number;
      value: any;
    }[]
  ) => void;
  onMouseEnter: ({ source, rowIndex }: { source: string; rowIndex: number }) => void;
}) => {
  const { isDragging, setNodeRef, transform } = useSortable({
    id: cell.column.id,
  });

  return (
    <td
      onClick={(e) => {
        oncellclick(e, {
          source: cell.column.id,
          rowIndex: cell.row.index,
          value: cell.getValue() || cell.row.original[cell.column.id],
        });
      }}
      onMouseEnter={() => onMouseEnter({ source: cell.column.id, rowIndex: cell.row.index })}
      style={{
        opacity: isDragging ? 0.8 : 1,
        transform: CSS.Translate.toString(transform), // translate instead of transform to avoid squishing
        transition: 'width transform 0.2s ease-in-out',
        width: cell.column.getSize(),
        zIndex: isDragging ? 1 : 0,
      }}
      className={`td-${cell.column.id} relative content-center`}
      ref={setNodeRef}
    >
      {flexRender(cell.column.columnDef.cell, cell.getContext())}
    </td>
  );
};

export default DragAlongCell;
