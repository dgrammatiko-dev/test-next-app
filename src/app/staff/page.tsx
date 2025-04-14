"use client";

import React, { useEffect, useState, useMemo, Suspense } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DataTable } from "@/components/DataTable";
import { StaffMember, Business } from "@/types"; // Import Business type
import { useRouter, useSearchParams } from "next/navigation";
import { EditModal } from "@/components/EditModal";
import { ColumnDef, CellContext } from "@tanstack/react-table";

// Fetch Businesses for Select Dropdown
async function fetchBusinessesForSelect(): Promise<Business[]> {
  const res = await fetch("http://localhost:4444/businesses");
  if (!res.ok) throw new Error("Failed to fetch businesses");
  return res.json();
}

// Create new staff
async function createStaffMember(
  newStaffData: Omit<StaffMember, "id">
): Promise<StaffMember> {
  // Ensure bussinesId is a number before sending
  const payload = {
    ...newStaffData,
    bussinesId: Number(newStaffData.bussinesId),
  };
  const res = await fetch(`http://localhost:4444/staff`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.text();
    throw new Error(
      `Failed to create staff member: ${res.statusText} - ${errorData}`
    );
  }
  return res.json();
}

// Update existing staff
async function updateStaffMember(staff: StaffMember): Promise<StaffMember> {
  // Ensure bussinesId is a number before sending
  const payload = {
    ...staff,
    bussinesId: Number(staff.bussinesId),
  };
  const res = await fetch(`http://localhost:4444/staff/${staff.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.text();
    throw new Error(
      `Failed to update staff member: ${res.statusText} - ${errorData}`
    );
  }
  return res.json();
}

// Delete existing staff
async function deleteStaff(staff: StaffMember): Promise<StaffMember> {
  const res = await fetch(`http://localhost:4444/staff/${staff.id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(staff),
  });
  if (!res.ok) {
    const errorData = await res.text();
    throw new Error(`Failed to delete staff: ${res.statusText} - ${errorData}`);
  }
  try {
    return await res.json();
  } catch (error) {
    console.log("Error parsing JSON:", error);
    return staff;
  }
}

