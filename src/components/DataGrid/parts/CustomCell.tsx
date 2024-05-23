import { formatValue } from '@ws-ui/webform-editor';
import { MdCheck, MdClose } from 'react-icons/md';
// import { DataType, getStyle } from '@ws-ui/formatter';

const CustomCell = ({ format, dataType, value }: { format: any; dataType: string; value: any }) => {
  switch (true) {
    case value && typeof value === 'object' && !(value instanceof Date):
      return (
        <>
          {dataType === 'image' && value?.__deferred?.image ? (
            <img className="image h-10 w-10" src={value?.__deferred?.uri} alt="" />
          ) : (
            JSON.stringify(value)
          )}
        </>
      );
    case dataType === 'number' && typeof value === 'boolean' && format === 'checkbox':
      return <input type="checkbox" checked={value} disabled />;
    case dataType === 'number' && typeof value === 'boolean' && format === 'icon':
      return value ? <MdCheck /> : <MdClose />;
    case dataType === 'number' && typeof value === 'number' && format === 'slider':
      return <input type="range" value={value} disabled />;
    default:
      const customValue =
        value !== undefined && value !== null
          ? format
            ? formatValue(value, dataType, format)
            : value.toString()
          : value;
      // const customStyle = format ? getStyle(dataType as DataType, format, value) : {};

      return <div /*style={customStyle}*/>{customValue}</div>;
  }
};

export default CustomCell;
