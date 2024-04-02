import { formatValue } from '@ws-ui/webform-editor';

const CustomCell = ({ cell, format, dataType }: { cell: any; format: any; dataType: string }) => {
  const value = cell.getValue();

  if (value && typeof value === 'object' && !(value instanceof Date)) {
    return (
      <>
        {dataType === 'image' && value?.__deferred?.image ? (
          <img className="image h-10 w-10 rounded-full" src={value?.__deferred?.uri} alt="" />
        ) : (
          JSON.stringify(value)
        )}
      </>
    );
  }

  const Customvalue =
    value !== undefined && value !== null
      ? format
        ? formatValue(value, dataType, format)
        : value.toString()
      : value;

  return Customvalue;
};

export default CustomCell;