// Fetch Staff Function
async function fetchStaff(businessId: string | null): Promise<StaffMember[]> {
  let url = "http://localhost:4444/staff";
  if (businessId) {
    url += `?bussinesId=${businessId}`;
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error("Network response was not ok");
  return res.json();
}

// Initial state
const initialCreateStaffState: Omit<StaffMember, "id"> = {
  firstName: "",
  lastName: "",
  email: "",
  position: "kitchen",
  bussinesId: 0,
};

function StaffPageComponent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const businessIdParam = searchParams.get("bussinesId");

  // Edit
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [editFormState, setEditFormState] = useState<Omit<StaffMember, "id">>(
    initialCreateStaffState
  );
  const [editFormError, setEditFormError] = useState<string | null>(null);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Delete
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);

  // Create
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createFormState, setCreateFormState] = useState<
    Omit<StaffMember, "id">
  >({ ...initialCreateStaffState });
  const [createFormError, setCreateFormError] = useState<string | null>(null);
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);

  const StaffTypes = ["Kitchen", "Service", "PR"];

  // Auth Check
  useEffect(() => {
    const authKey = sessionStorage.getItem("authKey");
    if (!authKey) router.replace("/");
  }, [router]);

  const isAuthenticated =
  typeof window !== "undefined" && !!sessionStorage.getItem("authKey");

  const {
    data: staffData,
    isLoading: isLoadingStaff,
    isError: isErrorStaff,
    error: staffError,
  } = useQuery<StaffMember[], Error>({
    queryKey: ["staff", businessIdParam],
    queryFn: () => fetchStaff(businessIdParam),
    enabled: isAuthenticated,
  });

  // Fetch Businesses for dropdowns
  const {
    data: businessesData,
    isLoading: isLoadingBusinesses,
    isError: isErrorBusinesses,
    error: businessesError,
  } = useQuery<Business[], Error>({
    queryKey: ["businessesList"],
    queryFn: fetchBusinessesForSelect,
    enabled: isAuthenticated,
  });

  // Edit Modal
  const openEditModal = (staff: StaffMember) => {
    setEditingStaff(staff);
    setEditFormState({
      firstName: staff.firstName,
      lastName: staff.lastName,
      email: staff.email,
      position: staff.position,
      bussinesId: staff.bussinesId,
    });
    setEditFormError(null);
    setIsEditModalOpen(true);
  };
  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingStaff(null);
    setEditFormError(null);
    setIsSubmittingEdit(false);
  };
  const handleEditInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    const processedValue = name === "bussinesId" ? Number(value) : value;
    setEditFormState((prev) => ({ ...prev, [name]: processedValue }));
  };
  const handleEditFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff || !editFormState.bussinesId) {
      setEditFormError("Please select a valid business.");
      return;
    }
    setIsSubmittingEdit(true);
    setEditFormError(null);
    const updatedStaff: StaffMember = { ...editingStaff, ...editFormState };
    try {
      await updateStaffMember(updatedStaff);
      await queryClient.invalidateQueries({
        queryKey: ["staff", businessIdParam],
      });
      await queryClient.invalidateQueries({ queryKey: ["staff"] });
      closeEditModal();
    } catch (err) {
      console.error("Update failed:", err);
      setEditFormError(
        err instanceof Error ? err.message : "An unknown error occurred."
      );
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Create Modal
  const openCreateModal = () => {
    setCreateFormState({
      ...initialCreateStaffState,
      bussinesId: businessIdParam ? Number(businessIdParam) : 0,
    });
    setCreateFormError(null);
    setIsCreateModalOpen(true);
  };
  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    setCreateFormError(null);
    setIsSubmittingCreate(false);
  };
  const handleCreateInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    const processedValue = name === "bussinesId" ? Number(value) : value;
    setCreateFormState((prev) => ({ ...prev, [name]: processedValue }));
  };
  const handleCreateFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createFormState.bussinesId) {
      setCreateFormError("Please select a valid business.");
      return;
    }
    setIsSubmittingCreate(true);
    setCreateFormError(null);
    try {
      await createStaffMember(createFormState);
      await queryClient.invalidateQueries({
        queryKey: ["staff", businessIdParam],
      });
      await queryClient.invalidateQueries({ queryKey: ["staff"] });
      closeCreateModal();
    } catch (err) {
      console.error("Create failed:", err);
      setCreateFormError(
        err instanceof Error ? err.message : "An unknown error occurred."
      );
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  // Columns
  const staffColumns = useMemo<ColumnDef<StaffMember>[]>(
    () => [
      { accessorKey: "id", header: "ID" },
      { accessorKey: "firstName", header: "First Name" },
      { accessorKey: "lastName", header: "Last Name" },
      { accessorKey: "email", header: "Email" },
      { accessorKey: "position", header: "Position" },
      { accessorKey: "bussinesId", header: "Business ID" },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }: CellContext<StaffMember, unknown>) => {
          const staffMember = row.original;
          const handleDelete = async () => {
            if (
              window.confirm(
                `Are you sure you want to delete ${staffMember.firstName} ${staffMember.lastName}?`
              )
            ) {
              setIsSubmittingDelete(true);
              try {
                await deleteStaff(staffMember);
                await queryClient.invalidateQueries({
                  queryKey: ["staff", businessIdParam],
                });
                await queryClient.invalidateQueries({ queryKey: ["staff"] });
              } catch (err) {
                console.error("Delete failed:", err);
                alert(
                  `Delete failed: ${
                    err instanceof Error ? err.message : "Unknown error"
                  }`
                );
              } finally {
                setIsSubmittingDelete(false);
              }
            }
          };
          return (
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => openEditModal(staffMember)}
                className="btn-edit"
                disabled={isSubmittingEdit}
              >
                Edit
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="btn-delete"
                disabled={isSubmittingDelete}
              >
                {isSubmittingDelete ? "Deleting..." : "Delete"}
              </button>
            </div>
          );
        },
      },
    ],
    [queryClient, businessIdParam, isSubmittingDelete, isSubmittingEdit]
  );

  if (!isAuthenticated) {
    return <div className="text-center p-10">Unauthorized. Redirecting...</div>;
  }
  if (isLoadingStaff)
    return <div className="text-center p-10">Loading staff members...</div>;
  if (isErrorStaff)
    return (
      <div className="text-center p-10 text-red-600">
        Error loading staff data: {staffError.message}
      </div>
    );

  if (isLoadingBusinesses) return <div className="text-center p-10">Loading business list...</div>;
  if (isErrorBusinesses) return <div className="text-center p-10 text-red-600">Error loading businesses: {businessesError.message}</div>;
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">
          Staff Members{" "}
          {businessIdParam ? `(Business ID: ${businessIdParam})` : ""}
        </h1>
        <button
          type="button"
          onClick={openCreateModal}
          className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          disabled={isLoadingBusinesses || isErrorBusinesses}
        >
          {isLoadingBusinesses ? "Loading..." : "Create Staff"}
        </button>
      </div>

      {staffData ? (
        <DataTable columns={staffColumns} data={staffData} />
      ) : (
        <p>No staff data available.</p>
      )}

      <EditModal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        title={`Edit Staff: ${editingStaff?.firstName ?? ""} ${
          editingStaff?.lastName ?? ""
        }`}
      >
        <form onSubmit={handleEditFormSubmit}>
          {editFormError && (
            <p className="text-red-500 text-sm mb-4">{editFormError}</p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="edit-firstName" className="label-style">
                First Name
              </label>
              <input
                type="text"
                id="edit-firstName"
                name="firstName"
                value={editFormState.firstName}
                onChange={handleEditInputChange}
                required
                className="input-field"
                disabled={isSubmittingEdit}
              />
            </div>
            <div>
              <label htmlFor="edit-lastName" className="label-style">
                Last Name
              </label>
              <input
                type="text"
                id="edit-lastName"
                name="lastName"
                value={editFormState.lastName}
                onChange={handleEditInputChange}
                required
                className="input-field"
                disabled={isSubmittingEdit}
              />
            </div>
            <div>
              <label htmlFor="edit-email" className="label-style">
                Email
              </label>
              <input
                type="email"
                id="edit-email"
                name="email"
                value={editFormState.email}
                onChange={handleEditInputChange}
                required
                className="input-field"
                disabled={isSubmittingEdit}
              />
            </div>
            <div>
              <label htmlFor="edit-position" className="label-style">
                Position
              </label>
              <div className="appearance-none w-full relative">
                <select
                  id="edit-position"
                  name="position"
                  value={editFormState.position}
                  onChange={handleEditInputChange}
                  disabled={isSubmittingEdit}
                  required
                  className="appearance-none input-field w-full py-1 px-2 bg-white"
                >
                  {StaffTypes.map((type) => (
                    <option key={type} value={type.toLowerCase()}>
                      {type}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-0 top-0 bottom-0 flex items-center px-2 text-gray-700">
                  <svg
                    aria-hidden="true"
                    className="h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          <div>
            <label htmlFor="edit-bussinesId" className="label-style">
              Business
            </label>
            <div className="appearance-none w-full relative">
              <select
                id="edit-bussinesId"
                name="bussinesId"
                value={editFormState.bussinesId}
                onChange={handleEditInputChange}
                required
                className="appearance-none input-field w-full py-1 px-2 bg-white"
                disabled={
                  isSubmittingEdit || isLoadingBusinesses || isErrorBusinesses
                }
              >
                <option value="0" disabled>
                  {isLoadingBusinesses
                    ? "Loading..."
                    : isErrorBusinesses
                    ? "Error loading"
                    : "Select Business"}
                </option>
                {businessesData?.map((business) => (
                  <option key={business.id} value={business.id}>
                    {business.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-0 top-0 bottom-0 flex items-center px-2 text-gray-700">
                <svg
                  aria-hidden="true"
                  className="h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="modal-actions">
            <button
              type="button"
              onClick={closeEditModal}
              disabled={isSubmittingEdit}
              className="btn-cancel"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                isSubmittingEdit ||
                isLoadingBusinesses ||
                isErrorBusinesses ||
                !editFormState.bussinesId
              }
              className="btn-submit"
            >
              {isSubmittingEdit ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </EditModal>

      <EditModal
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        title="Create New Staff Member"
      >
        <form onSubmit={handleCreateFormSubmit}>
          {createFormError && (
            <p className="text-red-500 text-sm mb-4">{createFormError}</p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="create-firstName" className="label-style">
                First Name
              </label>
              <input
                type="text"
                id="create-firstName"
                name="firstName"
                value={createFormState.firstName}
                onChange={handleCreateInputChange}
                required
                className="input-field"
                disabled={isSubmittingCreate}
              />
            </div>
            <div>
              <label htmlFor="create-lastName" className="label-style">
                Last Name
              </label>
              <input
                type="text"
                id="create-lastName"
                name="lastName"
                value={createFormState.lastName}
                onChange={handleCreateInputChange}
                required
                className="input-field"
                disabled={isSubmittingCreate}
              />
            </div>
            <div>
              <label htmlFor="create-email" className="label-style">
                Email
              </label>
              <input
                type="email"
                id="create-email"
                name="email"
                value={createFormState.email}
                onChange={handleCreateInputChange}
                required
                className="input-field"
                disabled={isSubmittingCreate}
              />
            </div>
            <div>
              <label htmlFor="create-position" className="label-style">
                Position
              </label>
              <div className="appearance-none w-full relative">
                <select
                  id="create-position"
                  name="position"
                  value={createFormState.position}
                  onChange={handleCreateInputChange}
                  required
                  disabled={isSubmittingCreate}
                  className="appearance-none input-field w-full py-1 px-2 bg-white"
                >
                  {StaffTypes.map((type) => (
                    <option key={type} value={type.toLowerCase()}>
                      {type}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-0 top-0 bottom-0 flex items-center px-2 text-gray-700">
                  <svg
                    aria-hidden="true"
                    className="h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          <div>
            <label htmlFor="create-bussinesId" className="label-style">
              Business
            </label>
            <div className="appearance-none w-full relative">
              <select
                id="create-bussinesId"
                name="bussinesId"
                value={createFormState.bussinesId}
                onChange={handleCreateInputChange}
                required
                className="input-field appearance-none w-full py-1 px-2 bg-white"
                disabled={
                  isSubmittingCreate || isLoadingBusinesses || isErrorBusinesses
                }
              >
                <option value="0" disabled>
                  {isLoadingBusinesses
                    ? "Loading..."
                    : isErrorBusinesses
                    ? "Error loading"
                    : "Select Business"}
                </option>
                {businessesData?.map((business) => (
                  <option key={business.id} value={business.id}>
                    {business.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-0 top-0 bottom-0 flex items-center px-2 text-gray-700">
                <svg
                  aria-hidden="true"
                  className="h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="modal-actions">
            <button
              type="button"
              onClick={closeCreateModal}
              disabled={isSubmittingCreate}
              className="btn-cancel"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                isSubmittingCreate ||
                isLoadingBusinesses ||
                isErrorBusinesses ||
                !createFormState.bussinesId
              }
              className="btn-submit"
            >
              {isSubmittingCreate ? "Creating..." : "Create Staff"}
            </button>
          </div>
        </form>
      </EditModal>
    </div>
  );
}

export default function StaffPage() {
  return (
    <Suspense
      fallback={<div className="text-center p-10">Loading page...</div>}
    >
      <StaffPageComponent />
    </Suspense>
  );
}
