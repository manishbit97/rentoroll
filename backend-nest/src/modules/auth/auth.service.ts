import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { User, UserDocument } from '@database/schemas/user.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { MailService } from '@modules/mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly config: ConfigService,
    private readonly mailService: MailService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.userModel.findOne({ email: dto.email });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const password_hash = await bcrypt.hash(dto.password, 12);
    const user = await this.userModel.create({
      name: dto.name,
      email: dto.email,
      password_hash,
      role: dto.role,
    });

    return {
      token: this.issueToken(user._id.toString(), user.email, user.role),
      user: { id: user._id.toString(), name: user.name, email: user.email, role: user.role },
    };
  }

  async login(dto: LoginDto) {
    const user = await this.userModel.findOne({ email: dto.email });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const match = await bcrypt.compare(dto.password, user.password_hash);
    if (!match) throw new UnauthorizedException('Invalid credentials');

    return {
      token: this.issueToken(user._id.toString(), user.email, user.role),
      user: { id: user._id.toString(), name: user.name, email: user.email, role: user.role },
    };
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<void> {
    const user = await this.userModel.findOne({ email: dto.email });
    // Always return success — never reveal whether email exists
    if (!user) return;

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otp_hash = await bcrypt.hash(otp, 8);
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await this.userModel.updateOne(
      { email: dto.email },
      { reset_otp: otp_hash, reset_otp_expires_at: expires },
    );

    await this.mailService.sendOtp(user.email, user.name, otp);
  }

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const user = await this.userModel.findOne({ email: dto.email });

    if (!user?.reset_otp || !user?.reset_otp_expires_at) {
      throw new BadRequestException('No OTP was requested for this email');
    }

    if (user.reset_otp_expires_at < new Date()) {
      await this.userModel.updateOne(
        { email: dto.email },
        { reset_otp: null, reset_otp_expires_at: null },
      );
      throw new BadRequestException('OTP has expired, please request a new one');
    }

    const valid = await bcrypt.compare(dto.otp, user.reset_otp);
    if (!valid) throw new BadRequestException('Invalid OTP');

    const password_hash = await bcrypt.hash(dto.new_password, 12);
    await this.userModel.updateOne(
      { email: dto.email },
      { password_hash, reset_otp: null, reset_otp_expires_at: null },
    );
  }

  async getProfile(userId: string) {
    const user = await this.userModel.findById(userId).lean();
    if (!user) throw new UnauthorizedException('User not found');
    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      upi_id: user.upi_id,
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const updates: Record<string, string> = {};
    if (dto.name !== undefined) updates.name = dto.name;
    if (dto.phone !== undefined) updates.phone = dto.phone;
    if (dto.upi_id !== undefined) updates.upi_id = dto.upi_id;
    await this.userModel.updateOne({ _id: userId }, { $set: updates });
    return this.getProfile(userId);
  }

  private issueToken(userId: string, email: string, role: string): string {
    const secret = this.config.get<string>('app.jwtSecret');
    return jwt.sign({ user_id: userId, email, role }, secret, { expiresIn: '7d' });
  }
}
