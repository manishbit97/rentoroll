import {
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

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly config: ConfigService,
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
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const match = await bcrypt.compare(dto.password, user.password_hash);
    if (!match) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return {
      token: this.issueToken(user._id.toString(), user.email, user.role),
      user: { id: user._id.toString(), name: user.name, email: user.email, role: user.role },
    };
  }

  private issueToken(userId: string, email: string, role: string): string {
    const secret = this.config.get<string>('app.jwtSecret');
    return jwt.sign({ user_id: userId, email, role }, secret, { expiresIn: '7d' });
  }
}
