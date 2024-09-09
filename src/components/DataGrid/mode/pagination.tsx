import { useEffect, useCallback, useState, useMemo } from 'react';
import {
  getCoreRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
  getFilteredRowModel,
  ColumnFiltersState,
  ColumnDef,
  ColumnResizeMode,
  ColumnSizingState,
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
import { DataLoader, unsubscribeFromDatasource, useWebformPath } from '@ws-ui/webform-editor';
import { useDoubleClick } from '../hooks/useDoubleClick';
import { TableVisibility, TableHeader, TableBody, TablePagination, TableFooter } from '../parts';
import { TEmit } from '@ws-ui/webform-editor/dist/hooks/use-emit';
import {
  findIndexByRefOrValue,
  getParentEntitySel,
  updateEntity,
} from '../hooks/useDsChangeHandler';
import orderBy from 'lodash/orderBy';

const Pagination = ({
  displayFooter,
  rowHeight,
  headerHeight,
  columnsVisibility,
  filter,
  datasource,
  columns,
  loader,
  currentElement,
  saveState,
  state = '',
  emit,
  id,
}: {
  displayFooter: boolean;
  rowHeight: number;
  headerHeight: number;
  columnsVisibility: boolean;
  filter: boolean;
  datasource: datasources.DataSource;
  currentElement: datasources.DataSource;
  columns: ColumnDef<any, any>[];
  loader: DataLoader;
  saveState: boolean;
  state?: string;
  emit: TEmit;
  id: string;
}) => {
  const [data, setData] = useState<datasources.IEntity[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(
    datasource.getPageSize() != 0 ? datasource.getPageSize() : 10,
  );
  const [loading, setLoading] = useState(true);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});
  const [columnSorting, setColumnSorting] = useState<SortingState>([]);
  const [columnOrder, setColumnOrder] = useState<string[]>(
    columns.map((column) => column.id as string),
  );
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [selection, setSelection] = useState({ selectedIndex: -1, selectedPage: -1 });
  const path = useWebformPath();
  const stateDS = window.DataSource.getSource(state, path);
  const emitCellEvent = (
    eventName: string,
    { source, rowIndex, value }: { source: string; rowIndex: number; value: any },
  ) => {
    emit(eventName, {
      row: rowIndex,
      name: source,
      value: value,
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
    if (!datasource) {
      return;
    }

    const cb = async () => {
      await loader
        .fetchPage((currentPage - 1) * pageSize, currentPage * pageSize)
        .then(updateFromLoader);
    };

    datasource.addListener('changed', cb);

    return () => {
      unsubscribeFromDatasource(datasource, cb);
    };
  }, [datasource, currentPage, pageSize]);

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
  const tableOptions = useMemo(
    () => ({
      data,
      columns,
      getCoreRowModel: getCoreRowModel(),
      manualPagination: true,
      manualSorting: true,
      manualFiltering: true,
      enableColumnResizing: true,
      enableMultiSort: true,
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
        if (stateDS) {
          stateDS.setValue(null, localStorageData);
          emit('onsavestate');
        }
        // Save newVisibilityState to localStorage
        if (saveState) {
          localStorage.setItem(`tableSettings_${id}`, JSON.stringify(localStorageData));
        }

        setColumnVisibility(updater);
      },
      onColumnSizingChange: setColumnSizingChange,
      onColumnFiltersChange: setColumnFilters,
      getFilteredRowModel: getFilteredRowModel(),
      state: {
        columnSizing,
        sorting: columnSorting,
        columnVisibility,
        columnOrder,
        columnFilters,
      },
    }),
    [columns, columnVisibility, columnOrder, columnFilters, columnSorting, data, columnSizing],
  );
  const table = useReactTable(tableOptions);

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
  };
  //since this table option is derived from table row model state, we're using the table.setOptions utility
  table.setOptions((prev) => ({
    ...prev,
    onSortingChange: handleSortingChange,
  }));

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

  useEffect(() => {
    if (!currentElement) {
      return;
    }
    // Get The selected element position
    currentDsChangeHandler();
  }, []);

  const updateFromLoader = useCallback(() => {
    if (!loader) {
      return;
    }
    if (currentPage === 0) {
      setCurrentPage(1);
      setSelection((prev) => ({ ...prev, selectedPage: 1 }));
      return;
    }
    if (loader.length < pageSize) {
      //search-> go back to page 1 to see rows..
      setCurrentPage(1);
    }
    setData(loader.page);
    setTotal(loader.length);
    setLoading(false);
  }, [loader, currentPage]);

  const loadArray = (dsValue: any, sorting: SortingState) => {
    if (sorting.length > 0) {
      dsValue = orderBy(
        dsValue,
        sorting.map((e) => e.id),
        sorting.map((e) => (e.desc ? 'desc' : 'asc')),
      );
    }

    if (dsValue.length < pageSize) {
      //search-> go back to page 1 to see rows..
      setCurrentPage(1);
    }
    setPageSize(pageSize ? pageSize : 10);
    if (currentPage === 0) {
      setCurrentPage(1);
    }
    setTotal(dsValue.length);
    setData(dsValue.slice((currentPage - 1) * pageSize, currentPage * pageSize));
    setLoading(false);
  };

  useEffect(() => {
    if (!loader || !datasource) {
      return;
    }

    const updateDataFromSorting = async () => {
      if (datasource.dataType === 'array') {
        let dsValue = await datasource.getValue();
        loadArray(dsValue, columnSorting);
      } else {
        if (columnSorting.length > 0) {
          const sortingString = columnSorting
            .map(
              ({ id: columnId, desc: isDescending }) =>
                `${columnId} ${isDescending ? 'DESC' : 'ASC'}`,
            )
            .join(',');
          await datasource.orderBy(sortingString);
        }
        await loader
          .fetchPage((currentPage - 1) * pageSize, currentPage * pageSize)
          .then(updateFromLoader);
      }
      // TODO: calculate the new position of the selected element and fetch the page with the new position
      // await currentDsNewPosition();
    };
    setLoading(true);
    updateDataFromSorting();
  }, [currentPage, pageSize, columnSorting, selection.selectedPage]);

  // handle selelctElement
  const currentDsChangeHandler = useCallback(async () => {
    if (!currentElement) {
      return;
    }
    switch (currentElement.type) {
      case 'entity': {
        const parent = getParentEntitySel(currentElement, currentElement.dataclassID) || datasource;
        const entity = (currentElement as any).getEntity();
        if (entity) {
          let currentIndex = entity.getPos();
          if (currentIndex == null && parent) {
            // used "==" to handle both null & undefined values
            currentIndex = await parent.findElementPosition(currentElement);
          }
          if (typeof currentIndex === 'number') {
            setCurrentPage(Math.floor(currentIndex / pageSize) + 1);
            selectIndex(currentIndex % pageSize, Math.floor(currentIndex / pageSize) + 1);
          }
        } else {
          selectIndex(-1);
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
          selectIndex(currentIndex);
        } else {
          selectIndex(-1);
        }
        break;
      }
    }
  }, [currentElement, loader]); // do we need loader here?

  const updateCurrentDsValue = async ({
    index,
    forceUpdate = false,
    fireEvent = true,
  }: {
    index: number;
    forceUpdate?: boolean;
    fireEvent?: boolean;
  }) => {
    if (!datasource || !currentElement || (selection.selectedIndex === index && !forceUpdate)) {
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
  const selectIndex = (index: number, curPage = currentPage) => {
    setSelection((prev) => {
      if (prev.selectedPage !== curPage) {
        return { selectedIndex: index, selectedPage: curPage };
      } else {
        return { ...prev, selectedIndex: index };
      }
    });
  };

  useEffect(() => {
    if (!currentElement) {
      return;
    }
    currentElement.addListener('changed', currentDsChangeHandler);
    return () => {
      currentElement.removeListener('changed', currentDsChangeHandler);
    };
  }, [currentDsChangeHandler]);

  return (
    <div className="block max-w-full">
      {columnsVisibility && <TableVisibility table={table} />}
      <div className="overflow-x-scroll overflow-y-hidden">
        <DndContext
          collisionDetection={closestCenter}
          modifiers={[restrictToHorizontalAxis]}
          onDragEnd={handleDragEnd}
          sensors={sensors}
        >
          <table className="w-full">
            <TableHeader
              table={table}
              headerHeight={headerHeight}
              filter={filter}
              columnOrder={columnOrder}
              handleHeaderClick={handleHeaderClick}
            />
            <tbody className="body">
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
                    await updateCurrentDsValue({ index: row.index + pageSize * (currentPage - 1) });
                    emit('onselect', row.original);
                    selectIndex(row.index);
                  }}
                  page={currentPage}
                  selection={selection}
                  oncellclick={handleCellClick}
                  onMouseEnter={({ rowIndex, source, value }) => {
                    emit('oncellmouseenter', {
                      row: rowIndex,
                      name: source,
                      value,
                    });
                  }}
                />
              )}
            </tbody>
            {displayFooter && <TableFooter table={table} columnOrder={columnOrder} />}
          </table>
        </DndContext>
      </div>
      <TablePagination
        table={table}
        total={total}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        pageSize={pageSize}
        setPageSize={setPageSize}
      />
    </div>
  );
};

export default Pagination;
