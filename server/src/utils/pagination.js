export function parsePagination(query = {}) {
  const integer = (value, fallback) => {
    if (typeof value !== 'string' || !/^\d+$/.test(value)) return fallback
    return Math.max(1, Math.min(Number(value), fallback === 12 ? 50 : Number.MAX_SAFE_INTEGER))
  }
  return { page: integer(query.page, 1), limit: integer(query.limit, 12) }
}

export function paginationMeta(page, limit, total) {
  return { page, limit, total, totalPages: Math.ceil(total / limit) }
}
