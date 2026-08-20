import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@burkhabymalika.com';
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'ChangeMe123!';
  const adminName = process.env.ADMIN_NAME ?? 'Malika Admin';
  const [adminFirstName, ...adminLastRest] = adminName.split(' ');
  const adminLastName = adminLastRest.join(' ') || 'Admin';

  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      password: hashedPassword,
      firstName: adminFirstName,
      lastName: adminLastName,
      role: Role.SUPER_ADMIN,
    },
  });
  console.log(`Seeded SUPER_ADMIN account: ${adminEmail}`);

  // Local-development-only test accounts (Role.USER). Plain-text passwords
  // never touch the database — each is hashed with the same bcrypt(cost 10)
  // used by auth.service.ts before being written. Upserted by the unique
  // `email` field, so re-running the seed does not create duplicates.
  const testUsers = [
    { email: 'testuser1@meridian.dev', password: 'TestUser123!', firstName: 'Amina', lastName: 'Test' },
    { email: 'testuser2@meridian.dev', password: 'TestUser123!', firstName: 'Bilal', lastName: 'Test' },
    { email: 'testuser3@meridian.dev', password: 'TestUser123!', firstName: 'Sara', lastName: 'Test' },
  ];
  for (const testUser of testUsers) {
    const hashedTestPassword = await bcrypt.hash(testUser.password, 10);
    await prisma.user.upsert({
      where: { email: testUser.email },
      update: {},
      create: {
        email: testUser.email,
        password: hashedTestPassword,
        firstName: testUser.firstName,
        lastName: testUser.lastName,
        role: Role.USER,
      },
    });
  }
  console.log(`Seeded ${testUsers.length} test customer accounts`);

  const categories = [
    {
      name: 'Abaya',
      description: 'Elegant, flowing abayas for everyday and occasion wear.',
    },
    {
      name: 'Burqa',
      description: 'Full-coverage burqas with modern detailing.',
    },
    {
      name: 'Niqab',
      description: 'Breathable niqab sets in a range of styles.',
    },
    {
      name: 'Kids',
      description: 'Modest wear sized for children.',
    },
  ];

  const categoryRecords = new Map<string, string>();
  for (const category of categories) {
    const record = await prisma.category.upsert({
      where: { name: category.name },
      update: { description: category.description },
      create: {
        name: category.name,
        slug: slugify(category.name),
        description: category.description,
      },
    });
    categoryRecords.set(category.name, record.id);
  }
  console.log(`Seeded ${categories.length} categories`);

  // `images` point at placeholder photos already committed to the frontend's
  // public/ folder (../public relative to this repo's backend/). There's no
  // Cloudinary upload happening here — this just gives the seeded catalog
  // real images to render out of the box instead of empty <Image> src values.
  const products = [
    {
      name: "Kids' Ruffle Abaya Set",
      category: 'Kids',
      price: 45,
      compareAtPrice: 58,
      description: 'Tiered ruffle abaya in soft navy with a matching hijab.',
      sizes: ['2-3Y', '4-5Y', '6-7Y', '8-9Y', '10-11Y'],
      isFeatured: true,
      images: [
        '/products/kids/kids-ruffle-abaya-1.jpg',
        '/products/kids/kids-ruffle-abaya-2.jpg',
      ],
    },
    {
      name: "Kids' Classic Abaya",
      category: 'Kids',
      price: 38,
      compareAtPrice: 48,
      description: 'Simple, structured black abaya built for everyday wear.',
      sizes: ['2-3Y', '4-5Y', '6-7Y', '8-9Y', '10-11Y'],
      images: [
        '/products/kids/kids-classic-abaya-1.jpg',
        '/products/kids/kids-classic-abaya-2.jpg',
      ],
    },
    {
      name: 'Flowing Niqab Set',
      category: 'Niqab',
      price: 85,
      description: 'Full-length flared niqab in breathable black crepe.',
      sizes: ['S', 'M', 'L', 'XL'],
      images: [
        '/products/niqab/flowing-niqab-set-1.jpg',
        '/products/niqab/flowing-niqab-set-2.jpg',
      ],
    },
    {
      name: 'Navy Trim Burqa',
      category: 'Burqa',
      price: 95,
      compareAtPrice: 120,
      description: 'Deep navy burqa with geometric trim detail and gloves.',
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      isFeatured: true,
      images: [
        '/products/burqa/navy-trim-burqa-1.jpg',
        '/products/burqa/navy-trim-burqa-2.jpg',
      ],
    },
    {
      name: 'Embroidered Sleeve Abaya',
      category: 'Abaya',
      price: 110,
      compareAtPrice: 145,
      description: 'Open-front abaya with floral lace embroidery on the sleeves.',
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      isFeatured: true,
      images: [
        '/products/abaya/embroidered-abaya-1.jpg',
        '/products/abaya/embroidered-abaya-2.jpg',
      ],
    },
    {
      name: 'Tie-Belt Niqab',
      category: 'Niqab',
      price: 78,
      description: 'Relaxed niqab set with a fitted cap and tie-belt waist.',
      sizes: ['S', 'M', 'L', 'XL'],
      images: [
        '/products/niqab/tie-belt-niqab-1.jpg',
        '/products/niqab/tie-belt-niqab-2.jpg',
      ],
    },
  ];

  for (const product of products) {
    const slug = slugify(product.name);
    const record = await prisma.product.upsert({
      where: { slug },
      update: {},
      create: {
        name: product.name,
        slug,
        description: product.description,
        price: product.price,
        compareAtPrice: product.compareAtPrice,
        sizes: product.sizes,
        stock: 25,
        isFeatured: product.isFeatured ?? false,
        categoryId: categoryRecords.get(product.category)!,
      },
    });

    const existingImageCount = await prisma.productImage.count({
      where: { productId: record.id },
    });
    if (existingImageCount === 0) {
      await prisma.productImage.createMany({
        data: product.images.map((url, index) => ({
          productId: record.id,
          url,
          publicId: `local/${slug}-${index + 1}`,
          isPrimary: index === 0,
          position: index,
        })),
      });
    }
  }
  console.log(`Seeded ${products.length} products`);

  const discountCodes = [
    { code: 'WELCOME10', percentOff: 10 },
    { code: 'MODEST15', percentOff: 15 },
  ];
  for (const discount of discountCodes) {
    await prisma.discountCode.upsert({
      where: { code: discount.code },
      update: { percentOff: discount.percentOff },
      create: discount,
    });
  }
  console.log(`Seeded ${discountCodes.length} discount codes`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
