
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

  // 1. 核心主题与角色分配逻辑
  let themeContext = "";
  if (params.theme) {
    themeContext = `
      【核心主题与名单】：${params.theme}
      【角色分配指令】：
      1. 请分析主题文本，识别其中是否包含多个角色名称（如以逗号、空格或序号分隔）。
      2. 如果包含多个角色，请将本次生成的角色严格锁定为名单中的第 ${index + 1} 个。
      3. 如果角色数量多于生成总数，请选择其中最具代表性的；如果少于生成总数，请基于该主题创作互补的原创角色。
      4. 严禁出现与系列中其他序号（1 到 ${total}）重复的角色外观。
    `;
  } else {
    themeContext = "请基于上传素材进行高质量的艺术重塑。";
  }

  // 2. 风格与材质指令
  const is3DStyle = params.style.startsWith('3D');
  let styleInstruction = "";
  if (is3DStyle) {
    styleInstruction = "执行极致 3D 渲染，确保电影级材质感（如磨砂、液态金属、发光塑胶），光影需达到专业摄影棚水准。";
  } else if (params.style === AvatarStyle.RETRO_DITHERED) {
    styleInstruction = "应用 1-Bit 抖动艺术风格，使用黑白点阵（Dithering）呈现复古计算机高对比美学。";
  } else {
    styleInstruction = "应用高质量 2D 艺术表现，精准控制线条、色块与平面美学。";
  }

  // 3. 细节随机化逻辑
  let detailContext = "";
  if (params.isRandom) {
    detailContext = "【细节随机化】：请自由发挥，为该角色增加极具个性的服装细节和配饰，增强其独特性。";
  } else {
    const accStr = params.accessory === Accessory.NONE ? "保持原貌" : params.accessory;
    const clothStr = params.clothing === Clothing.NONE ? "保持原貌" : params.clothing;
    detailContext = `【细节定制】：配饰选择 ${accStr}，服装款式选择 ${clothStr}。`;
  }

  // 4. 构建最终 Prompt
  const prompt = `
    【图像转换任务：NFT 艺术重构 - 系列作品第 ${index + 1}/${total} 号】
    
    你正在为一套包含 ${total} 件作品的限量收藏系列创作。
    当前作品编号：#${index + 1}

    输入：附件中的角色图片作为基础视觉灵魂。
    任务：基于该角色，生成一张全新的、艺术风格化的肖像。

    指令细则：
    - 视觉框架：风格：${params.style}，背景：${params.background}，重构强度：${params.isRandom ? '85' : params.intensity}%。
    - ${styleInstruction}
    - ${detailContext}
    - ${themeContext}
    
    【关键要求】：
    1. 角色唯一性：如果用户指定了角色名单，本次生成必须精准对应序号。
    2. 构图：角色必须居中，1:1 正方形肖像，构图稳定。
    3. 灵魂保留：必须能让人一眼看出是基于输入原图进行的转生。

    输出规范：
    - 直接输出生成的图像。
    - 随后提供文本：
      主题名称: [填写该角色的具体身份名称]
      创意描述: [描述该角色的独特设计亮点]
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ inlineData: { data: imageData, mimeType: 'image/png' } }, { text: prompt }],
      },
      config: {
        imageConfig: { aspectRatio: "1:1" }
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
