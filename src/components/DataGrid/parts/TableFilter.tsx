import { useEffect, useState } from 'react';
import { Column, Table } from '@tanstack/react-table';

const DebouncedInput = ({
  value: initialValue,
  onChange,
  debounce = 500,
  ...props
}: {
  value: string | number | Date;
  onChange: (value: any) => void;
  debounce?: number;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'>) => {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value);
    }, debounce);

    return () => clearTimeout(timeout);
  }, [value]);

  return <input {...props} value={value} onChange={(e) => setValue(e.target.value)} />;
};

const renderNumberFilter = (min: number, max: number, onChange: any) => {
  return (
    <div>
      <div className="flex space-x-2">
        <DebouncedInput
          type="number"
          value={min}
          onChange={(value) => onChange((old: [number, number]) => [value, old?.[1]])}
          placeholder="Min"
          className="w-24 border shadow rounded text-black"
        />
        <DebouncedInput
          type="number"
          value={max}
          onChange={(value) => onChange((old: [number, number]) => [old?.[0], value])}
          placeholder="Max"
          className="w-24 border shadow rounded text-black"
        />
      </div>
    </div>
  );
};

const renderStringFilter = (value: string, onChange: any) => {
  return (
    <DebouncedInput
      type="text"
      value={value}
      onChange={onChange}
      placeholder="Search... "
      className="w-36 border shadow rounded text-black"
    />
  );
};

const renderDateFilter = (value: any, onChange: any) => {
  return (
    <DebouncedInput
      type="date"
      value={value}
      onChange={onChange}
      placeholder="Search... "
      className="w-36 border shadow rounded text-black"
    />
  );
};

/*const renderTimeFilter = (value: any, onChange: any) => {
  return (
    <DebouncedInput
      type="time"
      value={value}
      onChange={onChange}
      placeholder="Search... "
      className="w-36 border shadow rounded text-black"
    />
  );
}*/

const hasImage = (obj: any): obj is { __deferred: { image: boolean } } => {
  return obj.__deferred && obj.__deferred.image;
};

const TableFilter = ({ column, table }: { column: Column<any, unknown>; table: Table<any> }) => {
  const firstValue = table.getPreFilteredRowModel().flatRows[0]?.getValue(column.id);

  const columnFilterValue = column.getFilterValue();

  switch (typeof firstValue) {
    case 'number':
      return renderNumberFilter(
        (columnFilterValue as [number, number])?.[0] ?? '',
        (columnFilterValue as [number, number])?.[1] ?? '',
        column.setFilterValue as any as any,
      );
    case 'object':
      if (hasImage(firstValue)) return <></>;
      return renderDateFilter((columnFilterValue ?? '') as Date, (value: any) =>
        column.setFilterValue(value),
      );
    case 'string':
    default:
      return renderStringFilter((columnFilterValue ?? '') as string, (value: any) =>
        column.setFilterValue(value),
      );
  }
};

export default TableFilter;
