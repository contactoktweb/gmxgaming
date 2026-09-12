'use client'

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AdminPaginationProps {
  currentPage: number
  totalItems: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  onItemsPerPageChange: (itemsPerPage: number) => void
  itemsPerPageOptions?: number[]
  itemName?: string
  className?: string
}

export function AdminPagination({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  itemsPerPageOptions = [10, 20, 50],
  itemName = 'elementos',
  className
}: AdminPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage))
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages)
  const startIndex = totalItems === 0 ? 0 : (safeCurrentPage - 1) * itemsPerPage
  const endIndex = totalItems === 0 ? 0 : Math.min(startIndex + itemsPerPage, totalItems)

  const pages: (number | string)[] = []
  const delta = 1

  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= safeCurrentPage - delta && i <= safeCurrentPage + delta)
    ) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...')
    }
  }

  return (
    <div className={cn("flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border pt-5 mt-4 text-xs", className)}>
      {/* Left: Info & Items per page selector */}
      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 sm:gap-4 text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="font-500">Mostrar:</span>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              onItemsPerPageChange(Number(e.target.value))
              onPageChange(1)
            }}
            aria-label="Cantidad por página"
            className="rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer transition-colors"
          >
            {itemsPerPageOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt} por página
              </option>
            ))}
          </select>
        </div>

        <span className="text-border hidden sm:inline">|</span>

        <span>
          Mostrando <strong className="text-white font-600">{totalItems === 0 ? 0 : startIndex + 1}</strong> - <strong className="text-white font-600">{endIndex}</strong> de <strong className="text-white font-600">{totalItems}</strong> {itemName}
        </span>
      </div>

      {/* Right: Page navigation */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={safeCurrentPage === 1}
          title="Primera página"
          aria-label="Primera página"
          className="flex h-8 w-8 items-center justify-center rounded border border-border bg-background text-muted-foreground transition-colors hover:border-primary hover:text-white disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-border disabled:hover:text-muted-foreground"
        >
          <ChevronsLeft className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, safeCurrentPage - 1))}
          disabled={safeCurrentPage === 1}
          title="Página anterior"
          aria-label="Página anterior"
          className="flex h-8 w-8 items-center justify-center rounded border border-border bg-background text-muted-foreground transition-colors hover:border-primary hover:text-white disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-border disabled:hover:text-muted-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Page Number Buttons */}
        <div className="flex items-center gap-1 mx-1">
          {pages.map((p, idx) => {
            if (p === '...') {
              return (
                <span key={`ellipsis-${idx}`} className="px-1 text-muted-foreground select-none">
                  ...
                </span>
              )
            }
            const isCurrent = p === safeCurrentPage
            return (
              <button
                key={`page-${p}`}
                type="button"
                onClick={() => onPageChange(Number(p))}
                aria-current={isCurrent ? 'page' : undefined}
                className={cn(
                  "min-w-8 h-8 px-2 flex items-center justify-center rounded text-xs font-600 transition-colors border",
                  isCurrent
                    ? "bg-primary border-primary text-white"
                    : "border-border bg-background text-muted-foreground hover:border-primary hover:text-white"
                )}
              >
                {p}
              </button>
            )
          })}
        </div>

        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, safeCurrentPage + 1))}
          disabled={safeCurrentPage === totalPages}
          title="Página siguiente"
          aria-label="Página siguiente"
          className="flex h-8 w-8 items-center justify-center rounded border border-border bg-background text-muted-foreground transition-colors hover:border-primary hover:text-white disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-border disabled:hover:text-muted-foreground"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={safeCurrentPage === totalPages}
          title="Última página"
          aria-label="Última página"
          className="flex h-8 w-8 items-center justify-center rounded border border-border bg-background text-muted-foreground transition-colors hover:border-primary hover:text-white disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-border disabled:hover:text-muted-foreground"
        >
          <ChevronsRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
