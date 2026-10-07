import { getDriver } from "./db";
import { Person, Media, Relationship, PersonWithRelations, SearchResult, LivedAt } from "./types";
import { v4 as uuid } from "uuid";

export async function createPerson(
  data: Omit<Person, "id" | "createdAt">
): Promise<Person> {
  const driver = getDriver();
  const session = driver.session();
  const id = uuid();
  const createdAt = new Date().toISOString();

  const props: Record<string, any> = { id, name: data.name, createdAt };
  if (data.birthDate) props.birthDate = data.birthDate;
  if (data.deathDate) props.deathDate = data.deathDate;
  if (data.isLiving !== undefined) props.isLiving = data.isLiving;
  if (data.bio) props.bio = data.bio;
  if (data.facts) props.facts = data.facts;

  const keys = Object.keys(props);
  const setClause = keys.map((k) => `p.${k} = $${k}`).join(", ");

  try {
    const result = await session.run(
      `
      CREATE (p:Person)
      SET ${setClause}
      RETURN p
    `,
      props
    );
    const record = result.records[0];
    return record.get("p").properties as Person;
  } finally {
    await session.close();
  }
}

export async function getPerson(id: string): Promise<PersonWithRelations | null> {
  const driver = getDriver();
  const session = driver.session();

  try {
    const result = await session.run(
      `
      MATCH (p:Person {id: $id})
      OPTIONAL MATCH (p)-[r]->(related:Person)
      WHERE type(r) IN [
        "MOTHER","FATHER","SISTER","BROTHER","DAUGHTER","SON",
        "SPOUSE","GRANDMOTHER","GRANDFATHER","AUNT","UNCLE","COUSIN"
      ]
      OPTIONAL MATCH (p)-[:APPEARS_IN]->(m:Media)
      OPTIONAL MATCH (p)-[l:LIVED_AT]->(loc:Location)
      RETURN p,
        collect(DISTINCT {person: related, type: type(r)}) as relationships,
        collect(DISTINCT m) as media,
        collect(DISTINCT {location: loc.name, date: l.date}) as locations
    `,
      { id }
    );

    if (result.records.length === 0) return null;

    const record = result.records[0];
    const person = record.get("p").properties as Person;
    const relationships = record
      .get("relationships")
      .filter((r: any) => r.person !== null)
      .map((r: any) => ({
        person: r.person.properties as Person,
        type: r.type,
      }));
    const media = record
      .get("media")
      .filter((m: any) => m !== null)
      .map((m: any) => m.properties as Media);
    const locations = record
      .get("locations")
      .filter((l: any) => l.location !== null)
      .map((l: any) => ({ location: l.location, date: l.date }) as LivedAt);

    return { ...person, relationships, media, locations };
  } finally {
    await session.close();
  }
}

export async function getAllPeople(): Promise<Person[]> {
  const driver = getDriver();
  const session = driver.session();

  try {
    const result = await session.run(`
      MATCH (p:Person)
      RETURN p
      ORDER BY p.name
    `);
    return result.records.map((r) => r.get("p").properties as Person);
  } finally {
    await session.close();
  }
}

export async function updatePerson(
  id: string,
  data: Partial<Omit<Person, "id" | "createdAt">>
): Promise<Person | null> {
  const driver = getDriver();
  const session = driver.session();

  try {
    const setClauses: string[] = [];
    const params: Record<string, any> = { id };

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        setClauses.push(`p.${key} = $${key}`);
        params[key] = value;
      }
    }

    if (setClauses.length === 0) return null;

    const result = await session.run(
      `
      MATCH (p:Person {id: $id})
      SET ${setClauses.join(", ")}
      RETURN p
    `,
      params
    );

    if (result.records.length === 0) return null;
    return result.records[0].get("p").properties as Person;
  } finally {
    await session.close();
  }
}

export async function deletePerson(id: string): Promise<boolean> {
  const driver = getDriver();
  const session = driver.session();

  try {
    const result = await session.run(
      `
      MATCH (p:Person {id: $id})
      DETACH DELETE p
      RETURN count(p) as deleted
    `,
      { id }
    );
    return result.records[0].get("deleted").toNumber() > 0;
  } finally {
    await session.close();
  }
}

export async function searchPeople(query: string): Promise<Person[]> {
  const driver = getDriver();
  const session = driver.session();

  try {
    const result = await session.run(
      `
      MATCH (p:Person)
      WHERE toLower(p.name) CONTAINS toLower($query)
         OR toLower(p.bio) CONTAINS toLower($query)
         OR ANY(f IN p.facts WHERE toLower(f) CONTAINS toLower($query))
         OR EXISTS {
              MATCH (p)-[:LIVED_AT]->(loc:Location)
              WHERE toLower(loc.name) CONTAINS toLower($query)
            }
      RETURN p
      ORDER BY p.name
    `,
      { query }
    );
    return result.records.map((r) => r.get("p").properties as Person);
  } finally {
    await session.close();
  }
}

