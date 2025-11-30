export interface CreateUserDto {
  // 用户名：仅展示用途，可选，可重复
  username?: string;

  password: string;

  // 手机号：非必填
  phone?: string;

  email: string;

  // 邮箱验证码（注册必填）
  emailCode: string;

  avatar?: string;

  wechatId?: string;
}
