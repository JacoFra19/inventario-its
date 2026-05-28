import type { Key, ReactNode } from "react";

export interface DataTableColumn<T> {
  key: string;
  header: ReactNode;
  render: (row: T, index: number) => ReactNode;
  headerClassName?: string;
  cellClassName?: string;
}

interface DataTableActions<T> {
  header?: ReactNode;
  render: (row: T, index: number) => ReactNode;
  headerClassName?: string;
  cellClassName?: string;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowKey: (row: T, index: number) => Key;
  emptyMessage?: ReactNode;
  loading?: boolean;
  loadingMessage?: ReactNode;
  actions?: DataTableActions<T>;
  className?: string;
  scrollClassName?: string;
  tableClassName?: string;
  headerClassName?: string;
  rowClassName?: string | ((row: T, index: number) => string);
  onRowClick?: (row: T, index: number) => void;
}

export default function DataTable<T>({
  columns,
  rows,
  getRowKey,
  emptyMessage = "Nessun dato disponibile.",
  loading = false,
  loadingMessage = "Caricamento...",
  actions,
  className = "",
  scrollClassName = "",
  tableClassName = "",
  headerClassName = "",
  rowClassName = "",
  onRowClick,
}: DataTableProps<T>) {
  const colSpan = columns.length + (actions ? 1 : 0);

  function rowClasses(row: T, index: number) {
    const customClass =
      typeof rowClassName === "function" ? rowClassName(row, index) : rowClassName;

    return [
      "group border-t align-top transition hover:bg-blue-50/40",
      onRowClick ? "cursor-pointer" : "",
      customClass,
    ]
      .filter(Boolean)
      .join(" ");
  }

  return (
    <section
      className={`overflow-hidden rounded-3xl bg-white shadow ring-1 ring-gray-100 ${className}`}
    >
      <div className={`overflow-x-auto ${scrollClassName}`}>
        <table className={`min-w-full text-sm ${tableClassName}`}>
          <thead className={`sticky top-0 z-10 bg-gray-100/95 text-left text-xs uppercase tracking-wide text-gray-500 backdrop-blur ${headerClassName}`}>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`p-4 font-semibold ${column.headerClassName ?? ""}`}
                >
                  {column.header}
                </th>
              ))}

              {actions && (
                <th
                  className={`p-4 font-semibold text-right ${
                    actions.headerClassName ?? ""
                  }`}
                >
                  {actions.header ?? "Azioni"}
                </th>
              )}
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td colSpan={colSpan} className="p-6 text-center text-gray-500">
                  {loadingMessage}
                </td>
              </tr>
            )}

            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={colSpan} className="p-6 text-center text-gray-500">
                  {emptyMessage}
                </td>
              </tr>
            )}

            {!loading &&
              rows.map((row, index) => (
                <tr
                  key={getRowKey(row, index)}
                  className={rowClasses(row, index)}
                  onClick={() => onRowClick?.(row, index)}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`p-4 ${column.cellClassName ?? ""}`}
                    >
                      {column.render(row, index)}
                    </td>
                  ))}

                  {actions && (
                    <td
                      className={`p-4 text-right ${
                        actions.cellClassName ?? ""
                      }`}
                    >
                      {actions.render(row, index)}
                    </td>
                  )}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
