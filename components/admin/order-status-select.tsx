"use client";

import { inputClass } from "@/components/admin/ui";

export function OrderStatusSelect({ statuses, value }: { statuses: string[]; value: string }) {
  return (
    <select
      name="status"
      defaultValue={value}
      className={inputClass}
      onChange={(event) => event.currentTarget.form?.requestSubmit()}
    >
      {statuses.map((status) => (
        <option key={status} value={status}>
          {status}
        </option>
      ))}
    </select>
  );
}
