import { openai } from "@ai-sdk/openai";
// eslint-disable-next-line deprecation/deprecation
import { generateObject } from "ai";
import { z } from "zod";

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
    const preferencesJson = formData.get("preferences") as string | null;
    
    let preferences: {
      budget?: string | null;
      wineTypes?: string[];
      region?: string | null;
    } = {};
    
    if (preferencesJson) {
      try {
        preferences = JSON.parse(preferencesJson);
      } catch (e) {
        console.error("Failed to parse preferences:", e);
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

    // EVAWINEのAPIからワイン情報を取得（毎回ランダムに選ぶ）
    const host = request.headers.get("host") || "localhost:3000";
    const protocol = request.headers.get("x-forwarded-proto") || 
                     (request.headers.get("x-forwarded-ssl") === "on" ? "https" : "http");
    const baseUrl = `${protocol}://${host}`;

    // 希望に基づいてEVAWINEのAPIを呼び出す
    const evawineParams = new URLSearchParams();
    if (preferences.wineTypes && preferences.wineTypes.length > 0) {
      // 複数のタイプがある場合は、最初のタイプでフィルタリング
      evawineParams.append("type", preferences.wineTypes[0]);
    }
    if (preferences.budget) {
      evawineParams.append("maxPrice", preferences.budget);
    }
    // randomパラメータは削除（マッチングアルゴリズムで選ぶため）
    evawineParams.append("count", "50"); // 十分な数のワインを取得してマッチング

    const evawineResponse = await fetch(`${baseUrl}/api/evawine?${evawineParams.toString()}`);
    let evawineWines: Array<{ type: string; name: string; price?: number; url?: string; description?: string }> = [];
    
    if (evawineResponse.ok) {
      const evawineData = await evawineResponse.json();
      evawineWines = evawineData.wines || [];
    }

    // 産地でフィルタリング（APIで取得した後）
    if (preferences.region && evawineWines.length > 0) {
      evawineWines = evawineWines.filter((wine) => {
        const regionLower = preferences.region!.toLowerCase();
        return (
          wine.description?.toLowerCase().includes(regionLower) ||
          wine.name.toLowerCase().includes(regionLower)
        );
      });
    }

    // フィルタリング結果が少ない場合は、再度取得（フィルタなし）
    if (evawineWines.length < 5) {
      const fallbackParams = new URLSearchParams();
      fallbackParams.append("count", "50");
      const fallbackResponse = await fetch(`${baseUrl}/api/evawine?${fallbackParams.toString()}`);
      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        evawineWines = fallbackData.wines || [];
      }
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
