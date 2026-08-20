import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { UploadService } from '../upload/upload.service';
import { paginate } from '../../common/dto/pagination-query.dto';
import { decimalToNumber } from '../../common/utils/decimal.util';
import { slugify } from '../../common/utils/slugify.util';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';

const PRODUCT_INCLUDE = {
  category: true,
  images: { orderBy: { position: 'asc' as const } },
} satisfies Prisma.ProductInclude;

type ProductWithRelations = Prisma.ProductGetPayload<{
  include: typeof PRODUCT_INCLUDE;
}>;

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService,
  ) {}

  async findAll(query: QueryProductDto, includeInactive = false) {
    const where: Prisma.ProductWhereInput = {
      ...(includeInactive ? {} : { isActive: true }),
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.isFeatured !== undefined ? { isFeatured: query.isFeatured } : {}),
      ...(query.search ? { name: { contains: query.search, mode: 'insensitive' } } : {}),
      ...(query.minPrice !== undefined || query.maxPrice !== undefined
        ? {
            price: {
              ...(query.minPrice !== undefined ? { gte: query.minPrice } : {}),
              ...(query.maxPrice !== undefined ? { lte: query.maxPrice } : {}),
            },
          }
        : {}),
    };

    const orderBy: Prisma.ProductOrderByWithRelationInput =
      query.sortBy === 'price_asc'
        ? { price: 'asc' }
        : query.sortBy === 'price_desc'
          ? { price: 'desc' }
          : { createdAt: 'desc' };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        include: PRODUCT_INCLUDE,
        orderBy,
        skip: query.prismaSkip,
        take: query.prismaTake,
      }),
      this.prisma.product.count({ where }),
    ]);

    return paginate(
      items.map((p) => this.serialize(p)),
      total,
      query,
    );
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: PRODUCT_INCLUDE,
    });
    if (!product) throw new NotFoundException('Product not found');
    return this.serialize(product);
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: PRODUCT_INCLUDE,
    });
    if (!product) throw new NotFoundException('Product not found');
    return this.serialize(product);
  }

  async create(dto: CreateProductDto) {
    await this.assertCategoryExists(dto.categoryId);

    const slug = await this.generateUniqueSlug(dto.name);
    const product = await this.prisma.product.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description,
        price: dto.price,
        compareAtPrice: dto.compareAtPrice,
        sizes: dto.sizes,
        colors: dto.colors ?? [],
        stock: dto.stock ?? 0,
        sku: dto.sku,
        isFeatured: dto.isFeatured ?? false,
        isActive: dto.isActive ?? true,
        categoryId: dto.categoryId,
      },
      include: PRODUCT_INCLUDE,
    });
    return this.serialize(product);
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findOne(id);
    if (dto.categoryId) {
      await this.assertCategoryExists(dto.categoryId);
    }

    const product = await this.prisma.product.update({
      where: { id },
      data: { ...dto },
      include: PRODUCT_INCLUDE,
    });
    return this.serialize(product);
  }

  async remove(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { images: true },
    });
    if (!product) throw new NotFoundException('Product not found');

    await Promise.allSettled(
      product.images.map((image) => this.uploadService.deleteImage(image.publicId)),
    );
    await this.prisma.product.delete({ where: { id } });
    return { message: 'Product deleted' };
  }

  async addImages(productId: string, files: Express.Multer.File[]) {
    await this.findOne(productId);
    if (!files || files.length === 0) {
      throw new BadRequestException('No files were provided');
    }

    const existingCount = await this.prisma.productImage.count({
      where: { productId },
    });

    const uploaded = await Promise.all(
      files.map((file) => this.uploadService.uploadImage(file)),
    );

    await this.prisma.productImage.createMany({
      data: uploaded.map((image, index) => ({
        productId,
        url: image.url,
        publicId: image.publicId,
        position: existingCount + index,
        isPrimary: existingCount === 0 && index === 0,
      })),
    });

    return this.findOne(productId);
  }

  async removeImage(productId: string, imageId: string) {
    const image = await this.prisma.productImage.findUnique({
      where: { id: imageId },
    });
    if (!image || image.productId !== productId) {
      throw new NotFoundException('Image not found for this product');
    }

    await this.uploadService.deleteImage(image.publicId);
    await this.prisma.productImage.delete({ where: { id: imageId } });

    if (image.isPrimary) {
      const nextImage = await this.prisma.productImage.findFirst({
        where: { productId },
        orderBy: { position: 'asc' },
      });
      if (nextImage) {
        await this.prisma.productImage.update({
          where: { id: nextImage.id },
          data: { isPrimary: true },
        });
      }
    }

    return this.findOne(productId);
  }

  async setPrimaryImage(productId: string, imageId: string) {
    const image = await this.prisma.productImage.findUnique({
      where: { id: imageId },
    });
    if (!image || image.productId !== productId) {
      throw new NotFoundException('Image not found for this product');
    }

    await this.prisma.$transaction([
      this.prisma.productImage.updateMany({
        where: { productId },
        data: { isPrimary: false },
      }),
      this.prisma.productImage.update({
        where: { id: imageId },
        data: { isPrimary: true },
      }),
    ]);

    return this.findOne(productId);
  }

  private async assertCategoryExists(categoryId: string) {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
    });
    if (!category) {
      throw new BadRequestException('Category does not exist');
    }
  }

  private async generateUniqueSlug(name: string): Promise<string> {
    const base = slugify(name);
    let slug = base;
    let suffix = 1;

    while (await this.prisma.product.findUnique({ where: { slug } })) {
      slug = `${base}-${suffix}`;
      suffix += 1;
    }
    return slug;
  }

  private serialize(product: ProductWithRelations) {
    return {
      ...product,
      price: decimalToNumber(product.price),
      compareAtPrice: decimalToNumber(product.compareAtPrice),
    };
  }
}
