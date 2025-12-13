import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class AiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not defined in environment variables');
    }
    
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
  }

  async analyzeUX(filePath: string, userIntent: string): Promise<string> {
    try {
      // 프롬프트 템플릿 로드
      const promptTemplate = await this.loadPromptTemplate();
      
      // 이미지 파일 읽기
      const imageBuffer = await fs.readFile(filePath);
      const base64Image = imageBuffer.toString('base64');
      const mimeType = this.getMimeType(filePath);

      // 변수 치환
      const prompt = promptTemplate.replace('{USER_INTENT}', userIntent);

      // Gemini API 호출 (이미지 포함)
      const result = await this.model.generateContent([
        {
          inlineData: {
            data: base64Image,
            mimeType: mimeType,
          },
        },
        prompt,
      ]);

      const response = await result.response;
      const text = response.text();

      return text;
    } catch (error) {
      console.error('AI 분석 오류:', error);
      throw new Error('AI 분석 중 오류가 발생했습니다');
    }
  }

  private async loadPromptTemplate(): Promise<string> {
    const promptPath = path.join(process.cwd(), 'prompts', 'ux-analysis.txt');
    return await fs.readFile(promptPath, 'utf-8');
  }

  private getMimeType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
    };
    return mimeTypes[ext] || 'image/png';
  }
}
