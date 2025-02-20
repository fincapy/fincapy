import bcrypt from 'bcryptjs';

class ResetPasswordService {
  constructor({ userRepository }) {
    this.userRepository = userRepository;
  }

  async resetPassword({ userId, newPassword }) {
    const user = await this.userRepository.get({ userId });
    if (!user) {
      throw new Error('User not found');
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update user's password
    user.password = hashedPassword;
    
    // Save the updated user
    await this.userRepository.set({ 
      userId: user.id, 
      user 
    });

    return true;
  }
}

export { ResetPasswordService };
