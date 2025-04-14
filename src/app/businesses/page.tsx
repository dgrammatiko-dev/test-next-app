"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DataTable } from "@/components/DataTable";
import { Business } from "@/types";
import { useRouter } from "next/navigation";
import { EditModal } from "@/components/EditModal";
import { ColumnDef, CellContext } from "@tanstack/react-table";
import Link from "next/link";

// Create new business
async function createBusiness(
  newBusinessData: Omit<Business, "id">
): Promise<Business> {
  const res = await fetch(`http://localhost:4444/businesses`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newBusinessData),
  });
  if (!res.ok) {
    const errorData = await res.text();
    throw new Error(
      `Failed to create business: ${res.statusText} - ${errorData}`
    );
  }
  return res.json();
}

// Delete existing business
async function deleteBusiness(business: Business): Promise<Business> {
  const res = await fetch(`http://localhost:4444/businesses/${business.id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(business),
  });
  if (!res.ok) {
    const errorData = await res.text();
    throw new Error(
      `Failed to delete business: ${res.statusText} - ${errorData}`
    );
  }
  return res.json();
}

// Update existing business
async function updateBusiness(business: Business): Promise<Business> {
  const res = await fetch(`http://localhost:4444/businesses/${business.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(business),
  });
  if (!res.ok) {
    const errorData = await res.text();
    throw new Error(
      `Failed to update business: ${res.statusText} - ${errorData}`
    );
  }
  return res.json();
}

// Fetcher Function
async function fetchBusinesses(): Promise<Business[]> {
  const res = await fetch("http://localhost:4444/businesses");
  if (!res.ok) throw new Error("Network response was not ok");
  return res.json();
}

// Initial State for Create Form
const initialCreateFormState: Omit<Business, "id"> = {
  name: "",
  type: "bar",
  location: "",
};

