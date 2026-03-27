import crypto from 'crypto';
import https from 'https';
import { ENV } from './_core/env';

// 創建 HTTPS Agent，禁用 SSL 驗證（僅用於開發/測試）
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
  minVersion: 'TLSv1.2',
});

/**
 * Star Pay 簽名生成
 * 待簽字符串 = merchant_no + params + sign_type + timestamp + Key
 * 簽名 = MD5(待簽字符串)
 */
export function generateStarPaySignature(
  params: Record<string, any>,
  timestamp: number
): { sign: string; paramsStr: string } {
  const merchantNo = ENV.starPayMerchantNo;
  const apiKey = ENV.starPayApiKey;
  const signType = 'MD5';

  // 將 params 轉換為 JSON 字符串
  const paramsStr = JSON.stringify(params);

  // 構造待簽字符串
  const toSign = `${merchantNo}${paramsStr}${signType}${timestamp}${apiKey}`;

  // 生成 MD5 簽名
  const sign = crypto.createHash('md5').update(toSign).digest('hex');

  return { sign, paramsStr };
}

/**
 * 驗證 Star Pay Webhook 簽名
 */
export function verifyStarPaySignature(
  merchantNo: string,
  paramsStr: string,
  timestamp: number,
  sign: string
): boolean {
  const apiKey = ENV.starPayApiKey;
  const signType = 'MD5';

  // 構造待簽字符串
  const toSign = `${merchantNo}${paramsStr}${signType}${timestamp}${apiKey}`;

  // 生成 MD5 簽名
  const expectedSign = crypto.createHash('md5').update(toSign).digest('hex');

  // 比較簽名（不區分大小寫）
  return expectedSign.toLowerCase() === sign.toLowerCase();
}

/**
 * Star Pay 支付產品類型
 */
export type StarPayProduct = 'TRC20Buy' | 'TRC20H5' | 'USDCERC20Buy';

/**
 * 驗證支付產品代碼是否有效
 */
export function isValidStarPayProduct(product: string): product is StarPayProduct {
  const validProducts = ENV.starPayProducts?.split(',').map((p: string) => p.trim()) || [];
  return validProducts.includes(product);
}

/**
 * 創建 Star Pay 支付訂單
 */
export async function createStarPayOrder(
  merchantRef: string,
  product: StarPayProduct,
  amount: string,
  language: string = 'en_US',
  extraData?: Record<string, any>
) {
  const timestamp = Math.floor(Date.now() / 1000);
  const merchantNo = ENV.starPayMerchantNo;

  // 構造業務參數
  const params: Record<string, any> = {
    merchant_ref: merchantRef,
    product,
    amount,
    language,
    extra: {
      fiat_currency: 'USD', // 法幣類型在 extra 對象中
      // 不設置 bank_code，讓 Star Pay 使用默認值
      ...(extraData || {}),
    },
  };

  // 生成簽名
  const { sign, paramsStr } = generateStarPaySignature(params, timestamp);

  // 構造請求參數
  const requestParams = new URLSearchParams({
    merchant_no: merchantNo,
    timestamp: timestamp.toString(),
    sign_type: 'MD5',
    params: paramsStr,
    sign,
  });

  try {
    // 調用 Star Pay API
    const data = await new Promise<any>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Star Pay API request timeout'));
      }, 15000); // 15 秒超時

      const postData = requestParams.toString();
      const options = {
        hostname: 'api.star-pay.vip',
        port: 443,
        path: '/api/gateway/pay',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData),
        },
        agent: httpsAgent,
      };

      const req = https.request(options, (res) => {
        let responseData = '';

        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', () => {
          clearTimeout(timeoutId);
          try {
            const parsedData = JSON.parse(responseData);
            resolve(parsedData);
          } catch (e) {
            reject(new Error(`Failed to parse Star Pay response: ${e}`));
          }
        });
      });

      req.on('error', (error) => {
        clearTimeout(timeoutId);
        reject(error);
      });

      req.write(postData);
      req.end();
    });

    console.log('[Star Pay] API Response:', {
      merchantRef,
      product,
      amount,
      code: data.code,
      message: data.message,
      params: data.params,
      fullResponse: JSON.stringify(data),
    });

    return data;
  } catch (error) {
    console.error('[Star Pay] API Error:', error);
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        throw new Error('Star Pay API request timeout');
      }
      throw new Error(`Failed to create Star Pay order: ${error.message}`);
    }
    throw error;
  }
}

/**
 * 格式化金額為 Star Pay 所需的格式
 * 法幣：保留兩位小數
 * 數字貨幣：保留6位小數
 */
export function formatStarPayAmount(amount: number, isCrypto: boolean = true): string {
  if (isCrypto) {
    return amount.toFixed(6);
  }
  return amount.toFixed(2);
}
