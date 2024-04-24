import { formatValue } from '@ws-ui/webform-editor';
import { MdCheck, MdClose } from 'react-icons/md';

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

  if (dataType === 'bool' && typeof value === 'boolean') {
    // TODO: waiting fot formatting
    if (format === 'checkbox') {
      return <input type="checkbox" checked={value} disabled />;
    }
    return value ? <MdCheck /> : <MdClose />;
    //return value ? 'true' : 'false';
  }

  if (dataType === 'number' && format === 'slider' && typeof value === 'number') {
    // TODO: add more styling
    return <input type="range" value={value} disabled />;
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