export async function createRelationship(
  fromId: string,
  toId: string,
  type: string
): Promise<boolean> {
  const driver = getDriver();
  const session = driver.session();

  try {
    const validTypes = [
      "MOTHER", "FATHER", "SISTER", "BROTHER", "DAUGHTER", "SON",
      "SPOUSE", "GRANDMOTHER", "GRANDFATHER", "AUNT", "UNCLE", "COUSIN",
    ];
    if (!validTypes.includes(type)) return false;

    await session.run(
      `
      MATCH (a:Person {id: $fromId}), (b:Person {id: $toId})
      MERGE (a)-[r:${type}]->(b)
    `,
      { fromId, toId }
    );
    return true;
  } finally {
    await session.close();
  }
}

export async function deleteRelationship(
  fromId: string,
  toId: string,
  type: string
): Promise<boolean> {
  const driver = getDriver();
  const session = driver.session();

  try {
    await session.run(
      `
      MATCH (a:Person {id: $fromId})-[r:${type}]->(b:Person {id: $toId})
      DELETE r
    `,
      { fromId, toId }
    );
    return true;
  } finally {
    await session.close();
  }
}

export async function addLivedAt(
  personId: string,
  location: string,
  date: string
): Promise<boolean> {
  const driver = getDriver();
  const session = driver.session();

  try {
    const result = await session.run(
      `
      MATCH (p:Person {id: $personId})
      MERGE (loc:Location {name: $location})
      MERGE (p)-[r:LIVED_AT {date: $date}]->(loc)
      RETURN p.id as id
    `,
      { personId, location, date }
    );
    return result.records.length > 0;
  } finally {
    await session.close();
  }
}

export async function removeLivedAt(
  personId: string,
  location: string,
  date: string
): Promise<boolean> {
  const driver = getDriver();
  const session = driver.session();

  try {
    await session.run(
      `
      MATCH (p:Person {id: $personId})-[r:LIVED_AT {date: $date}]->(loc:Location {name: $location})
      DELETE r
    `,
      { personId, location, date }
    );
    return true;
  } finally {
    await session.close();
  }
}

export async function getRelationships(personId: string): Promise<Relationship[]> {
  const driver = getDriver();
  const session = driver.session();

  try {
    const result = await session.run(
      `
      MATCH (p:Person {id: $personId})-[r]->(related:Person)
      WHERE type(r) IN [
        "MOTHER","FATHER","SISTER","BROTHER","DAUGHTER","SON",
        "SPOUSE","GRANDMOTHER","GRANDFATHER","AUNT","UNCLE","COUSIN"
      ]
      RETURN p.id as from, related.id as to, type(r) as type
    `,
      { personId }
    );
    return result.records.map((r) => ({
      from: r.get("from"),
      to: r.get("to"),
      type: r.get("type"),
    }));
  } finally {
    await session.close();
  }
}

export async function createMedia(
  data: Omit<Media, "id" | "createdAt">
): Promise<Media> {
  const driver = getDriver();
  const session = driver.session();
  const id = uuid();
  const createdAt = new Date().toISOString();

  try {
    const result = await session.run(
      `
      CREATE (m:Media {
        id: $id,
        filename: $filename,
        originalName: $originalName,
        mimeType: $mimeType,
        path: $path,
        location: $location,
        dateTaken: $dateTaken,
        createdAt: $createdAt
      })
      RETURN m
    `,
      { id, ...data, createdAt }
    );
    return result.records[0].get("m").properties as Media;
  } finally {
    await session.close();
  }
}

export async function getMedia(id: string): Promise<Media | null> {
  const driver = getDriver();
  const session = driver.session();

  try {
    const result = await session.run(
      `
      MATCH (m:Media {id: $id})
      RETURN m
    `,
      { id }
    );
    if (result.records.length === 0) return null;
    const record = result.records[0];
    return record.get("m").properties as Media;
  } finally {
    await session.close();
  }
}

export async function getAllMedia(): Promise<Media[]> {
  const driver = getDriver();
  const session = driver.session();

  try {
    const result = await session.run(`
      MATCH (m:Media)
      RETURN m
      ORDER BY m.dateTaken DESC
    `);
    return result.records.map((r) => r.get("m").properties as Media);
  } finally {
    await session.close();
  }
}

