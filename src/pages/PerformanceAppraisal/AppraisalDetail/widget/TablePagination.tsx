import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationEllipsis,
} from "@/components/ui/pagination";
export function TablePagination({
  total,
  page,
  limit,
  onPageChange,
}: {
  total: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <Pagination className='mt-4'>
      <PaginationContent>
        {(() => {
          const totalPages = Math.ceil(total / limit);
          const currentPage = page;
          const PAGES_TO_SHOW = 5;
          const HALF_WINDOW = Math.floor(PAGES_TO_SHOW / 2);

          let startPage: number;
          let endPage: number;

          if (totalPages <= PAGES_TO_SHOW) {
            // Show all pages if total is less than window size
            startPage = 1;
            endPage = totalPages;
          } else if (currentPage <= HALF_WINDOW) {
            // Near the beginning: show first PAGES_TO_SHOW pages
            startPage = 1;
            endPage = PAGES_TO_SHOW;
          } else if (currentPage + HALF_WINDOW >= totalPages) {
            // Near the end: show last PAGES_TO_SHOW pages
            startPage = totalPages - PAGES_TO_SHOW + 1;
            endPage = totalPages;
          } else {
            // In the middle: center around current page
            startPage = currentPage - HALF_WINDOW;
            endPage = currentPage + HALF_WINDOW;
          }

          const pageNumbers: number[] = [];
          for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(i);
          }

          const showFirstPage = startPage > 1;
          const showLastPage = endPage < totalPages;
          const showStartEllipsis = startPage > 2;
          const showEndEllipsis = endPage < totalPages - 1;

          return (
            <>
              {/* First page */}
              {showFirstPage && (
                <PaginationItem>
                  <PaginationLink
                    href='#'
                    isActive={currentPage === 1}
                    onClick={(e) => {
                      e.preventDefault();
                      onPageChange(1);
                    }}>
                    1
                  </PaginationLink>
                </PaginationItem>
              )}

              {/* Start ellipsis */}
              {showStartEllipsis && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}

              {/* Page numbers */}
              {pageNumbers.map((pageNumber) => (
                <PaginationItem key={pageNumber}>
                  <PaginationLink
                    href='#'
                    isActive={currentPage === pageNumber}
                    onClick={(e) => {
                      e.preventDefault();
                      onPageChange(pageNumber);
                    }}>
                    {pageNumber}
                  </PaginationLink>
                </PaginationItem>
              ))}

              {/* End ellipsis */}
              {showEndEllipsis && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}

              {/* Last page */}
              {showLastPage && (
                <PaginationItem>
                  <PaginationLink
                    href='#'
                    isActive={currentPage === totalPages}
                    onClick={(e) => {
                      e.preventDefault();
                      onPageChange(totalPages);
                    }}>
                    {totalPages}
                  </PaginationLink>
                </PaginationItem>
              )}
            </>
          );
        })()}
      </PaginationContent>
    </Pagination>
  );
}
