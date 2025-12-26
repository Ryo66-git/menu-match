import { z } from "zod";

const wineInfoSchema = z.object({
  name: z.string(),
  type: z.string(),
  price: z.number().optional(),
  url: z.string().optional(),
  description: z.string().optional(),
});

export type WineInfo = z.infer<typeof wineInfoSchema>;

// EVAWINEの人気ワイン情報（実際のサイトから取得する場合は、ここでスクレイピングまたはAPI呼び出し）
// 注意: 実際のスクレイピングは利用規約に違反する可能性があるため、サンプルデータを使用
const evawinePopularWines: WineInfo[] = [
  // 赤ワイン
  {
    name: "ロタンティーク・シラー",
    type: "赤",
    price: 1500,
    url: "https://www.evawine.jp/shopdetail/000000001710/",
    description: "南フランスのシラー種の赤ワイン。深みのあるダークチェリーとカシスの香り",
  },
  {
    name: "パヴィヨン・デ・デュック・ルージュ",
    type: "赤",
    price: 2000,
    url: "https://www.evawine.jp/shopdetail/000000001855/",
    description: "ジルベール＆ガイヤール金賞受賞の赤ワイン。完熟したグルナッシュ種",
  },
  {
    name: "ロッチァ・ブルナ・プーリア・ロッソ・アパッシメント",
    type: "赤",
    price: 1600,
    url: "https://www.evawine.jp/",
    description: "イタリア・プーリア州産の赤ワイン。凝縮感のある果実味",
  },
  {
    name: "シャトー・デュ・グラン・ムーラン ボルドー",
    type: "赤",
    price: 2500,
    url: "https://www.evawine.jp/",
    description: "フランス・ボルドー産の赤ワイン。カベルネ・ソーヴィニョンとメルローのブレンド",
  },
  {
    name: "バローロ デル・コムーネ・ディ・バローロ",
    type: "赤",
    price: 3500,
    url: "https://www.evawine.jp/",
    description: "イタリア・ピエモンテ産の高級赤ワイン。ネッビオーロ種の力強いタンニン",
  },
  {
    name: "カンティーナ・デル・パガネッタ キアンティ",
    type: "赤",
    price: 1800,
    url: "https://www.evawine.jp/",
    description: "イタリア・トスカーナ産の赤ワイン。サンジョヴェーゼ種の爽やかな酸味",
  },
  // 白ワイン
  {
    name: "ドメーヌ・ラ・コロンベット シャルドネ",
    type: "白",
    price: 1700,
    url: "https://www.evawine.jp/",
    description: "フランス産の白ワイン。シャルドネ種特有のフルーティーな香り",
  },
  {
    name: "ソーヴィニョン・ブラン ロワール",
    type: "白",
    price: 1600,
    url: "https://www.evawine.jp/",
    description: "フランス・ロワール産の白ワイン。ソーヴィニョン・ブラン種の爽やかな酸味",
  },
  {
    name: "ピノ・グリージョ アルト・アディジェ",
    type: "白",
    price: 1900,
    url: "https://www.evawine.jp/",
    description: "イタリア・アルト・アディジェ産の白ワイン。ピノ・グリージョ種の軽やかな味わい",
  },
  {
    name: "リースリング モーゼル",
    type: "白",
    price: 2200,
    url: "https://www.evawine.jp/",
    description: "ドイツ・モーゼル産の白ワイン。リースリング種の甘みと酸味のバランス",
  },
  {
    name: "シャルドネ ナパ・バレー",
    type: "白",
    price: 2800,
    url: "https://www.evawine.jp/",
    description: "アメリカ・カリフォルニア産の白ワイン。樽熟成による豊かなコク",
  },
  // スパークリング
  {
    name: "ベルモン・ブラン・ド・ブラン・ブリュット・プレステージ",
    type: "スパークリング",
    price: 1800,
    url: "https://www.evawine.jp/",
    description: "爽やかな味わいと上品な泡立ちが特徴のスパークリングワイン",
  },
  {
    name: "プロセッコ DOCG",
    type: "スパークリング",
    price: 2000,
    url: "https://www.evawine.jp/",
    description: "イタリア・ヴェネト産のスパークリングワイン。グレラ種のフルーティーな香り",
  },
  {
    name: "クレマン・ド・ボルドー ブリュット",
    type: "スパークリング",
    price: 2100,
    url: "https://www.evawine.jp/",
    description: "フランス・ボルドー産のスパークリングワイン。エレガントな泡立ち",
  },
  // ロゼ
  {
    name: "ロゼ・ダンジュー",
    type: "ロゼ",
    price: 1900,
    url: "https://www.evawine.jp/",
    description: "フランス・アンジュー産のロゼワイン。グレナッシュ種のフルーティーな味わい",
  },
  {
    name: "ロゼ・ド・プロヴァンス",
    type: "ロゼ",
    price: 1700,
    url: "https://www.evawine.jp/",
    description: "フランス・プロヴァンス産のロゼワイン。爽やかで軽やかな味わい",
  },
  {
    name: "チンクエ・テッレ ロゼ",
    type: "ロゼ",
    price: 2400,
    url: "https://www.evawine.jp/",
    description: "イタリア・リグーリア産のロゼワイン。地中海の香りが特徴",
  },
];

// ワインリストをシャッフルする関数
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // 赤、白、スパークリング、ロゼ
    const maxPrice = searchParams.get("maxPrice");
    const count = searchParams.get("count"); // 取得するワインの数
    const random = searchParams.get("random") === "true"; // ランダムに選ぶかどうか

    // 毎回シャッフルして異なる順序にする
    let wines = random ? shuffleArray(evawinePopularWines) : evawinePopularWines;

    // タイプでフィルタリング
    if (type) {
      wines = wines.filter((wine) => wine.type === type);
    }

    // 価格でフィルタリング
    if (maxPrice) {
      const max = parseInt(maxPrice, 10);
      wines = wines.filter((wine) => !wine.price || wine.price <= max);
    }

    // 指定された数だけ取得
    if (count) {
      const countNum = parseInt(count, 10);
      wines = wines.slice(0, countNum);
    }

    return Response.json({ wines });
  } catch (error) {
    console.error("Error fetching EVAWINE wines:", error);
    return Response.json(
      { error: "ワイン情報の取得中にエラーが発生しました" },
      { status: 500 }
    );
  }
}