export async function linkPersonToMedia(
  personId: string,
  mediaId: string
): Promise<boolean> {
  const driver = getDriver();
  const session = driver.session();

  try {
    await session.run(
      `
      MATCH (p:Person {id: $personId}), (m:Media {id: $mediaId})
      MERGE (p)-[:APPEARS_IN]->(m)
    `,
      { personId, mediaId }
    );
    return true;
  } finally {
    await session.close();
  }
}

export async function searchMedia(
  query: string,
  location?: string,
  dateFrom?: string,
  dateTo?: string
): Promise<Media[]> {
  const driver = getDriver();
  const session = driver.session();

  try {
    let conditions: string[] = [];
    const params: Record<string, any> = {};

    if (query) {
      conditions.push(
        "(toLower(m.originalName) CONTAINS toLower($query) OR toLower(m.location) CONTAINS toLower($query))"
      );
      params.query = query;
    }
    if (location) {
      conditions.push("toLower(m.location) CONTAINS toLower($location)");
      params.location = location;
    }
    if (dateFrom) {
      conditions.push("m.dateTaken >= $dateFrom");
      params.dateFrom = dateFrom;
    }
    if (dateTo) {
      conditions.push("m.dateTaken <= $dateTo");
      params.dateTo = dateTo;
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const result = await session.run(
      `
      MATCH (m:Media)
      ${whereClause}
      RETURN m
      ORDER BY m.dateTaken DESC
    `,
      params
    );
    return result.records.map((r) => r.get("m").properties as Media);
  } finally {
    await session.close();
  }
}

export async function fullSearch(query: string): Promise<SearchResult> {
  const [people, media] = await Promise.all([
    searchPeople(query),
    searchMedia(query),
  ]);
  return { people, media };
}

export async function advancedSearch(params: {
  query?: string;
  location?: string;
  dateFrom?: string;
  dateTo?: string;
  personIds?: string[];
}): Promise<SearchResult> {
  const driver = getDriver();
  const session = driver.session();

  try {
    let mediaIds: string[] = [];
    let people: Person[] = [];

    if (params.personIds && params.personIds.length > 0) {
      const mediaResult = await session.run(
        `
        MATCH (p:Person)-[:APPEARS_IN]->(m:Media)
        WHERE p.id IN $personIds
        RETURN DISTINCT m.id as id
      `,
        { personIds: params.personIds }
      );
      mediaIds = mediaResult.records.map((r) => r.get("id"));
    }

    let mediaConditions: string[] = [];
    const mediaParams: Record<string, any> = {};

    if (mediaIds.length > 0) {
      mediaConditions.push("m.id IN $mediaIds");
      mediaParams.mediaIds = mediaIds;
    }
    if (params.query) {
      mediaConditions.push(
        "(toLower(m.originalName) CONTAINS toLower($query) OR toLower(m.location) CONTAINS toLower($query))"
      );
      mediaParams.query = params.query;
    }
    if (params.location) {
      mediaConditions.push("toLower(m.location) CONTAINS toLower($location)");
      mediaParams.location = params.location;
    }
    if (params.dateFrom) {
      mediaConditions.push("m.dateTaken >= $dateFrom");
      mediaParams.dateFrom = params.dateFrom;
    }
    if (params.dateTo) {
      mediaConditions.push("m.dateTaken <= $dateTo");
      mediaParams.dateTo = params.dateTo;
    }

    const mediaWhere =
      mediaConditions.length > 0 ? `WHERE ${mediaConditions.join(" AND ")}` : "";

    const mediaResult = await session.run(
      `
      MATCH (m:Media)
      ${mediaWhere}
      RETURN m
      ORDER BY m.dateTaken DESC
    `,
      mediaParams
    );

    if (params.query || params.personIds) {
      let personConditions: string[] = [];
      const personParams: Record<string, any> = {};

      if (params.query) {
        personConditions.push(
          "(toLower(p.name) CONTAINS toLower($query) OR toLower(p.bio) CONTAINS toLower($query))"
        );
        personParams.query = params.query;
      }
      if (params.personIds && params.personIds.length > 0) {
        personConditions.push("p.id IN $personIds");
        personParams.personIds = params.personIds;
      }

      if (personConditions.length > 0) {
        const personResult = await session.run(
          `
          MATCH (p:Person)
          WHERE ${personConditions.join(" AND ")}
          RETURN p
          ORDER BY p.name
        `,
          personParams
        );
        people = personResult.records.map((r) => r.get("p").properties as Person);
      }
    }

    return {
      people,
      media: mediaResult.records.map((r) => r.get("m").properties as Media),
    };
  } finally {
    await session.close();
  }
}