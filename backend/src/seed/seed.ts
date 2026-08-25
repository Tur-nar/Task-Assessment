import 'dotenv/config';
import neo4j from 'neo4j-driver';
import * as bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';

async function main() {
  const driver = neo4j.driver(
    process.env.COGNODB_URI!,
    neo4j.auth.basic(process.env.COGNODB_USER!, process.env.COGNODB_PASSWORD!),
  );
  const session = driver.session();

  try {
    console.log('Wiping existing demo data (Task/User/Department/SubTask nodes)...');
    await session.run(
      `MATCH (n) WHERE n:Task OR n:User OR n:Department OR n:SubTask DETACH DELETE n`,
    );

    const pw = (plain: string) => bcrypt.hashSync(plain, 10);

    console.log('Creating departments...');
    const [eng, ops] = await Promise.all(
      ['Engineering', 'Operations'].map(async (name) => {
        const id = uuid();
        await session.run(
          `CREATE (d:Department {id: $id, name: $name, description: $name + ' department', createdAt: datetime()})`,
          { id, name },
        );
        return { id, name };
      }),
    );

    console.log('Creating users...');
    const admin = { id: uuid(), firstName: 'Ada', lastName: 'Okoro', email: 'ada.okoro@org.com' };
    const engSupervisor = { id: uuid(), firstName: 'Femi', lastName: 'Balogun', email: 'femi.balogun@org.com' };
    const opsSupervisor = { id: uuid(), firstName: 'Chidinma', lastName: 'Eze', email: 'chidinma.eze@org.com' };
    const staff = [
      { id: uuid(), firstName: 'Tunde', lastName: 'Alabi', email: 'tunde.alabi@org.com', dept: eng, sup: engSupervisor },
      { id: uuid(), firstName: 'Zainab', lastName: 'Bello', email: 'zainab.bello@org.com', dept: eng, sup: engSupervisor },
      { id: uuid(), firstName: 'Ifeoma', lastName: 'Nwosu', email: 'ifeoma.nwosu@org.com', dept: ops, sup: opsSupervisor },
    ];

    await session.run(
      `CREATE (u:User {id: $id, firstName: $firstName, lastName: $lastName, email: $email,
        passwordHash: $pw, role: 'admin', status: 'active', createdAt: datetime()})`,
      { ...admin, pw: pw('Password123!') },
    );

    for (const [sup, dept] of [[engSupervisor, eng], [opsSupervisor, ops]] as const) {
      await session.run(
        `CREATE (u:User {id: $id, firstName: $firstName, lastName: $lastName, email: $email,
          passwordHash: $pw, role: 'supervisor', status: 'active', createdAt: datetime()})
         WITH u
         MATCH (d:Department {id: $deptId})
         MERGE (u)-[:MEMBER_OF]->(d)`,
        { ...sup, pw: pw('Password123!'), deptId: dept.id },
      );
    }

    for (const s of staff) {
      await session.run(
        `CREATE (u:User {id: $id, firstName: $firstName, lastName: $lastName, email: $email,
          passwordHash: $pw, role: 'staff', status: 'active', createdAt: datetime()})
         WITH u
         MATCH (d:Department {id: $deptId}), (sup:User {id: $supId})
         MERGE (u)-[:MEMBER_OF]->(d)
         MERGE (u)-[:SUPERVISED_BY]->(sup)`,
        {
          id: s.id, firstName: s.firstName, lastName: s.lastName, email: s.email,
          pw: pw('Password123!'), deptId: s.dept.id, supId: s.sup.id
        },
      );
    }

    for (const sup of [engSupervisor, opsSupervisor]) {
      await session.run(
        `MATCH (u:User {id: $id}), (a:User {id: $adminId}) MERGE (u)-[:SUPERVISED_BY]->(a)`,
        { id: sup.id, adminId: admin.id },
      );
    }

    console.log('Creating tasks with a real dependency chain...');
    const inDays = (n: number) => new Date(Date.now() + n * 86400000).toISOString();
    const task = async (title: string, assignee: { id: string }, dept: { id: string }, priority: string, deadline: string, status = 'not_started') => {
      const id = uuid();
      await session.run(
        `CREATE (t:Task {id: $id, title: $title, status: $status, priority: $priority,
          deadline: datetime($deadline), createdAt: datetime()})
         WITH t
         MATCH (u:User {id: $assigneeId}), (d:Department {id: $deptId})
         MERGE (t)-[:ASSIGNED_TO]->(u)
         MERGE (t)-[:BELONGS_TO]->(d)`,
        { id, title, status, priority, deadline, assigneeId: assignee.id, deptId: dept.id },
      );
      return id;
    };

    const design = await task('Design API schema', staff[0], eng, 'high', inDays(2), 'completed');
    const build = await task('Implement API endpoints', staff[1], eng, 'high', inDays(5));
    const test = await task('Write integration tests', staff[0], eng, 'medium', inDays(7));
    const deploy = await task('Deploy to production', staff[1], eng, 'high', inDays(9));

    await session.run(
      `MATCH (b:Task {id: $build}), (d:Task {id: $design}) MERGE (b)-[:DEPENDS_ON]->(d)`,
      { build, design },
    );
    await session.run(
      `MATCH (t:Task {id: $test}), (b:Task {id: $build}) MERGE (t)-[:DEPENDS_ON]->(b)`,
      { test, build },
    );
    await session.run(
      `MATCH (dep:Task {id: $deploy}), (t:Task {id: $test}) MERGE (dep)-[:DEPENDS_ON]->(t)`,
      { deploy, test },
    );

    // A couple of unrelated ops tasks so department filtering has something to show.
    await task('Reconcile monthly invoices', staff[2], ops, 'medium', inDays(3));
    await task('Vendor onboarding checklist', staff[2], ops, 'low', inDays(10));

    console.log('Done. Sample login (all seeded users): password "Password123!"');
    console.log(`Admin: ${admin.email}`);
  } finally {
    await session.close();
    await driver.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
