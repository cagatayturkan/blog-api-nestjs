import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Application')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Get hello message' })
  @ApiResponse({ status: 200, description: 'Returns hello message' })
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('db-check')
  @ApiOperation({ summary: 'Check database connection' })
  @ApiResponse({ status: 200, description: 'Database connection status' })
  async checkDb(): Promise<string> {
    return this.appService.checkDbConnection();
  }

  @Get('debug-sentry')
  @ApiOperation({ summary: 'Test Sentry error capturing' })
  @ApiResponse({
    status: 500,
    description: 'Throws an error for Sentry testing',
  })
  getError(): void {
    const timestamp = new Date().toISOString();
    throw new Error(
      `🚀 TURKIYE BLOG API TEST MESAJI - SENTRY CALISIYOR 2025! 🎯 [${timestamp}]`,
    );
  }
}
