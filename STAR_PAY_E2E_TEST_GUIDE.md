# Star Pay 完整集成端到端測試指南

## 概述

本文檔提供了使用 Star Pay 官方測試工具進行完整端到端測試的步驟。

## 系統架構

```
┌─────────────────────────────────────────────────────────────┐
│                      前端 (Checkout 頁面)                    │
│  - 支付方法選擇 (Stripe / Star Pay)                         │
│  - Star Pay iframe 顯示支付表單                              │
│  - 訂單創建和支付流程                                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   後端 API (tRPC)                            │
│  - POST /api/trpc/payments.createStarPayOrder              │
│    • 驗證支付產品代碼                                        │
│    • 生成 MD5 簽名                                           │
│    • 調用 Star Pay API                                       │
│    • 返回支付 URL                                            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Star Pay API                              │
│  - https://api.star-pay.vip/api/gateway/pay                │
│  - 接收訂單信息和簽名                                        │
│  - 返回支付 URL                                              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Star Pay 支付頁面                          │
│  - 用戶完成支付                                              │
│  - 支付成功/失敗                                             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Webhook 回調                              │
│  - POST /api/star-pay/webhook                              │
│  - 驗證簽名                                                  │
│  - 更新訂單狀態                                              │
│  - 返回成功響應                                              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   數據庫                                     │
│  - 更新訂單支付狀態 (paid/failed/refunded)                  │
│  - 更新訂單狀態 (processing/cancelled)                      │
└─────────────────────────────────────────────────────────────┘
```

## 測試環境配置

### 1. 環境變量

確保以下環境變量已正確配置：

```env
STAR_PAY_MERCHANT_NO=your_merchant_no
STAR_PAY_API_KEY=your_api_key
STAR_PAY_PRODUCTS=TRC20Buy,TRC20H5,USDCERC20Buy
```

### 2. 支付產品配置

支持的支付產品：
- **TRC20Buy**: USDT (Tron TRC20)
- **TRC20H5**: USDT H5 (Mobile)
- **USDCERC20Buy**: USDC (Ethereum ERC20)

### 3. 金額格式

- **法幣 (USD)**: 保留 2 位小數 (例: 100.00)
- **加密貨幣**: 保留 6 位小數 (例: 100.000000)

## 端到端測試步驟

### 步驟 1: 啟動開發服務器

```bash
cd /home/ubuntu/shopmart
pnpm dev
```

服務器將在 http://localhost:3000 啟動

### 步驟 2: 訪問 Checkout 頁面

1. 打開瀏覽器訪問 http://localhost:3000
2. 登錄或註冊用戶
3. 添加商品到購物車
4. 點擊「結賬」進入 Checkout 頁面

### 步驟 3: 選擇 Star Pay 支付方法

1. 在 Checkout 頁面，選擇 Star Pay 支付選項之一：
   - USDT (TRC20)
   - USDT H5
   - USDC (ERC20)

2. 填寫收貨地址

3. 點擊相應的 Star Pay 選項

### 步驟 4: 測試支付流程

#### 使用 Star Pay 官方測試工具

1. 訪問 Star Pay 官方測試工具：https://www.star-pay.vip/doc/openApi

2. 在「在線測試交易」部分，填寫以下信息：

   ```json
   {
     "merchant_no": "your_merchant_no",
     "timestamp": 1606806265,
     "sign_type": "MD5",
     "params": "{\"merchant_ref\":\"ORDER-123-1606806265\",\"product\":\"TRC20Buy\",\"amount\":\"100.00\",\"language\":\"en_US\",\"extra\":{\"fiat_currency\":\"USD\"}}",
     "sign": "生成的MD5簽名"
   }
   ```

3. 點擊「Send The Request」提交測試請求

4. 查看響應，應包含：
   ```json
   {
     "code": 200,
     "message": "",
     "params": "{\"merchant_ref\":\"ORDER-123-1606806265\",\"system_ref\":\"SYS-456-7890\",\"payurl\":\"https://...\"}"
   }
   ```

### 步驟 5: 驗證 Webhook 回調

#### 使用 Star Pay 官方測試工具發送 Webhook

1. 在 Star Pay 官方測試工具中，找到 Webhook 測試部分

2. 配置 Webhook URL：
   ```
   https://your-domain.com/api/star-pay/webhook
   ```

3. 填寫 Webhook 負載：
   ```json
   {
     "merchant_no": "your_merchant_no",
     "timestamp": 1606806265,
     "sign_type": "MD5",
     "params": "{\"merchant_ref\":\"ORDER-123-1606806265\",\"system_ref\":\"SYS-456-7890\",\"status\":1,\"amount\":\"100.00\",\"fee\":\"0.00\",\"success_time\":1606806300}",
     "sign": "生成的MD5簽名"
   }
   ```

