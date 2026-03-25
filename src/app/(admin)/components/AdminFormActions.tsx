import type { ReactNode } from "react";
import { cx } from "@/utils/cx";

type AdminFormActionsProps = {
  primaryActions: ReactNode;
  destructiveAction?: ReactNode;
  className?: string;
};

export const ADMIN_ACTION_BUTTON_CLASS = "w-full justify-center sm:w-auto sm:min-w-[10rem]";

export default function AdminFormActions({ primaryActions, destructiveAction, className }: AdminFormActionsProps) {
  return (
    <div className={cx("flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">{primaryActions}</div>
      {destructiveAction ? <div className="flex flex-col gap-3 sm:ml-auto sm:flex-row sm:items-center">{destructiveAction}</div> : null}
    </div>
  );
}
