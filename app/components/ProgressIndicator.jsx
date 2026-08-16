import * as React from "react";

export default function ProgressIndicator({ progress, color }) {
  return (
    <div className={`${color} flex overflow-hidden flex-col w-10 bg-opacity-20 rounded-[888px]`}>
      <div
        className={`${color} flex shrink-0 h-2 rounded-[888px]`}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}