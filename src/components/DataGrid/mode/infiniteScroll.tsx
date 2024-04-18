import { useEffect, useCallback, useState, useRef } from 'react';
import {
  getCoreRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
  getFilteredRowModel,
  ColumnFiltersState,
  ColumnDef,
  OnChangeFn,
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
import { TableVisibility, TableHeader, TableBodyScroll } from '../parts';

import { updateEntity } from '../hooks/useDsChangeHandler';
import { useVirtualizer, VirtualizerOptions } from '@tanstack/react-virtual';

import { ceil, debounce } from 'lodash';
import { TEmit } from '@ws-ui/webform-editor/dist/hooks/use-emit';

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
  height = '600px',
  emit,
}: {
  columns: ColumnDef<any, any>[];
  datasource: datasources.DataSource;
  columnsVisibility: boolean;
  rowHeight: number;
  headerHeight: number;
  filter: boolean;
  loader: DataLoader;
  currentElement: datasources.DataSource;
  height: string | number | undefined;
  emit: TEmit;
}) => {
  //we need a reference to the scrolling element for logic down below
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const [data, setData] = useState<Data>({ length: 0, list: [], start: 0, end: 0 });

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

  //scroll to top of table when sorting changes
  const handleSortingChange: OnChangeFn<SortingState> = (updater) => {
    setSorting(updater);
    if (!!table.getRowModel().rows.length) {
      rowVirtualizer.scrollToIndex?.(0);
    }
  };

  //since this table option is derived from table row model state, we're using the table.setOptions utility
  table.setOptions((prev) => ({
    ...prev,
    onSortingChange: handleSortingChange,
  }));

  const opts = {
    count: data.length,
    estimateSize: () => rowHeight, //estimate row height for accurate scrollbar dragging
    getScrollElement: () => tableContainerRef.current,
    //measure dynamic row height, except in firefox because it measures table border height incorrectly
    measureElement:
      typeof window !== 'undefined' && navigator.userAgent.indexOf('Firefox') === -1
        ? (element: any) => element?.getBoundingClientRect().height
        : undefined,
    overscan: 10,
    /*scrollToFn: () => {},
    observeElementRect: (element: any) => {
      console.log('observeElementRect', element);
    },
    observeElementOffset: (element: any) => {
      console.log('observeElementOffset', element);
    },*/
  };
  const rowVirtualizer = useVirtualizer(opts);

  // TODO: check why is not working
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
        const key = index + data.start;
        await updateEntity({ index: key, datasource, currentElement, fireEvent });
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

  // TODO: to be tested
  const fetchItem = debounce((index: number) => {
    if (!loader) {
      return;
    }
    const size = ceil((datasource as any).pageSize / 2);

    const start = index > size ? index - size : 0;
    const end = index + size < loader.length ? index + size : loader.length;
    loader.fetchPage(start, end).then(updateFromLoader);
  }, 50);

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
    console.log('data', data);
    const updatedOptions: VirtualizerOptions<HTMLDivElement, Element> = {
      ...opts, // Assuming opts is the current options object
      count: data.length,
    };
    rowVirtualizer.setOptions(updatedOptions);
  }, [loader]);

  useEffect(() => {
    if (!loader || !datasource) {
      return;
    }
    const updateDataFromSorting = async () => {
      const { id: columnId, desc: isDescending } = sorting[0];
      // Sorting is an object [desc: boolean, id: string]
      await datasource
        .orderBy(`${columnId} ${isDescending ? 'desc' : 'asc'}`)
        .then((value: any) => {
          setData({
            length: value._private.selLength,
            list: value._private.curPage.entitiesDef,
            start: value._private.curPage.first,
            end: value._private.curPage.first + value._private.curPage.size,
          });
          setLoading(false);
        });
      // TODO: Select the first Element
    };

    if (sorting.length > 0) {
      setLoading(true);
      updateDataFromSorting();
    }
  }, [sorting]);

  useEffect(() => {
    if (!loader || !datasource) {
      return;
    }
    loader.sourceHasChanged().then(updateFromLoader);
  }, [loader]);

  //called on scroll and possibly on mount to fetch more data as the user scrolls and reaches bottom of table
  const fetchMoreOnBottomReached = useCallback(
    (containerRefElement?: HTMLDivElement | null) => {
      if (containerRefElement) {
        const { scrollHeight, scrollTop, clientHeight, offsetHeight } = containerRefElement;
        console.log('containerRefElement', scrollHeight, scrollTop, clientHeight, offsetHeight);
        //once the user has scrolled within 500px of the bottom of the table, fetch more data if we can
        console.log('data', data);
        if (scrollHeight - scrollTop - clientHeight < 500 && data.end - data.start < data.length) {
          fetchItem(data.end - 1);
        }
      }
    },
    [data],
  );

  return (
    <div
      className="container relative overflow-auto"
      onScroll={(e) => fetchMoreOnBottomReached(e.target as HTMLDivElement)}
      ref={tableContainerRef}
      style={{
        height: height, //should be a fixed height // TODO: make it dynamic
      }}
    >
      <DndContext
        collisionDetection={closestCenter}
        modifiers={[restrictToHorizontalAxis]}
        onDragEnd={handleDragEnd}
        sensors={sensors}
      >
        {columnsVisibility && <TableVisibility table={table} />}
        <table className="grid">
          <TableHeader
            infinite={true}
            table={table}
            headerHeight={headerHeight}
            filter={filter}
            columnOrder={columnOrder}
          />
          <tbody
            className="relative grid"
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`, //tells scrollbar how big the table is
            }}
          >
            {loading ? (
              <tr>
                <td colSpan={100}>
                  <div className="loading">⏳</div>
                </td>
              </tr>
            ) : (
              <TableBodyScroll
                table={table}
                rowHeight={rowHeight}
                columnOrder={columnOrder}
                onRowClick={async (row) => {
                  await updateCurrentDsValue({ index: row.index });
                  emit('onselect'); // TODO
                  setSelectedIndex(row.index);
                }}
                rowVirtualizer={rowVirtualizer}
                selectedIndex={selectedIndex}
              />
            )}
          </tbody>
        </table>
      </DndContext>
    </div>
  );
};

export default InfiniteScroll;
