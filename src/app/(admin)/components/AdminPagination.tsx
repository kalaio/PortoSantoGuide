"use client";

import { PaginationCardMinimal } from "@/components/application/pagination/pagination";

type AdminPaginationProps = {
  page: number;
  total: number;
  onChange: (nextPage: number) => void;
};

export default function AdminPagination({ page, total, onChange }: AdminPaginationProps) {
  if (total <= 1) {
    return null;
  }

  return (
    <PaginationCardMinimal
      page={page}
      total={total}
      align="right"
      onPageChange={onChange}
      className="border-0 px-0 py-0"
    />
  );
}
