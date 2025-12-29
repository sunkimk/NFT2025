
import { GoogleGenAI } from "@google/genai";
import { GenerationParams, GeneratedResult } from "../types";

export const transformImage = async (
  base64Image: string,
  params: GenerationParams
): Promise<GeneratedResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  let themeContext = "";
  if (params.randomizeTheme) {
    themeContext = "创意自由度：开启随机主题。请为用户构思一个完全独特且意想不到的创意主题（例如：星际歌剧、赛博朋克、古代神话、蒸汽朋克等）。根据该主题重新设计所有视觉元素。";
  } else if (params.theme) {
    themeContext = `创意主题：“${params.theme}”。请发挥创意，使视觉元素完美契合该主题。`;
  }

  const is3DStyle = params.style.startsWith('3D');
  const styleInstruction = is3DStyle 
    ? "应用高质量 3D 渲染，带有柔和阴影、专业摄影棚灯光和 3D 材质感（如粘土、塑胶或金属）。"
    : "应用高质量 2D 艺术表现手法，根据选定风格调整线条感、配色和笔触，确保其具有独特的平面艺术魅力。";

  const randomContext = params.isRandom
    ? `随机模式已启用：忽略下方提供的具体基础参数，自由发挥。`
    : `基础风格: ${params.style}. 基础配饰: ${params.accessory}. 基础服装: ${params.clothing}. 基础背景: ${params.background}.`;

  const prompt = `
    将附件图像中的角色转换为高质量的 NFT 艺术头像。
    
    ${randomContext}
    
    ${themeContext}
    
    指令要求：
    1. 保持原角色的核心特征（物种、关键面部特征、配色方案）。
    2. 视觉风格：${params.style}。
    3. ${styleInstruction}
    4. 角色应为居中的肖像，高分辨率，4K，呈现具有高收藏价值的数字艺术藏品美学。
    5. 转化强度：${params.isRandom ? '85' : params.intensity}/100。

    关键要求：在你的文本回复部分，必须且仅提供以下两行简体中文信息：
    第一行：主题名称: [为此系列起一个简洁响亮的主题名]
    第二行：创意描述: [用一句话简洁描述该系列的设计创意和风格亮点]
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image.split(',')[1],
              mimeType: 'image/png',
            },
          },
          { text: prompt },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
        }
      }
    });

    if (!response.candidates?.[0]?.content?.parts) {
      throw new Error("模型未生成响应内容。");
    }

    let imageUrl = "";
    let themeText = "";
    let descriptionText = "";

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        imageUrl = `data:image/png;base64,${part.inlineData.data}`;
      } else if (part.text) {
        const text = part.text;
        const themeMatch = text.match(/(主题名称|Theme Name)[:：]\s*(.*)/i);
        const descMatch = text.match(/(创意描述|Description)[:：]\s*(.*)/i);
        if (themeMatch) themeText = themeMatch[2].trim();
        if (descMatch) descriptionText = descMatch[2].trim();
      }
    }

    if (!imageUrl) {
      throw new Error("未能从响应中找到生成的图像。");
    }

    return {
      url: imageUrl,
      theme: themeText || (params.theme || "定制风格系列"),
      description: descriptionText || "角色已通过 AI 完成艺术化重塑，呈现独特美学。"
    };
  } catch (error) {
    console.error("图像转换错误:", error);
    throw error;
  }
};
