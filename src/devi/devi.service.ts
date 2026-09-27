import { Injectable, InternalServerErrorException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DeviService {
  private readonly apiKey: string;
  private readonly agentId: string;

  constructor(configService: ConfigService) {
    const apiKey = configService.get<string>('OPENAI_API_KEY');
    this.agentId = configService.get<string>('OPENAI_AGENT_ID', '');
    if (!apiKey || !this.agentId) throw new Error('OPENAI_API_KEY y OPENAI_AGENT_ID son obligatorias para Devi');
    this.apiKey = apiKey;
  }

  async ask(message: string): Promise<{ answer: string }> {
    try {
      const response = await fetch('https://api.openai.com/v1/agents/sessions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'agents=v1',
        },
        body: JSON.stringify({
          agent_id: this.agentId,
          environment: { type: 'none' },
          input: message,
          stream: true,
        }),
      });
      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`OpenAI ${response.status}: ${errorBody}`);
      }
      const stream = await response.text();
      const answer = this.extractStreamText(stream);
      if (!answer) throw new Error('La sesión de Devi no devolvió texto');
      return { answer };
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('OpenAI ')) {
        throw new ServiceUnavailableException(`Devi no está disponible: ${error.message}`);
      }
      if (error instanceof ServiceUnavailableException) throw error;
      throw new InternalServerErrorException('No fue posible consultar a Devi');
    }
  }

  private extractText(value: unknown): string {
    if (!value || typeof value !== 'object') return '';
    const data = value as Record<string, unknown>;
    if (typeof data.output_text === 'string') return data.output_text;
    if (typeof data.text === 'string') return data.text;
    if (Array.isArray(data.output) || Array.isArray(data.content)) {
      const items = (data.output ?? data.content) as unknown[];
      return items.map((item) => this.extractText(item)).filter(Boolean).join('\n');
    }
    return '';
  }

  private extractStreamText(stream: string): string {
    const events = stream.split(/\r?\n\r?\n/);
    for (let index = events.length - 1; index >= 0; index -= 1) {
      const event = events[index];
      if (!event.includes('agent.session.turn.output_text.done')) continue;
      const dataLine = event.split(/\r?\n/).find((line) => line.startsWith('data: '));
      if (!dataLine) continue;
      try {
        const data = JSON.parse(dataLine.slice(6)) as { text?: string };
        if (data.text) return data.text;
      } catch {
        return '';
      }
    }
    return '';
  }
}
