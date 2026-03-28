"use client";

import * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  FileIcon,
  FolderIcon,
  FolderOpenIcon,
  Loader2,
  FolderPlus,
  Edit2,
  Trash2,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  GripVertical,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import path from "path-browserify";
import { cn } from "@/lib/utils";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import {
  useSortable,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useEditorSheetLayout } from "./use-editor-sheet-layout";

interface FileTreeNode {
  name: string;
  children?: string[];
}

interface SaveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (
    filePath: string,
    metadata: { title: string; description: string }
  ) => Promise<void>;
  initialFileName?: string;
  initialTitle?: string;
  initialDescription?: string;
  editMode?: {
    content: string;
    metadata: {
      title?: string;
      description?: string;
    };
    filePath: string;
  };
}

interface TreeItemProps {
  nodeId: string;
  node: FileTreeNode;
  allNodes: Record<string, FileTreeNode>;
  level: number;
  selectedPath: string;
  expandedPaths: Set<string>;
  onSelect: (path: string) => void;
  onToggleExpand: (path: string) => void;
  onDelete: (path: string, isFolder: boolean) => void;
  onRename: (path: string, newName: string, isFolder: boolean) => void;
  draggedItem?: string | null;
  dropIndicator?: {
    nodeId: string;
    position: "before" | "after" | "inside";
  } | null;
}

