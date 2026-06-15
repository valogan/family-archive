import { getDriver } from "./db";

export async function initSchema(): Promise<void> {
  const driver = getDriver();
  const session = driver.session();

  try {
    await session.run(`
      CREATE INDEX person_id IF NOT EXISTS FOR (p:Person) ON (p.id)
    `);
    await session.run(`
      CREATE INDEX media_id IF NOT EXISTS FOR (m:Media) ON (m.id)
    `);
    await session.run(`
      CREATE INDEX person_name IF NOT EXISTS FOR (p:Person) ON (p.name)
    `);
    await session.run(`
      CREATE INDEX media_location IF NOT EXISTS FOR (m:Media) ON (m.location)
    `);
    await session.run(`
      CREATE INDEX media_date IF NOT EXISTS FOR (m:Media) ON (m.dateTaken)
    `);
    console.log("Neo4j schema initialized");
  } finally {
    await session.close();
  }
}

export async function seedDemo(): Promise<void> {
  const driver = getDriver();
  const session = driver.session();

  try {
    await session.run(`
      MATCH (n) DETACH DELETE n
    `);

    await session.run(`
      CREATE
        (p1:Person {id: "p1", name: "John Smith", birthDate: "1940-03-15", bio: "Grandfather. Engineer.", createdAt: datetime().toString()}),
        (p2:Person {id: "p2", name: "Mary Smith", birthDate: "1942-07-22", bio: "Grandmother. Teacher.", createdAt: datetime().toString()}),
        (p3:Person {id: "p3", name: "Robert Smith", birthDate: "1965-11-03", bio: "Father. Doctor.", createdAt: datetime().toString()}),
        (p4:Person {id: "p4", name: "Linda Smith", birthDate: "1967-04-18", bio: "Mother. Artist.", createdAt: datetime().toString()}),
        (p5:Person {id: "p5", name: "Alice Smith", birthDate: "1990-08-25", bio: "Daughter. Software developer.", createdAt: datetime().toString()}),
        (p6:Person {id: "p6", name: "James Smith", birthDate: "1993-01-12", bio: "Son. Architect.", createdAt: datetime().toString()}),

        (m1:Media {id: "m1", filename: "family_reunion.jpg", originalName: "family_reunion.jpg", mimeType: "image/jpeg", path: "/uploads/family_reunion.jpg", location: "Central Park, NYC", dateTaken: "2010-06-15", createdAt: datetime().toString()}),
        (m2:Media {id: "m2", filename: "wedding.jpg", originalName: "wedding.jpg", mimeType: "image/jpeg", path: "/uploads/wedding.jpg", location: "Chicago, IL", dateTaken: "1988-09-20", createdAt: datetime().toString()})

      CREATE
        (p1)-[:SPOUSE]->(p2),
        (p2)-[:SPOUSE]->(p1),
        (p1)-[:FATHER]->(p3),
        (p2)-[:MOTHER]->(p3),
        (p3)-[:SPOUSE]->(p4),
        (p4)-[:SPOUSE]->(p3),
        (p3)-[:FATHER]->(p5),
        (p4)-[:MOTHER]->(p5),
        (p3)-[:FATHER]->(p6),
        (p4)-[:MOTHER]->(p6),
        (p5)-[:SISTER]->(p6),
        (p6)-[:BROTHER]->(p5),

        (p1)-[:APPEARS_IN]->(m1),
        (p2)-[:APPEARS_IN]->(m1),
        (p3)-[:APPEARS_IN]->(m1),
        (p4)-[:APPEARS_IN]->(m1),
        (p5)-[:APPEARS_IN]->(m1),
        (p6)-[:APPEARS_IN]->(m1),
        (p3)-[:APPEARS_IN]->(m2),
        (p4)-[:APPEARS_IN]->(m2)
    `);
    console.log("Demo data seeded");
  } finally {
    await session.close();
  }
}

if (require.main === module) {
  initSchema()
    .then(() => seedDemo())
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}