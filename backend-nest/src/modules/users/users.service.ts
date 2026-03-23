import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '@database/schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async searchByEmail(email: string) {
    const user = await this.userModel.findOne({ email, role: 'tenant' });
    if (!user) throw new NotFoundException('Tenant not found');
    return { id: user._id.toString(), name: user.name, email: user.email };
  }
}
