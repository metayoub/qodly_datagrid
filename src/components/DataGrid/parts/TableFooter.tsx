import { Table } from '@tanstack/react-table';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import DragAlongFooter from './DragAlongFooter';

const TableFooter = ({
  table,
  columnOrder,
  infinite = false,
}: {
  table: Table<any>;
  columnOrder: string[];
  infinite?: boolean;
}) => {
  return (
    <tfoot className={`footer ${infinite && 'sticky bottom-0 z-10'} text-left bg-gray-50 flex`}>
      {table.getFooterGroups().map((footerGroup) => (
        <tr key={footerGroup.id} className={`tf-${footerGroup.id} flex grow bg-gray-50`}>
          {footerGroup.headers.map((header) => (
            <td
              key={header.id}
              style={{
                minWidth: header.column.getSize(),
                width: header.column.getSize(),
                flexGrow: 1,
              }}
            >
              <SortableContext
                key={header.id}
                items={columnOrder}
                strategy={horizontalListSortingStrategy}
              >
                <DragAlongFooter key={header.id} header={header} />
              </SortableContext>
            </td>
          ))}
        </tr>
      ))}
    </tfoot>
  );
};
export default TableFooter;
