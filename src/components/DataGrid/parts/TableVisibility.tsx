import { Table } from '@tanstack/react-table';
import { useState } from 'react';
import cn from 'classnames';
import { MdKeyboardArrowDown } from 'react-icons/md';

const TableVisibility = ({ table }: { table: Table<any> }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="flex justify-end mb-2">
      <div className="relative inline-block text-left">
        <div className="">
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="inline-flex w-full justify-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            id="menu-button"
            aria-expanded="true"
            aria-haspopup="true"
          >
            Columns
            <MdKeyboardArrowDown className="w-5 h-5" />
          </button>
        </div>
        {show && (
          <div
            className="absolute right-0 z-10 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
            role="menu"
            aria-orientation="vertical"
            aria-labelledby="menu-button"
            tabIndex={-1}
          >
            <div
              className="relative flex items-start py-2 border-b border-black m-2"
              onClick={table.getToggleAllColumnsVisibilityHandler()}
            >
              <input
                className="hidden"
                {...{
                  type: 'checkbox',
                  defaultChecked: table.getIsAllColumnsVisible(),
                }}
              />
              <label
                className={cn(
                  'inline-flex w-full items-center justify-between w-auto p-2 font-medium tracking-tight border rounded-lg cursor-pointer bg-brand-light text-brand-black border-violet-500 decoration-2',

                  {
                    'border-blue-400 bg-blue-700 text-white font-semibold underline decoration-brand-dark':
                      table.getIsAllColumnsVisible(),
                  },
                )}
              >
                <div className="flex items-center justify-center w-full">
                  <div className="text-sm text-brand-black">Toggle All</div>
                </div>
              </label>
            </div>
            {table.getAllColumns().map((column) => {
              return (
                <div
                  key={column.id}
                  className="relative flex items-start border-b border-black m-2"
                  onClick={column.getToggleVisibilityHandler()}
                >
                  <input
                    className="hidden"
                    {...{
                      type: 'checkbox',
                      defaultChecked: column.getIsVisible(),
                    }}
                  />
                  <label
                    className={cn(
                      'inline-flex w-full items-center justify-between w-auto p-2 font-medium tracking-tight border rounded-lg cursor-pointer bg-brand-light text-brand-black border-violet-500 decoration-2',

                      {
                        'border-blue-400 bg-blue-700 text-white font-semibold underline decoration-brand-dark':
                          column.getIsVisible(),
                      },
                    )}
                  >
                    <div className="flex items-center justify-center w-full">
                      <div className="text-sm text-brand-black">{column.id}</div>
                    </div>
                  </label>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TableVisibility;
