import { useEffect, useCallback, useState, useRef, useMemo } from 'react';
import {
  getCoreRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
  getFilteredRowModel,
  ColumnFiltersState,
  ColumnDef,
  OnChangeFn,
  ColumnResizeMode,
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
import { useDoubleClick } from '@ws-ui/shared';
import { TableVisibility, TableHeader, TableBodyScroll } from '../parts';

import { useVirtualizer } from '@tanstack/react-virtual';

import { TEmit } from '@ws-ui/webform-editor/dist/hooks/use-emit';
import {
  findIndexByRefOrValue,
  getParentEntitySel,
  updateEntity,
} from '../hooks/useDsChangeHandler';
import { isNumber } from 'lodash';

interface Data {
  length: number;
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
  saveState,
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
  saveState: boolean;
  emit: TEmit;
}) => {
  //we need a reference to the scrolling element for logic down below
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const [data, setData] = useState<Data>({ length: 0, start: 0, end: 0 });
  const [dataToDisplay, setDataToDisplay] = useState<datasources.IEntity[]>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnOrder, setColumnOrder] = useState<string[]>(
    columns.map((column) => column.id as string),
  );
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const emitCellEvent = (
    eventName: string,
    { source, rowIndex }: { source: string; rowIndex: number },
  ) => {
    emit(eventName, {
      row: rowIndex,
      name: source,
    });
  };
  const handleCellClick = useDoubleClick<{ source: string; rowIndex: number }>(
    (_, params) => {
      emitCellEvent('oncelldblclick', params);
    },
    (_, params) => {
      emitCellEvent('oncellclick', params);
    },
  );

  useEffect(() => {
    if (saveState) {
      // Load table settings from localStorage
      const savedSettings = localStorage.getItem('tableSettings');
      if (savedSettings) {
        const { columnVisibility, columnOrder } = JSON.parse(savedSettings);
        setColumnVisibility(columnVisibility);
        setColumnOrder(columnOrder);
      }
    }
  }, []);

  // Create the table and pass your options
  const tableOptions = useMemo(() => {
    return {
      data: dataToDisplay,
      columns,
      getCoreRowModel: getCoreRowModel(),
      manualSorting: true,
      manualFiltering: true,
      enableColumnResizing: true,
      columnResizeMode: 'onChange' as ColumnResizeMode,
      onColumnVisibilityChange: (updater: any) => {
        const newVisibilityState =
          updater instanceof Function ? updater(columnVisibility) : updater;
        // Save newVisibilityState to localStorage
        if (saveState) {
          const localStorageData = {
            columnVisibility: newVisibilityState,
            columnOrder,
          };
          localStorage.setItem('tableSettings', JSON.stringify(localStorageData));
        }
        setColumnVisibility(updater);
      },
      onColumnFiltersChange: setColumnFilters,
      getFilteredRowModel: getFilteredRowModel(),
      state: {
        sorting,
        columnVisibility,
        columnOrder,
        columnFilters,
      },
    };
  }, [dataToDisplay, columnVisibility, columns, columnOrder, sorting, columnFilters]);

  const table = useReactTable(tableOptions);
  const pageSize = useMemo(() => (datasource as any).pageSize, [datasource]);

  const { rows } = table.getRowModel();

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    estimateSize: () => rowHeight, //estimate row height for accurate scrollbar dragging
    getScrollElement: () => tableContainerRef.current,
    //measure dynamic row height, except in firefox because it measures table border height incorrectly
    measureElement:
      typeof window !== 'undefined' && navigator.userAgent.indexOf('Firefox') === -1
        ? (element: any) => element?.getBoundingClientRect().height
        : undefined,
    overscan: 10,
  });

  const handleSortingChange: OnChangeFn<SortingState> = (updater) => {
    setSorting(updater);
    if (!!table.getRowModel().rows.length) {
      rowVirtualizer.scrollToIndex(0);
    }
  };

  //since this table option is derived from table row model state, we're using the table.setOptions utility
  table.setOptions((prev) => ({
    ...prev,
    onSortingChange: handleSortingChange,
  }));

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
        const key = index;
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
  const fetchItems = (start: number) => {
    if (!loader) {
      return;
    }

    const end = start + pageSize < loader.length ? start + pageSize : loader.length;
    setLoading(true);
    loader.fetchPage(start, end).then(updateFromLoader);
  };

  const currentDsNewPosition = async () => {
    if (!currentElement) {
      return;
    }
    switch (currentElement.type) {
      case 'entity': {
        const parent = getParentEntitySel(currentElement, currentElement.dataclassID) || datasource;
        const entity = await (currentElement as any).getEntity();
        if (entity) {
          let currentIndex = entity.getPos();
          if (currentIndex == null && parent) {
            // used "==" to handle both null & undefined values
            currentIndex = await parent.findElementPosition(currentElement);
          }
          if (typeof currentIndex === 'number') {
            setSelectedIndex(currentIndex);
            rowVirtualizer.scrollToIndex(currentIndex + 5); // replace 5 by any other number
          }
        } else {
          setSelectedIndex(-1);
        }
        break;
      }
      case 'scalar': {
        if (!datasource || datasource.dataType !== 'array') {
          return;
        }
        const items = await datasource.getValue();
        const value = await currentElement.getValue();
        const currentIndex = findIndexByRefOrValue(items, value);
        if (currentIndex >= 0) {
          // selectIndex(currentIndex);
        } else {
          // selectIndex(-1);
        }
        break;
      }
    }
  };

  // reorder columns after drag & drop
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      // order columns
      setColumnOrder((columnOrder) => {
        const oldIndex = columnOrder.indexOf(active.id as string);
        const newIndex = columnOrder.indexOf(over.id as string);
        const newColumnOrder = arrayMove(columnOrder, oldIndex, newIndex);
        if (saveState) {
          // Save new column order along with current visibility state
          const localStorageData = {
            columnVisibility,
            columnOrder: newColumnOrder,
          };
          localStorage.setItem('tableSettings', JSON.stringify(localStorageData));
        }
        return newColumnOrder;
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

    setDataToDisplay((prev) => {
      return [...prev, ...loader.page];
    });
    setData({
      length: loader.length,
      start: loader.start,
      end: loader.end,
    });
    setLoading(false);
  }, [loader]);

  useEffect(() => {
    if (!loader || !datasource) {
      return;
    }
    const updateDataFromSorting = async () => {
      const { id: columnId, desc: isDescending } = sorting[0];
      // Sorting is an object [desc: boolean, id: string]
      // workaround until the fix is delivered
      await (datasource?.orderBy as any)(`${columnId} ${isDescending ? 'desc' : 'asc'}`, {
        first: 0,
        size: pageSize,
      }).then((value: any) => {
        setData({
          length: value._private.selLength,
          start: value._private.curPage.first,
          end: value._private.curPage.first + value._private.curPage.size,
        });
        setDataToDisplay(value._private.curPage.entitiesDef);
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
    async (containerRefElement?: HTMLDivElement | null) => {
      if (containerRefElement) {
        const { scrollHeight, scrollTop, clientHeight } = containerRefElement;
        if (
          !loading &&
          scrollHeight - scrollTop - clientHeight < 500 &&
          data.end - data.start - 1 < pageSize
        ) {
          await fetchItems(data.end);
        }
      }
    },
    [data, pageSize, loading],
  );

  useEffect(() => {
    if (!loader || !datasource) {
      return;
    }

    const dsListener = () => {
      loader.sourceHasChanged().then(() => {
        updateFromLoader();
        if (isNumber(selectedIndex) && selectedIndex > -1) {
          currentDsNewPosition();
        }
      });
    };
    datasource.addListener('changed', dsListener);
    return () => {
      datasource.removeListener('changed', dsListener);
    };
  }, [selectedIndex]);

  useEffect(() => {
    const updatePosition = async () => {
      await currentDsNewPosition();
    };

    // Call updatePosition whenever selectedIndex changes
    updatePosition();
  }, [selectedIndex]);

  useEffect(() => {
    if (!currentElement) {
      return;
    }

    currentElement.addListener('changed', currentDsNewPosition);
    return () => {
      currentElement.removeListener('changed', currentDsNewPosition);
    };
  }, [currentDsNewPosition]);

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
                oncellclick={handleCellClick}
              />
            )}
          </tbody>
        </table>
      </DndContext>
    </div>
  );
};

export default InfiniteScroll;
