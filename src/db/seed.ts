import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { PostsService } from '../posts/posts.service';
import { CreatePostDto } from '../posts/dto/create-post.dto';
import { UserRepository } from '../auth/repositories/user.repository';
import { ProjectEntity } from '../projects/entities/project.entity';
import { CategoryEntity } from '../categories/entities/category.entity';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as fs from 'fs';
import * as path from 'path';

// mock.json'daki bir postun arayüzü (kısmi)
interface MockPostAttributes {
  boxContent: Array<{ order: number; title?: string; content: string }>;
  'our-news-category': string[];
  authors: string[];
  title: string;
  slug: string;
  seo?: { metaTitle: string; metaDesc: string };
  img?: string;
}

interface MockPost {
  _id: string;
  user_id: string;
  type: string; // Bu project name olacak
  attributes: MockPostAttributes;
  lang: string;
  createdAt: string;
  updatedAt: string;
}

async function bootstrap() {
  const appContext = await NestFactory.createApplicationContext(AppModule);
  const postsService = appContext.get(PostsService);
  const userRepository = appContext.get(UserRepository);
  const projectRepository = appContext.get<Repository<ProjectEntity>>(
    getRepositoryToken(ProjectEntity),
  );
  const categoryRepository = appContext.get<Repository<CategoryEntity>>(
    getRepositoryToken(CategoryEntity),
  );

  console.log('Seeding database...');

  // Find admin user to assign posts to
  let adminUserId: string;
  try {
    const adminUser = await userRepository.findByEmail('admin@blog.com');
    if (!adminUser) {
      throw new Error('Admin user not found');
    }
    adminUserId = adminUser.id;
    console.log(`Found admin user with ID: ${adminUserId}`);
  } catch (error) {
    console.error('Admin user not found. Please run the admin seeder first.');
    await appContext.close();
    return;
  }

  // Create default projects if they don't exist
  const defaultProjects = [
    { name: 'our-news', description: 'Our News Project' },
    { name: 'tech-blog', description: 'Technology Blog' },
    { name: 'company-updates', description: 'Company Updates' },
  ];

  const projectMap = new Map<string, string>(); // name -> id mapping

  for (const projectData of defaultProjects) {
    let project = await projectRepository.findOneBy({ name: projectData.name });
    if (!project) {
      project = projectRepository.create(projectData);
      await projectRepository.save(project);
      console.log(`Created project: ${projectData.name}`);
    }
    projectMap.set(projectData.name, project.id);
  }

  const mockFilePath = path.join(__dirname, '../../mock.json');
  let mockData: MockPost[];

  try {
    const fileContent = fs.readFileSync(mockFilePath, 'utf-8');
    mockData = JSON.parse(fileContent) as MockPost[];
  } catch (error) {
    console.error(
      `Error reading or parsing mock.json from ${mockFilePath}:`,
      error,
    );
    await appContext.close();
    return;
  }

  let seededCount = 0;
  let skippedCount = 0;

  for (const mockPost of mockData) {
    const projectName = mockPost.type;
    const projectId = projectMap.get(projectName);

    if (!projectId) {
      console.warn(`Project "${projectName}" not found. Skipping post.`);
      skippedCount++;
      continue;
    }

    const slug = mockPost.attributes.slug;

    try {
      // Check if post already exists
      await postsService.findOneBySlugAndProject(projectName, slug);
      skippedCount++;
      continue; // Skip if exists
    } catch (error) {
      if (error.name !== 'NotFoundException') {
        console.warn(
          `Error checking for existing post ${projectName}/${slug}: ${error.message}. Skipping this one.`,
        );
        skippedCount++;
        continue;
      }
    }

    // Create categories for this project if they don't exist
    const categoryNames: string[] = [];
    for (const categoryName of mockPost.attributes['our-news-category'] || []) {
      let category = await categoryRepository.findOneBy({
        name: categoryName,
        project_id: projectId,
      });

      if (!category) {
        category = categoryRepository.create({
          name: categoryName,
          project_id: projectId,
          slug: categoryName.toLowerCase().replace(/\s+/g, '-'),
        });
        await categoryRepository.save(category);
        console.log(
          `Created category: ${categoryName} for project ${projectName}`,
        );
      }

      categoryNames.push(categoryName);
    }

    const createPostDto: CreatePostDto = {
      projectId: projectId,
      title: mockPost.attributes.title,
      slug: slug,
      contentBlocks: mockPost.attributes.boxContent.map((cb) => ({
        order: cb.order,
        title: cb.title,
        content: cb.content,
      })),
      categories: categoryNames,
      authors: mockPost.attributes.authors || [],
      seo: mockPost.attributes.seo
        ? {
            title: mockPost.attributes.seo.metaTitle,
            description: mockPost.attributes.seo.metaDesc,
          }
        : undefined,
      featuredImage: mockPost.attributes.img || undefined,
      language: mockPost.lang,
      isPublished: true,
    };

    try {
      await postsService.create(createPostDto, adminUserId);
      seededCount++;
    } catch (error) {
      console.error(
        `Error seeding post ${projectName}/${createPostDto.slug}:`,
        error.message,
      );
      skippedCount++;
    }
  }

  console.log('----------------------------------------');
  console.log(`Seeding complete.`);
  console.log(`Successfully seeded posts: ${seededCount}`);
  console.log(`Skipped existing/erroneous posts: ${skippedCount}`);
  console.log('----------------------------------------');

  await appContext.close();
}

bootstrap().catch((err) => {
  console.error('Unhandled error during seeding process:', err);
  process.exit(1);
});
