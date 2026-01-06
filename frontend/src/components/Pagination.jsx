"use client"

export default function Pagination({ pagination, currentPage, onPageChange }) {
  const pages = []
  for (let i = 1; i <= pagination.pages; i++) {
    pages.push(i)
  }

  return (
    <div className="flex justify-center gap-2 mt-8">
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
      >
        Previous
      </button>

      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`px-4 py-2 rounded ${
            page === currentPage ? "bg-blue-600 text-white" : "border border-gray-300 hover:bg-gray-50"
          }`}
        >
          {page}
        </button>
      ))}

      <button
        onClick={() => onPageChange(Math.min(pagination.pages, currentPage + 1))}
        disabled={currentPage === pagination.pages}
        className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
      >
        Next
      </button>
    </div>
  )
}
