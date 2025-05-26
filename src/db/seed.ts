import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module'; // Ana app modülümüz
import { PostsService } from '../posts/posts.service';
import { CreatePostDto } from '../posts/dto/create-post.dto';
import { PostEntity } from '../posts/entities/post.entity'; // Var olanları kontrol için gerekebilir
import { UserRepository } from '../auth/repositories/user.repository';
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
  type: string; // Bu projectIdentifier olacak
  attributes: MockPostAttributes;
  lang: string;
  createdAt: string;
  updatedAt: string;
}

async function bootstrap() {
  const appContext = await NestFactory.createApplicationContext(AppModule);
  const postsService = appContext.get(PostsService);
  const userRepository = appContext.get(UserRepository);

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

  const mockFilePath = path.join(__dirname, '../../mock.json');
  let mockData: MockPost[];

  try {
    const fileContent = fs.readFileSync(mockFilePath, 'utf-8');
    mockData = JSON.parse(fileContent) as MockPost[];
  } catch (error) {
    console.error(`Error reading or parsing mock.json from ${mockFilePath}:`, error);
    await appContext.close();
    return;
  }

  let seededCount = 0;
  let skippedCount = 0;

  for (const mockPost of mockData) {
    const projectIdentifier = mockPost.type;
    const slug = mockPost.attributes.slug;

    try {
      // Önce bu projectIdentifier ve slug ile bir post var mı diye kontrol et
      await postsService.findOneBySlugAndProject(projectIdentifier, slug);
      skippedCount++;
      continue; // Varsa atla
    } catch (error) {
      // NotFoundException ise post yok demektir, oluşturabiliriz.
      // Diğer hataları loglayıp devam edebiliriz veya durabiliriz.
      if (error.name !== 'NotFoundException') {
        console.warn(`Error checking for existing post ${projectIdentifier}/${slug}: ${error.message}. Skipping this one.`);
        skippedCount++;
        continue;
      }
    }

    const createPostDto: CreatePostDto = {
      projectIdentifier: projectIdentifier,
      title: mockPost.attributes.title,
      slug: slug, // mock.json'daki slug'ı kullanalım, servis zaten üretebilir ama tutarlılık için
      contentBlocks: mockPost.attributes.boxContent.map(cb => ({ // DTO ile uyumlu hale getir
        order: cb.order,
        title: cb.title,
        content: cb.content,
      })),
      categories: mockPost.attributes['our-news-category'] || [],
      authors: mockPost.attributes.authors || [],
      seo: mockPost.attributes.seo ? {
        title: mockPost.attributes.seo.metaTitle,
        description: mockPost.attributes.seo.metaDesc,
      } : undefined,
      featuredImage: mockPost.attributes.img || undefined,
      language: mockPost.lang,
      // userId: mockPost.user_id, // DTO'da yok, servis default atıyor
    };

    try {
      await postsService.create(createPostDto, adminUserId);
      seededCount++;
    } catch (error) {
      console.error(`Error seeding post ${createPostDto.projectIdentifier}/${createPostDto.slug}:`, error.message);
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

bootstrap().catch(err => {
  console.error('Unhandled error during seeding process:', err);
  process.exit(1);
}); 