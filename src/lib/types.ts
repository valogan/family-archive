export interface Person {
  id: string;
  name: string;
  birthDate?: string;
  deathDate?: string;
  isLiving?: boolean;
  bio?: string;
  facts?: string[];
  summary?: string;
  createdAt: string;
}

export interface LivedAt {
  id: string;
  location: string;
  date?: string;
  moveIn?: string;
  moveOut?: string;
}

export interface LifeEvent {
  id: string;
  label: string;
  date?: string;
}

export interface MediaTag {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface MediaWithTags extends Media {
  people: { person: Person; tag: MediaTag | null }[];
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
  locations: LivedAt[];
  events: LifeEvent[];
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