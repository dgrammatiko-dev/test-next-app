"use client";

import { ColumnDef } from "@tanstack/react-table";
import { StaffMember } from "@/types";

export const staffColumns: ColumnDef<StaffMember>[] = [
  {
    accessorKey: "id",
    header: "ID",
  },
  {
    accessorKey: "firstName",
    header: "First Name",
  },
  {
    accessorKey: "lastName",
    header: "Last Name",
  },
  {
    accessorKey: "position",
    header: "Position",
  },
  {
    accessorKey: "bussinesId",
    header: "Business ID",
  },
];
