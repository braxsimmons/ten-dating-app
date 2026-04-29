"use client";

import { useTransition } from "react";
import { resolveReportAction, setBanAction } from "@/lib/actions/admin";

export function ReportControls({
  reportId,
  reportedUserId,
  alreadyBanned,
}: {
  reportId: string;
  reportedUserId: string;
  alreadyBanned: boolean;
}) {
  const [pending, start] = useTransition();
  return (
    <div className="space-x-1">
      {!alreadyBanned ? (
        <button
          disabled={pending}
          onClick={() => start(async () => {
            await setBanAction(reportedUserId, true);
            await resolveReportAction({ reportId, status: "resolved" });
          })}
          className="btn-ember py-1.5 px-3"
        >
          Ban &amp; resolve
        </button>
      ) : null}
      <button
        disabled={pending}
        onClick={() => start(async () => { await resolveReportAction({ reportId, status: "resolved" }); })}
        className="btn-primary py-1.5 px-3"
      >
        Resolve
      </button>
      <button
        disabled={pending}
        onClick={() => start(async () => { await resolveReportAction({ reportId, status: "dismissed" }); })}
        className="btn-ghost py-1.5 px-3"
      >
        Dismiss
      </button>
    </div>
  );
}
