import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Analysis } from './entities/analysis.entity';
import { CreateAnalysisDto } from './dto/create-analysis.dto';
import { AiService } from '../ai/ai.service';
import * as fs from 'fs/promises';

@Injectable()
export class AnalysisService {
  constructor(
    @InjectRepository(Analysis)
    private analysisRepository: Repository<Analysis>,
    private aiService: AiService,
  ) {}

  async create(
    userId: string,
    createAnalysisDto: CreateAnalysisDto,
    file: Express.Multer.File,
  ): Promise<Analysis> {
    if (!file) {
      throw new BadRequestException('파일을 업로드해주세요');
    }

    // 이미지 크기 감지
    const sharp = require('sharp');
    const metadata = await sharp(file.path).metadata();
    const imageWidth = metadata.width;
    const imageHeight = metadata.height;

    console.log(`📐 이미지 크기 감지: ${imageWidth}x${imageHeight}`);

    // Analysis 생성
    const analysis = this.analysisRepository.create({
      userId,
      filePath: file.path,
      userIntent: createAnalysisDto.userIntent,
      imageWidth,
      imageHeight,
      status: 'processing',
    });

    await this.analysisRepository.save(analysis);

    // 비동기로 AI 분석 실행 (이미지 크기 전달)
    this.performAiAnalysis(
      analysis.id,
      file.path,
      createAnalysisDto.userIntent,
      imageWidth,
      imageHeight,
    );

    return analysis;
  }

  async findAll(userId: string): Promise<Analysis[]> {
    return await this.analysisRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<Analysis> {
    const analysis = await this.analysisRepository.findOne({
      where: { id, userId },
    });

    if (!analysis) {
      throw new NotFoundException('분석 보고서를 찾을 수 없습니다');
    }

    return analysis;
  }

  async remove(id: string, userId: string): Promise<void> {
    const analysis = await this.findOne(id, userId);
    
    // 파일 삭제
    try {
      await fs.unlink(analysis.filePath);
    } catch (error) {
      console.error('파일 삭제 오류:', error);
    }

    await this.analysisRepository.remove(analysis);
  }

  private async performAiAnalysis(
    analysisId: string,
    filePath: string,
    userIntent: string,
    imageWidth: number,
    imageHeight: number,
  ): Promise<void> {
    try {
      // AI 분석 수행 (이미지 파일 경로 및 크기 전달)
      const aiResult = await this.aiService.analyzeUX(
        filePath,
        userIntent,
        imageWidth,
        imageHeight,
      );

      // JSON 하이라이트 정보 추출
      const highlights = this.extractHighlights(aiResult);

      // 결과 저장
      await this.analysisRepository.update(analysisId, {
        aiAnalysisResult: aiResult,
        highlights: highlights,
        status: 'completed',
      });
    } catch (error) {
      console.error('AI 분석 오류:', error);
      await this.analysisRepository.update(analysisId, {
        status: 'failed',
      });
    }
  }

  private extractHighlights(aiResult: string): any[] {
    try {
      // AI 결과에서 JSON 블록 찾기
      const jsonMatch = aiResult.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch && jsonMatch[1]) {
        const parsed = JSON.parse(jsonMatch[1]);
        return parsed.highlights || [];
      }
      return [];
    } catch (error) {
      console.error('하이라이트 추출 오류:', error);
      return [];
    }
  }
}
