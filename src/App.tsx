import { useState } from "react";
import type { TreeNode } from "./types";
import TreeView from "./TreeView";

const initialData: TreeNode[] = [
  {
    id: "1",
    name: "File",
    children: [
      {
        id: "2",
        name: "Sub File",
      },
    ],
  },
];

function App() {
  const [treeData, setTreeData] = useState<TreeNode[]>(initialData);

  return (
    <div style={{ padding: 5 }}>
      <h2>Tree View</h2>
      <TreeView data={treeData} setData={setTreeData} />
    </div>
  );
}

export default App;
