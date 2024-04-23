import { formatValue } from '@ws-ui/webform-editor';

const CustomCell = ({ format, dataType, value }: { format: any; dataType: string; value: any }) => {
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    return (
      <>
        {dataType === 'image' && value?.__deferred?.image ? (
          <img className="image h-10 w-10" src={value?.__deferred?.uri} alt="" />
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
