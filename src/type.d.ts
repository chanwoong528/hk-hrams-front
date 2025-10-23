interface Department {
  id: string;
  name: string;
  leader: string;
  memberCount: number;
  parentId: string | null;
  children?: Department[];
}