export default function BusinessesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createFormState, setCreateFormState] = useState<Omit<Business, "id">>(
    initialCreateFormState
  );
  const [createFormError, setCreateFormError] = useState<string | null>(null);
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);

  // Delete
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
  const [editFormState, setEditFormState] = useState<Omit<Business, "id">>(
    initialCreateFormState
  );
  const [editFormError, setEditFormError] = useState<string | null>(null);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  const bussinessTypes = ["Bar", "Restaurant", "Club", "Hotel", "Cafe"];

  // Auth Check
  useEffect(() => {
    const authKey = sessionStorage.getItem("authKey");
    if (!authKey) router.replace("/");
  }, [router]);

  // Data Fetching
  const { data, isLoading, isError, error } = useQuery<Business[], Error>({
    queryKey: ["businesses"],
    queryFn: fetchBusinesses,
    enabled:
      typeof window !== "undefined" && !!sessionStorage.getItem("authKey"),
  });

  // Edit Modal
  const openEditModal = (business: Business) => {
    setEditingBusiness(business);
    setEditFormState({
      name: business.name,
      type: business.type,
      location: business.location,
    });
    setEditFormError(null);
    setIsEditModalOpen(true);
  };
  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingBusiness(null);
    setEditFormError(null);
    setIsSubmittingEdit(false);
  };
  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditFormState((prev) => ({ ...prev, [name]: value }));
  };
  const handleEditFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBusiness) return;
    setIsSubmittingEdit(true);
    setEditFormError(null);
    const updatedBusiness: Business = { ...editingBusiness, ...editFormState };
    try {
      await updateBusiness(updatedBusiness);
      await queryClient.invalidateQueries({ queryKey: ["businesses"] });
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
    setCreateFormState(initialCreateFormState);
    setCreateFormError(null);
    setIsCreateModalOpen(true);
  };
  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    setCreateFormError(null);
    setIsSubmittingCreate(false);
  };
  const handleCreateInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCreateFormState((prev) => ({ ...prev, [name]: value }));
  };
  const handleCreateFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingCreate(true);
    setCreateFormError(null);
    try {
      await createBusiness(createFormState);
      await queryClient.invalidateQueries({ queryKey: ["businesses"] });
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

  const businessColumns = useMemo<ColumnDef<Business>[]>(
    () => [
      { accessorKey: "id", header: "ID" },
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row, getValue }: CellContext<Business, unknown>) => {
          const businessId = row.original.id;
          const businessName = getValue<string>();
          return (
            <Link
              href={`/staff?bussinesId=${businessId}`}
              className="text-blue-600 hover:underline"
            >
              {businessName}
            </Link>
          );
        },
      },
      { accessorKey: "type", header: "Type" },
      { accessorKey: "location", header: "Location" },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }: CellContext<Business, unknown>) => {
          const business = row.original;
          const handleDelete = async () => {
            if (
              window.confirm(
                `Are you sure you want to delete ${business.name}?`
              )
            ) {
              setIsSubmittingDelete(true);
              try {
                await deleteBusiness(business);
                await queryClient.invalidateQueries({
                  queryKey: ["businesses"],
                });
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
                onClick={() => openEditModal(business)}
                className="btn-edit"
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
    [queryClient, isSubmittingDelete]
  );

  if (typeof window !== "undefined" && !sessionStorage.getItem("authKey")) {
    return <div className="text-center p-10">Unauthorized. Redirecting...</div>;
  }
  if (isLoading)
    return <div className="text-center p-10">Loading businesses...</div>;
  if (isError)
    return (
      <div className="text-center p-10 text-red-600">
        Error loading data: {error.message}
      </div>
    );

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">Businesses</h1>
        <button
          type="button"
          onClick={openCreateModal}
          className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          Create Business
        </button>
      </div>

      {data ? (
        <DataTable columns={businessColumns} data={data} />
      ) : (
        <p>No business data available.</p>
      )}

      <EditModal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        title={`Edit Business: ${editingBusiness?.name ?? ""}`}
      >
        <form onSubmit={handleEditFormSubmit}>
          {editFormError && (
            <p className="text-red-500 text-sm mb-4">{editFormError}</p>
          )}
          <div className="mb-4">
            <label
              htmlFor="edit-name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Name
            </label>
            <input
              type="text"
              id="edit-name"
              name="name"
              value={editFormState.name}
              onChange={handleEditInputChange}
              required
              className="input-field"
              disabled={isSubmittingEdit}
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="edit-type"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Type
            </label>
            <div className="appearance-none w-full relative">
              <select
                id="edit-type"
                name="type"
                value={editFormState.type}
                onChange={handleEditInputChange}
                required
                disabled={isSubmittingEdit}
                className="appearance-none input-field w-full py-1 px-2 bg-white"
              >
                {bussinessTypes.map((type) => (
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
          <div className="mb-6">
            <label
              htmlFor="edit-location"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Location
            </label>
            <input
              type="text"
              id="edit-location"
              name="location"
              value={editFormState.location}
              onChange={handleEditInputChange}
              required
              className="input-field"
              disabled={isSubmittingEdit}
            />
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
              disabled={isSubmittingEdit}
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
        title="Create New Business"
      >
        <form onSubmit={handleCreateFormSubmit}>
          {createFormError && (
            <p className="text-red-500 text-sm mb-4">{createFormError}</p>
          )}
          <div className="mb-4">
            <label
              htmlFor="create-name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Name
            </label>
            <input
              type="text"
              id="create-name"
              name="name"
              value={createFormState.name}
              onChange={handleCreateInputChange}
              required
              className="input-field"
              disabled={isSubmittingCreate}
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="create-type"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Type
            </label>
            <div className="appearance-none w-full relative">
              <select
                id="create-type"
                name="type"
                value={createFormState.type}
                onChange={handleCreateInputChange}
                required
                disabled={isSubmittingCreate}
                className="appearance-none input-field w-full py-1 px-2 bg-white"
              >
                {bussinessTypes.map((type) => (
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
          <div className="mb-6">
            <label
              htmlFor="create-location"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Location
            </label>
            <input
              type="text"
              id="create-location"
              name="location"
              value={createFormState.location}
              onChange={handleCreateInputChange}
              required
              className="input-field"
              disabled={isSubmittingCreate}
            />
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
              disabled={isSubmittingCreate}
              className="btn-submit"
            >
              {isSubmittingCreate ? "Creating..." : "Create Business"}
            </button>
          </div>
        </form>
      </EditModal>
    </div>
  );
}
