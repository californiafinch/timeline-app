# Supabase Email Auth 启用指南

**创建日期**: 2026-01-20  
**项目**: 历史年表网站  
**功能**: 用户注册邮箱验证码

---

## 📋 启用步骤

### 步骤 1：访问 Supabase Dashboard

1. 打开浏览器，访问：
   ```
   https://supabase.com/dashboard
   ```

2. 登录你的 Supabase 账号

3. 选择你的项目：`sxjlazmnyrauiqqdjfah`

---

### 步骤 2：进入 Authentication 设置

1. 在左侧导航栏中，点击 **Authentication**

2. 等待页面加载完成

---

### 步骤 3：添加 Email Provider

1. 点击 **Add new provider** 按钮

2. 在弹出的对话框中，选择 **Email**

3. 点击 **Confirm**

---

### 步骤 4：配置 Email Provider

#### 4.1 基本设置

在 Email Provider 配置页面中，设置以下选项：

**Enabled**: ✅ 勾选启用

**Confirm email**: ✅ 勾选（需要用户确认邮箱）

**Double confirm email**: ✅ 勾选（双重确认，更安全）

#### 4.2 邮件模板配置

**Email template**：
```
主题：验证码 - 历史年表网站

内容：
<h2>您的验证码是：{{ .Code }}</h2>
<p>验证码将在 10 分钟后过期。</p>
<p>如果这不是您的操作，请忽略此邮件。</p>
<p>感谢您使用我们的服务！</p>
```

**OTP length**: `6`（6 位数字验证码）

**OTP expiry**: `600`（10 分钟，单位：秒）

#### 4.3 安全设置

**Secure email change**: ✅ 勾选（修改邮箱时需要验证）

**Minimum password length**: `8`（最小密码长度）

**Maximum password length**: `16`（最大密码长度）

#### 4.4 高级设置（可选）

**Custom SMTP**: ❌ 不勾选（使用 Supabase 默认邮件服务）

**Sender email**: 留空（使用 Supabase 默认发件人）

**Sender name**: `历史年表网站`（发件人名称）

---

### 步骤 5：保存配置

1. 检查所有配置是否正确

2. 点击 **Save** 按钮

3. 等待保存完成

4. 确认显示 "Email provider has been updated"

---

## 🔍 验证配置

### 验证步骤

1. **检查 Provider 状态**
   - 返回 Authentication 页面
   - 确认 Email Provider 显示为 "Enabled"

2. **测试发送验证码**
   - 使用测试脚本：`node test-email-verification.js`
   - 检查是否收到验证码邮件

3. **验证验证码格式**
   - 确认验证码为 6 位数字
   - 确认邮件内容包含验证码

---

## 📧 测试流程

### 测试场景 1：发送验证码

**命令**：
```bash
node test-email-verification.js
```

**预期结果**：
- ✅ 验证码已发送
- ✅ 邮箱收到验证码
- ✅ 验证码为 6 位数字

**如果失败**：
- ❌ 错误：未找到
  - 原因：Supabase Email Auth 未启用
  - 解决：重新检查配置

---

### 测试场景 2：注册（带验证码）

**命令**：
```bash
node test-email-verification.js
```

**预期结果**：
- ✅ 发送验证码成功
- ✅ 注册成功
- ✅ 验证码验证通过

**如果失败**：
- ❌ 验证码错误或已过期
  - 原因：验证码格式错误或已过期
  - 解决：重新发送验证码

---

## 🔧 故障排除

### 问题 1：发送验证码失败

**错误信息**：
```
错误：未找到
```

**可能原因**：
1. Supabase Email Auth 未启用
2. 邮箱格式不正确
3. Supabase 服务暂时不可用

**解决方案**：
1. 检查 Supabase Dashboard 中的 Email Provider 状态
2. 确认 Email Provider 已启用
3. 检查邮箱格式是否正确
4. 等待几分钟后重试

---

