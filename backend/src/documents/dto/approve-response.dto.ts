import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

export class ApproveResponseDto {
  @IsString()
  @IsNotEmpty({ message: 'Ostateczna treść odpowiedzi jest wymagana' })
  finalResponseText: string;

  @IsString()
  @IsOptional()
  anonymizedText?: string;

  @IsArray()
  @IsOptional()
  dane_podlegajace_anonimizacji?: Array<{
    id: string;
    category: string;
    label: string;
    value: string;
    replacement: string;
    isAnonymized: boolean;
    legalBasis?: string;
  }>;

  @IsString()
  @IsOptional()
  officerNote?: string;
}
