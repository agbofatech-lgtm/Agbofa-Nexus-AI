import React from "react";

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
}

export interface TableComponentProps<T> {
  columns: Column<T>[];
  data: T[];
  emptyMessage?: string;
  className?: string;
  "data-testid"?: string;
}

export function Table<T extends Record<string, any>>({
  columns,
  data,
  emptyMessage = "No records found.",
  className = "",
  ...props
}: TableComponentProps<T>) {
  return (
    <div className={`overflow-x-auto border border-slate-200 rounded-lg ${className}`} {...props}>
      <table className="w-full text-left text-xs text-[#0F172A]">
        <thead className="bg-slate-50 border-b border-slate-200 uppercase font-semibold text-[#64748B]">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-3">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-[#FFFFFF]">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-6 text-center text-[#64748B]"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-50">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3">
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
