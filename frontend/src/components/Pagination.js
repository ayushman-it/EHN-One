import React from 'react';

export default function Pagination({
  currentPage = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100]
}) {
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="d-flex flex-wrap align-items-center justify-content-between justify-content-center gap-2 p-3 border-top bg-white" style={{ borderRadius: '0 0 14px 14px' }}>
      <div className="d-flex flex-wrap align-items-center justify-content-center gap-2 text-center text-sm-start">
        <div className="d-flex align-items-center gap-1.5" style={{ fontSize: '0.8rem', color: '#0f2917' }}>
          <span className="fw-semibold">Rows:</span>
          <select
            className="form-select form-select-sm py-1 px-2"
            style={{ width: 'auto', fontSize: '0.78rem', borderRadius: '6px', borderColor: '#4CAF50' }}
            value={pageSize}
            onChange={(e) => {
              const newSize = Number(e.target.value);
              if (onPageSizeChange) onPageSizeChange(newSize);
            }}
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <span className="text-muted small ms-sm-2" style={{ fontSize: '0.78rem' }}>
          <strong>{startItem}</strong>–<strong>{endItem}</strong> of <strong>{totalItems}</strong>
        </span>
      </div>

      <div className="d-flex align-items-center justify-content-center gap-1 flex-wrap">
        <button
          className="btn-v outline-secondary btn-sm px-2 py-1"
          style={{ fontSize: '0.75rem', borderRadius: '6px' }}
          disabled={currentPage <= 1}
          onClick={() => onPageChange(1)}
          title="First Page"
        >
          <i className="bi bi-chevron-double-left"></i>
        </button>

        <button
          className="btn-v outline-secondary btn-sm px-2 py-1"
          style={{ fontSize: '0.75rem', borderRadius: '6px' }}
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          title="Previous Page"
        >
          <i className="bi bi-chevron-left"></i> <span className="d-none d-sm-inline">Prev</span>
        </button>

        <span className="px-2 py-1 fw-bold text-dark text-nowrap" style={{ fontSize: '0.78rem', background: '#DAF2DB', color: '#1E4D2B', borderRadius: '6px' }}>
          {currentPage} / {totalPages}
        </span>

        <button
          className="btn-v outline-secondary btn-sm px-2 py-1"
          style={{ fontSize: '0.75rem', borderRadius: '6px' }}
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          title="Next Page"
        >
          <span className="d-none d-sm-inline">Next</span> <i className="bi bi-chevron-right"></i>
        </button>

        <button
          className="btn-v outline-secondary btn-sm px-2 py-1"
          style={{ fontSize: '0.75rem', borderRadius: '6px' }}
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(totalPages)}
          title="Last Page"
        >
          <i className="bi bi-chevron-double-right"></i>
        </button>
      </div>
    </div>
  );
}
