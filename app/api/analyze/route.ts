import { openai } from "@ai-sdk/openai";
// eslint-disable-next-line deprecation/deprecation
import { generateObject } from "ai";
import { z } from "zod";

// EVAWINEのワインリストを直接インポート（API呼び出しの代わり）
// ワインリストをシャッフルする関数
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// EVAWINEの人気ワイン情報
const evawinePopularWines = [
  // 赤ワイン
  { name: "ロタンティーク・シラー", type: "赤", price: 1500, url: "https://www.evawine.jp/shopdetail/000000001710/", description: "南フランスのシラー種の赤ワイン。深みのあるダークチェリーとカシスの香り" },
  { name: "パヴィヨン・デ・デュック・ルージュ", type: "赤", price: 2000, url: "https://www.evawine.jp/shopdetail/000000001855/", description: "ジルベール＆ガイヤール金賞受賞の赤ワイン。完熟したグルナッシュ種" },
  { name: "ロッチァ・ブルナ・プーリア・ロッソ・アパッシメント", type: "赤", price: 1600, url: "https://www.evawine.jp/", description: "イタリア・プーリア州産の赤ワイン。凝縮感のある果実味" },
  { name: "シャトー・デュ・グラン・ムーラン ボルドー", type: "赤", price: 2500, url: "https://www.evawine.jp/", description: "フランス・ボルドー産の赤ワイン。カベルネ・ソーヴィニョンとメルローのブレンド" },
  { name: "バローロ デル・コムーネ・ディ・バローロ", type: "赤", price: 3500, url: "https://www.evawine.jp/", description: "イタリア・ピエモンテ産の高級赤ワイン。ネッビオーロ種の力強いタンニン" },
  { name: "カンティーナ・デル・パガネッタ キアンティ", type: "赤", price: 1800, url: "https://www.evawine.jp/", description: "イタリア・トスカーナ産の赤ワイン。サンジョヴェーゼ種の爽やかな酸味" },
  // 白ワイン
  { name: "ドメーヌ・ラ・コロンベット シャルドネ", type: "白", price: 1700, url: "https://www.evawine.jp/", description: "フランス産の白ワイン。シャルドネ種特有のフルーティーな香り" },
  { name: "ソーヴィニョン・ブラン ロワール", type: "白", price: 1600, url: "https://www.evawine.jp/", description: "フランス・ロワール産の白ワイン。ソーヴィニョン・ブラン種の爽やかな酸味" },
  { name: "ピノ・グリージョ アルト・アディジェ", type: "白", price: 1900, url: "https://www.evawine.jp/", description: "イタリア・アルト・アディジェ産の白ワイン。ピノ・グリージョ種の軽やかな味わい" },
  { name: "リースリング モーゼル", type: "白", price: 2200, url: "https://www.evawine.jp/", description: "ドイツ・モーゼル産の白ワイン。リースリング種の甘みと酸味のバランス" },
  { name: "シャルドネ ナパ・バレー", type: "白", price: 2800, url: "https://www.evawine.jp/", description: "アメリカ・カリフォルニア産の白ワイン。樽熟成による豊かなコク" },
  // スパークリング
  { name: "ベルモン・ブラン・ド・ブラン・ブリュット・プレステージ", type: "スパークリング", price: 1800, url: "https://www.evawine.jp/", description: "爽やかな味わいと上品な泡立ちが特徴のスパークリングワイン" },
  { name: "プロセッコ DOCG", type: "スパークリング", price: 2000, url: "https://www.evawine.jp/", description: "イタリア・ヴェネト産のスパークリングワイン。グレラ種のフルーティーな香り" },
  { name: "クレマン・ド・ボルドー ブリュット", type: "スパークリング", price: 2100, url: "https://www.evawine.jp/", description: "フランス・ボルドー産のスパークリングワイン。エレガントな泡立ち" },
  // ロゼ
  { name: "ロゼ・ダンジュー", type: "ロゼ", price: 1900, url: "https://www.evawine.jp/", description: "フランス・アンジュー産のロゼワイン。グレナッシュ種のフルーティーな味わい" },
  { name: "ロゼ・ド・プロヴァンス", type: "ロゼ", price: 1700, url: "https://www.evawine.jp/", description: "フランス・プロヴァンス産のロゼワイン。爽やかで軽やかな味わい" },
  { name: "チンクエ・テッレ ロゼ", type: "ロゼ", price: 2400, url: "https://www.evawine.jp/", description: "イタリア・リグーリア産のロゼワイン。地中海の香りが特徴" },
];

