import { IsOptional, IsString } from 'class-validator';

export class CheckSensitiveDataDto {
  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsString()
  @IsOptional()
  applicant?: string;
}
