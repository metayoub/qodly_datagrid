import { Table } from '@tanstack/react-table';
import divide from 'lodash/divide';
import ceil from 'lodash/ceil';
import { MdNavigateNext, MdNavigateBefore, MdFirstPage, MdLastPage } from 'react-icons/md';
import { useMemo } from 'react';

const TablePagination = ({
  table,
  total,
  currentPage,
  setCurrentPage,
  pageSize,
  setPageSize,
}: {
  table: Table<any>;
  total: number;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  pageSize: number;
  setPageSize: (pageSize: number) => void;
}) => {
  const initPageSize = useMemo(() => pageSize, []); //to display the stable default size in the select
  return (
    <>
      <div className="flex justify-between items-center flex-1 hidden">
        <div className="w-10">
          <button
            title="Previous"
            type="button"
            className=" flex items-center justify-center rounded-full relative outline-none hover:bg-gray-500/5 disabled:opacity-70 disabled:cursor-not-allowed disabled:pointer-events-none w-10 h-10"
            rel="prev"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <span className="sr-only">Previous</span>

            <MdNavigateBefore className="w-8 h-8" />
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <label>
            <select
              className="h-8 text-sm pr-8 leading-none transition duration-75 border-gray-300 rounded-lg shadow-sm outline-none"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
              }}
            >
              {![10, 20, 25, 50, 100].includes(initPageSize)
                ? [initPageSize, 10, 20, 25, 50, 100].map((pageSize) => (
                    <option key={pageSize} value={pageSize}>
                      {pageSize}
                    </option>
                  ))
                : [10, 20, 25, 50, 100].map((pageSize) => (
                    <option key={pageSize} value={pageSize}>
                      {pageSize}
                    </option>
                  ))}
            </select>
            <span className="text-sm font-medium">per page</span>
          </label>
        </div>

        <div className="w-10">
          <button
            title="Next"
            type="button"
            className="flex items-center justify-center rounded-full relative outline-none hover:bg-gray-500/5 disabled:opacity-70 disabled:cursor-not-allowed disabled:pointer-events-none w-10 h-10"
            rel="next"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === ceil(divide(total, pageSize))}
          >
            <span className="sr-only">Next</span>
            <MdNavigateNext className="w-8 h-8" />
          </button>
        </div>
      </div>

      <div className=" flex justify-between items-center lg:grid grid-cols-3">
        <div className="flex items-center gap-x-2">
          <div className="flex items-center">
            <div className="pl-2 text-sm font-medium">
              {' '}
              Showing {table.getRowModel().rows.length.toLocaleString()} of {total} Rows
            </div>
          </div>
          {' | '}
          <span className="text-sm text-gray-800 whitespace-nowrap dark:text-white">Go to</span>
          <input
            type="number"
            value={currentPage}
            onChange={(e) => {
              const page = e.target.value ? Number(e.target.value) : 1;
              setCurrentPage(page);
            }}
            className="min-h-[38px] py-2 px-2.5 block w-12 border-gray-200 rounded-lg text-sm text-center focus:border-blue-500 focus:ring-blue-500 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-50 disabled:pointer-events-none dark:bg-slate-900 dark:border-gray-700 dark:text-gray-400 dark:focus:ring-gray-600"
          />
          <span className="text-sm text-gray-800 whitespace-nowrap dark:text-white">page</span>
        </div>

        <div className="flex items-center justify-center">
          <div className="flex items-center space-x-2 filament-tables-pagination-records-per-page-selector rtl:space-x-reverse">
            <label>
              <select
                className="h-8 text-sm pr-8 leading-none transition duration-75 border-gray-300 rounded-lg shadow-sm outline-none"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                }}
              >
                {![10, 20, 25, 50, 100].includes(initPageSize)
                  ? [initPageSize, 10, 20, 25, 50, 100].map((pageSize) => (
                      <option key={pageSize} value={pageSize}>
                        {pageSize}
                      </option>
                    ))
                  : [10, 20, 25, 50, 100].map((pageSize) => (
                      <option key={pageSize} value={pageSize}>
                        {pageSize}
                      </option>
                    ))}
              </select>
              <span className="text-sm font-medium">per page</span>
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end">
          <div className="mt-1 border rounded-lg">
            <ol className="flex items-center text-sm text-gray-500 divide-x rtl:divide-x-reverse divide-gray-300">
              <li>
                <button
                  type="button"
                  className="relative flex items-center justify-center font-medium min-w-[2rem] px-1.5 h-8 -my-3 rounded-md outline-none hover:bg-gray-500/5"
                  aria-label="Previous"
                  rel="first"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  <MdFirstPage className="w-5 h-5" />
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="relative flex items-center justify-center font-medium min-w-[2rem] px-1.5 h-8 -my-3 rounded-md outline-none hover:bg-gray-500/5"
                  aria-label="Previous"
                  rel="prev"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <MdNavigateBefore className="w-5 h-5" />
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="relative flex items-center justify-center font-medium min-w-[2rem] px-1.5 h-8 -my-3 rounded-md outline-none hover:bg-gray-500/5 "
                  aria-label="Next"
                  rel="next"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === ceil(divide(total, pageSize))}
                >
                  <MdNavigateNext className="w-5 h-5" />
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="relative flex items-center justify-center font-medium min-w-[2rem] px-1.5 h-8 -my-3 rounded-md outline-none hover:bg-gray-500/5 "
                  aria-label="Next"
                  rel="last"
                  onClick={() => setCurrentPage(ceil(divide(total, pageSize)))}
                  disabled={currentPage === ceil(divide(total, pageSize))}
                >
                  <MdLastPage className="w-5 h-5" />
                </button>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </>
  );
};

export default TablePagination;
