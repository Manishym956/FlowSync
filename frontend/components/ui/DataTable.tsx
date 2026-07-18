import { clsx } from "clsx";

// ─── Column definition ────────────────────────────────────────────────────────

export interface Column<T> {
  key: string;
  header: string;
  width?: string;
  align?: "left" | "right" | "center";
  mono?: boolean;
  render: (row: T) => React.ReactNode;
}

// ─── DataTable ────────────────────────────────────────────────────────────────

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  keyField: keyof T;
  onRowClick?: (row: T) => void;
  className?: string;
  emptyMessage?: string;
}

export function DataTable<T>({
  columns,
  rows,
  keyField,
  onRowClick,
  className,
  emptyMessage = "No data available.",
}: DataTableProps<T>) {
  return (
    <div className={clsx("w-full overflow-x-auto", className)}>
      <table className="w-full border-collapse text-[13px]">
        {/* ── Header ────────────────────────────────────────────────────────── */}
        <thead>
          <tr className="border-b border-[#2a2d3e]">
            {columns.map((col) => (
              <th
                key={col.key}
                style={{ width: col.width }}
                className={clsx(
                  "px-4 py-2 text-[11px] font-medium tracking-widest uppercase text-[#6b7280] whitespace-nowrap",
                  col.align === "right" && "text-right",
                  col.align === "center" && "text-center",
                  !col.align && "text-left",
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>

        {/* ── Body ──────────────────────────────────────────────────────────── */}
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-12 text-center text-[13px] text-[#6b7280]"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={String(row[keyField])}
                onClick={() => onRowClick?.(row)}
                className={clsx(
                  "h-10 border-b border-[#2a2d3e] transition-colors",
                  onRowClick && "cursor-pointer hover:bg-[#191b22]",
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={clsx(
                      "px-4 text-[#e2e2eb]",
                      col.align === "right" && "text-right",
                      col.align === "center" && "text-center",
                      col.mono && "font-mono text-[12px] text-[#c7c4d7]",
                    )}
                  >
                    {col.render(row)}
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
