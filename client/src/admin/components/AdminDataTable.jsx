export function AdminDataTable({ columns, rows, emptyText = 'Chưa có dữ liệu', rowKey = 'id' }) {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="w-full overflow-x-auto">
        <table className="min-w-[920px] w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs font-black uppercase tracking-[0.08em] text-slate-500">
              {columns.map((column) => (
                <th key={column.key} className={column.className ?? 'px-4 py-3'}>
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 ? (
              <tr>
                <td className="px-4 py-10 text-center text-sm font-semibold text-slate-500" colSpan={columns.length}>
                  {emptyText}
                </td>
              </tr>
            ) : (
              rows.map((row, index) => {
                let key = row[rowKey] ?? row.id ?? row.uuid ?? row._id;
                if (key === undefined || key === null) {
                  console.warn(`AdminDataTable: Row at index ${index} is missing a unique key (${rowKey}, id, uuid, _id). Using index as fallback key. Row data:`, row);
                  key = index;
                }
                return (
                  <tr key={key} className="transition duration-200 ease-out hover:bg-slate-50">
                    {columns.map((column) => (
                      <td key={column.key} className={column.cellClassName ?? 'px-4 py-3 align-middle'}>
                        {column.render ? column.render(row) : row[column.key]}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
