"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Wine {
  name: string;
  type: string;
  grape: string;
  region: string;
  reason: string;
  price?: number;
  evawineName?: string;
  evawinePrice?: number;
  evawineUrl?: string;
  evawineDescription?: string;
}

interface Preferences {
  budget: string | null;
  wineTypes: string[];
  region: string | null;
}

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [wines, setWines] = useState<Wine[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<Preferences>({
    budget: null,
    wineTypes: [],
    region: null,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
      setWines(null);
      
      // プレビュー画像を作成
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      setError("画像を選択してください");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("image", selectedFile);
      formData.append("preferences", JSON.stringify(preferences));

      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = "画像の解析に失敗しました";
        try {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
            const errorDetails = errorData.details ? ` (詳細: ${errorData.details})` : "";
            throw new Error(errorMessage + errorDetails);
          } else {
            const text = await response.text();
            throw new Error(`${errorMessage} (ステータス: ${response.status})`);
          }
        } catch (parseError) {
          if (parseError instanceof Error) {
            throw parseError;
          }
          throw new Error(`${errorMessage} (ステータス: ${response.status})`);
        }
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("サーバーからの応答がJSON形式ではありません");
      }

      const data = await response.json();
      if (!data.wines || !Array.isArray(data.wines)) {
        throw new Error("ワインリストの形式が正しくありません");
      }
      setWines(data.wines);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "エラーが発生しました";
      setError(errorMessage);
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <main className="flex min-h-screen w-full flex-col items-center justify-center px-4 py-16">
        <div className="flex flex-col items-center gap-10 text-center max-w-4xl w-full">
          <div className="flex flex-col items-center gap-6">
            <div className="relative">
              <h1 className="text-5xl md:text-6xl font-bold leading-tight tracking-tight text-foreground relative z-10">
                Menu-Match AI
              </h1>
              <div className="absolute -inset-2 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-2xl blur-xl -z-0"></div>
            </div>
            <p className="text-xl md:text-2xl leading-relaxed text-foreground/80 max-w-xl font-medium">
              メニュー画像をアップロードするだけで、<br />
              AIソムリエが最適なワインリストを提案
            </p>
            <div className="w-24 h-1 bg-gradient-to-r from-transparent via-primary to-transparent rounded-full"></div>
          </div>

          <div className="w-full max-w-2xl space-y-6">
            <div className="space-y-2">
              <Label htmlFor="image-upload" className="text-lg font-semibold text-foreground">
                メニュー画像を選択
              </Label>
              <div className="relative">
                <Input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="cursor-pointer border-2 border-primary/20 hover:border-primary/40 transition-colors bg-white/80 backdrop-blur-sm"
                />
              </div>
            </div>

            {/* 希望選択UI */}
            <Card className="border-2 border-primary/20 shadow-lg bg-white/90 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-t-lg">
                <CardTitle className="text-2xl text-foreground">ご希望をお選びください（任意）</CardTitle>
                <CardDescription className="text-base">
                  より適切なワインを提案するために、ご希望をお聞かせください
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 予算 */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">予算</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[
                      { value: "1500", label: "~1,500円" },
                      { value: "2000", label: "~2,000円" },
                      { value: "3000", label: "~3,000円" },
                      { value: "5000", label: "~5,000円" },
                    ].map((budget) => (
                      <Button
                        key={budget.value}
                        type="button"
                        variant={preferences.budget === budget.value ? "default" : "outline"}
                        size="sm"
                        onClick={() =>
                          setPreferences((prev) => ({
                            ...prev,
                            budget: prev.budget === budget.value ? null : budget.value,
                          }))
                        }
                        className={`w-full transition-all duration-200 ${
                          preferences.budget === budget.value
                            ? "bg-gradient-to-r from-primary to-primary/90 shadow-md"
                            : "hover:border-primary/50 hover:bg-primary/5"
                        }`}
                      >
                        {budget.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* ワインの種類 */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">ワインの種類</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {["赤", "白", "スパークリング", "ロゼ"].map((type) => (
                      <Button
                        key={type}
                        type="button"
                        variant={preferences.wineTypes.includes(type) ? "default" : "outline"}
                        size="sm"
                        onClick={() =>
                          setPreferences((prev) => ({
                            ...prev,
                            wineTypes: prev.wineTypes.includes(type)
                              ? prev.wineTypes.filter((t) => t !== type)
                              : [...prev.wineTypes, type],
                          }))
                        }
                        className={`w-full transition-all duration-200 ${
                          preferences.wineTypes.includes(type)
                            ? "bg-gradient-to-r from-primary to-primary/90 shadow-md"
                            : "hover:border-primary/50 hover:bg-primary/5"
                        }`}
                      >
                        {type}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* 産地 */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">産地</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[
                      { value: "フランス", label: "フランス" },
                      { value: "イタリア", label: "イタリア" },
                      { value: "スペイン", label: "スペイン" },
                      { value: "その他", label: "その他" },
                    ].map((region) => (
                      <Button
                        key={region.value}
                        type="button"
                        variant={preferences.region === region.value ? "default" : "outline"}
                        size="sm"
                        onClick={() =>
                          setPreferences((prev) => ({
                            ...prev,
                            region: prev.region === region.value ? null : region.value,
                          }))
                        }
                        className={`w-full transition-all duration-200 ${
                          preferences.region === region.value
                            ? "bg-gradient-to-r from-primary to-primary/90 shadow-md"
                            : "hover:border-primary/50 hover:bg-primary/5"
                        }`}
                      >
                        {region.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {preview && (
              <div className="mt-4 relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
                <img
                  src={preview}
                  alt="プレビュー"
                  className="relative w-full h-auto rounded-xl border-2 border-primary/20 shadow-lg max-h-64 object-contain bg-white/50 backdrop-blur-sm"
                />
              </div>
            )}

            <Button
              size="lg"
              onClick={handleAnalyze}
              disabled={!selectedFile || loading}
              className="w-full text-lg px-8 py-6 h-auto bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
            >
              {loading ? "ソムリエが思考中..." : "今すぐ試す"}
            </Button>

            {error && (
              <div className="text-destructive text-sm mt-2">{error}</div>
            )}
          </div>

          {loading && (
            <div className="mt-8 text-foreground/70">
              <div className="flex items-center justify-center gap-3 mb-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-accent rounded-full animate-pulse delay-75"></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-150"></div>
              </div>
              <p className="text-lg font-medium">ソムリエが思考中...</p>
              <p className="text-sm mt-2 text-foreground/60">メニューを分析し、最適なワインを選んでいます</p>
            </div>
          )}

          {wines && wines.length > 0 && (
            <div className="mt-16 w-full">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold mb-3 text-foreground">
                  おすすめワインリスト
                </h2>
                <div className="w-32 h-1 bg-gradient-to-r from-transparent via-primary to-transparent rounded-full mx-auto"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {wines.map((wine, index) => (
                  <Card 
                    key={index} 
                    className="hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] border-2 border-primary/10 bg-white/95 backdrop-blur-sm overflow-hidden group"
                  >
                    <div className="h-2 bg-gradient-to-r from-primary via-accent to-primary"></div>
                    <CardHeader className="bg-gradient-to-br from-primary/5 to-transparent">
                      <CardTitle className="text-xl text-foreground group-hover:text-primary transition-colors">
                        {wine.evawineName || wine.name}
                      </CardTitle>
                      <CardDescription className="text-base font-medium">
                        <span className="inline-block px-2 py-1 rounded-md bg-primary/10 text-primary mr-2">
                          {wine.type}
                        </span>
                        {wine.grape}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-3 rounded-lg bg-secondary/50">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">産地</p>
                        <p className="text-base font-medium text-foreground">{wine.region}</p>
                      </div>
                      {wine.evawineDescription && (
                        <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">商品説明</p>
                          <p className="text-sm text-foreground/80 leading-relaxed">{wine.evawineDescription}</p>
                        </div>
                      )}
                      <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">おすすめの理由</p>
                        <p className="text-sm text-foreground leading-relaxed">{wine.reason}</p>
                      </div>
                      <div className="pt-4 border-t-2 border-primary/10 space-y-3">
                        {(wine.evawinePrice || wine.price) && (
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-primary">
                              ¥{(wine.evawinePrice || wine.price || 0).toLocaleString()}
                            </span>
                            <span className="text-sm text-muted-foreground">（税込）</span>
                          </div>
                        )}
                        <Button
                          variant="default"
                          size="sm"
                          asChild
                          className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white shadow-md hover:shadow-lg transition-all"
                        >
                          <a
                            href={
                              (wine.evawineUrl && wine.evawineUrl !== "https://www.evawine.jp/" && wine.evawineUrl !== "https://www.evawine.jp") 
                                ? wine.evawineUrl
                                : `https://www.evawine.jp/?q=${encodeURIComponent(wine.evawineName || wine.name)}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => {
                              const url = (wine.evawineUrl && wine.evawineUrl !== "https://www.evawine.jp/" && wine.evawineUrl !== "https://www.evawine.jp") 
                                ? wine.evawineUrl
                                : `https://www.evawine.jp/?q=${encodeURIComponent(wine.evawineName || wine.name)}`;
                              console.log("購入リンク:", url, "ワイン名:", wine.evawineName || wine.name, "evawineUrl:", wine.evawineUrl);
                              // リンクが正しく設定されていることを確認
                              if (!url || url === "#") {
                                e.preventDefault();
                                console.error("無効なURL:", url);
                                alert("リンクが設定されていません");
                              }
                            }}
                          >
                            EVAWINEで購入
                          </a>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
