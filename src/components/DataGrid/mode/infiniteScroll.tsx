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
  ColumnSizingState,
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
import {
  DataLoader,
  unsubscribeFromDatasource,
  useWebformPath,
  updateEntity,
} from '@ws-ui/webform-editor';
import { useDoubleClick } from '../hooks/useDoubleClick';
import { TableVisibility, TableHeader, TableBodyScroll, TableFooter } from '../parts';

import { useVirtualizer } from '@tanstack/react-virtual';

import { TEmit } from '@ws-ui/webform-editor/dist/hooks/use-emit';
import { findIndexByRefOrValue, getParentEntitySel } from '../hooks/useDsChangeHandler';
import isNumber from 'lodash/isNumber';
import orderBy from 'lodash/orderBy';

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
  state = '',
  displayFooter,
  emit,
  id,
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
  state?: string;
  emit: TEmit;
  id: string;
  displayFooter: boolean;
}) => {
  //we need a reference to the scrolling element for logic down below
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const [data, setData] = useState<Data>({ length: 0, start: 0, end: 0 });
  const [dataToDisplay, setDataToDisplay] = useState<datasources.IEntity[]>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnSorting, setColumnSorting] = useState<SortingState>([]);
  const [columnOrder, setColumnOrder] = useState<string[]>(
    columns.map((column) => column.id as string),
  );
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const path = useWebformPath();
  const stateDS = window.DataSource.getSource(state, path);
  const emitCellEvent = (
    eventName: string,
    { source, rowIndex }: { source: string; rowIndex: number },
  ) => {
    emit(eventName, {
      row: rowIndex,
      name: source,
    });
  };
  const handleCellClick = useDoubleClick<{ source: string; rowIndex: number; value: any }>(
    (_, params) => {
      emitCellEvent('oncelldblclick', params);
    },
    (_, params) => {
      emitCellEvent('oncellclick', params);
    },
  );
  const handleHeaderClick = useDoubleClick<{ source: string; index: number }>(
    (_, params) => {
      emit('onheaderdblclick', params);
    },
    (_, params) => {
      emit('onheaderclick', params);
    },
  );

  useEffect(() => {
    //manage array case (display+sorting)
    const displayArray = async () => {
      if (datasource.dataType === 'array') {
        let dsValue = await datasource.getValue();
        if (columnSorting.length > 0) {
          dsValue = orderBy(
            dsValue,
            columnSorting.map((e) => e.id),
            columnSorting.map((e) => (e.desc ? 'desc' : 'asc')),
          );
        }
        setLoading(false);
        setDataToDisplay(dsValue);
      }
    };

    displayArray();
  }, [datasource, columnSorting]);

  useEffect(() => {
    const getValue = async () => {
      if (stateDS) {
        const dsValue = await stateDS?.value;
        if (dsValue.columnVisibility) setColumnVisibility(dsValue.columnVisibility);
        if (dsValue.columnOrder) setColumnOrder(dsValue.columnOrder);
        if (dsValue.columnSizing) setColumnSizing(dsValue.columnSizing);
        if (dsValue.columnSorting) setColumnSorting(dsValue.columnSorting);
      } else if (saveState) {
        // Load table settings from localStorage in case it not saved in DB
        const savedSettings = localStorage.getItem(`tableSettings_${id}`);
        if (savedSettings) {
          const { columnVisibility, columnOrder, columnSizing, columnSorting } =
            JSON.parse(savedSettings);
          setColumnVisibility(columnVisibility);
          setColumnOrder(columnOrder);
          setColumnSizing(columnSizing || {});
          setColumnSorting(columnSorting);
        }
      }
    };
    getValue();
  }, []);

  const setColumnSizingChange = (updater: any) => {
    const newColumnSizeState = updater instanceof Function ? updater(columnSizing) : updater;
    const localStorageData = {
      columnSizing: newColumnSizeState,
      columnVisibility,
      columnOrder,
      columnSorting,
    };
    // Save newVisibilityState to localStorage
    if (stateDS) {
      stateDS.setValue(null, localStorageData);
      emit('onsavestate');
    }
    if (saveState) {
      localStorage.setItem(`tableSettings_${id}`, JSON.stringify(localStorageData));
    }
    setColumnSizing(updater);
  };

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
        const localStorageData = {
          columnVisibility: newVisibilityState,
          columnOrder,
          columnSizing,
          columnSorting,
        };
        // Save newVisibilityState to localStorage
        if (stateDS) {
          stateDS.setValue(null, localStorageData);
          emit('onsavestate');
        }
        if (saveState) {
          localStorage.setItem(`tableSettings_${id}`, JSON.stringify(localStorageData));
        }
        setColumnVisibility(updater);
      },
      onColumnFiltersChange: setColumnFilters,
      getFilteredRowModel: getFilteredRowModel(),
      onColumnSizingChange: setColumnSizingChange,
      state: {
        columnSizing,
        sorting: columnSorting,
        columnVisibility,
        columnOrder,
        columnFilters,
      },
    };
  }, [
    dataToDisplay,
    columnVisibility,
    columns,
    columnOrder,
    columnSorting,
    columnFilters,
    columnSizing,
  ]);

  const table = useReactTable(tableOptions);
  const pageSize = useMemo(() => (datasource as any).pageSize, [datasource]);

  const { rows } = table.getRowModel();

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    estimateSize: () => rowHeight, //estimate row height for accurate scrollbar dragging
    getScrollElement: () => tableContainerRef.current,
    //measure dynamic row height, except in firefox because it measures table border height incorrectly
    /*measureElement:
      typeof window !== 'undefined' && navigator.userAgent.indexOf('Firefox') === -1
        ? (element: any) => element?.getBoundingClientRect().height
        : undefined,*/
    overscan: 10,
  });

  const handleSortingChange: OnChangeFn<SortingState> = (updater) => {
    const newSortingState = updater instanceof Function ? updater(columnSorting) : updater;
    const localStorageData = {
      columnSizing,
      columnVisibility,
      columnOrder,
      columnSorting: newSortingState,
    };
    // Save newSortingState to localStorage
    if (stateDS) {
      stateDS.setValue(null, localStorageData);
      emit('onsavestate');
    }
    if (saveState) {
      localStorage.setItem(`tableSettings_${id}`, JSON.stringify(localStorageData));
    }

    setColumnSorting(updater);
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

    setLoading(true);
    loader.fetchPage(start, pageSize).then(() => {
      updateFromLoader();
      setLoading(false);
    });
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
        const localStorageData = {
          columnVisibility,
          columnSizing,
          columnOrder: newColumnOrder,
          columnSorting,
        };
        if (stateDS) {
          stateDS.setValue(null, localStorageData);
          emit('onsavestate');
        }
        if (saveState) {
          // Save new column order along with current visibility state
          localStorage.setItem(`tableSettings_${id}`, JSON.stringify(localStorageData));
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

  const updateFromLoader = useCallback(
    (reset?: boolean) => {
      if (!loader) {
        return;
      }
      if (reset) {
        setDataToDisplay(loader.page);
      } else {
        setDataToDisplay((prev) => {
          return [...prev, ...loader.page];
        });
      }
      setData({
        length: loader.length,
        start: loader.start,
        end: loader.end,
      });
      setLoading(false);
    },
    [loader],
  );

  useEffect(() => {
    if (!loader || !datasource || datasource.dataType === 'array') {
      return;
    }
    const updateDataFromSorting = async () => {
      const sortingString = columnSorting
        .map(
          ({ id: columnId, desc: isDescending }) => `${columnId} ${isDescending ? 'DESC' : 'ASC'}`,
        )
        .join(',');
      await datasource
        .orderBy(sortingString, {
          first: 0,
          size: pageSize,
        })
        .then((value: any) => {
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

    if (columnSorting.length > 0) {
      setLoading(true);
      updateDataFromSorting();
    }
  }, [columnSorting]);

  useEffect(() => {
    if (!loader || !datasource || datasource.dataType === 'array') {
      return;
    }
    loader.sourceHasChanged().then(() => updateFromLoader(true));
  }, [loader]);

  useEffect(() => {
    if (!datasource || datasource.dataType === 'array') {
      return;
    }
    const cb = async () => {
      await loader.fetchPage(0, pageSize).then(() => updateFromLoader(true));
    };

    datasource.addListener('changed', cb);

    return () => {
      unsubscribeFromDatasource(datasource, cb);
    };
  }, [datasource]);

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
    if (!loader || !datasource || datasource.dataType === 'array') {
      return;
    }

    const dsListener = () => {
      loader.sourceHasChanged().then(() => {
        updateFromLoader(true);
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
      className="relative overflow-auto"
      onScroll={(e) => fetchMoreOnBottomReached(e.target as HTMLDivElement)}
      ref={tableContainerRef}
      style={{
        height: height, //should be a fixed height // TODO: make it dynamic
      }}
    >
      {columnsVisibility && <TableVisibility table={table} />}
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          position: 'relative',
          minHeight: '100%',
        }}
      >
        <DndContext
          collisionDetection={closestCenter}
          modifiers={[restrictToHorizontalAxis]}
          onDragEnd={handleDragEnd}
          sensors={sensors}
        >
          <TableHeader
            infinite={true}
            table={table}
            headerHeight={headerHeight}
            filter={filter}
            columnOrder={columnOrder}
            handleHeaderClick={handleHeaderClick}
          />
          {loading && <div className="loading z-11 fixed opacity-50">⏳</div>}
          <table className="w-full relative">
            <tbody className="body flex-row">
              <TableBodyScroll
                table={table}
                rowHeight={rowHeight}
                columnOrder={columnOrder}
                onRowClick={async (row) => {
                  await updateCurrentDsValue({ index: row.index });
                  emit('onselect', row.original);
                  setSelectedIndex(row.index);
                }}
                rowVirtualizer={rowVirtualizer}
                selectedIndex={selectedIndex}
                oncellclick={handleCellClick}
                onMouseEnter={({ rowIndex, source, value }) => {
                  emit('oncellmouseenter', {
                    row: rowIndex,
                    name: source,
                    value,
                  });
                }}
              />
            </tbody>
          </table>
        </DndContext>
      </div>
      {displayFooter && <TableFooter table={table} columnOrder={columnOrder} infinite={true} />}
    </div>
  );
};

export default InfiniteScroll;
