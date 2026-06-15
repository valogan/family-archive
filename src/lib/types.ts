export interface Person {
  id: string;
  name: string;
  birthDate?: string;
  deathDate?: string;
  bio?: string;
  createdAt: string;
}

export interface Media {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  path: string;
  location?: string;
  dateTaken?: string;
  createdAt: string;
}

export interface Relationship {
  from: string;
  to: string;
  type: RelationshipType;
}

export type RelationshipType =
  | "MOTHER"
  | "FATHER"
  | "SISTER"
  | "BROTHER"
  | "DAUGHTER"
  | "SON"
  | "SPOUSE"
  | "GRANDMOTHER"
  | "GRANDFATHER"
  | "AUNT"
  | "UNCLE"
  | "COUSIN";

export interface PersonWithRelations extends Person {
  relationships: { person: Person; type: RelationshipType }[];
  media: Media[];
}

export interface SearchResult {
  people: Person[];
  media: Media[];
}

export interface LLMConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}