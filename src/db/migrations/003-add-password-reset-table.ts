import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class AddPasswordResetTable1701234567890 implements MigrationInterface {
  name = 'AddPasswordResetTable1701234567890';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create password_resets table
    await queryRunner.createTable(
      new Table({
        name: 'password_resets',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'token',
            type: 'varchar',
            length: '255',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'expires_at',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'is_used',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
        indices: [
          {
            name: 'IDX_password_resets_user_id',
            columnNames: ['user_id'],
          },
          {
            name: 'IDX_password_resets_token',
            columnNames: ['token'],
          },
          {
            name: 'IDX_password_resets_expires_at',
            columnNames: ['expires_at'],
          },
          {
            name: 'IDX_password_resets_is_used',
            columnNames: ['is_used'],
          },
        ],
        foreignKeys: [
          {
            name: 'FK_password_resets_user_id',
            columnNames: ['user_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop table (this will automatically drop indexes and foreign keys)
    await queryRunner.dropTable('password_resets');
  }
} 