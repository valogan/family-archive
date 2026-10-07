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
    await session.run(`
      CREATE INDEX location_name IF NOT EXISTS FOR (l:Location) ON (l.name)
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
        (p1:Person {id: "p1", name: "John Smith", birthDate: "1940-03-15", deathDate: "2018-01-05", isLiving: false, bio: "Grandfather. Engineer.", facts: ["Served in the Navy", "Built model trains", "Loved big band music"], createdAt: toString(datetime())}),
        (p2:Person {id: "p2", name: "Mary Smith", birthDate: "1942-07-22", deathDate: "2020-11-30", isLiving: false, bio: "Grandmother. Teacher.", facts: ["Taught 4th grade for 30 years", "Made the best apple pie"], createdAt: toString(datetime())}),
        (p3:Person {id: "p3", name: "Robert Smith", birthDate: "1965-11-03", isLiving: true, bio: "Father. Doctor.", facts: ["Cardiologist", "Runs marathons"], createdAt: toString(datetime())}),
        (p4:Person {id: "p4", name: "Linda Smith", birthDate: "1967-04-18", isLiving: true, bio: "Mother. Artist.", facts: ["Watercolor painter", "Grew up on a farm"], createdAt: toString(datetime())}),
        (p5:Person {id: "p5", name: "Alice Smith", birthDate: "1990-08-25", isLiving: true, bio: "Daughter. Software developer.", facts: ["Plays the violin"], createdAt: toString(datetime())}),
        (p6:Person {id: "p6", name: "James Smith", birthDate: "1993-01-12", isLiving: true, bio: "Son. Architect.", facts: ["Eagle Scout"], createdAt: toString(datetime())}),

        (lex:Location {name: "Lexington, KY"}),
        (chi:Location {name: "Chicago, IL"}),
        (nyc:Location {name: "New York, NY"}),

        (m1:Media {id: "m1", filename: "family_reunion.jpg", originalName: "family_reunion.jpg", mimeType: "image/jpeg", path: "/uploads/family_reunion.jpg", location: "Central Park, NYC", dateTaken: "2010-06-15", createdAt: toString(datetime())}),
        (m2:Media {id: "m2", filename: "wedding.jpg", originalName: "wedding.jpg", mimeType: "image/jpeg", path: "/uploads/wedding.jpg", location: "Chicago, IL", dateTaken: "1988-09-20", createdAt: toString(datetime())})

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

        (p1)-[:LIVED_AT {id: "lv1", date: "1940-03-15"}]->(chi),
        (p1)-[:LIVED_AT {id: "lv2", date: "1965-11-03"}]->(chi),
        (p1)-[:LIVED_AT {id: "lv3", date: "1975-06-01"}]->(nyc),
        (p2)-[:LIVED_AT {id: "lv4", date: "1942-07-22"}]->(chi),
        (p2)-[:LIVED_AT {id: "lv5", date: "1975-06-01"}]->(nyc),
        (p3)-[:LIVED_AT {id: "lv6", date: "1965-11-03"}]->(chi),
        (p3)-[:LIVED_AT {id: "lv7", date: "1995-09-01"}]->(lex),
        (p4)-[:LIVED_AT {id: "lv8", date: "1995-09-01"}]->(lex),
        (p5)-[:LIVED_AT {id: "lv9", date: "1990-08-25"}]->(lex),
        (p6)-[:LIVED_AT {id: "lv10", date: "1993-01-12"}]->(lex),
        (p3)-[:LIVED_AT {id: "lv11", moveIn: "1995-09-01", moveOut: "2020-05-15"}]->(lex),

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