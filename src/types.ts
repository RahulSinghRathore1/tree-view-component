export type TreeNode = {
  id: string;
  name: string;
  children?: TreeNode[];
  isLoading?: boolean;
};
