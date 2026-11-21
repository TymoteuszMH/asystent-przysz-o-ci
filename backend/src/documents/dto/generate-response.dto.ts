import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class GenerateResponseDto {
  @IsString()
  @IsNotEmpty({ message: 'Treść odpowiedzi z wydziału jest wymagana' })
  departmentFeedback: string;

  @IsString()
  @IsOptional()
  departmentName?: string;
}
