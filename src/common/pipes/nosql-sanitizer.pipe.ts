import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';

@Injectable()
export class NoSqlSanitizerPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (
      metadata.type !== 'body' ||
      typeof value !== 'object' ||
      value === null
    ) {
      return value;
    }

    return this.sanitize(value);
  }

  private sanitize(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map((v) => this.sanitize(v));
    } else if (obj !== null && typeof obj === 'object') {
      const newObj: Record<string, any> = {};
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          // Prevent keys starting with $ (NoSQL operators)
          if (!key.startsWith('$')) {
            newObj[key] = this.sanitize(obj[key]);
          }
        }
      }
      return newObj;
    }
    return obj;
  }
}
