import { useState } from "react";
import type { TreeNode } from "./types";

type Props = {
  data: TreeNode[];
  setData: React.Dispatch<React.SetStateAction<TreeNode[]>>;
};

/* ---------------- Helper Functions ---------------- */

const addChildToTree = (
  nodes: TreeNode[],
  parentId: string,
  child: TreeNode
): TreeNode[] =>
  nodes.map((n) =>
    n.id === parentId
      ? { ...n, children: [...(n.children || []), child] }
      : {
          ...n,
          children: n.children
            ? addChildToTree(n.children, parentId, child)
            : n.children,
        }
  );

const renameNodeInTree = (
  nodes: TreeNode[],
  nodeId: string,
  newName: string
): TreeNode[] =>
  nodes.map((n) =>
    n.id === nodeId
      ? { ...n, name: newName }
      : {
          ...n,
          children: n.children
            ? renameNodeInTree(n.children, nodeId, newName)
            : n.children,
        }
  );

const deleteNodeFromTree = (nodes: TreeNode[], nodeId: string): TreeNode[] =>
  nodes
    .filter((n) => n.id !== nodeId)
    .map((n) => ({
      ...n,
      children: n.children
        ? deleteNodeFromTree(n.children, nodeId)
        : n.children,
    }));

const loadChildrenLazy = (nodes: TreeNode[], nodeId: string): TreeNode[] =>
  nodes.map((n) =>
    n.id === nodeId
      ? { ...n, isLoading: true }
      : {
          ...n,
          children: n.children
            ? loadChildrenLazy(n.children, nodeId)
            : n.children,
        }
  );

const setLoadedChildren = (
  nodes: TreeNode[],
  nodeId: string,
  children: TreeNode[]
): TreeNode[] =>
  nodes.map((n) =>
    n.id === nodeId
      ? { ...n, isLoading: false, children }
      : {
          ...n,
          children: n.children
            ? setLoadedChildren(n.children, nodeId, children)
            : n.children,
        }
  );

const removeNodeFromTree = (
  nodes: TreeNode[],
  nodeId: string
): { newTree: TreeNode[]; removedNode?: TreeNode } => {
  let removed: TreeNode | undefined;

  const newTree = nodes
    .map((n) => {
      if (n.id === nodeId) {
        removed = n;
        return null;
      }

      return {
        ...n,
        children: n.children
          ? removeNodeFromTree(n.children, nodeId).newTree
          : n.children,
      };
    })
    .filter(Boolean) as TreeNode[];

  return { newTree, removedNode: removed };
};

const insertNodeIntoTree = (
  nodes: TreeNode[],
  parentId: string,
  nodeToInsert: TreeNode
): TreeNode[] =>
  nodes.map((n) =>
    n.id === parentId
      ? { ...n, children: [...(n.children || []), nodeToInsert] }
      : {
          ...n,
          children: n.children
            ? insertNodeIntoTree(n.children, parentId, nodeToInsert)
            : n.children,
        }
  );

const isDescendant = (
  nodes: TreeNode[],
  parentId: string,
  childId: string
): boolean => {
  for (const n of nodes) {
    if (n.id === parentId && n.children) {
      if (n.children.some((c) => c.id === childId)) return true;

      for (const c of n.children) {
        if (isDescendant([c], c.id, childId)) return true;
      }
    }
  }
  return false;
};

/* ---------------- TreeView Component ---------------- */

export default function TreeView({ data, setData }: Props) {
  return (
    <div>
      {data.map((node) => (
        <TreeNodeItem key={node.id} node={node} data={data} setData={setData} />
      ))}
    </div>
  );
}

/* ---------------- Tree Node Component ---------------- */

function TreeNodeItem({
  node,
  data,
  setData,
}: {
  node: TreeNode;
  data: TreeNode[];
  setData: React.Dispatch<React.SetStateAction<TreeNode[]>>;
}) {
  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(node.name);

  const addChild = () => {
    const childName = prompt("Enter file name");
    if (!childName) return;

    const newNode: TreeNode = {
      id: Date.now().toString(),
      name: childName,
    };

    setData((prev) => addChildToTree(prev, node.id, newNode));
    setOpen(true);
  };

  const saveRename = () => {
    setData((prev) => renameNodeInTree(prev, node.id, name));
    setIsEditing(false);
  };

  const handleToggle = () => {
    if (!open && node.children === undefined) {
      setData((prev) => loadChildrenLazy(prev, node.id));

      setTimeout(() => {
        const fakeChildren: TreeNode[] = [
          { id: Date.now().toString(), name: "Lazy Child 1" },
          { id: (Date.now() + 1).toString(), name: "Lazy Child 2" },
        ];

        setData((prev) => setLoadedChildren(prev, node.id, fakeChildren));
      }, 1000);
    }

    setOpen(!open);
  };

  return (
    <div
      style={{ marginLeft: 20 }}
      draggable
      onDragStart={(e) => e.dataTransfer.setData("nodeId", node.id)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        const draggedId = e.dataTransfer.getData("nodeId");
        if (!draggedId || draggedId === node.id) return;

        setOpen(true); // auto expand target

        setData((prev) => {
          if (isDescendant(prev, draggedId, node.id)) return prev;

          const { newTree, removedNode } = removeNodeFromTree(prev, draggedId);
          if (!removedNode) return prev;

          return insertNodeIntoTree(newTree, node.id, removedNode);
        });
      }}
    >
      <span
        onClick={handleToggle}
        style={{ cursor: "pointer", marginRight: 6 }}
      >
        {node.children !== undefined || node.isLoading
          ? open
            ? "▼"
            : "▶"
          : "•"}
      </span>

      {isEditing ? (
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={saveRename}
          onKeyDown={(e) => e.key === "Enter" && saveRename()}
          autoFocus
        />
      ) : (
        <span onDoubleClick={() => setIsEditing(true)}>{node.name}</span>
      )}

      <button onClick={addChild} style={btnStyle}>
        +
      </button>

      <button
        onClick={() => {
          if (confirm("Delete this node and all its children?")) {
            setData((prev) => deleteNodeFromTree(prev, node.id));
          }
        }}
        style={btnStyle}
      >
        🗑
      </button>

      {node.isLoading && <div style={{ marginLeft: 20 }}>Loading...</div>}

      {open &&
        node.children?.map((child) => (
          <TreeNodeItem
            key={child.id}
            node={child}
            data={data}
            setData={setData}
          />
        ))}
    </div>
  );
}

const btnStyle = {
  marginLeft: 6,
  background: "transparent",
  border: "1px solid #888",
  borderRadius: 4,
  color: "#ccc",
  cursor: "pointer",
  padding: "0 6px",
  fontSize: 12,
};
