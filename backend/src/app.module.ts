import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ResponseInterceptor } from './lib/common/interceptors/response-interceptors';
import { Neo4jModule } from './lib/neo4j/neo4j.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { DepartmentsModule } from './modules/departments/departments.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { CommentsModule } from './modules/comments/comments.module';
import { PerformanceModule } from './modules/performance/performance.module';
import { TargetsModule } from './modules/targets/targets.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    Neo4jModule,
    AuthModule,
    UsersModule,
    DepartmentsModule,
    TasksModule,
    CommentsModule,
    PerformanceModule,
    TargetsModule,
    NotificationsModule,
  ],
  providers: [ResponseInterceptor]
})
export class AppModule { }
