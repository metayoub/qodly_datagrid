// needed for row & cell level scope DnD setup
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { flexRender } from '@tanstack/react-table';

const DragAlongFooter = ({ header, style }: { header: any; style: any }) => {
  const { isDragging, setNodeRef, transform } = useSortable({
    id: header.column.id,
  });

  return (
    <th
      className={`th-${header.column.id} relative`}
      style={{
        ...style,
        opacity: isDragging ? 0.8 : 1,
        transform: CSS.Translate.toString(transform), // translate instead of transform to avoid squishing
        transition: 'width transform 0.2s ease-in-out',
        zIndex: isDragging ? 1 : 0,
      }}
      ref={setNodeRef}
    >
      {flexRender(header.column.columnDef.footer, header.getContext())}
    </th>
  );
};

export default DragAlongFooter;
