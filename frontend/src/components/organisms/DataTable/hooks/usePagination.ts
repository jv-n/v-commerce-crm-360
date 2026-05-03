import { useState } from "react"

export function usePagination(defaultRowsPerPage: number) {
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(defaultRowsPerPage)

  const paginate = <T>(data: T[]) => {
    const totalItems = data.length
    const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage))
    const safePage   = Math.min(currentPage, totalPages)
    return {
      pageData:    data.slice((safePage - 1) * rowsPerPage, safePage * rowsPerPage),
      safePage,
      pageNumbers: Array.from({ length: totalPages }, (_, i) => i + 1),
      startItem:   totalItems === 0 ? 0 : (safePage - 1) * rowsPerPage + 1,
      endItem:     Math.min(safePage * rowsPerPage, totalItems),
      totalItems,
    }
  }

  const resetPage = () => setCurrentPage(1)

  const changeRowsPerPage = (val: number) => {
    setRowsPerPage(val)
    setCurrentPage(1)
  }

  return { currentPage, setCurrentPage, rowsPerPage, changeRowsPerPage, resetPage, paginate }
}
