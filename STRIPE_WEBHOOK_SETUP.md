# Stripe Webhook 配置指南

本文檔說明如何在 Stripe Dashboard 中配置 Webhook 端點，以便自動更新訂單狀態。

## 概述

Webhook 端點已在後端實現，位置為：`/api/stripe/webhook`

該端點會自動處理以下 Stripe 事件：
- ✅ `payment_intent.succeeded` - 支付成功
- ✅ `charge.failed` - 支付失敗
- ✅ `charge.refunded` - 退款成功
- ✅ `checkout.session.completed` - 結帳會話完成

## 配置步驟

### 1. 登入 Stripe Dashboard

訪問 [Stripe Dashboard](https://dashboard.stripe.com) 並使用您的帳戶登入。

### 2. 導航到 Webhooks 設置

1. 點擊左側菜單中的 **Developers**
2. 選擇 **Webhooks**

### 3. 添加新的 Webhook 端點

1. 點擊 **Add endpoint** 按鈕
2. 在「Endpoint URL」欄位中輸入您的 Webhook URL：

   ```
   https://shopmart-8wwg5mrc.manus.space/api/stripe/webhook
   ```

   **注意**：如果您使用自訂域名，請替換為您的域名。例如：
   ```
   https://mynft01.eu.cc/api/stripe/webhook
   ```

3. 點擊 **Select events** 按鈕

### 4. 選擇要監聽的事件

在事件選擇器中，勾選以下事件：

**支付事件**：
- ✅ `payment_intent.succeeded` - 支付成功時觸發
- ✅ `charge.failed` - 支付失敗時觸發
- ✅ `charge.refunded` - 退款成功時觸發

**結帳事件**：
- ✅ `checkout.session.completed` - 結帳會話完成時觸發

選擇完成後，點擊 **Add events** 按鈕。

### 5. 創建 Webhook 端點

1. 點擊 **Add endpoint** 按鈕完成創建
2. 您將被重定向到 Webhook 端點詳情頁面

### 6. 複製 Webhook 簽名密鑰

在 Webhook 端點詳情頁面上：

1. 找到「Signing secret」部分
2. 點擊「Reveal」按鈕顯示密鑰
3. 複製密鑰（以 `whsec_` 開頭）

**示例**：
```
whsec_test_secret_abc123def456...
```

### 7. 配置環境變數

在 Manus 項目管理界面中配置 `STRIPE_WEBHOOK_SECRET` 環境變數：

1. 打開項目設置 → **Secrets**
2. 添加新密鑰：
   - **Key**: `STRIPE_WEBHOOK_SECRET`
   - **Value**: 粘貼複製的簽名密鑰

3. 保存設置

## 測試 Webhook

### 使用 Stripe CLI 測試（推薦）

如果您有 Stripe CLI 安裝在本地：

```bash
# 1. 登入 Stripe CLI
stripe login

# 2. 轉發 Webhook 事件到本地
stripe listen --forward-to localhost:3000/api/stripe/webhook

# 3. 在另一個終端觸發測試事件
stripe trigger payment_intent.succeeded
```

### 使用 Stripe Dashboard 測試

1. 在 Webhook 端點詳情頁面，找到「Send test event」部分
2. 選擇要測試的事件類型（例如 `payment_intent.succeeded`）
3. 點擊 **Send test event** 按鈕
4. 檢查 Webhook 日誌以確認事件已被接收和處理

## 驗證 Webhook 工作正常

### 檢查 Webhook 日誌

1. 在 Stripe Dashboard 的 Webhooks 頁面
2. 點擊您的 Webhook 端點
3. 查看「Recent events」部分
4. 確認事件已被成功發送（綠色勾選）

### 檢查應用日誌

在您的應用日誌中，應該能看到類似的日誌信息：

```
[Webhook] Processing event: payment_intent.succeeded
[Webhook] Updating order 123 to paid status
[Webhook] Order 123 updated to paid status
```

## 事件處理邏輯

### payment_intent.succeeded

當支付成功時：
1. 訂單狀態更新為 `paymentStatus: "paid"`
2. 訂單狀態更新為 `status: "processing"`
3. 自動發送確認郵件給客戶

### charge.failed

當支付失敗時：
1. 訂單狀態更新為 `paymentStatus: "failed"`
2. 記錄失敗原因

### charge.refunded

當退款成功時：
1. 訂單狀態更新為 `paymentStatus: "refunded"`
2. 記錄退款金額

### checkout.session.completed

當結帳會話完成時：
1. 訂單狀態更新為 `paymentStatus: "paid"`
2. 保存 Stripe 會話 ID
3. 自動發送確認郵件給客戶

## 故障排除

### Webhook 未被觸發

**可能原因**：
1. Webhook URL 配置錯誤
2. 防火牆阻止了 Stripe 服務器的連接
3. 應用服務器未運行

**解決方案**：
- 驗證 Webhook URL 是否正確
- 檢查應用日誌是否有錯誤
- 使用 Stripe CLI 測試連接

### 事件簽名驗證失敗

**可能原因**：
1. `STRIPE_WEBHOOK_SECRET` 配置錯誤
2. 簽名密鑰已過期或被重置

**解決方案**：
- 驗證環境變數中的簽名密鑰是否正確
- 如果密鑰已更改，重新複製新密鑰並更新環境變數

### 訂單狀態未更新

**可能原因**：
1. 數據庫連接失敗
2. 訂單 ID 未正確傳遞
3. 應用代碼有 Bug

**解決方案**：
- 檢查應用日誌中的錯誤信息
- 驗證訂單是否存在於數據庫
- 檢查 Webhook 事件中的 `client_reference_id` 或 `payment_intent` ID

## 環境變數

確保以下環境變數已正確配置：

| 變數名 | 說明 | 示例 |
|--------|------|------|
| `STRIPE_SECRET_KEY` | Stripe 密鑰（用於 API 調用） | `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | Webhook 簽名密鑰 | `whsec_test_...` |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe 可發佈密鑰（前端使用） | `pk_test_...` |

## 相關文檔

- [Stripe Webhook 官方文檔](https://stripe.com/docs/webhooks)
- [Stripe Event Types](https://stripe.com/docs/api/events/types)
- [Stripe Webhook 簽名驗證](https://stripe.com/docs/webhooks/signatures)

## 支持

如有問題，請：
1. 查看應用日誌
2. 檢查 Stripe Dashboard 中的 Webhook 日誌
3. 參考 [Stripe 支持文檔](https://support.stripe.com)
