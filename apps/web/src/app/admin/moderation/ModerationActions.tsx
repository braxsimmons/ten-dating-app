"use client";

import { useTransition } from "react";
import { approvePhotoAction, rejectPhotoAction } from "@/lib/actions/admin-moderation";

export function ModerationActions({
  photoId,
  status,
}: {
  photoId: string;
  status: "pending" | "approved" | "rejected";
}) {
  const [pending, start] = useTransition();
  return (
    <div className="mt-3 flex gap-2">
      {status !== "approved" ? (
        <button
          disabled={pending}
          onClick={() => start(async () => { await approvePhotoAction(photoId); })}
          className="btn-primary py-1.5 flex-1"
        >
          Approve
        </button>
      ) : null}
      {status !== "rejected" ? (
        <button
          disabled={pending}
          onClick={() => start(async () => { await rejectPhotoAction({ photoId, deleteFile: false }); })}
          className="btn-outline py-1.5 flex-1 text-red-600"
        >
          Reject
        </button>
      ) : null}
      <button
        disabled={pending}
        onClick={() => start(async () => {
          if (!confirm("Delete this photo permanently?")) return;
          await rejectPhotoAction({ photoId, deleteFile: true });
        })}
        className="btn-ghost py-1.5 px-3 text-red-600"
        title="Delete"
      >
        ✕
      </button>
    </div>
  );
}
