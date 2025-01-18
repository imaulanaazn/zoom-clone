export interface ILabelGroup {
  id: number;
  name: string;
  owner_id: string;
  image: string;
  members: number[];
}

export interface ILabel {
  id: number;
  name: string;
  owner_id: string;
  descriptor: number[];
  image: string;
}
