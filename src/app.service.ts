import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class AppService {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  getHello(): string {
    return 'Hello World!';
  }

  async checkDbConnection(): Promise<string> {
    try {
      await this.dataSource.query('SELECT 1');
      return 'PostgreSQL connection successful!';
    } catch (error) {
      console.error('PostgreSQL connection error:', error);
      return 'PostgreSQL connection failed!';
    }
  }
}
