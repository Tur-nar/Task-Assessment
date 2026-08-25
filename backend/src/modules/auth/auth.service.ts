import {
  Injectable,
  Logger,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import { Neo4jService } from '../../lib/neo4j/neo4j.service';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly neo4j: Neo4jService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) { }

  async onModuleInit() {
    const existing = await this.neo4j.run(
      `MATCH (u:User {role: 'super_admin'}) RETURN u LIMIT 1`,
      {},
      'READ',
    );
    if (existing.length > 0) return;

    const email = this.config.get<string>('SUPER_ADMIN_EMAIL');
    const password = this.config.get<string>('SUPER_ADMIN_PASSWORD');
    if (!email || !password) {
      this.logger.warn(
        'No super_admin exists and SUPER_ADMIN_EMAIL/PASSWORD are not set — skipping bootstrap',
      );
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await this.neo4j.run(
      `CREATE (u:User {
        id: $id, email: $email, passwordHash: $passwordHash,
        firstName: $firstName, lastName: $lastName,
        role: 'super_admin', status: 'active', createdAt: datetime()
      })`,
      {
        id: uuid(),
        email,
        passwordHash,
        firstName: this.config.get<string>('SUPER_ADMIN_FIRST_NAME') ?? 'Super',
        lastName: this.config.get<string>('SUPER_ADMIN_LAST_NAME') ?? 'Admin',
      },
    );
    this.logger.log(`Seeded super_admin account for ${email}`);
  }

  async login(email: string, password: string) {
    const [row] = await this.neo4j.run(
      `MATCH (u:User {email: $email}) RETURN u`,
      { email },
      'READ',
    );
    const user = row?.u;
    if (!user) throw new UnauthorizedException('Invalid credentials');
    if (user.status !== 'active') throw new UnauthorizedException('Account is Inactive. Contact admin');

    const matches = await bcrypt.compare(password, user.passwordHash);
    if (!matches) throw new UnauthorizedException('Invalid credentials');

    await this.neo4j.run(
      `MATCH (u:User {id: $id}) SET u.lastLogin = datetime()`,
      { id: user.id },
    );

    const token = this.jwt.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    const { passwordHash, ...safeUser } = user;
    return { token, user: safeUser };
  }
}
