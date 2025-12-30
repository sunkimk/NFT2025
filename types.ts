
export enum AvatarStyle {
  // 3D 风格
  MATTE_CLAY = '3D 磨砂粘土 (Matte Clay)',
  GLOSSY_PLASTIC = '3D 亮面塑胶 (Glossy)',
  NEON_GLOW = '3D 霓虹全息 (Neon)',
  CRYSTAL = '3D 水晶玻璃 (Crystal)',
  // 2D 风格
  ANIME_TRENDY = '日系潮流二次元 (Anime)',
  VECTOR_FLAT = '极简矢量扁平 (Vector)',
  PIXEL_ART = '复古 8-Bit 像素 (Pixel)',
  RETRO_DITHERED = '复古 1-Bit 抖动 (Retro Dithered)',
  SKETCH_LINEART = '手绘线条速写 (Sketch)',
  OIL_PAINTING = '厚涂古典油画 (Oil Painting)',
  POP_ART = '波普艺术拼贴 (Pop Art)'
}

export enum Accessory {
  NONE = '无 (None)',
  SUNGLASSES = '酷炫墨镜 (Sunglasses)',
  CYBER_GOGGLES = '赛博义体护目镜 (Goggles)',
  BEANIE = '潮流针织帽 (Beanie)',
  BASEBALL_CAP = '街头棒球帽 (Cap)',
  BUCKET_HAT = '设计师渔夫帽 (Bucket)',
  HEADPHONES = '专业降噪耳机 (Headphones)',
  GOLD_CHAIN = '至尊大金链 (Gold Chain)',
  CROWN = '圣洁皇冠 (Crown)',
  ONIGIRI_MASK = '和风面具 (Mask)',
  HALO = '天使光环 (Halo)',
  DEVIL_HORNS = '恶魔尖角 (Horns)'
}

export enum Clothing {
  NONE = '无 (None)',
  HOODIE = '运动卫衣 (Hoodie)',
  JACKET = '机车皮夹克 (Jacket)',
  SWEATER = '复古毛衣 (Sweater)',
  TECHWEAR = '机能特工服 (Techwear)',
  SUIT = '雅痞西装 (Suit)',
  KIMONO = '和服羽织 (Kimono)',
  ARMOR = '未来机甲 (Armor)',
  CHINESE_ROBE = '国潮长袍 (Robe)'
}

export enum Background {
  STUDIO_GREY = '摄影棚灰 (Studio Grey)',
  PASTEL_RAINBOW = '梦幻彩虹 (Rainbow)',
  VIBRANT_GRADIENT = '活力渐变 (Gradient)',
  CYBERPUNK_STREET = '赛博朋克街景 (Cyber)',
  MINIMAL_WHITE = '极简纯白 (Minimalist)',
  TRADITIONAL_ZEN = '禅意山水 (Zen)',
  SPACE_NEBULA = '深空星云 (Space)',
  DOODLE_WALL = '涂鸦墙面 (Doodle)'
}

export interface GenerationParams {
  style: AvatarStyle;
  accessory: Accessory;
  clothing: Clothing;
  background: Background;
  intensity: number;
  theme?: string;
  isRandom: boolean;
  randomizeTheme: boolean;
  quantity: number;
}

export interface GeneratedResult {
  url: string;
  theme: string;
  description: string;
}
