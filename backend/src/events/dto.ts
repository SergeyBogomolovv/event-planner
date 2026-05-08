import { Transform } from 'class-transformer';
import type { TransformFnParams } from 'class-transformer';
import {
  IsEnum,
  IsISO8601,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { EventFormat } from './event.entity';

const trimString = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class CreateEventDto {
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  title: string;

  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  description: string;

  @IsISO8601()
  startsAt: string;

  @IsOptional()
  @IsISO8601()
  endsAt?: string;

  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(240)
  location?: string;

  @IsEnum(EventFormat)
  format: EventFormat;

  @IsOptional()
  @IsInt()
  @Min(1)
  participantLimit?: number;
}

export class UpdateEventDto {
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  title?: string;

  @Transform(trimString)
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  description?: string;

  @IsOptional()
  @IsISO8601()
  startsAt?: string;

  @ValidateIf((_, value: unknown) => value !== undefined && value !== null)
  @IsISO8601()
  endsAt?: string | null;

  @Transform(trimString)
  @ValidateIf((_, value: unknown) => value !== undefined && value !== null)
  @IsString()
  @MaxLength(240)
  location?: string | null;

  @IsOptional()
  @IsEnum(EventFormat)
  format?: EventFormat;

  @ValidateIf((_, value: unknown) => value !== undefined && value !== null)
  @IsInt()
  @Min(1)
  participantLimit?: number | null;
}
