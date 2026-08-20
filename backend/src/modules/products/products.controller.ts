import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List products (public — active only)' })
  findAll(@Query() query: QueryProductDto) {
    return this.productsService.findAll(query, false);
  }

  @Get('admin/all')
  @ApiBearerAuth()
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: '[Admin] List all products, including inactive' })
  findAllForAdmin(@Query() query: QueryProductDto) {
    return this.productsService.findAll(query, true);
  }

  @Public()
  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get a product by slug' })
  findBySlug(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get a product by id' })
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Post()
  @ApiBearerAuth()
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: '[Admin] Create a product' })
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: '[Admin] Update a product' })
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: '[Admin] Delete a product' })
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

  @Post(':id/images')
  @ApiBearerAuth()
  @Roles(Role.SUPER_ADMIN)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: '[Admin] Upload one or more product images to Cloudinary' })
  @UseInterceptors(FilesInterceptor('files', 10))
  addImages(@Param('id') id: string, @UploadedFiles() files: Express.Multer.File[]) {
    return this.productsService.addImages(id, files);
  }

  @Delete(':id/images/:imageId')
  @ApiBearerAuth()
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: '[Admin] Remove a product image' })
  removeImage(@Param('id') id: string, @Param('imageId') imageId: string) {
    return this.productsService.removeImage(id, imageId);
  }

  @Patch(':id/images/:imageId/primary')
  @ApiBearerAuth()
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: '[Admin] Mark an image as the primary product image' })
  setPrimaryImage(@Param('id') id: string, @Param('imageId') imageId: string) {
    return this.productsService.setPrimaryImage(id, imageId);
  }
}
