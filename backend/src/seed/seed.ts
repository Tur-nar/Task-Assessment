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
    console.log('Wiping existing demo data...');
    await session.run(
      `MATCH (n) WHERE n:Task OR n:User OR n:Department OR n:SubTask
         OR n:TaskComment OR n:Target OR n:TargetEntry OR n:Notification
       DETACH DELETE n`,
    );

    const pw = (plain: string) => bcrypt.hashSync(plain, 10);

    // ---------- Departments ----------
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
          pw: pw('Password123!'), deptId: s.dept.id, supId: s.sup.id,
        },
      );
    }

    for (const sup of [engSupervisor, opsSupervisor]) {
      await session.run(
        `MATCH (u:User {id: $id}), (a:User {id: $adminId}) MERGE (u)-[:SUPERVISED_BY]->(a)`,
        { id: sup.id, adminId: admin.id },
      );
    }

    console.log('Creating tasks with dependency chain...');
    const inDays = (n: number) => new Date(Date.now() + n * 86400000).toISOString();
    const task = async (
      title: string,
      assignee: { id: string },
      assigner: { id: string },
      dept: { id: string },
      priority: string,
      deadline: string,
      status = 'not_started',
    ) => {
      const id = uuid();
      await session.run(
        `CREATE (t:Task {id: $id, title: $title, status: $status, priority: $priority,
          deadline: datetime($deadline), createdAt: datetime()})
         WITH t
         MATCH (u:User {id: $assigneeId}), (d:Department {id: $deptId}), (a:User {id: $assignerId})
         MERGE (t)-[:ASSIGNED_TO]->(u)
         MERGE (t)-[:ASSIGNED_BY]->(a)
         MERGE (t)-[:BELONGS_TO]->(d)`,
        { id, title, status, priority, deadline, assigneeId: assignee.id, assignerId: assigner.id, deptId: dept.id },
      );
      return id;
    };

    const design = await task('Design API schema', staff[0], engSupervisor, eng, 'high', inDays(2), 'completed');
    const build = await task('Implement API endpoints', staff[1], engSupervisor, eng, 'high', inDays(5));
    const test_ = await task('Write integration tests', staff[0], engSupervisor, eng, 'medium', inDays(7));
    const deploy = await task('Deploy to production', staff[1], engSupervisor, eng, 'high', inDays(9));

    await session.run(
      `MATCH (b:Task {id: $build}), (d:Task {id: $design}) MERGE (b)-[:DEPENDS_ON]->(d)`,
      { build, design },
    );
    await session.run(
      `MATCH (t:Task {id: $test}), (b:Task {id: $build}) MERGE (t)-[:DEPENDS_ON]->(b)`,
      { test: test_, build },
    );
    await session.run(
      `MATCH (dep:Task {id: $deploy}), (t:Task {id: $test}) MERGE (dep)-[:DEPENDS_ON]->(t)`,
      { deploy, test: test_ },
    );

    const opsTask1 = await task('Reconcile monthly invoices', staff[2], opsSupervisor, ops, 'medium', inDays(3));
    const opsTask2 = await task('Vendor onboarding checklist', staff[2], opsSupervisor, ops, 'low', inDays(10));

    console.log('Creating subtasks...');
    for (const [title, order] of [['Draft schema document', 0], ['Review with team', 1], ['Finalize schema', 2]] as const) {
      await session.run(
        `MATCH (t:Task {id: $taskId})
         CREATE (s:SubTask {id: $id, title: $title, isCompleted: $completed, order: $order})
         MERGE (t)-[:HAS_SUBTASK]->(s)`,
        { taskId: design, id: uuid(), title, order, completed: true },
      );
    }

    console.log('Creating task comments...');
    const commentId = uuid();
    await session.run(
      `CREATE (c:TaskComment {id: $id, content: 'Schema looks great — just need to add pagination fields.', createdAt: datetime()})
       WITH c
       MATCH (t:Task {id: $taskId}), (u:User {id: $userId})
       MERGE (c)-[:ON_TASK]->(t)
       MERGE (c)-[:AUTHORED_BY]->(u)`,
      { id: commentId, taskId: design, userId: engSupervisor.id },
    );

    const replyId = uuid();
    await session.run(
      `CREATE (c:TaskComment {id: $id, content: 'Good point, added offset and limit params.', createdAt: datetime()})
       WITH c
       MATCH (t:Task {id: $taskId}), (u:User {id: $userId}), (parent:TaskComment {id: $parentId})
       MERGE (c)-[:ON_TASK]->(t)
       MERGE (c)-[:AUTHORED_BY]->(u)
       MERGE (c)-[:REPLY_TO]->(parent)`,
      { id: replyId, taskId: design, userId: staff[0].id, parentId: commentId },
    );

    console.log('Creating targets with entries...');
    const teamTargetId = uuid();
    await session.run(
      `CREATE (t:Target {id: $id, title: 'Complete Q3 sprint goals', description: 'Team delivery target for Q3',
        type: 'team', targetValue: 20, deadline: datetime($deadline), createdAt: datetime()})
       WITH t
       MATCH (creator:User {id: $creatorId}), (d:Department {id: $deptId})
       MERGE (t)-[:CREATED_BY]->(creator)
       MERGE (t)-[:FOR_DEPARTMENT]->(d)`,
      { id: teamTargetId, deadline: inDays(30), creatorId: engSupervisor.id, deptId: eng.id },
    );

    for (const [value, userId, note] of [
      [3, staff[0].id, 'Completed 3 tickets this week'],
      [5, staff[1].id, 'Wrapped up the auth module'],
    ] as const) {
      await session.run(
        `CREATE (e:TargetEntry {id: $id, value: $value, note: $note, createdAt: datetime()})
         WITH e
         MATCH (t:Target {id: $targetId}), (u:User {id: $userId})
         MERGE (e)-[:LOGGED_FOR]->(t)
         MERGE (e)-[:SUBMITTED_BY]->(u)`,
        { id: uuid(), value, note, targetId: teamTargetId, userId },
      );
    }

    const individualTargetId = uuid();
    await session.run(
      `CREATE (t:Target {id: $id, title: 'Close 10 support tickets', description: 'Individual ops target',
        type: 'individual', targetValue: 10, deadline: datetime($deadline), createdAt: datetime()})
       WITH t
       MATCH (creator:User {id: $creatorId}), (assignee:User {id: $assigneeId})
       MERGE (t)-[:CREATED_BY]->(creator)
       MERGE (t)-[:ASSIGNED_TO]->(assignee)`,
      { id: individualTargetId, deadline: inDays(14), creatorId: opsSupervisor.id, assigneeId: staff[2].id },
    );

    await session.run(
      `CREATE (e:TargetEntry {id: $id, value: 4, note: 'Week 1 tickets', createdAt: datetime()})
       WITH e
       MATCH (t:Target {id: $targetId}), (u:User {id: $userId})
       MERGE (e)-[:LOGGED_FOR]->(t)
       MERGE (e)-[:SUBMITTED_BY]->(u)`,
      { id: uuid(), targetId: individualTargetId, userId: staff[2].id },
    );

    console.log('Creating sample notifications...');
    const notifications = [
      { userId: staff[0].id, title: 'Task Assigned', message: 'You have been assigned: Design API schema', type: 'task_assigned', severity: 'info', taskId: design },
      { userId: engSupervisor.id, title: 'Task Completed', message: 'Tunde Alabi completed: Design API schema', type: 'task_completed', severity: 'success', taskId: design },
      { userId: staff[2].id, title: 'Task Assigned', message: 'You have been assigned: Reconcile monthly invoices', type: 'task_assigned', severity: 'info', taskId: opsTask1 },
    ];
    for (const n of notifications) {
      await session.run(
        `CREATE (notif:Notification {id: $id, title: $title, message: $message, type: $type,
          severity: $severity, isRead: false, createdAt: datetime()})
         WITH notif
         MATCH (u:User {id: $userId})
         MERGE (notif)-[:FOR_USER]->(u)
         WITH notif
         OPTIONAL MATCH (t:Task {id: $taskId})
         FOREACH (_ IN CASE WHEN t IS NOT NULL THEN [1] ELSE [] END |
           MERGE (notif)-[:RELATED_TO]->(t)
         )`,
        { id: uuid(), ...n },
      );
    }

    console.log('✅ Seed complete. All accounts use password: "Password123!"');
    console.log(`Admin: ${admin.email}`);
    console.log(`Eng Supervisor: ${engSupervisor.email}`);
    console.log(`Ops Supervisor: ${opsSupervisor.email}`);
    console.log(`Staff: ${staff.map(s => s.email).join(', ')}`);
  } finally {
    await session.close();
    await driver.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
