export function parsePagination(query) {
  const page = Math.max(1, Number(query.page ?? 1));
  const limit = Math.min(100, Math.max(1, Number(query.limit ?? 20)));
  const search = String(query.search ?? '').trim();
  const sortBy = String(query.sortBy ?? 'createdAt');
  const sortOrder = String(query.sortOrder ?? 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';
  return { page, limit, search, sortBy, sortOrder, skip: (page - 1) * limit };
}
