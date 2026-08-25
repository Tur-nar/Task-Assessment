import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Neo4jModule } from './lib/neo4j/neo4j.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { DepartmentsModule } from './modules/departments/departments.module';
import { TasksModule } from './modules/tasks/tasks.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    Neo4jModule,
    AuthModule,
    UsersModule,
    DepartmentsModule,
    TasksModule,
    // TargetsModule, NotificationsModule — next phase, see plan doc
  ],
})
export class AppModule {}
