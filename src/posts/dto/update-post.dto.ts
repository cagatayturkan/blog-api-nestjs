import { PartialType } from '@nestjs/mapped-types';
import { CreatePostDto } from './create-post.dto';

// UpdatePostDto inherits all validation rules from CreatePostDto,
// but makes all fields optional for PATCH requests.
// For PUT requests, you might want a different DTO or ensure all fields are provided.
export class UpdatePostDto extends PartialType(CreatePostDto) {}
