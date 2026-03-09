import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/AuthContext";
import {
  getMembers,
  addMember,
  updateMember,
  deleteMember,
  reorderMembers,
} from "@/lib/api";
import type { Member } from "@/types";
import {
  PlusIcon,
  TrashIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  PencilIcon,
  CheckIcon,
  XIcon,
} from "lucide-react";

export function MemberManager() {
  const { isAdmin } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  // Add member form
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<Member | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadMembers = useCallback(async () => {
    try {
      const data = await getMembers();
      setMembers(data.sort((a, b) => a.sortOrder - b.sortOrder));
    } catch (err) {
      console.error("Error cargando miembros:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      void loadMembers();
    }
  }, [isAdmin, loadMembers]);

  if (!isAdmin) return null;

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setAddLoading(true);
    try {
      await addMember(newName.trim(), newEmail.trim() || undefined);
      setNewName("");
      setNewEmail("");
      await loadMembers();
    } catch (err) {
      console.error("Error agregando miembro:", err);
    } finally {
      setAddLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteMember(deleteTarget.id);
      setDeleteTarget(null);
      await loadMembers();
    } catch (err) {
      console.error("Error eliminando miembro:", err);
    } finally {
      setDeleteLoading(false);
    }
  }

  function startEdit(member: Member) {
    setEditingId(member.id);
    setEditName(member.name);
    setEditEmail(member.email ?? "");
  }

  async function saveEdit() {
    if (editingId === null) return;
    try {
      await updateMember(editingId, {
        name: editName.trim(),
        email: editEmail.trim() || null,
      });
      setEditingId(null);
      await loadMembers();
    } catch (err) {
      console.error("Error actualizando miembro:", err);
    }
  }

  async function handleMove(memberId: number, direction: "up" | "down") {
    const idx = members.findIndex((m) => m.id === memberId);
    if (idx === -1) return;
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === members.length - 1) return;

    const newMembers = [...members];
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    const temp = newMembers[idx];
    const swapItem = newMembers[swapIdx];
    if (!temp || !swapItem) return;
    newMembers[idx] = swapItem;
    newMembers[swapIdx] = temp;

    setMembers(newMembers);

    try {
      await reorderMembers(newMembers.map((m) => m.id));
    } catch (err) {
      console.error("Error reordenando:", err);
      await loadMembers();
    }
  }

  async function handleToggleActive(member: Member) {
    try {
      await updateMember(member.id, { active: !member.active });
      await loadMembers();
    } catch (err) {
      console.error("Error actualizando estado:", err);
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Gestión de Miembros</CardTitle>
          <CardDescription>
            Agrega, edita o reordena los miembros de la rotación.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Add member form */}
          <form
            onSubmit={(e) => { void handleAdd(e); }}
            className="flex flex-col sm:flex-row gap-2 mb-4"
          >
            <Input
              placeholder="Nombre"
              value={newName}
              onChange={(e) => { setNewName(e.target.value); }}
              className="flex-1"
            />
            <Input
              placeholder="Email (opcional)"
              type="email"
              value={newEmail}
              onChange={(e) => { setNewEmail(e.target.value); }}
              className="flex-1"
            />
            <Button type="submit" disabled={addLoading || !newName.trim()}>
              <PlusIcon />
              {addLoading ? "Agregando..." : "Agregar"}
            </Button>
          </form>

          <Separator className="my-4" />

          {/* Member list */}
          {loading ? (
            <p className="text-muted-foreground animate-pulse">
              Cargando miembros...
            </p>
          ) : members.length === 0 ? (
            <p className="text-muted-foreground">
              No hay miembros. Agrega el primero.
            </p>
          ) : (
            <ul className="space-y-2">
              {members.map((member, idx) => (
                <li
                  key={member.id}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 ${
                    member.active ? "bg-muted/50" : "bg-muted/20 opacity-60"
                  }`}
                >
                  {/* Order number */}
                  <span className="text-xs text-muted-foreground w-6 text-center font-mono">
                    {idx + 1}
                  </span>

                  {/* Name / Edit */}
                  {editingId === member.id ? (
                    <div className="flex flex-1 gap-2 items-center">
                      <Input
                        value={editName}
                        onChange={(e) => { setEditName(e.target.value); }}
                        className="h-7 text-sm"
                      />
                      <Input
                        value={editEmail}
                        onChange={(e) => { setEditEmail(e.target.value); }}
                        placeholder="Email"
                        className="h-7 text-sm"
                      />
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => { void saveEdit(); }}
                      >
                        <CheckIcon />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => { setEditingId(null); }}
                      >
                        <XIcon />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-1 items-center gap-2 min-w-0">
                      <span className="font-medium truncate">
                        {member.name}
                      </span>
                      {member.email && (
                        <span className="text-xs text-muted-foreground truncate hidden sm:inline">
                          {member.email}
                        </span>
                      )}
                      {!member.active && (
                        <Badge variant="secondary" className="text-[0.65rem]">
                          Inactivo
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  {editingId !== member.id && (
                    <div className="flex items-center gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => { void handleMove(member.id, "up"); }}
                        disabled={idx === 0}
                        title="Mover arriba"
                      >
                        <ChevronUpIcon />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => { void handleMove(member.id, "down"); }}
                        disabled={idx === members.length - 1}
                        title="Mover abajo"
                      >
                        <ChevronDownIcon />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => { startEdit(member); }}
                        title="Editar"
                      >
                        <PencilIcon />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => { void handleToggleActive(member); }}
                        title={member.active ? "Desactivar" : "Activar"}
                      >
                        {member.active ? (
                          <span className="text-[0.6rem]">OFF</span>
                        ) : (
                          <span className="text-[0.6rem]">ON</span>
                        )}
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon-xs"
                        onClick={() => { setDeleteTarget(member); }}
                        title="Eliminar"
                      >
                        <TrashIcon />
                      </Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              {deleteTarget
                ? `¿Estás seguro de que deseas eliminar a "${deleteTarget.name}" de la rotación? Esta acción no se puede deshacer.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setDeleteTarget(null); }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={deleteLoading}
              onClick={() => { void handleDelete(); }}
            >
              {deleteLoading ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