const TreeItem: React.FC<TreeItemProps> = ({
  nodeId,
  node,
  allNodes,
  level,
  selectedPath,
  expandedPaths,
  onSelect,
  onToggleExpand,
  onDelete,
  onRename,
  draggedItem,
  dropIndicator,
}) => {
  const isFolder = !!node.children;
  const isExpanded = expandedPaths.has(nodeId);
  const isSelected = selectedPath === nodeId;
  const [isRenaming, setIsRenaming] = React.useState(false);
  const [newName, setNewName] = React.useState(node.name);
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);

  const isRootDocs = nodeId === "docs";

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: nodeId,
    disabled: isRootDocs || isRenaming,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleRename = () => {
    if (newName.trim() && newName.trim() !== node.name) {
      onRename(nodeId, newName.trim(), isFolder);
    }
    setIsRenaming(false);
    setNewName(node.name);
  };

  const handleDelete = () => {
    onDelete(nodeId, isFolder);
    setShowDeleteDialog(false);
  };

  const showDropBefore =
    dropIndicator?.nodeId === nodeId && dropIndicator?.position === "before";
  const showDropAfter =
    dropIndicator?.nodeId === nodeId && dropIndicator?.position === "after";
  const showDropInside =
    dropIndicator?.nodeId === nodeId && dropIndicator?.position === "inside";

  return (
    <>
      {showDropBefore && (
        <div className="relative">
          <div
            className="h-0.5 bg-blue-500 rounded-full mx-2 my-1 shadow-lg"
            style={{ marginLeft: `${level * 20 + 16}px` }}
          >
            <div className="absolute -left-1 -top-1 w-2 h-2 bg-blue-500 rounded-full"></div>
            <div className="absolute -right-1 -top-1 w-2 h-2 bg-blue-500 rounded-full"></div>
          </div>
        </div>
      )}

      <div ref={setNodeRef} style={style}>
        <ContextMenu>
          <ContextMenuTrigger disabled={isRootDocs}>
            <div
              data-node-id={nodeId}
              className={cn(
                "flex items-center gap-1 px-2 py-1 text-sm cursor-pointer hover:bg-accent rounded-sm group relative transition-all duration-200",
                isSelected && "bg-accent",
                "select-none",
                isDragging && "opacity-50 shadow-lg z-50",
                draggedItem === nodeId && "ring-2 ring-blue-500 bg-blue-50",
                showDropInside &&
                  isFolder &&
                  "bg-blue-100 ring-2 ring-blue-500 ring-opacity-50 shadow-lg"
              )}
              style={{ paddingLeft: `${level * 20 + 8}px` }}
              onClick={() => {
                if (isRenaming) return;
                if (isFolder) {
                  onToggleExpand(nodeId);
                  onSelect(nodeId);
                } else {
                  const parentPath = nodeId.includes("/")
                    ? nodeId.substring(0, nodeId.lastIndexOf("/"))
                    : "docs";
                  onSelect(parentPath);
                }
              }}
            >
              {!isRootDocs && (
                <div
                  {...attributes}
                  {...listeners}
                  className="flex items-center justify-center w-4 h-4 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing transition-opacity duration-200 hover:bg-gray-200 rounded"
                  onClick={(e) => e.stopPropagation()}
                >
                  <GripVertical className="h-3 w-3 text-muted-foreground" />
                </div>
              )}

              {isFolder && (
                <div className="flex items-center justify-center w-4 h-4">
                  {isExpanded ? (
                    <ChevronDown className="h-3 w-3 transition-transform duration-200" />
                  ) : (
                    <ChevronRight className="h-3 w-3 transition-transform duration-200" />
                  )}
                </div>
              )}
              {!isFolder && <div className="w-4" />}

              {isFolder ? (
                isExpanded ? (
                  <FolderOpenIcon className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                ) : (
                  <FolderIcon className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                )
              ) : (
                <FileIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              )}

              {isRenaming ? (
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleRename();
                    } else if (e.key === "Escape") {
                      setIsRenaming(false);
                      setNewName(node.name);
                    }
                  }}
                  onBlur={handleRename}
                  className="h-6 px-1 text-xs flex-1 min-w-0"
                  autoFocus
                />
              ) : (
                <span className="truncate">{node.name}</span>
              )}

              {showDropInside && isFolder && (
                <>
                  <div className="absolute inset-0 border-2 border-blue-500 border-dashed rounded-sm pointer-events-none bg-blue-50/50 animate-pulse" />
                  <div className="absolute top-1 right-1 text-xs text-blue-600 font-medium pointer-events-none">
                    Drop here
                  </div>
                </>
              )}
            </div>
          </ContextMenuTrigger>

          {!isRootDocs && (
            <ContextMenuContent>
              <ContextMenuItem
                onClick={() => setIsRenaming(true)}
                className="flex items-center gap-2"
              >
                <Edit2 className="h-4 w-4" />
                Rename {isFolder ? "Folder" : "File"}
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="flex items-center gap-2 text-red-600 focus:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
                Delete {isFolder ? "Folder" : "File"}
              </ContextMenuItem>
            </ContextMenuContent>
          )}
        </ContextMenu>
      </div>

      {showDropAfter && (
        <div className="relative">
          <div
            className="h-0.5 bg-blue-500 rounded-full mx-2 my-1 shadow-lg"
            style={{ marginLeft: `${level * 20 + 16}px` }}
          >
            <div className="absolute -left-1 -top-1 w-2 h-2 bg-blue-500 rounded-full"></div>
            <div className="absolute -right-1 -top-1 w-2 h-2 bg-blue-500 rounded-full"></div>
          </div>
        </div>
      )}

      {isFolder && isExpanded && node.children && (
        <SortableContext
          items={node.children}
          strategy={verticalListSortingStrategy}
        >
          <div>
            {node.children.map((childId) => {
              const childNode = allNodes[childId];
              if (!childNode) return null;
              return (
                <TreeItem
                  key={childId}
                  nodeId={childId}
                  node={childNode}
                  allNodes={allNodes}
                  level={level + 1}
                  selectedPath={selectedPath}
                  expandedPaths={expandedPaths}
                  onSelect={onSelect}
                  onToggleExpand={onToggleExpand}
                  onDelete={onDelete}
                  onRename={onRename}
                  draggedItem={draggedItem}
                  dropIndicator={dropIndicator}
                />
              );
            })}
          </div>
        </SortableContext>
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Confirm Delete
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {isFolder ? "folder" : "file"} "
              {node.name}"?
              {isFolder &&
                " All files and subfolders inside it will also be deleted."}
              <br />
              <span className="text-red-600 font-medium">
                This action cannot be undone.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

const DragOverlayItem = ({
  nodeId,
  items,
}: {
  nodeId: string;
  items: Record<string, FileTreeNode>;
}) => {
  const node = items[nodeId];
  if (!node) return null;
  const isFolder = !!node.children;
  return (
    <div className="flex items-center gap-2 px-2 py-1 text-xs bg-background/95 border border-blue-500 rounded-md shadow-lg backdrop-blur-md max-w-[180px]">
      <div className="flex items-center gap-1 opacity-70">
        {isFolder ? (
          <FolderIcon className="h-3 w-3 text-yellow-500 flex-shrink-0" />
        ) : (
          <FileIcon className="h-3 w-3 text-blue-500 flex-shrink-0" />
        )}
      </div>
      <span className="truncate font-medium text-foreground">{node.name}</span>
    </div>
  );
};

export const SaveDialog = ({
  open,
  onOpenChange,
  onSave,
  initialFileName = "",
  initialTitle = "",
  initialDescription = "",
  editMode,
}: SaveDialogProps) => {
  const { sheetSide } = useEditorSheetLayout();
  const [items, setItems] = React.useState<Record<string, FileTreeNode>>({});
  const [isLoading, setIsLoading] = React.useState(true);
  const [fileName, setFileName] = React.useState(initialFileName);
  const [title, setTitle] = React.useState(initialTitle);
  const [description, setDescription] = React.useState(initialDescription);

  const normalizePath = (pathStr: string): string => {
    return pathStr.replace(/\\/g, "/");
  };

  const getInitialSelectedPath = () => {
    if (editMode?.filePath) {
      const normalizedPath = normalizePath(editMode.filePath);
      const pathParts = normalizedPath.replace(/\.mdx$/, "").split("/");
      if (pathParts.length > 1) {
        pathParts.pop();
        return pathParts.join("/");
      }
    }
    return "docs";
  };

  const getInitialFileName = () => {
    if (editMode?.filePath) {
      const normalizedPath = normalizePath(editMode.filePath);
      const pathParts = normalizedPath.replace(/\.mdx$/, "").split("/");
      return pathParts[pathParts.length - 1];
    }
    return initialFileName;
  };

  const [selectedPath, setSelectedPath] = React.useState(
    getInitialSelectedPath()
  );
  const [expandedPaths, setExpandedPaths] = React.useState<Set<string>>(
    new Set(["docs"])
  );

  React.useEffect(() => {
    setFileName(getInitialFileName());
    setTitle(initialTitle);
    setDescription(initialDescription);
    setSelectedPath(getInitialSelectedPath());
  }, [initialFileName, initialTitle, initialDescription, editMode]);

  const [isSaving, setIsSaving] = React.useState(false);
  const { toast } = useToast();
  const [newFolderName, setNewFolderName] = React.useState("");
  const [isCreatingFolder, setIsCreatingFolder] = React.useState(false);
  const [showNewFolderInput, setShowNewFolderInput] = React.useState(false);
  const [draggedItem, setDraggedItem] = React.useState<string | null>(null);
  const [dropIndicator, setDropIndicator] = React.useState<{
    nodeId: string;
    position: "before" | "after" | "inside";
  } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const fetchFileTree = React.useCallback(
    (preserveExpandedPaths = false) => {
      setIsLoading(true);
      fetch("/api/files")
        .then((res) => res.json())
        .then((data) => {
          if (data.tree) {
            const normalizedTree: Record<string, FileTreeNode> = {};
            Object.keys(data.tree).forEach((key) => {
              const normalizedKey = normalizePath(key);
              const node = data.tree[key];
              normalizedTree[normalizedKey] = {
                ...node,
                children: node.children?.map((child: string) =>
                  normalizePath(child)
                ),
              };
            });
            setItems(normalizedTree);
            if (!preserveExpandedPaths) {
              setExpandedPaths(new Set(["docs"]));
            }
          } else {
            throw new Error("Invalid data structure from API");
          }
        })
        .catch(() => {
          toast({
            variant: "destructive",
            title: "Failed to Load Folder Structure",
            description: "Unable to fetch folder structure. Please try again.",
          });
        })
        .finally(() => setIsLoading(false));
    },
    [toast]
  );

  React.useEffect(() => {
    if (open) fetchFileTree();
  }, [open, fetchFileTree]);

  const handleToggleExpand = (path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    setDraggedItem(event.active.id as string);
    setDropIndicator(null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      setDropIndicator(null);
      return;
    }
    const activeId = active.id as string;
    const overId = over.id as string;
    if (activeId === overId || overId.startsWith(activeId + "/")) {
      setDropIndicator(null);
      return;
    }
    const overNode = items[overId];
    if (!overNode) {
      setDropIndicator(null);
      return;
    }
    const isOverFolder = !!overNode.children;
    if (isOverFolder) {
      setDropIndicator({ nodeId: overId, position: "inside" });
      if (!expandedPaths.has(overId)) {
        setExpandedPaths((prev) => new Set([...prev, overId]));
      }
    } else {
      setDropIndicator({ nodeId: overId, position: "after" });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setDraggedItem(null);
    setDropIndicator(null);
    if (!over || active.id === over.id) return;

    const normalizedActiveId = normalizePath(active.id as string);
    const normalizedOverId = normalizePath(over.id as string);

    if (normalizedActiveId === "docs") return;
    if (
      normalizedActiveId === normalizedOverId ||
      normalizedOverId.startsWith(normalizedActiveId + "/")
    )
      return;

    const overNode = items[normalizedOverId];
    let targetPath = "";
    const dropPosition = dropIndicator?.position;

    if (normalizedOverId === "docs") {
      targetPath = "docs";
    } else if (dropPosition === "inside" && overNode?.children) {
      targetPath = normalizedOverId;
    } else if (dropPosition === "before" || dropPosition === "after") {
      targetPath = normalizedOverId.includes("/")
        ? normalizedOverId.substring(0, normalizedOverId.lastIndexOf("/"))
        : "docs";
    } else {
      targetPath = overNode?.children
        ? normalizedOverId
        : normalizedOverId.includes("/")
        ? normalizedOverId.substring(0, normalizedOverId.lastIndexOf("/"))
        : "docs";
    }

    try {
      const response = await fetch("/api/files", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "move",
          sourcePath: normalizedActiveId,
          targetPath,
        }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Failed to move item");
      }
      toast({ title: "Success", description: "Item moved successfully." });
      await fetchFileTree(true);
      if (targetPath !== "docs") {
        setExpandedPaths((prev) => new Set([...prev, targetPath]));
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to Move",
        description:
          error instanceof Error ? error.message : "An error occurred.",
      });
    }
  };

  const sanitizeName = (name: string): string =>
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\-_]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast({
        variant: "destructive",
        title: "Empty Folder Name",
        description: "Please enter a folder name.",
      });
      return;
    }
    const sanitized = sanitizeName(newFolderName);
    if (!sanitized) {
      toast({
        variant: "destructive",
        title: "Invalid Folder Name",
        description: "Use letters, numbers, hyphens, or underscores.",
      });
      return;
    }
    setIsCreatingFolder(true);
    const normalizedSelected = normalizePath(selectedPath);
    const folderPath =
      normalizedSelected === "docs"
        ? sanitized
        : `${normalizedSelected}/${sanitized}`;

    try {
      const response = await fetch("/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderPath }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Failed to create folder");
      }
      toast({
        title: "Success",
        description: `Folder "${newFolderName}" created.`,
      });
      setShowNewFolderInput(false);
      setNewFolderName("");
      await fetchFileTree(true);
      setExpandedPaths((prev) => new Set([...prev, selectedPath]));
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to Create Folder",
        description:
          error instanceof Error ? error.message : "An error occurred.",
      });
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const handleDelete = async (itemPath: string, isFolder: boolean) => {
    try {
      const response = await fetch("/api/files", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemPath, isFolder }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Failed to delete");
      }
      toast({
        title: "Success",
        description: `${isFolder ? "Folder" : "File"} deleted.`,
      });
      await fetchFileTree(true);
      if (selectedPath === itemPath || selectedPath.startsWith(itemPath + "/")) {
        const parentPath = itemPath.includes("/")
          ? itemPath.substring(0, itemPath.lastIndexOf("/"))
          : "docs";
        setSelectedPath(parentPath);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to Delete",
        description:
          error instanceof Error ? error.message : "An error occurred.",
      });
    }
  };

  const handleRename = async (
    oldPath: string,
    newName: string,
    isFolder: boolean
  ) => {
    const sanitized = sanitizeName(newName);
    if (!sanitized) {
      toast({
        variant: "destructive",
        title: "Invalid Name",
        description: "Use letters, numbers, hyphens, or underscores.",
      });
      return;
    }
    try {
      const response = await fetch("/api/files", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPath, newName: sanitized, isFolder }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Failed to rename");
      }
      toast({ title: "Success", description: "Renamed successfully." });
      await fetchFileTree(true);
      if (selectedPath === oldPath) {
        const parentPath = oldPath.includes("/")
          ? oldPath.substring(0, oldPath.lastIndexOf("/"))
          : "docs";
        setSelectedPath(
          parentPath === "docs" ? sanitized : `${parentPath}/${sanitized}`
        );
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to Rename",
        description:
          error instanceof Error ? error.message : "An error occurred.",
      });
    }
  };

  const handleSave = async () => {
    if (!fileName.trim()) {
      toast({
        variant: "destructive",
        title: "Empty File Name",
        description: "Please enter a file name.",
      });
      return;
    }
    if (!title.trim()) {
      toast({
        variant: "destructive",
        title: "Empty Title",
        description: "Please enter a document title.",
      });
      return;
    }
    const sanitizedFileName = sanitizeName(fileName.trim().replace(/\.mdx$/, ""));
    if (!sanitizedFileName) {
      toast({
        variant: "destructive",
        title: "Invalid File Name",
        description: "Use letters, numbers, hyphens, or underscores.",
      });
      return;
    }
    setIsSaving(true);
    const finalPath =
      selectedPath === "docs"
        ? `${sanitizedFileName}.mdx`
        : path.join(selectedPath, `${sanitizedFileName}.mdx`);

    try {
      await onSave(finalPath, {
        title: title.trim(),
        description: description.trim(),
      });
      onOpenChange(false);
    } catch {
      // Error handled by onSave
    } finally {
      setIsSaving(false);
    }
  };

  const formContent = (
    <div className="space-y-4 px-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="title">Document title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Document title"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description (optional)</Label>
        <Input
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Short description"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="filename">File name</Label>
        <div className="flex items-center">
          <Input
            id="filename"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            placeholder="new-file-name"
            className="rounded-r-none"
          />
          <span className="flex h-10 items-center rounded-r-md border border-l-0 border-input bg-muted px-3 text-sm text-muted-foreground">
            .mdx
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Use letters, numbers, hyphens (-), and underscores (_) only.
        </p>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Save location</Label>
          <Button
            variant="outline"
            size="sm"
            className="h-7"
            onClick={() => setShowNewFolderInput(!showNewFolderInput)}
          >
            <FolderPlus className="h-4 w-4 mr-1" />
            New folder
          </Button>
        </div>
        {showNewFolderInput && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="new-folder-name"
                onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
              />
              <Button
                onClick={handleCreateFolder}
                disabled={isCreatingFolder || !newFolderName.trim()}
                size="sm"
              >
                {isCreatingFolder && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create
              </Button>
            </div>
          </div>
        )}
        <ScrollArea className="h-48 rounded-md border">
          <div className="p-2">
            {isLoading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </div>
            ) : items.docs ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={items.docs.children || []}
                  strategy={verticalListSortingStrategy}
                >
                  {draggedItem && (
                    <div className="relative mb-2">
                      <div
                        className={cn(
                          "text-xs text-muted-foreground px-2 py-2 border border-dashed rounded transition-all",
                          dropIndicator?.nodeId === "docs" &&
                            dropIndicator?.position === "inside"
                            ? "bg-blue-100 border-blue-500 text-blue-700 dark:bg-blue-900/20"
                            : "bg-muted/50 border-muted-foreground/30"
                        )}
                      >
                        📁 Drop here to move to root docs folder
                      </div>
                    </div>
                  )}
                  <TreeItem
                    nodeId="docs"
                    node={items.docs}
                    allNodes={items}
                    level={0}
                    selectedPath={selectedPath}
                    expandedPaths={expandedPaths}
                    onSelect={setSelectedPath}
                    onToggleExpand={handleToggleExpand}
                    onDelete={handleDelete}
                    onRename={handleRename}
                    draggedItem={draggedItem}
                    dropIndicator={dropIndicator}
                  />
                </SortableContext>
                <DragOverlay>
                  {draggedItem ? (
                    <DragOverlayItem nodeId={draggedItem} items={items} />
                  ) : null}
                </DragOverlay>
              </DndContext>
            ) : (
              <div className="text-center text-muted-foreground p-4">
                No folder data available
              </div>
            )}
          </div>
        </ScrollArea>
        <p className="text-xs text-muted-foreground">
          Path:{" "}
          <code className="bg-muted px-1 py-0.5 rounded">
            content/docs/
            {selectedPath === "docs" ? "" : `${selectedPath}/`}
          </code>
        </p>
        <p className="text-xs text-muted-foreground">
          💡 Right-click to rename / delete • Drag (⋮⋮) to move items
        </p>
      </div>
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={sheetSide}
        className={cn(
          "flex flex-col gap-0 overflow-hidden p-0",
          sheetSide === "right"
            ? cn(
                "h-full",
                "md:w-[min(36rem,90vw)] md:max-w-[90vw]",
                "lg:w-[min(36rem,50vw)] lg:max-w-[50vw]"
              )
            : "h-[90dvh] max-h-[90dvh] w-full rounded-t-xl"
        )}
      >
        <SheetHeader className="px-4 pt-4 pb-3 border-b shrink-0">
          <SheetTitle>
            {editMode ? "Update document" : "Save document"}
          </SheetTitle>
          <SheetDescription>
            {editMode
              ? `Editing: ${editMode.filePath}`
              : "Choose a folder and file name to save your document."}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 h-0">
          {formContent}
        </ScrollArea>

        <SheetFooter className="px-4 py-3 border-t shrink-0 flex flex-row gap-2 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || isLoading || !fileName.trim() || !title.trim()}
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {editMode ? "Update" : "Save"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
