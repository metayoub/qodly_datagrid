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
import { TableVisibility, TableHeader, TableBody, TablePagination, TableFooter } from '../parts';
/*import {
  updateEntity,
  getParentEntitySel,
  findIndexByRefOrValue,
} from '@ws-ui/webform-editor';*/

import { isNumber } from 'lodash';

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
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Create the table and pass your options
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    enableColumnResizing: true,
    enableMultiSort: true,
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
    if (currentPage === 0) {
      setCurrentPage(1);
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
      loader.fetchPage((currentPage - 1) * pageSize, currentPage * pageSize).then(updateFromLoader);
    };

    setLoading(true);
    updateDataFromSorting();
  }, [currentPage, pageSize, sorting]);

  // handle selelctElement
  const currentDsChangeHandler = useCallback(async () => {
    if (!currentElement) {
      return;
    }
    console.log('currentDsChangeHandler', currentElement);
    /*switch (currentElement.type) {
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
            setSelectedIndex(currentIndex);
            // refreshItem(currentIndex);
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
          setSelectedIndex(currentIndex);
        } else {
          setSelectedIndex(-1);
        }
        break;
      }
    }*/
  }, [currentElement]);

  const updateCurrentDsValue = async ({
    index,
    forceUpdate = false,
    fireEvent = true,
  }: {
    index: number;
    forceUpdate?: boolean;
    fireEvent?: boolean;
  }) => {
    console.log('updateCurrentDsValue', index, forceUpdate, fireEvent);
    /*if (!datasource || !currentElement || (selectedIndex === index && !forceUpdate)) {
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
    }*/
  };

  useEffect(() => {
    if (!loader || !datasource) {
      return;
    }
    if (currentElement) {
      currentElement.addListener('changed', currentDsChangeHandler);
    }
    console.log('useEffect', selectedIndex);
    const dsListener = () => {
      loader.sourceHasChanged().then(() => {
        updateFromLoader();
        if (isNumber(selectedIndex) && selectedIndex > -1) {
          updateCurrentDsValue({
            index: selectedIndex,
            forceUpdate: true,
          });
        }
      });
    };
    datasource.addListener('changed', dsListener);
    return () => {
      currentElement?.removeListener('changed', currentDsChangeHandler);
      datasource?.removeListener('changed', dsListener);
    };
  }, [selectedIndex]);

  useEffect(() => {
    // select current element
    console.log('useEffect 2', currentElement, selectedIndex);
    if (currentElement && selectedIndex === -1) {
      try {
        let index = -1;
        if (currentElement.type === 'entity') {
          index = (currentElement as any).getEntity()?.getPos();
        } else if (
          currentElement.type === 'scalar' &&
          currentElement.dataType === 'object' &&
          currentElement.parentSource
        ) {
          index = (currentElement as any).getPos();
        }
        if (index >= 0) {
          setSelectedIndex(index);
        }
      } catch (e) {
        // proceed
      }
    }
  }, []);

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
        <tbody className="body">
          {loading ? (
            <tr>
              <td colSpan={100}>
                <div className="loading">⏳</div>
              </td>
            </tr>
          ) : (
            <TableBody table={table} rowHeight={rowHeight} columnOrder={columnOrder} />
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
  );
};

export default Pagination;
