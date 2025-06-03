import { Injectable } from '@nestjs/common';
import { UserRepository } from '../repositories/user.repository';
import { UserRole } from '../enums/user-role.enum';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminSeeder {
  constructor(private readonly userRepository: UserRepository) {}

  async seedAdmin(): Promise<void> {
    // Get admin credentials from environment variables
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@blog.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const adminFirstName = process.env.ADMIN_FIRST_NAME || 'Super';
    const adminLastName = process.env.ADMIN_LAST_NAME || 'Admin';

    // Check if any SUPER_ADMIN exists
    const existingAdmin = await this.userRepository.findByEmail(adminEmail);

    if (!existingAdmin) {
      // Create default admin user using environment variables
      const adminData = {
        email: adminEmail,
        firstName: adminFirstName,
        lastName: adminLastName,
        password: adminPassword,
      };

      const adminUser = await this.userRepository.create(adminData);

      // Update the role to SUPER_ADMIN after creation
      await this.userRepository.update(adminUser.id, {
        role: UserRole.SUPER_ADMIN,
        is_email_verified: true,
      });

      console.log(`✅ Default SUPER_ADMIN user created: ${adminEmail}`);
    } else {
      // Update existing user to SUPER_ADMIN if not already
      if (existingAdmin.role !== UserRole.SUPER_ADMIN) {
        await this.userRepository.update(existingAdmin.id, {
          role: UserRole.SUPER_ADMIN,
        });
        console.log(`✅ Updated existing user to SUPER_ADMIN: ${adminEmail}`);
      } else {
        console.log(`ℹ️  SUPER_ADMIN user already exists: ${adminEmail}`);
      }
    }
  }
}
