// 商品和分類的中英文翻譯
// Product and Category translations for Chinese and English

export const categoryTranslations: Record<string, Record<string, string>> = {
  'HOME PET': { zh: '家居寵物', en: 'HOME PET' },
  'OUTDOORS': { zh: '戶外用品', en: 'OUTDOORS' },
  'DIGITAL': { zh: '數碼電子', en: 'DIGITAL' },
  'Apparel': { zh: '服裝', en: 'Apparel' },
  'Children': { zh: '兒童用品', en: 'Children' },
  'COSMETICS': { zh: '化妝品', en: 'COSMETICS' },
  'Food & Drink': { zh: '食品飲料', en: 'Food & Drink' },
  'Sports': { zh: '運動用品', en: 'Sports' },
};

export const productTranslations: Record<number, Record<string, string>> = {
  1: {
    name_zh: '優雅露肩褶皺連衣裙',
    name_en: 'Crepe Off-the-Shoulder Dress',
    desc_zh: '優雅的露肩褶皺連衣裙，適合正式場合。',
    desc_en: 'Elegant off-shoulder crepe dress perfect for formal occasions.',
  },
  2: {
    name_zh: '中文名稱商品',
    name_en: 'Chinese Named Product',
    desc_zh: '這是一個示例商品。',
    desc_en: 'This is a sample product.',
  },
  3: {
    name_zh: '棉質眼孔中長連衣裙',
    name_en: 'Cotton Eyelet Midi Dress',
    desc_zh: '舒適的棉質眼孔中長連衣裙。',
    desc_en: 'Comfortable cotton eyelet midi dress.',
  },
  4: {
    name_zh: '手提單肩帆布包',
    name_en: 'Handheld Single Shoulder Canvas Bag',
    desc_zh: '耐用的帆布單肩包。',
    desc_en: 'Durable canvas single shoulder bag.',
  },
  5: {
    name_zh: '1.3升雙噴口冷霧加濕器',
    name_en: '1.3L Air Humidifier DoubleSpray Port Cool Mist',
    desc_zh: '高效的冷霧加濕器。',
    desc_en: 'Efficient cool mist humidifier.',
  },
  6: {
    name_zh: 'PHATOIL 100ml香薰香水',
    name_en: 'PHATOIL 100ml Aromatherapy Fragrance',
    desc_zh: '天然香薰香水。',
    desc_en: 'Natural aromatherapy fragrance.',
  },
  7: {
    name_zh: '89年份法國紅酒收藏',
    name_en: '89 Years of French Red Wine Collection',
    desc_zh: '珍貴的法國紅酒。',
    desc_en: 'Precious French red wine.',
  },
  8: {
    name_zh: '熱銷品牌男士香水',
    name_en: 'Hot Selling Brand Eau De Toilette for Men Fresh Romantic',
    desc_zh: '流行的男士香水。',
    desc_en: 'Popular men\'s fragrance.',
  },
  9: {
    name_zh: '定製4.5英寸創意陶瓷研缽',
    name_en: 'Customized 4.5 Inch Creative Ceramic Mortar',
    desc_zh: '精美的陶瓷研缽。',
    desc_en: 'Beautiful ceramic mortar.',
  },
  10: {
    name_zh: '環保黑胡桃木餐盤',
    name_en: 'Eco Friendly Black Walnut Wood Serving Tray',
    desc_zh: '環保木製餐盤。',
    desc_en: 'Eco-friendly wooden serving tray.',
  },
};

export const statusTranslations: Record<string, Record<string, string>> = {
  pending: { zh: '待處理', en: 'Pending' },
  processing: { zh: '處理中', en: 'Processing' },
  shipped: { zh: '已發貨', en: 'Shipped' },
  delivered: { zh: '已送達', en: 'Delivered' },
  cancelled: { zh: '已取消', en: 'Cancelled' },
  active: { zh: '活躍', en: 'Active' },
  inactive: { zh: '非活躍', en: 'Inactive' },
  out_of_stock: { zh: '缺貨', en: 'Out of Stock' },
  banned: { zh: '已封禁', en: 'Banned' },
};

export function getProductName(productId: number, language: string): string {
  const translation = productTranslations[productId];
  if (!translation) return `Product ${productId}`;
  return language === 'zh' ? translation.name_zh : translation.name_en;
}

export function getProductDescription(productId: number, language: string): string {
  const translation = productTranslations[productId];
  if (!translation) return '';
  return language === 'zh' ? translation.desc_zh : translation.desc_en;
}

export function getCategoryName(category: string, language: string): string {
  const translation = categoryTranslations[category];
  if (!translation) return category;
  return language === 'zh' ? translation.zh : translation.en;
}

export function getStatusLabel(status: string, language: string): string {
  const translation = statusTranslations[status];
  if (!translation) return status;
  return language === 'zh' ? translation.zh : translation.en;
}
