# Overview

DataGrid's Qodly component using [react-table](https://github.com/TanStack/table)

## TODO:

- Display Columns : done
- Display Data & length : done
- Sorting : done enable multiSorting
- Set width : donex
- Search in column ??
- ReOrder : done
- Pagination : on going
- AutoFIt : ??
- Resize : done
- Customizable columns (display picture, display slider.) : picture done, slider ??
- Styling (CSS)
- Editable cells
- Stacked Header
- Column chooser : on going
- Save State ??
- Export
- Add events: on click, on select ...
- infinite scroll ?

## Styling

you can easily restyle your table using by creating a CSS class and bind it to your table

```CSS

self table {
  border-collapse: collapse;
  width: 100%;
}

self th,
td {
  text-align: left;
  padding: 8px;
}

self th {
  background-color: #005689;
  color: white;
}

self tr:hover {
  background-color: #d5eeff;
}

self tr.selected,
self tr:nth-child(even).selected {
  background-color: #007cb9;
}

self tr:nth-child(even) {
  background-color: #f2f2f2;
}

```