const wineSchema = z.object({
  wines: z.array(
    z.object({
      name: z.string().describe("ワインの銘柄名"),
      type: z.enum(["赤", "白", "スパークリング", "ロゼ"]).describe("ワインの種類"),
      grape: z.string().describe("ブドウ品種"),
      region: z.string().describe("産地"),
      reason: z.string().max(50).describe("その料理に合う理由（日本語で30文字程度）"),
      price: z.number().describe("推定市場価格（日本円）"),
    })
  ).length(5),
});

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return Response.json(
        { error: "OPENAI_API_KEYが設定されていません" },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("image") as File;
    const preferencesValue = formData.get("preferences");
    
    let preferences: {
      budget?: string | null;
      wineTypes?: string[];
      region?: string | null;
    } = {};
    
    // preferencesの処理を安全に行う
    if (preferencesValue) {
      try {
        // 文字列であることを確認
        let preferencesJson: string | null = null;
        
        if (typeof preferencesValue === "string") {
          preferencesJson = preferencesValue;
        } else if (preferencesValue instanceof File) {
          // Fileオブジェクトの場合は読み込む
          preferencesJson = await preferencesValue.text();
        } else {
          // Requestオブジェクトやその他のオブジェクトの場合はスキップ
          console.warn("preferencesValue is not a string or File, skipping. Type:", typeof preferencesValue);
          // 無効な値として扱う（処理をスキップ）
        }
        
        // JSON文字列であることを確認してからパース
        if (preferencesJson && 
            typeof preferencesJson === "string" &&
            preferencesJson.trim() !== "" && 
            preferencesJson !== "null" &&
            preferencesJson !== "undefined" &&
            (preferencesJson.trim().startsWith("{") || preferencesJson.trim().startsWith("["))) {
          try {
            preferences = JSON.parse(preferencesJson);
          } catch (parseError) {
            console.error("JSON.parse failed for preferences:", parseError);
            console.error("preferencesJson value:", preferencesJson?.substring(0, 100));
            // パースに失敗しても処理を続行
          }
        }
      } catch (e) {
        console.error("Failed to process preferences:", e);
        // エラーが発生しても処理を続行（デフォルト値を使用）
      }
    }

    if (!file) {
      return Response.json(
        { error: "画像がアップロードされていません" },
        { status: 400 }
      );
    }

    // 画像をbase64に変換
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mimeType = file.type;
    const dataUrl = `data:${mimeType};base64,${base64}`;

    const messages = [
      {
        role: "system" as const,
        content: "あなたは世界最高のソムリエです。アップロードされた料理メニュー画像を解析し、その料理に最も合うワインリストを提案してください。",
      },
      {
        role: "user" as const,
        content: [
          {
            type: "image" as const,
            image: dataUrl,
          },
          {
            type: "text" as const,
            text: `画像を詳しく分析し、以下の情報を考慮してワインを選んでください：
- 料理の種類（肉料理、魚料理、パスタ、サラダなど）
- 調理方法（グリル、煮込み、生など）
- ソースや調味料の特徴
- 料理の濃淡や味の強さ
${preferences.wineTypes && preferences.wineTypes.length > 0 ? `\n- 希望のワインの種類: ${preferences.wineTypes.join("、")}` : ""}
${preferences.budget ? `\n- 希望の予算: ${preferences.budget}円以下` : ""}
${preferences.region ? `\n- 希望の産地: ${preferences.region}` : ""}

5つの異なるワインを提案し、それぞれについて詳細な理由を説明してください。`,
          },
        ],
      },
    ];

    const { object } = await generateObject({
      model: openai("gpt-4o"),
      schema: wineSchema,
      messages,
    });

    // EVAWINEのワインリストから希望に基づいてフィルタリング
    let evawineWines = [...evawinePopularWines];

    // 希望に基づいてフィルタリング
    if (preferences.wineTypes && preferences.wineTypes.length > 0) {
      evawineWines = evawineWines.filter((wine) =>
        preferences.wineTypes!.includes(wine.type)
      );
    }

    if (preferences.budget) {
      const maxBudget = parseInt(preferences.budget, 10);
      evawineWines = evawineWines.filter(
        (wine) => !wine.price || wine.price <= maxBudget
      );
    }

    // 産地でフィルタリング
    if (preferences.region && evawineWines.length > 0) {
      evawineWines = evawineWines.filter((wine) => {
        const regionLower = preferences.region!.toLowerCase();
        return (
          wine.description?.toLowerCase().includes(regionLower) ||
          wine.name.toLowerCase().includes(regionLower)
        );
      });
    }

    // フィルタリング結果が少ない場合は、元のリストから選ぶ
    if (evawineWines.length === 0) {
      evawineWines = [...evawinePopularWines];
    }

    // ワインマッチングスコアを計算する関数
    const calculateMatchScore = (
      evawineWine: { type: string; name: string; price?: number; url?: string; description?: string },
      aiWine: { type: string; region: string; grape: string; price: number }
    ): number => {
      let score = 0;

      // タイプが一致する（最重要: 100点）
      if (evawineWine.type === aiWine.type) {
        score += 100;
      }

      // 産地が一致する（50点）
      const regionLower = aiWine.region.toLowerCase();
      if (
        evawineWine.description?.toLowerCase().includes(regionLower) ||
        evawineWine.name.toLowerCase().includes(regionLower)
      ) {
        score += 50;
      }

      // ブドウ品種が一致する（30点）
      const grapeLower = aiWine.grape.toLowerCase();
      if (
        evawineWine.description?.toLowerCase().includes(grapeLower) ||
        evawineWine.name.toLowerCase().includes(grapeLower)
      ) {
        score += 30;
      }

      // 価格が近い（20点）
      if (evawineWine.price && aiWine.price) {
        const priceDiff = Math.abs(evawineWine.price - aiWine.price);
        const priceRatio = priceDiff / aiWine.price;
        if (priceRatio <= 0.2) {
          score += 20;
        } else if (priceRatio <= 0.5) {
          score += 10;
        }
      }

      // 希望の予算内（10点）
      if (preferences.budget && evawineWine.price) {
        const maxBudget = parseInt(preferences.budget, 10);
        if (evawineWine.price <= maxBudget) {
          score += 10;
        }
      }

      return score;
    };

    // AIの提案に基づいて、EVAWINEから最もマッチする5つのワインを選ぶ
    const selectedWines: Array<{ 
      wine: { type: string; name: string; price?: number; url?: string; description?: string };
      score: number;
      aiWineIndex: number;
    }> = [];
    const usedIndices = new Set<number>();

    // 各AIの提案に対して、最もマッチするワインを選ぶ
    for (let aiIndex = 0; aiIndex < object.wines.length; aiIndex++) {
      const aiWine = object.wines[aiIndex];
      
      // 未使用のワインに対してスコアを計算
      const scoredWines = evawineWines
        .map((wine, index) => ({
          wine,
          index,
          score: calculateMatchScore(wine, aiWine),
        }))
        .filter(({ index }) => !usedIndices.has(index))
        .sort((a, b) => b.score - a.score); // スコアが高い順にソート

      if (scoredWines.length > 0) {
        // 最もスコアが高いワインを選ぶ（同点の場合は最初のものを選ぶ）
        const bestMatch = scoredWines[0];
        selectedWines.push({
          wine: bestMatch.wine,
          score: bestMatch.score,
          aiWineIndex: aiIndex,
        });
        usedIndices.add(bestMatch.index);
      }
    }

    // 5つに満たない場合は、残りのワインから最もマッチするものを選ぶ
    while (selectedWines.length < 5 && evawineWines.length > selectedWines.length) {
      const availableWines = evawineWines
        .map((wine, index) => ({ wine, index }))
        .filter(({ index }) => !usedIndices.has(index));

      if (availableWines.length > 0) {
        // 残りのAIの提案（または最初の提案）に対して最もマッチするものを選ぶ
        const aiWine = object.wines[selectedWines.length % object.wines.length];
        
        const scoredWines = availableWines
          .map(({ wine, index }) => ({
            wine,
            index,
            score: calculateMatchScore(wine, aiWine),
          }))
          .sort((a, b) => b.score - a.score);

        if (scoredWines.length > 0) {
          const bestMatch = scoredWines[0];
          selectedWines.push({
            wine: bestMatch.wine,
            score: bestMatch.score,
            aiWineIndex: selectedWines.length % object.wines.length,
          });
          usedIndices.add(bestMatch.index);
        } else {
          break;
        }
      } else {
        break;
      }
    }

    // AIの提案とEVAWINEのワインをマッチング（スコア順に並び替え）
    selectedWines.sort((a, b) => {
      // まずAIの提案の順序を保持し、次にスコアでソート
      if (a.aiWineIndex !== b.aiWineIndex) {
        return a.aiWineIndex - b.aiWineIndex;
      }
      return b.score - a.score;
    });

    const matchedWines = object.wines.map((aiWine, index) => {
      // 対応するAIの提案にマッチしたワインを探す
      const matched = selectedWines.find((sw) => sw.aiWineIndex === index) || 
                      selectedWines[index] || 
                      selectedWines[0];

      if (matched && matched.wine) {
        // URLが正しく設定されているか確認
        let evawineUrl = matched.wine.url;
        
        // URLが空、undefined、またはトップページの場合は検索ページにリンク
        if (!evawineUrl || 
            evawineUrl === "https://www.evawine.jp/" || 
            evawineUrl === "https://www.evawine.jp" ||
            evawineUrl.trim() === "") {
          evawineUrl = `https://www.evawine.jp/?q=${encodeURIComponent(matched.wine.name)}`;
        }
        
        return {
          ...aiWine,
          evawineName: matched.wine.name,
          evawinePrice: matched.wine.price,
          evawineUrl: evawineUrl,
          evawineDescription: matched.wine.description,
          name: aiWine.name || matched.wine.name,
          price: aiWine.price || matched.wine.price || 0,
        };
      }

      return {
        ...aiWine,
        price: aiWine.price || 0,
      };
    });

    return Response.json({ wines: matchedWines });
  } catch (error) {
    console.error("Error analyzing image:", error);
    const errorMessage = error instanceof Error ? error.message : "不明なエラー";
    const errorDetails = error instanceof Error ? error.stack : String(error);
    
    // 開発環境では詳細なエラー情報を返す
    const isDevelopment = process.env.NODE_ENV === "development";
    
    return Response.json(
      { 
        error: "画像の解析中にエラーが発生しました",
        details: isDevelopment ? errorMessage : undefined,
        stack: isDevelopment ? errorDetails : undefined,
      },
      { status: 500 }
    );
  }
}
