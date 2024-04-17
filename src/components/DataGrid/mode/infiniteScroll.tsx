import { useEffect, useCallback, useState } from 'react';
import {
  getCoreRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
  getFilteredRowModel,
  ColumnFiltersState,
  ColumnDef,
} from '@tanstack/react-table';
// needed for table body level scope DnD setup
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { restrictToHorizontalAxis } from '@dnd-kit/modifiers';
import { arrayMove } from '@dnd-kit/sortable';
import { DataLoader } from '@ws-ui/webform-editor';
import { TableVisibility, TableHeader, TableBody } from '../parts';

import {
  findIndexByRefOrValue,
  getParentEntitySel,
  updateEntity,
} from '../hooks/useDsChangeHandler';

interface Data {
  length: number;
  list: datasources.IEntity[];
  start: number;
  end: number;
}

const InfiniteScroll = ({
  columns,
  datasource,
  columnsVisibility,
  rowHeight,
  headerHeight,
  filter,
  loader,
  currentElement,
}: {
  columns: ColumnDef<any, any>[];
  datasource: datasources.DataSource;
  columnsVisibility: boolean;
  rowHeight: number;
  headerHeight: number;
  filter: boolean;
  loader: DataLoader;
  currentElement: datasources.DataSource;
}) => {
  const [data, setData] = useState<Data>({ length: 0, list: [], start: 0, end: 0 });
  // const [data, setData] = useState<datasources.IEntity[]>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnOrder, setColumnOrder] = useState<string[]>(
    columns.map((column) => column.id as string),
  );
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Create the table and pass your options
  const table = useReactTable({
    data: data.list,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    manualFiltering: true,
    enableColumnResizing: true,
    columnResizeMode: 'onChange',
    onColumnVisibilityChange: setColumnVisibility,
    onSortingChange: setSorting,
    onColumnOrderChange: setColumnOrder,
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnVisibility,
      columnOrder,
      columnFilters,
    },
  });

  const updateCurrentDsValue = async ({
    index,
    forceUpdate = false,
    fireEvent = true,
  }: {
    index: number;
    forceUpdate?: boolean;
    fireEvent?: boolean;
  }) => {
    if (!datasource || !currentElement || (selectedIndex === index && !forceUpdate)) {
      return;
    }

    switch (currentElement.type) {
      case 'entity': {
        await updateEntity({ index, datasource, currentElement, fireEvent });
        break;
      }
      case 'scalar': {
        if (datasource.dataType !== 'array') {
          return;
        }
        const value = await datasource.getValue();
        await currentElement.setValue(null, value[index], fireEvent);
        break;
      }
    }
  };

  const selectIndex = (index: number) => {
    // TODO: pagination
    setSelectedIndex(index);
  };

  /*const refreshItem = debounce(async (index: number) => {
    if (!loader) return;
    await loader.refreshIndex(index);
    setData({
      length: loader.length,
      list: loader.page,
      start: loader.start,
      end: loader.end,
    });
  }, 50);*/

  // reorder columns after drag & drop
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setColumnOrder((columnOrder) => {
        const oldIndex = columnOrder.indexOf(active.id as string);
        const newIndex = columnOrder.indexOf(over.id as string);
        return arrayMove(columnOrder, oldIndex, newIndex); //this is just a splice util
      });
    }
  };

  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {}),
  );

  const updateFromLoader = useCallback(() => {
    if (!loader) {
      return;
    }
    console.log('updateFromLoader', loader);
    setData({
      length: loader.length,
      list: loader.page,
      start: loader.start,
      end: loader.end,
    });
    setLoading(false);
  }, [loader]);

  useEffect(() => {
    if (!loader || !datasource) {
      return;
    }

    console.log('test 1');
    const updateDataFromSorting = async () => {
      const { id: columnId, desc: isDescending } = sorting[0];
      await datasource
        .orderBy(`${columnId} ${isDescending ? 'desc' : 'asc'}`)
        .then((value: any) => {
          console.log('updateDataFromSorting', isDescending);
          setData({
            length: value._private.selLength,
            list: value._private.curPage.entitiesDef,
            start: value._private.curPage.first,
            end: value._private.curPage.first + value._private.curPage.size,
          });
          setLoading(false);
        });
    };

    if (sorting.length > 0) {
      setLoading(true);
      // Sorting is an object [desc: boolean, id: string]
      updateDataFromSorting();
    }
  }, [sorting]);

  useEffect(() => {
    if (!loader || !datasource) {
      return;
    }
    loader.sourceHasChanged().then(updateFromLoader);
  }, [loader]);

  return (
    <DndContext
      collisionDetection={closestCenter}
      modifiers={[restrictToHorizontalAxis]}
      onDragEnd={handleDragEnd}
      sensors={sensors}
    >
      {columnsVisibility && <TableVisibility table={table} />}
      <table>
        <TableHeader
          table={table}
          headerHeight={headerHeight}
          filter={filter}
          columnOrder={columnOrder}
        />
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={100}>
                <div className="loading">⏳</div>
              </td>
            </tr>
          ) : (
            <TableBody
              table={table}
              rowHeight={rowHeight}
              columnOrder={columnOrder}
              onRowClick={async (row) => {
                await updateCurrentDsValue({ index: row.index });
                //emit('onselect'); // TODO
                selectIndex(row.index);
              }}
              page={0}
              selection={selectedIndex}
            />
          )}
        </tbody>
      </table>
    </DndContext>
  );
};

export default InfiniteScroll;
