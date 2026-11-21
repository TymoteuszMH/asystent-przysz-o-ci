import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

export class CheckSimilarityDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsNotEmpty({ message: 'Treść dokumentu jest wymagana do analizy zbieżności' })
  content: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}
