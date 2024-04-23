import { Table } from '@tanstack/react-table';
import { useState } from 'react';
import cn from 'classnames';
import { MdKeyboardArrowDown } from 'react-icons/md';

const TableVisibility = ({ table, disabled }: { table: Table<any>; disabled?: boolean }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="flex justify-end mb-2 visibility-menu">
      <div className="relative">
        <div className="">
          <button
            type="button"
            onClick={() => !disabled && setShow(!show)}
            className="visibility-button inline-flex w-full justify-center rounded-md bg-white p-2 text-sm font-semibold text-gray-900 border border-gray-300"
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
            className="absolute right-0 z-20 w-56 origin-top-right rounded-md bg-white ring-1 ring-inset ring-gray-300 divide-y divide-gray-300 mt-2"
            role="menu"
            aria-orientation="vertical"
            aria-labelledby="menu-button"
            tabIndex={-1}
          >
            <div
              className="relative flex items-start m-2"
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
                  `${table.getIsAllColumnsVisible() ? 'visibility-menu-button' : 'visibility-menu-button-checked'}`,
                  'inline-flex w-full items-center justify-between w-auto p-2 font-medium rounded-md cursor-pointer',
                  {
                    'bg-gray-500 text-white font-semibold underline':
                      table.getIsAllColumnsVisible(),
                    'border border-gray-500': !table.getIsAllColumnsVisible(),
                  },
                )}
              >
                <div className="flex items-center justify-center w-full">
                  <div className="text-sm text-brand-black">Toggle All</div>
                </div>
              </label>
            </div>
            <div>
              {table.getAllColumns().map((column) => {
                return (
                  <div
                    key={column.id}
                    className="relative flex items-start m-2"
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
                        `${column.getIsVisible() ? 'visibility-menu-button' : 'visibility-menu-button-checked'}`,
                        'inline-flex w-full items-center justify-between w-auto p-2 font-medium rounded-md cursor-pointer',

                        {
                          'bg-gray-500 text-white font-semibold underline': column.getIsVisible(),
                          'border border-gray-500': !column.getIsVisible(),
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
          </div>
        )}
      </div>
    </div>
  );
};

export default TableVisibility;
