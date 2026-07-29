"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ConfirmDialog,
  Dialog,
  Input,
  buttonVariants,
  toast,
} from "@/components/ui";
import {
  createContactPerson,
  deleteContactPerson,
  updateContactPerson,
} from "@/features/dealership/api";
import type { KeyContact, KeyContactInput } from "@/features/dealership/types";
import { displayValue } from "@/features/dealership/types";
import { toAuthErrorMessage } from "@/features/auth/client-auth";
import { cn } from "@/lib/utils/cn";

export function DealershipContactsSection({
  contacts,
  onChanged,
}: {
  contacts: KeyContact[];
  onChanged?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<KeyContact | null>(null);
  const [pendingDelete, setPendingDelete] = useState<KeyContact | null>(null);
  const [deleting, setDeleting] = useState(false);

  function openAdd() {
    setEditing(null);
    setOpen(true);
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteContactPerson(pendingDelete.id);
      toast.success("Contact deleted");
      setPendingDelete(null);
      onChanged?.();
    } catch (err) {
      toast.error(toAuthErrorMessage(err, "Failed to delete contact"));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Card className="flex min-h-0 flex-col">
      <CardHeader>
        <CardTitle>Contact Persons</CardTitle>
        <button
          type="button"
          onClick={openAdd}
          className={cn(
            buttonVariants({ variant: "link", size: "sm" }),
            "h-auto p-0",
          )}
        >
          Manage
        </button>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        {contacts.length === 0 ? (
          <p className="flex flex-1 items-center justify-center py-8 text-center text-sm text-[var(--color-text-muted)]">
            No contact persons added yet.
          </p>
        ) : (
          <ul className="min-h-0 flex-1 divide-y divide-[var(--color-border)] overflow-y-auto">
            {contacts.map((contact) => (
              <li
                key={contact.id}
                className="flex items-start justify-between gap-2 py-3 first:pt-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[var(--color-heading)]">
                    {displayValue(contact.name)}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-[var(--color-text-muted)]">
                    {[
                      displayValue(contact.designation),
                      displayValue(contact.email),
                      displayValue(contact.phone),
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  <Badge
                    className="mt-2"
                    variant={contact.isActive ? "success" : "muted"}
                  >
                    {contact.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditing(contact);
                      setOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Delete ${contact.name}`}
                    onClick={() => setPendingDelete(contact)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <Button
          variant="secondary"
          fullWidth
          className="mt-auto border-[var(--color-primary-soft)] bg-[var(--color-primary-soft)] text-[var(--color-primary)] hover:bg-[var(--color-primary-soft)]"
          onClick={openAdd}
        >
          <Plus />
          Add New Contact
        </Button>
      </CardContent>

      <ContactDialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setEditing(null);
        }}
        contact={editing}
        onSaved={onChanged}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(next) => {
          if (!next) setPendingDelete(null);
        }}
        description={
          pendingDelete
            ? `Delete contact “${pendingDelete.name}”? This cannot be undone.`
            : undefined
        }
        isLoading={deleting}
        onConfirm={confirmDelete}
      />
    </Card>
  );
}

function ContactDialog({
  open,
  onOpenChange,
  contact,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: KeyContact | null;
  onSaved?: () => void;
}) {
  const isEdit = Boolean(contact);

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Edit contact" : "Add contact"}
    >
      {open ? (
        <ContactForm
          key={contact?.id ?? "new"}
          contact={contact}
          onOpenChange={onOpenChange}
          onSaved={onSaved}
        />
      ) : null}
    </Dialog>
  );
}

function formFromContact(contact: KeyContact | null): KeyContactInput {
  if (!contact) {
    return {
      name: "",
      email: "",
      phone: "",
      designation: "",
      isActive: true,
    };
  }
  return {
    name: contact.name,
    email: contact.email,
    phone: contact.phone,
    designation: contact.designation,
    isActive: contact.isActive,
  };
}

function ContactForm({
  contact,
  onOpenChange,
  onSaved,
}: {
  contact: KeyContact | null;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}) {
  const [form, setForm] = useState<KeyContactInput>(() =>
    formFromContact(contact),
  );
  const [isLoading, setIsLoading] = useState(false);
  const isEdit = Boolean(contact);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.includes("@") || !form.phone.trim()) {
      toast.error("Enter name, email, and phone");
      return;
    }
    setIsLoading(true);
    try {
      if (isEdit && contact) {
        await updateContactPerson(contact.id, {
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          designation: form.designation.trim(),
          isActive: form.isActive ?? true,
        });
        toast.success("Contact updated");
      } else {
        await createContactPerson({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          designation: form.designation.trim(),
        });
        toast.success("Contact added");
      }
      onOpenChange(false);
      onSaved?.();
    } catch (err) {
      toast.error(toAuthErrorMessage(err, "Failed to save contact"));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
      <Input
        label="Name"
        value={form.name}
        onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
        required
      />
      <Input
        label="Email"
        type="email"
        value={form.email}
        onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
        required
      />
      <Input
        label="Phone"
        value={form.phone}
        onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
        required
      />
      <Input
        label="Designation"
        value={form.designation}
        onChange={(e) =>
          setForm((p) => ({ ...p, designation: e.target.value }))
        }
        required
      />
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={() => onOpenChange(false)}
        >
          Cancel
        </Button>
        <Button type="submit" isLoading={isLoading}>
          Save
        </Button>
      </div>
    </form>
  );
}
