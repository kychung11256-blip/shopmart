# ShopMart Project TODO

## Frontend API Integration Tasks

### Frontend Pages
- [x] 整合 Home.tsx 主頁面 API
  - [x] 集成 trpc.products.list 獲取商品
  - [x] 集成 trpc.categories.list 獲取分類
  - [x] 實現商品數據格式轉換
  - [x] 支持分類篩選和實時同步

- [x] 整合 Products.tsx 商品列表頁
  - [x] 集成 trpc.products.list 獲取商品
  - [x] 集成 trpc.categories.list 獲取分類
  - [x] 實現多條件篩選（分類、價格、搜索）
  - [x] 實現排序功能（價格、熱銷、評分）
  - [x] 響應式設計

- [x] 整合 ProductDetail.tsx 商品詳情頁
  - [x] 集成 trpc.products.getById 獲取詳情
  - [x] 集成 trpc.products.list 獲取相關商品
  - [x] 實現商品展示和圖片輪播
  - [x] 支持數量選擇和購買操作
  - [x] 產品描述、規格、評論標籤頁

- [x] 整合 Cart.tsx 購物車頁
  - [x] 集成 trpc.cart.list 獲取購物車
  - [x] 集成 trpc.products.list 獲取商品信息
  - [x] 實現購物車管理（增減、移除）
  - [x] 計算小計、節省金額、總計
  - [x] 支持全選和單選功能

- [x] 整合 AdminProducts.tsx 後台管理頁
  - [x] 集成 trpc.products.list 獲取商品
  - [x] 集成 trpc.categories.list 獲取分類
  - [x] 集成 trpc.products.create 創建商品
  - [x] 集成 trpc.products.update 更新商品
  - [x] 集成 trpc.products.delete 刪除商品
  - [x] 實現搜索、篩選、排序功能

### Data Conversion & Utilities
- [x] 實現統一的商品數據轉換函數
  - [x] 價格轉換（分 → 元）
  - [x] 評分轉換（0-500 → 0-5）
  - [x] 處理空值和可選字段

- [x] 實現統一的分類數據轉換函數
  - [x] 分類名稱轉換
  - [x] 分類圖標處理

### Testing
- [x] 編寫 API 整合單元測試
  - [x] 商品數據轉換測試
  - [x] 商品過濾測試
  - [x] 購物車操作測試
  - [x] 商品排序測試
  - [x] 折扣計算測試
  - [x] API 響應處理測試

### Features & Enhancements
- [x] 實現實時數據同步
  - [x] 所有頁面使用 TRPC 實時查詢
  - [x] 後台數據變動時前台自動更新

- [x] 加載狀態處理
  - [x] 所有頁面都有加載狀態提示
  - [x] 空狀態提示

- [x] 錯誤處理
  - [x] 集成 toast 提示
  - [x] 用戶友好的錯誤消息

- [x] 多語言支持
  - [x] 所有頁面支持中文/英文切換

- [x] 響應式設計
  - [x] 移動端優化
  - [x] 桌面端優化

## Backend API Routes (Reference)
- [x] trpc.products.list - 獲取商品列表
- [x] trpc.products.getById - 獲取單個商品
- [x] trpc.products.create - 創建商品
- [x] trpc.products.update - 更新商品
- [x] trpc.products.delete - 刪除商品
- [x] trpc.categories.list - 獲取分類列表
- [x] trpc.cart.list - 獲取購物車項目

## 🐛 Bug 修復
- [x] 購物車商品刪除後返回主頁時商品仍然存在 - 已修復購物車狀態同步
- [x] 購物車默認數據不斷重新出現 - 已移除默認數據填充邏輯
- [x] 商品無法加入購物車 - 已實現 ProductDetail 和 Products 的 API 調用
- [x] 購物車圖標小數字不同步 - 已實現實時同步

## Future Enhancements (Optional)
- [ ] 實現購物車持久化（保存到數據庫）
- [ ] 實現用戶收藏功能
- [ ] 實現商品評論功能
- [ ] 實現訂單管理功能
- [ ] 實現支付集成
- [ ] 實現庫存實時更新
- [ ] 實現推薦算法
- [ ] 實現搜索優化

## Project Status
**Status**: ✅ 完成
**Last Updated**: 2026-03-21
**Version**: 1.0.0

## 🟢 最近修載

- [x] 後台商品編輯功能 - 已修載所有 TypeScript 错誤和 API 整合
- [x] 前後台數據同步 - 已移除本地硬編碼數據，確保與數據庫同步
- [x] 所有 23 個測試全部通過


## 🎨 圖片上傳功能

- [x] 後台商品表單添加圖片 URL 輸入欄
- [x] 新增商品時支持圖片上傳
- [x] 編輯商品時支持圖片修改
- [x] 圖片預覽功能
- [x] 商品列表中顯示圖片縮圖
- [x] 圖片加載失敗時顯示佔位符


## 🖼️ 直接圖片上傳功能

- [x] 後端實現圖片上傳 API (tRPC 過程)
- [x] 前端添加文件選擇輸入框
- [x] 前端實現圖片上傳邏輯
- [x] 測試完整的上傳流程