4. 點擊「Send The Request」發送 Webhook

5. 驗證響應：
   ```json
   {\n     \"code\": 200,\n     \"message\": \"OK\"\n   }\n   ```

### 步驟 6: 驗證數據庫更新

使用 SQL 查詢驗證訂單狀態已更新：

```sql
SELECT id, orderNumber, paymentStatus, status, updatedAt 
FROM orders 
WHERE id = 123;
```

預期結果：
- `paymentStatus`: paid (支付成功) / failed (支付失敗) / refunded (已退款)
- `status`: processing (處理中) / cancelled (已取消)

## 測試場景

### 場景 1: 支付成功

1. 訂單狀態: pending → processing
2. 支付狀態: unpaid → paid
3. 數據庫更新: 訂單標記為已支付

### 場景 2: 支付失敗

1. 訂單狀態: pending → cancelled
2. 支付狀態: unpaid → failed
3. 數據庫更新: 訂單標記為失敗

### 場景 3: 支付退款

1. 訂單狀態: processing → cancelled
2. 支付狀態: paid → refunded
3. 數據庫更新: 訂單標記為已退款

## 簽名生成指南

### MD5 簽名算法

```
待簽字符串 = merchant_no + params + sign_type + timestamp + api_key
簽名 = MD5(待簽字符串)
```

### 示例

```javascript
const crypto = require('crypto');

const merchantNo = 'TEST_MERCHANT';
const params = JSON.stringify({
  merchant_ref: 'ORDER-123-1606806265',
  product: 'TRC20Buy',
  amount: '100.00',
  language: 'en_US',
  extra: { fiat_currency: 'USD' }
});
const signType = 'MD5';
const timestamp = 1606806265;
const apiKey = 'TEST_KEY_123';

const toSign = `${merchantNo}${params}${signType}${timestamp}${apiKey}`;
const sign = crypto.createHash('md5').update(toSign).digest('hex');

console.log('Sign:', sign);
```

## 常見問題

### Q1: 為什麼 API 返回 "Required fiat currency"?

**A**: `fiat_currency` 必須在 `extra` 對象中，而不是在根級別。

正確格式：
```json
{
  "merchant_ref": "ORDER-123-1606806265",
  "product": "TRC20Buy",
  "amount": "100.00",
  "language": "en_US",
  "extra": {
    "fiat_currency": "USD"
  }
}
```

### Q2: Webhook 簽名驗證失敗

**A**: 確保簽名算法正確：
1. 檢查 merchant_no 是否正確
2. 檢查 params 字符串是否完全相同
3. 檢查 sign_type 是否為 "MD5"
4. 檢查 timestamp 是否正確
5. 檢查 API Key 是否正確

### Q3: 訂單狀態沒有更新

**A**: 檢查以下項目：
1. Webhook URL 是否正確配置
2. Webhook 簽名是否驗證通過
3. 訂單 ID 是否正確提取（從 merchant_ref 中）
4. 數據庫連接是否正常

## 測試結果驗證

### 後端日誌

查看後端日誌確認：

```bash
# 查看 Star Pay API 調用日誌
tail -f .manus-logs/devserver.log | grep "Star Pay"

# 查看 Webhook 接收日誌
tail -f .manus-logs/devserver.log | grep "Webhook"
```

### 數據庫驗證

```sql
-- 查詢最新訂單
SELECT * FROM orders ORDER BY createdAt DESC LIMIT 1;

-- 查詢訂單項目
SELECT * FROM orderItems WHERE orderId = 123;

-- 查詢訂單支付歷史
SELECT * FROM orders WHERE id = 123;
```

## 部署前檢查清單

- [ ] 環境變量已配置 (STAR_PAY_MERCHANT_NO, STAR_PAY_API_KEY)
- [ ] Webhook 端點已正確註冊 (/api/star-pay/webhook)
- [ ] 簽名驗證邏輯已測試
- [ ] 訂單狀態更新邏輯已測試
- [ ] 支付產品驗證已測試
- [ ] 金額格式化已測試
- [ ] 錯誤處理已測試
- [ ] 單元測試全部通過 (22 個 Webhook 測試)
- [ ] 集成測試全部通過 (29 個前端支付流程測試)

## 相關文件

- `/home/ubuntu/shopmart/server/star-pay.ts` - Star Pay 核心邏輯
- `/home/ubuntu/shopmart/server/star-pay-webhook.ts` - Webhook 處理
- `/home/ubuntu/shopmart/server/star-pay.test.ts` - Webhook 測試 (22 個)
- `/home/ubuntu/shopmart/server/checkout-flow.test.ts` - 前端支付流程測試 (29 個)
- `/home/ubuntu/shopmart/server/routers.ts` - tRPC 路由定義
- `/home/ubuntu/shopmart/client/src/pages/Checkout.tsx` - 前端 Checkout 頁面
