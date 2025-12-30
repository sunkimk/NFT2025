
import { GoogleGenAI } from "@google/genai";
import { GenerationParams, AvatarStyle, GeneratedResult, Accessory, Clothing } from "../types";

export const transformImage = async (
  base64Image: string,
  params: GenerationParams,
  index: number = 0,
  total: number = 1
): Promise<GeneratedResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const imageData = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;

  let themeContext = "";
  if (params.randomizeTheme) {
    themeContext = "创意自由度：开启完全随机的主题重构。请为用户构思一个惊艳且独特的 NFT 系列主题（如：机械禅意、极光幽灵、复古未来主义等）。";
  } else if (params.theme) {
    themeContext = `核心主题：“${params.theme}”。请让角色的每一个细节都深度契合这一主题。`;
  }

  const is3DStyle = params.style.startsWith('3D');
  let styleInstruction = "";

  if (is3DStyle) {
    styleInstruction = "请执行极致的 3D 渲染，确保拥有电影级的材质感（如磨砂、液态金属或发光塑胶），光影处理需达到摄影棚水准。";
  } else if (params.style === AvatarStyle.RETRO_DITHERED) {
    styleInstruction = "请应用 1-Bit 抖动艺术风格。使用黑白点阵（Dithering）来表达阴影和质感，呈现早期复古计算机屏幕的高对比度数字美学。";
  } else {
    styleInstruction = "请应用高质量的 2D 艺术表现，根据风格要求精准控制线条、色块和平面美学。";
  }

  let detailContext = "";
  if (params.isRandom) {
    detailContext = "细节随机化已开启：请自由发挥，为角色增加极具个性的服装细节和配饰，增强其作为收藏品的独特性。";
  } else {
    const accStr = params.accessory === Accessory.NONE ? "保持原貌" : params.accessory;
    const clothStr = params.clothing === Clothing.NONE ? "保持原貌" : params.clothing;
    detailContext = `细节定制 - 配饰选择: ${accStr}, 服装款式: ${clothStr}。`;
  }

  const diversityInstruction = total > 1 ? `
    【系列化多样性指令】：
    这是系列中的第 ${index + 1} 张（共 ${total} 张）。为了确保收藏价值，请提供独特的视觉诠释：
    - 角色职能：探索主题下的不同细分角色（如：乐手、武士、科技特工等）。
    - 动作姿态：尝试不同的视角和动态姿势。
    - 氛围差异：在保持核心配色的基础上，微调背景光效，使每一张都独一无二。
  ` : "";

  const prompt = `
    【图像转换任务：NFT 艺术重构】
    输入：附件中的角色图片。
    任务：基于该角色，生成一张全新的、艺术风格化的 肖像图像。
    
    1. 视觉框架：
       - 核心艺术风格：${params.style}
       - 场景背景设置：${params.background}
       - 重构强度 (0-100)：${params.isRandom ? '85' : params.intensity}
    
    2. 指令细则：
       - ${styleInstruction}
       - ${detailContext}
       - ${themeContext}
       ${diversityInstruction}
       - 角色必须居中，构图为完美的 1:1 肖像。
       - 必须保留原角色的核心视觉灵魂，但必须将其完全重塑。
    
    3. 输出规范：
       - 直接输出生成的图像数据。
       - 随后提供文本：
         主题名称: [填写名称]
         创意描述: [描述亮点]
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ inlineData: { data: imageData, mimeType: 'image/png' } }, { text: prompt }],
      },
      config: {
        imageConfig: { aspectRatio: "1:1" },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
        ]
      }
    });

    const candidate = response.candidates?.[0];
    if (!candidate || candidate.finishReason === 'SAFETY') {
      throw new Error("生成受限或失败。");
    }

    let imageUrl = "";
    for (const part of candidate.content.parts) {
      if (part.inlineData) imageUrl = `data:image/png;base64,${part.inlineData.data}`;
    }

    const fullText = response.text || "";
    const themeMatch = fullText.match(/(主题名称|Theme Name)[:：]\s*(.*)/i);
    const descMatch = fullText.match(/(创意描述|Description)[:：]\s*(.*)/i);
    
    return {
      url: imageUrl,
      theme: themeMatch ? themeMatch[2].trim() : (params.theme || "重构系列"),
      description: descMatch ? descMatch[2].trim() : "AI 完成艺术化重构。"
    };
  } catch (error) {
    throw error;
  }
};
