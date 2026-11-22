import { IsString, IsNotEmpty, IsOptional, IsArray, IsObject } from 'class-validator';

export class CreateDocumentDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  duplicateOfId?: string;

  @IsString()
  @IsOptional()
  id?: string;

  @IsString()
  @IsNotEmpty({ message: 'Tytuł jest wymagany' })
  title: string;

  @IsString()
  @IsNotEmpty({ message: 'Treść jest wymagana' })
  content: string;

  @IsString()
  @IsOptional()
  author?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;

  @IsString()
  @IsOptional()
  createdAt?: string;

  @IsString()
  @IsOptional()
  updatedAt?: string;
}
