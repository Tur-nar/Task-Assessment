import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import neo4j, { Driver, Session, SessionMode } from 'neo4j-driver';

@Injectable()
export class Neo4jService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(Neo4jService.name);
  private driver: Driver;

  constructor(private readonly config: ConfigService) { }

  async onModuleInit() {
    const uri = this.config.get<string>('COGNODB_URI', '');
    const user = this.config.get<string>('COGNODB_USER', '');
    const password = this.config.get<string>('COGNODB_PASSWORD', '');

    console.log('Connecting to database with URI:', uri);
    console.log('Username:', user);
    this.driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

    try {
      await this.driver.verifyConnectivity();
      this.logger.log('Connected to CognoDB');
    } catch (err) {
      this.logger.error('Could not connect to CognoDB on startup', err);
    }
  }

  async onModuleDestroy() {
    await this.driver?.close();
  }

  async run<T = any>(
    cypher: string,
    params: Record<string, unknown> = {},
    mode: SessionMode = neo4j.session.WRITE,
  ): Promise<T[]> {
    if (!this.driver) {
      throw new ServiceUnavailableException(
        'Database connection is not available',
      );
    }

    const session: Session = this.driver.session({ defaultAccessMode: mode });
    try {
      const result = await session.run(cypher, params);
      return result.records.map((record) => this.recordToObject<T>(record));
    } catch (err) {
      const error = err as Error;
      this.logger.error(`Cypher query failed: ${error.message}`, error.stack);
      throw new ServiceUnavailableException(
        'Database query failed — the graph database may be unreachable',
      );
    } finally {
      await session.close();
    }
  }

  private recordToObject<T>(record: any): T {
    const obj: Record<string, unknown> = {};
    for (const key of record.keys) {
      const value = record.get(key);
      obj[key as string] = this.unwrap(value);
    }
    return obj as T;
  }

  private unwrap(value: any): any {
    if (value === null || value === undefined) return value;
    if (neo4j.isInt(value)) return value.toNumber();
    if (
      neo4j.isDateTime(value) ||
      neo4j.isDate(value) ||
      neo4j.isLocalDateTime(value) ||
      neo4j.isTime(value) ||
      neo4j.isLocalTime(value) ||
      neo4j.isDuration(value)
    ) {
      return value.toString();
    }
    if (Array.isArray(value)) return value.map((v) => this.unwrap(v));
    if (value.properties) {
      const props: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value.properties)) {
        props[k] = this.unwrap(v);
      }
      return props;
    }
    return value;
  }
}
