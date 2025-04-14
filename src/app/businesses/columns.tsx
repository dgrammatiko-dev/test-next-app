"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Business } from "@/types";

export const businessColumns: ColumnDef<Business>[] = [
  {
    accessorKey: "id",
    header: "ID",
  },
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "type",
    header: "Type",
  },
  {
    accessorKey: "location",
    header: "Location",
  },
];
