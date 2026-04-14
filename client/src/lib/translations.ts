/**
 * Jade Emporium - Multi-language Translations
 * 支援中文和英文的翻譯系統
 */

export type Language = 'zh' | 'en';

export const translations = {
  zh: {
    // 導航欄
    home: '首頁',
    myOrder: '我的訂單',
    applyFor: '申請',
    mobileApp: '移動應用',
    signIn: '登入',
    cart: '購物車',
    collectSite: '收藏本站',

    // 首頁 Banner
    newArrivals: '新品上市',
    elegantDressCollection: '優雅連衣裙系列',
    shopNow: '立即購物',
    latestTech: '最新科技',
    gadgetsElectronics: '小工具和電子產品',
    explore: '探索',
    summerSale: '夏季促銷',
    upTo50Off: '最高優惠50%',
    grabDeals: '搶購優惠',

    // 商品分類
    homePet: '家居寵物',
    outdoors: '戶外',
    digital: '數碼',
    apparel: '服裝',
    children: '兒童',
    cosmetics: '化妝品',
    foodDrink: '食品飲料',
    sports: '運動',

    // 商品區塊
    recommended: '推薦商品',
    shopStreet: '商品街',
    topOne: '排行榜',
    topList: '熱銷榜',
    promotions: '促銷活動',
    youMayAlsoLike: '你可能也喜歡',
    more: '更多',

    // 商品詳情
    addToCart: '加入購物車',
    buyNow: '立即購買',
    productDetails: '商品詳情',
    price: '價格',
    originalPrice: '原價',
    stock: '庫存',
    sold: '已銷售',
    rating: '評分',
    description: '描述',
    relatedProducts: '相關商品',

    // 購物車
    shoppingCart: '購物車',
    quantity: '數量',
    total: '合計',
    checkout: '結賬',
    continueShopping: '繼續購物',
    emptyCart: '購物車為空',

    // 登入
    login: '登入',
    emailAddr: '郵箱',
    password: '密碼',
    rememberMe: '記住我',
    forgotPassword: '忘記密碼？',
    signUp: '註冊',
    noAccount: '沒有帳戶？',

    // 後台
    dashboard: '儀表板',
    products: '商品',
    orders: '訂單',
    users: '用戶',
    categories: '分類',
    analytics: '分析',
    settings: '設置',
    viewStore: '查看商店',
    logout: '登出',
    admin: '管理員',

    // 後台商品管理
    addProduct: '新增商品',
    editProduct: '編輯商品',
    deleteProduct: '刪除商品',
    productName: '商品名稱',
    category: '分類',
    status: '狀態',
    active: '活躍',
    inactive: '非活躍',
    outOfStock: '缺貨',
    save: '保存',
    cancel: '取消',
    delete: '刪除',
    edit: '編輯',
    search: '搜尋',
    filter: '篩選',
    results: '結果',

    // 後台訂單管理
    orderID: '訂單ID',
    customer: '客戶',
    date: '日期',
    amount: '金額',
    pending: '待處理',
    shipped: '已發貨',
    delivered: '已送達',
    cancelled: '已取消',

    // 後台用戶管理
    userID: '用戶ID',
    username: '用戶名',
    emailUser: '郵箱',
    joinDate: '加入日期',
    action: '操作',
    ban: '封禁',
    unban: '解禁',

    // 頁腳
    completeVariety: '完整品種',
    millionsOfProducts: '數百萬種商品',
    fastDelivery: '快速配送',
    sameDayShipping: '同日發貨',
    genuineProduct: '正品商品',
    hundredPercentAuthentic: '百分百正品',
    lowPriceEveryDay: '每日低價',
    bestDealsGuaranteed: '保證最優惠',
    service: '服務',
    phone: '電話',
    address: '地址',
    copyright: '版權',

    // 通用
    loading: '加載中...',
    error: '錯誤',
    success: '成功',
    warning: '警告',
    noData: '無數據',
    selectAll: '全選',
    deselectAll: '取消全選',
  },

  en: {
    // Navigation
    home: 'Home',
    myOrder: 'My Order',
    applyFor: 'Apply for',
    mobileApp: 'Mobile App',
    signIn: 'Sign In',
    cart: 'Cart',
    collectSite: 'Collect this site',

    // Home Banner
    newArrivals: 'New Arrivals',
    elegantDressCollection: 'Elegant Dress Collection',
    shopNow: 'Shop Now',
    latestTech: 'Latest Tech',
    gadgetsElectronics: 'Gadgets & Electronics',
    explore: 'Explore',
    summerSale: 'Summer Sale',
    upTo50Off: 'Up to 50% Off',
    grabDeals: 'Grab Deals',

    // Product Categories
    homePet: 'HOME PET',
    outdoors: 'OUTDOORS',
    digital: 'DIGITAL',
    apparel: 'Apparel',
    children: 'Children',
    cosmetics: 'COSMETICS',
    foodDrink: 'Food & Drink',
    sports: 'Sports',

    // Product Sections
    recommended: 'Recommended',
    shopStreet: 'SHOP STREET',
    topOne: 'TOP ONE',
    topList: 'Top List',
    promotions: 'Promotions',
    youMayAlsoLike: 'You May Also Like',
    more: 'More',

    // Product Details
    addToCart: 'Add to Cart',
    buyNow: 'Buy Now',
    productDetails: 'Product Details',
    price: 'Price',
    originalPrice: 'Original Price',
    stock: 'Stock',
    sold: 'Sold',
    rating: 'Rating',
    description: 'Description',
    relatedProducts: 'Related Products',

    // Shopping Cart
    shoppingCart: 'Shopping Cart',
    quantity: 'Quantity',
    total: 'Total',
    checkout: 'Checkout',
    continueShopping: 'Continue Shopping',
    emptyCart: 'Your cart is empty',

    // Login
    login: 'Login',
    emailAddr: 'Email',
    password: 'Password',
    rememberMe: 'Remember me',
    forgotPassword: 'Forgot password?',
    signUp: 'Sign Up',
    noAccount: "Don't have an account?",

    // Admin
    dashboard: 'Dashboard',
    products: 'Products',
    orders: 'Orders',
    users: 'Users',
    categories: 'Categories',
    analytics: 'Analytics',
    settings: 'Settings',
    viewStore: 'View Store',
    logout: 'Logout',
    admin: 'Admin',

    // Admin Products
    addProduct: 'Add Product',
    editProduct: 'Edit Product',
    deleteProduct: 'Delete Product',
    productName: 'Product Name',
    category: 'Category',
    status: 'Status',
    active: 'Active',
    inactive: 'Inactive',
    outOfStock: 'Out of Stock',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    search: 'Search',
    filter: 'Filter',
    results: 'results',

    // Admin Orders
    orderID: 'Order ID',
    customer: 'Customer',
    date: 'Date',
    amount: 'Amount',
    pending: 'Pending',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',

    // Admin Users
    userID: 'User ID',
    username: 'Username',
    emailUser: 'Email',
    joinDate: 'Join Date',
    action: 'Action',
    ban: 'Ban',
    unban: 'Unban',

    // Footer
    completeVariety: 'Complete variety',
    millionsOfProducts: 'Millions of products',
    fastDelivery: 'Fast delivery',
    sameDayShipping: 'Same day shipping',
    genuineProduct: 'Genuine product',
    hundredPercentAuthentic: '100% authentic',
    lowPriceEveryDay: 'Low price every day',
    bestDealsGuaranteed: 'Best deals guaranteed',
    service: 'Service',
    phone: 'Phone',
    address: 'Address',
    copyright: 'Copyright',

    // Common
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    warning: 'Warning',
    noData: 'No data',
    selectAll: 'Select All',
    deselectAll: 'Deselect All',
  },
};

export function t(key: keyof typeof translations.zh, language: Language = 'zh'): string {
  return translations[language][key as keyof typeof translations[Language]] || key;
}
