# Overview

DataGrid's Qodly component using [react-table](https://github.com/TanStack/table)

## Featurees

|                                        | DataGrid | DataTable |
| -------------------------------------- | -------- | --------- |
| Customizable columns                   | ✔️       |           |
| Sorting                                | ✔️       | ✔️        |
| Filtering                              | ✔️       |           |
| ReOrder                                | ✔️       | ✔️        |
| Infinite scrolling (Virtual scrolling) | ✔️       | ✔️        |
| Pagination                             | ✔️       | ✔️        |
| Sticky Header                          | ✔️       | ✔️        |
| Resizing                               | ✔️       | ✔️        |
| AutoFit                                |          |           |
| Styling and themes (using CSS)         | ✔️       | ✔️        |
| Editable cells                         |          |           |
| Stacked Header                         |          |           |
| AutoWrap columns cells                 |          |           |
| Column Chooser                         | ✔️       |           |
| Hide & show                            | ✔️       |           |
| Grouping By                            |          |           |
| Export                                 |          |           |

## TODO:

- Selecte Element
- Search in column : On going
- AutoFIt : ??
- Customizable columns (display picture, display slider.) : picture done, slider ??
- Styling (CSS)
- Editable cells : working on it
- Stacked Header: ??
- Save State ??
- Export ??
- Add events: on click, on select ...

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
