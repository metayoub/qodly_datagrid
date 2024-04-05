import { Table } from '@tanstack/react-table';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import DragAlongFooter from './DragAlongFooter';

const TableFooter = ({ table, columnOrder }: { table: Table<any>; columnOrder: string[] }) => {
  return (
    <tfoot className="footer">
      {table.getFooterGroups().map((footerGroup) => (
        <tr key={footerGroup.id} className={`tf-${footerGroup.id}`}>
          {footerGroup.headers.map((header) => (
            <SortableContext
              key={header.id}
              items={columnOrder}
              strategy={horizontalListSortingStrategy}
            >
              <DragAlongFooter key={header.id} header={header} />
            </SortableContext>
          ))}
        </tr>
      ))}
    </tfoot>
  );
};
export default TableFooter;
