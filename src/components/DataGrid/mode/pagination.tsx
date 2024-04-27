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
import { TableVisibility, TableHeader, TableBody, TablePagination, TableFooter } from '../parts';
import { TEmit } from '@ws-ui/webform-editor/dist/hooks/use-emit';
import {
  findIndexByRefOrValue,
  getParentEntitySel,
  updateEntity,
} from '../hooks/useDsChangeHandler';

const Pagination = ({
  paginationSize,
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
  emit,
}: {
  paginationSize: number;
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
  emit: TEmit;
}) => {
  const [data, setData] = useState<datasources.IEntity[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(paginationSize);
  const [loading, setLoading] = useState(true);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnOrder, setColumnOrder] = useState<string[]>(
    columns.map((column) => column.id as string),
  );
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [selection, setSelection] = useState({ selectedIndex: -1, selectedPage: -1 });

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
    // Load table settings from localStorage
    if (saveState) {
      const savedSettings = localStorage.getItem('tableSettings');
      if (savedSettings) {
        const { columnVisibility, columnOrder } = JSON.parse(savedSettings);
        setColumnVisibility(columnVisibility);
        setColumnOrder(columnOrder);
      }
    }
  }, []);

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
      onSortingChange: setSorting,

      onColumnFiltersChange: setColumnFilters,
      getFilteredRowModel: getFilteredRowModel(),
      state: {
        sorting,
        columnVisibility,
        columnOrder,
        columnFilters,
      },
    }),
    [columns, columnVisibility, columnOrder, columnFilters, sorting, data],
  );
  const table = useReactTable(tableOptions);

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
    setData(loader.page);
    setTotal(loader.length);
    setLoading(false);
  }, [loader, currentPage]);

  useEffect(() => {
    if (!loader || !datasource) {
      return;
    }
    const updateDataFromSorting = async () => {
      if (sorting.length > 0) {
        const sortingString = sorting
          .map(
            ({ id: columnId, desc: isDescending }) =>
              `${columnId} ${isDescending ? 'DESC' : 'ASC'}`,
          )
          .join(',');
        await datasource.orderBy(sortingString);
      }
      // TODO: calculate the new position of the selected element and fetch the page with the new position

      await loader
        .fetchPage((currentPage - 1) * pageSize, currentPage * pageSize)
        .then(updateFromLoader);
      // await currentDsNewPosition();
    };

    setLoading(true);
    updateDataFromSorting();
  }, [currentPage, pageSize, sorting, selection]);

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
  }, [currentElement, loader]);

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
    <div className="p-2 block max-w-full">
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
          <TablePagination
            table={table}
            total={total}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            pageSize={pageSize}
            setPageSize={setPageSize}
          />
        </DndContext>
      </div>
    </div>
  );
};

export default Pagination;
