import config, { IDataGridProps } from './DataGrid.config';
import { T4DComponent, useEnhancedEditor } from '@ws-ui/webform-editor';
import Build from './DataGrid.build';
import Render from './DataGrid.render';

const DataGrid: T4DComponent<IDataGridProps> = (props) => {
  const { enabled } = useEnhancedEditor((state) => ({
    enabled: state.options.enabled,
  }));

  return enabled ? <Build {...props} /> : <Render {...props} />;
};

DataGrid.craft = config.craft;
DataGrid.info = config.info;
DataGrid.defaultProps = config.defaultProps;

export default DataGrid;