### 问题 2：验证码验证失败

**错误信息**：
```
错误：验证码错误或已过期
```

**可能原因**：
1. 验证码已过期（超过 10 分钟）
2. 验证码格式错误（不是 6 位数字）
3. 验证码已被使用

**解决方案**：
1. 重新发送验证码
2. 确保在 10 分钟内输入验证码
3. 检查验证码是否为 6 位数字

---

### 问题 3：未收到验证码邮件

**可能原因**：
1. 邮件被标记为垃圾邮件
2. 邮箱地址错误
3. Supabase 邮件服务延迟

**解决方案**：
1. 检查垃圾邮件文件夹
2. 确认邮箱地址正确
3. 等待 5-10 分钟
4. 重新发送验证码

---

## 📊 配置参考

### 完整配置示例

```json
{
  "enabled": true,
  "confirm_email": true,
  "double_confirm_email": true,
  "email_template": {
    "subject": "验证码 - 历史年表网站",
    "body": "<h2>您的验证码是：{{ .Code }}</h2><p>验证码将在 10 分钟后过期。</p><p>如果这不是您的操作，请忽略此邮件。</p><p>感谢您使用我们的服务！</p>"
  },
  "otp_length": 6,
  "otp_expiry": 600,
  "secure_email_change": true,
  "min_password_length": 8,
  "max_password_length": 16,
  "custom_smtp": false,
  "sender_email": "",
  "sender_name": "历史年表网站"
}
```

---

## 🎯 启用后测试

### 测试清单

- [ ] Supabase Email Auth 已启用
- [ ] 邮件模板已配置
- [ ] 验证码长度设置为 6 位
- [ ] 验证码过期时间设置为 10 分钟
- [ ] 发送验证码功能测试通过
- [ ] 注册（带验证码）功能测试通过
- [ ] 验证码验证功能测试通过
- [ ] 验证码过期功能测试通过

---

## 📝 注意事项

### 安全建议

1. **验证码长度**
   - 使用 6 位数字验证码
   - 避免使用过于简单的验证码（如 123456）

2. **过期时间**
   - 设置合理的过期时间（10 分钟）
   - 避免过期时间过长（增加安全风险）

3. **双重确认**
   - 启用双重邮箱确认
   - 提高账户安全性

4. **速率限制**
   - 限制发送验证码的频率
   - 防止暴力破解

### 用户体验建议

1. **邮件内容**
   - 清晰说明验证码用途
   - 提供过期时间
   - 包含品牌信息

2. **错误提示**
   - 提供明确的错误信息
   - 指导用户如何解决问题
   - 提供重试选项

3. **倒计时显示**
   - 在前端显示验证码倒计时
   - 提醒用户及时输入验证码

---

## 🔗 相关文档

- [邮箱验证码功能技术方案.md](file:///e:\Program\test01\.trae\documents\邮箱验证码功能技术方案.md)
- [邮箱验证码功能实施总结.md](file:///e:\Program\test01\.trae\documents\邮箱验证码功能实施总结.md)
- [项目追踪表.md](file:///e:\Program\test01\.trae\documents\项目追踪表.md)

---

## 🎉 总结

### 启用步骤

1. ✅ 访问 Supabase Dashboard
2. ✅ 进入 Authentication 设置
3. ✅ 添加 Email Provider
4. ✅ 配置 Email Provider（邮件模板、验证码设置）
5. ✅ 保存配置

### 测试步骤

1. ✅ 运行测试脚本
2. ✅ 验证发送验证码功能
3. ✅ 验证注册流程
4. ✅ 验证验证码验证

### 下一步

1. ⏳ 在 Supabase Dashboard 中启用 Email Auth
2. ⏳ 配置邮件模板
3. ⏳ 测试完整流程
4. ⏳ 前端集成验证码输入框
5. ⏳ 部署到生产环境

---

**创建日期**: 2026-01-20  
**项目状态**: 进行中（95% 完成）
