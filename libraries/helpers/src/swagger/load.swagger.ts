import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';
import { brandName } from '../utils/brand';

export const loadSwagger = (app: INestApplication) => {
  const config = new DocumentBuilder()
    .setTitle(`${brandName()} Swagger file`)
    .setDescription('API description')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);
};
