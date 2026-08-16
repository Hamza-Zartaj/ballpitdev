import * as React from "react";

export function DeleteButton({ onClick, loading }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`flex-1 shrink gap-2.5 self-stretch px-6 ${
        loading ? "text-black bg-Grey-600" : "text-white bg-red-500"
      } rounded-full min-h-[64px]`}
      aria-label="Confirm account deletion"
    >
      {loading ? "Deleting..." : "Yes, Delete."}
    </button>
  );
}

export function CancelButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex-1 shrink gap-2.5 self-stretch px-6 text-black rounded-full bg-zinc-100 min-h-[64px]"
      aria-label="Cancel account deletion"
    >
      No, Cancel
    </button>
  );
}
