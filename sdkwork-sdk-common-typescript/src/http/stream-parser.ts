interface StreamLines {
  lines: string[];
  remainder: string;
}

export function extractStreamLines(buffer: string, flush: boolean = false): StreamLines {
  const lines: string[] = [];
  let lineStart = 0;
  let index = 0;

  while (index < buffer.length) {
    const character = buffer[index];
    if (character === '\n') {
      lines.push(buffer.slice(lineStart, index));
      index += 1;
      lineStart = index;
      continue;
    }

    if (character === '\r') {
      if (!flush && index === buffer.length - 1) {
        break;
      }

      lines.push(buffer.slice(lineStart, index));
      index += buffer[index + 1] === '\n' ? 2 : 1;
      lineStart = index;
      continue;
    }

    index += 1;
  }

  if (flush && lineStart < buffer.length) {
    lines.push(buffer.slice(lineStart));
    lineStart = buffer.length;
  }

  return {
    lines,
    remainder: buffer.slice(lineStart),
  };
}

export class ServerSentEventDataParser {
  private dataLines: string[] = [];
  private firstLine = true;

  pushLine(rawLine: string): string | undefined {
    const line = this.firstLine && rawLine.charCodeAt(0) === 0xfeff
      ? rawLine.slice(1)
      : rawLine;
    this.firstLine = false;

    if (line === '') {
      return this.dispatch();
    }
    if (line.startsWith(':')) {
      return undefined;
    }

    const separatorIndex = line.indexOf(':');
    const field = separatorIndex === -1 ? line : line.slice(0, separatorIndex);
    let value = separatorIndex === -1 ? '' : line.slice(separatorIndex + 1);
    if (value.startsWith(' ')) {
      value = value.slice(1);
    }

    if (field === 'data') {
      this.dataLines.push(value);
    }

    return undefined;
  }

  flush(): string | undefined {
    return this.dispatch();
  }

  private dispatch(): string | undefined {
    if (this.dataLines.length === 0) {
      return undefined;
    }

    const data = this.dataLines.join('\n');
    this.dataLines = [];
    return data === '' || data === '[DONE]' ? undefined : data;
  }
}

export function normalizeLegacyStreamLine(line: string): string | undefined {
  const trimmedLine = line.trim();
  if (trimmedLine === '' || trimmedLine === 'data: [DONE]') {
    return undefined;
  }
  if (trimmedLine.startsWith('data: ')) {
    return trimmedLine.slice(6);
  }
  return trimmedLine;
}
