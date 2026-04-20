import { IsString } from 'class-validator';

export class CompanyTokenQueryDto {
  @IsString()
  token!: string;
}
