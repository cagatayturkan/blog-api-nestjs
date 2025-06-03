import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddResetFieldToUsers1701234567891 implements MigrationInterface {
  name = 'AddResetFieldToUsers1701234567891';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add reset JSONB column to users table
    await queryRunner.query(`
      ALTER TABLE "users" 
      ADD COLUMN "reset" jsonb
    `);

    // Drop password_resets table if it exists
    await queryRunner.query(`
      DROP TABLE IF EXISTS "password_resets"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove reset column
    await queryRunner.query(`
      ALTER TABLE "users" 
      DROP COLUMN IF EXISTS "reset"
    `);

    // Recreate password_resets table (basic structure)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "password_resets" (
        "id" uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
        "user_id" uuid NOT NULL,
        "token" varchar(255) UNIQUE NOT NULL,
        "expires_at" timestamp NOT NULL,
        "is_used" boolean DEFAULT false,
        "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
  }
}
