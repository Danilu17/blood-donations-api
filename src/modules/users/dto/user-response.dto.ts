export class UserResponseDto {
  id: string;
  email: string;
  dni: string;
  role: string;
  is_active: boolean;
  is_email_verified: boolean;
  created_at: Date;
  updated_at: Date;
}
